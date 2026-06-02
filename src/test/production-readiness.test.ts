import { readFileSync, statSync } from "node:fs";

import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

function rootSource(relativePath: string) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

describe("production readiness guardrails", () => {
  it("keeps pending and rejected submissions off public record surfaces", () => {
    expect(source("app/page.tsx")).not.toContain("recordSubmission.findMany");
    expect(source("app/levels/[slug]/page.tsx")).not.toContain("recordSubmission");
    expect(source("app/players/page.tsx")).not.toContain("recordSubmission");
    expect(source("app/page.tsx")).toContain("prisma.record.count");
    expect(source("app/page.tsx")).toContain("prisma.record.findMany");
    expect(source("app/players/page.tsx")).toContain("prisma.record.findMany");
    expect(source("app/levels/[slug]/page.tsx")).toContain("records:");
  });

  it("keeps private profile submissions behind a visibility check", () => {
    const profilePage = source("app/players/[playerName]/page.tsx");

    expect(profilePage).toContain("canSeeSubmission");
    expect(profilePage).toContain("canViewPrivate");
    expect(profilePage).toContain("{canViewPrivate ?");
  });

  it("protects moderator and admin pages server-side", () => {
    expect(source("app/moderation/page.tsx")).toContain("await requireModerator()");

    for (const path of [
      "app/admin/page.tsx",
      "app/admin/levels/page.tsx",
      "app/admin/users/page.tsx",
      "app/admin/rules/page.tsx",
      "app/admin/changelog/page.tsx",
    ]) {
      expect(source(path)).toContain("await requireAdmin()");
    }
  });

  it("requires explicit flags before destructive demo seeding", () => {
    const seed = rootSource("prisma/seed.ts");
    const seedFlags = source("lib/seed-flags.ts");

    expect(seed).toContain("demoSeedEnabled(process.env)");
    expect(seed).toContain("demoSeedResetEnabled(process.env)");
    expect(seedFlags).toContain("ENABLE_DEMO_SEED=true is required");
    expect(seedFlags).toContain("NDL_SEED_DEMO is deprecated");
    expect(seed).toContain("Refusing to create demo data");
    expect(seed).toContain("No demo users, levels, submissions, records");
    expect(seed).toContain("isDemo: true");
    expect(seed).toContain("if (seedDemoData)");
    expect(seed).toContain("await seedRules(rulesVersion)");
  });

  it("keeps public surfaces behind demo visibility filters", () => {
    expect(source("app/page.tsx")).toContain("publicLevelWhere");
    expect(source("app/page.tsx")).toContain("publicRecordWhere");
    expect(source("app/players/page.tsx")).toContain("publicRecordWhere");
    expect(source("app/players/[playerName]/page.tsx")).toContain(
      "publicUserWhere",
    );
    expect(source("app/levels/[slug]/page.tsx")).toContain("publicLevelWhere");
    expect(source("app/changelog/page.tsx")).toContain("publicChangelogWhere");
    expect(source("components/app-shell.tsx")).toContain("Demo mode is enabled");
  });

  it("wires level suggestion routes, navigation, and staff actions", () => {
    expect(source("app/suggest-level/page.tsx")).toContain("await requireUser()");
    expect(source("app/level-suggestions/page.tsx")).toContain(
      "await requireUser()",
    );
    expect(source("actions/level-suggestions.ts")).toContain(
      "submitLevelSuggestionAction",
    );
    expect(source("actions/level-suggestions.ts")).toContain(
      "convertLevelSuggestionAction",
    );
    expect(source("actions/level-suggestions.ts")).toContain(
      "parsed.data.thumbnailUrl ?? null",
    );
    expect(source("actions/level-suggestions.ts")).toContain(
      "localUploadsEnabled() && isUsableFile(thumbnailFile)",
    );
    expect(source("components/level-suggestion-form.tsx")).toContain(
      "handleUploadUrl: \"/api/suggestions/blob-thumbnail-upload\"",
    );
    expect(source("components/level-suggestion-form.tsx")).toContain(
      "thumbnailUrlInputRef.current.value = blob.url",
    );
    expect(source("app/api/suggestions/blob-thumbnail-upload/route.ts")).toContain(
      "getCurrentUser",
    );
    expect(source("app/api/suggestions/blob-thumbnail-upload/route.ts")).not.toContain(
      "isAdminRole",
    );
    expect(source("app/api/suggestions/blob-thumbnail-upload/route.ts")).toContain(
      "suggestion-thumbnails/",
    );
    expect(source("app/moderation/page.tsx")).toContain(
      "levelSuggestion.findMany",
    );
    expect(source("app/moderation/page.tsx")).toContain(
      "Convert to ranked level",
    );
    expect(source("app/admin/levels/page.tsx")).toContain("suggestionId");
    expect(source("actions/admin.ts")).toContain("sourceSuggestionId");
    expect(source("actions/admin.ts")).toContain("CONVERTED");
    expect(source("components/app-shell.tsx")).toContain("/suggest-level");
  });

  it("keeps suggestion thumbnails optional without disabled upload copy", () => {
    const form = source("components/level-suggestion-form.tsx");

    expect(form).toContain(
      "Upload or link a proposed thumbnail. Staff may replace it during review.",
    );
    expect(form).toContain("Optional thumbnail");
    expect(form).toContain("Thumbnail URL (optional)");
    expect(form).toContain("uploadsAvailable ? (");
    expect(form).toContain(
      "Uploads are unavailable right now. You can paste a direct image",
    );
    expect(form).not.toContain(
      "Thumbnail uploads are disabled on this NDL instance.",
    );
    expect(source("lib/level-suggestion-form-state.ts")).toContain(
      "\"thumbnailUrl\"",
    );
  });

  it("keeps production environment safety checks wired in", () => {
    expect(source("lib/db.ts")).toContain("requireDatabaseUrl");
    expect(source("lib/auth.ts")).toContain("requireSessionSecret");
    expect(source("lib/auth.ts")).toContain("createHmac");
    expect(source("lib/upload-storage.ts")).toContain(
      "productionLocalUploadsDisabledReason",
    );
    expect(source("lib/upload-storage.ts")).toContain("BLOB_READ_WRITE_TOKEN");
    expect(source("app/api/admin/blob-thumbnail-upload/route.ts")).toContain(
      "isAdminRole",
    );
    expect(source("app/api/admin/blob-thumbnail-upload/route.ts")).toContain(
      "handleUpload",
    );
    expect(source("app/api/suggestions/blob-thumbnail-upload/route.ts")).toContain(
      "handleUpload",
    );
    expect(source("app/api/suggestions/blob-thumbnail-upload/route.ts")).toContain(
      "maxImageUploadBytes",
    );
    expect(source("app/api/suggestions/blob-thumbnail-upload/route.ts")).toContain(
      "thumbnailUploadContentTypes",
    );
    expect(rootSource("prisma.config.ts")).toContain(
      "DATABASE_URL is required for Prisma commands.",
    );
  });

  it("keeps global SEO and social metadata configured", () => {
    const layout = source("app/layout.tsx");

    expect(layout).toContain("NDL - Nerfed Demonlist");
    expect(layout).toContain(
      "A moderated Geometry Dash community leaderboard",
    );
    expect(layout).toContain("process.env.APP_URL");
    expect(layout).toContain("openGraph");
    expect(layout).toContain("/og-image.svg");
    expect(layout).toContain("/favicon.ico");
  });

  it("keeps dedicated email logo asset and email templates wired", () => {
    const emailLogo = statSync(
      new URL("../../public/email-logo.png", import.meta.url),
    );
    const emailSource = source("lib/email.ts");

    expect(emailLogo.isFile()).toBe(true);
    expect(emailLogo.size).toBeGreaterThan(1000);
    expect(emailSource).toContain("/email-logo.png");
    expect(emailSource).not.toContain('new URL("/icon.png"');
    expect(emailSource).toContain('width="56"');
    expect(emailSource).toContain('height="56"');
    expect(emailSource).toContain('alt="Nerfed Demonlist"');
  });

  it("keeps the theme system wired for light, dark, and system modes", () => {
    expect(source("app/globals.css")).toContain("@custom-variant dark");
    expect(source("app/layout.tsx")).toContain("ndl-theme");
    expect(source("app/layout.tsx")).toContain("suppressHydrationWarning");
    expect(source("components/app-shell.tsx")).toContain("ThemeToggle");
    expect(source("components/theme-toggle.tsx")).toContain("system");
  });

  it("keeps the production footer wired on public pages only", () => {
    const appShell = source("components/app-shell.tsx");
    const footer = source("components/site-footer.tsx");
    const forbiddenPointercrateCopy =
      "Copyright © Pointercrate. All rights reserved.";

    expect(appShell).toContain("SiteFooter");
    expect(appShell).toContain('id="top"');
    expect(appShell).toContain("<SiteFooter />");
    expect(footer).toContain("usePathname");
    expect(footer).toContain('pathname === "/moderation"');
    expect(footer).toContain('pathname.startsWith("/admin")');
    expect(footer).toContain("© 2026 Nerfed Demonlist");
    expect(footer).toContain(
      "NDL is a community-ranked list for approved nerfed Geometry Dash",
    );
    expect(footer).toContain(
      "Nerfed Demonlist is not affiliated with RobTopGames, Geometry Dash,",
    );
    expect(footer).toContain(
      "Pointercrate, or the official Demonlist",
    );
    expect(footer).toContain(
      "Rules, rankings, records, and points are maintained by NDL staff",
    );
    expect(footer).toContain("Back to top");
    expect(footer).toContain('href="#top"');

    for (const href of [
      "/rules",
      "/submit",
      "/suggest-level",
      "/players",
      "/changelog",
      "/login",
      "/register",
      "/verify-email",
    ]) {
      expect(footer).toContain(`href: "${href}"`);
    }

    expect(footer).toContain("dark:border-slate");
    expect(footer).toContain("dark:bg-slate");
    expect(footer).toContain("dark:text-slate");
    expect(footer).not.toContain(forbiddenPointercrateCopy);
  });

  it("keeps /news available as the public news alias", () => {
    expect(source("app/news/page.tsx")).toContain('redirect("/changelog")');
  });

  it("renders level thumbnails through the safe thumbnail component", () => {
    expect(source("components/level-card.tsx")).toContain("SafeThumbnail");
    expect(source("app/levels/[slug]/page.tsx")).toContain("SafeThumbnail");
    expect(source("components/level-card.tsx")).not.toContain("next/image");
    expect(source("app/levels/[slug]/page.tsx")).not.toContain("next/image");
  });

  it("keeps admin thumbnail file preview wired to local object URLs", () => {
    const adminForm = source("components/admin-level-form.tsx");

    expect(adminForm).toContain("URL.createObjectURL");
    expect(adminForm).toContain("URL.revokeObjectURL");
    expect(adminForm).toContain("allowObjectUrl");
    expect(adminForm).toContain("onValueChange={setThumbnailUrlValue}");
    expect(adminForm).toContain("blobThumbnailPathname");
    expect(adminForm).toContain(
      "handleUploadUrl: \"/api/admin/blob-thumbnail-upload\"",
    );
    expect(adminForm).not.toContain("/api/suggestions/blob-thumbnail-upload");
  });

  it("keeps accessible field help tooltips wired into affected forms", () => {
    expect(source("components/help-tooltip.tsx")).toContain("role=\"tooltip\"");
    expect(source("components/ui.tsx")).toContain("HelpTooltip");
    expect(source("components/admin-level-form.tsx")).toContain(
      "fieldHelp.rank",
    );
    expect(source("components/level-suggestion-form.tsx")).toContain(
      "fieldHelp.compatibilityNotes",
    );
    expect(source("components/submit-record-form.tsx")).toContain(
      "fieldHelp.rawFootageUrl",
    );
  });

  it("keeps server-action forms on React-managed encoding", () => {
    expect(source("components/admin-level-form.tsx")).not.toContain("encType=");
    expect(source("components/submit-record-form.tsx")).not.toContain("encType=");
    expect(source("components/submit-record-form.tsx")).not.toContain("method=");
  });

  it("keeps admin level form simplified for NDL entries", () => {
    const adminForm = source("components/admin-level-form.tsx");

    expect(adminForm).toContain("Advanced: use image URL instead");
    expect(adminForm).toContain('type="hidden" name="difficulty"');
    expect(adminForm).not.toContain('label="Difficulty"');
  });

  it("keeps submit upload controls responsive and width-safe", () => {
    const submitForm = source("components/submit-record-form.tsx");

    expect(submitForm).toContain('title="Optional uploads"');
    expect(submitForm).toContain("xl:grid-cols-3");
    expect(submitForm).toContain("w-full min-w-0 max-w-full");
  });

  it("keeps submit action returning structured form state for failures", () => {
    const action = source("actions/submissions.ts");

    expect(action).toContain("validateSubmissionFormSubmission(formData)");
    expect(action).toContain("createSubmissionFormErrorState");
    expect(action).toContain("redirect(\"/submissions?created=1\")");
  });

  it("keeps public auth page copy production-clean", () => {
    const publicAuthCopy = [
      source("app/login/page.tsx"),
      source("app/register/page.tsx"),
      source("app/verify-email/page.tsx"),
      source("app/forgot-password/page.tsx"),
      source("app/reset-password/page.tsx"),
      source("components/register-form.tsx"),
      source("components/forgot-password-form.tsx"),
      source("components/reset-password-form.tsx"),
      source("lib/verification-status.ts"),
    ].join("\n").toLowerCase();

    for (const phrase of [
      "db:seed:demo",
      "demo local accounts",
      "seed commands",
      "terminal",
      "smtp fallback",
      "admin bootstrap",
      "local development",
      "dev console",
      "development verification links",
      "smtp not configured",
      "verification protects the queue",
    ]) {
      expect(publicAuthCopy).not.toContain(phrase);
    }

    expect(publicAuthCopy).toContain(
      "check your email for a verification link",
    );
    expect(publicAuthCopy).toContain("check your spam or junk folder");
    expect(publicAuthCopy).toContain("label=\"username\"");
    expect(publicAuthCopy).not.toContain("label=\"handle\"");
    expect(source("app/login/page.tsx")).toContain("/forgot-password");
    expect(source("app/forgot-password/page.tsx")).toContain("ForgotPasswordForm");
    expect(source("app/reset-password/page.tsx")).toContain("ResetPasswordForm");

    const authAction = source("actions/auth.ts");
    expect(authAction).toContain("validateRegisterFormSubmission(formData)");
    expect(authAction).toContain("registered-sent");
    expect(authAction).toContain("registered-email-failed");
    expect(authAction).toContain("email or username");
    expect(authAction.indexOf("if (!parsed.success)")).toBeLessThan(
      authAction.indexOf("prisma.user.create"),
    );
    expect(source("app/verify-email/page.tsx")).toContain(
      "verificationStatusFromParams(params)",
    );
    expect(source("app/verify-email/page.tsx")).toContain('href="/register"');
    expect(source("app/verify-email/page.tsx")).toContain(
      "initialCooldownSeconds={status?.cooldownSeconds ?? 0}",
    );
    expect(source("components/cooldown-submit-button.tsx")).not.toContain(
      "onClick",
    );
    expect(source("actions/verification.ts")).not.toContain("already-verified");
    expect(source("lib/email-verification.ts")).not.toContain(
      "already-verified",
    );
  });

  it("keeps password reset flow wired through hashed single-use tokens", () => {
    const passwordResetMigration = rootSource(
      "prisma/migrations/20260601120000_add_password_reset_tokens/migration.sql",
    );

    expect(rootSource("prisma/schema.prisma")).toContain(
      "model PasswordResetToken",
    );
    expect(passwordResetMigration).toContain(
      'CREATE TABLE "PasswordResetToken"',
    );
    expect(passwordResetMigration).toContain(
      'CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key"',
    );
    expect(rootSource("package.json")).toContain(
      '"db:migrate:deploy": "prisma migrate deploy"',
    );
    expect(rootSource("docs/deployment.md")).toContain(
      "After deploying the password reset release",
    );
    expect(source("actions/password-reset.ts")).toContain(
      "requestPasswordResetAction",
    );
    expect(source("actions/password-reset.ts")).toContain("resetPasswordAction");
    expect(source("actions/password-reset.ts")).toContain(
      "password-reset-request",
    );
    expect(source("actions/password-reset.ts")).toContain(
      "password-reset-attempt",
    );
    expect(source("lib/password-reset.ts")).toContain(
      "hashPasswordResetSecret",
    );
    expect(source("lib/password-reset.ts")).toContain(
      "PASSWORD_RESET_EXPIRY_MINUTES = 15",
    );
    expect(source("lib/password-reset.ts")).toContain("session.deleteMany");
    expect(source("lib/email.ts")).toContain(
      "Reset your Nerfed Demonlist password",
    );
  });

  it("keeps rank changes tied to level and record point recalculation", () => {
    const ranking = source("lib/level-ranking.ts");

    expect(ranking).toContain("calculateLevelPoints(item.rank, LevelStatus.RANKED)");
    expect(ranking).toContain("await updateRecordsForLevel(tx, item.id, points)");
    expect(ranking).toContain("pointsAwarded: points");
  });

  it("keeps public points computed from rank and status instead of stale stored rows", () => {
    expect(source("lib/points.ts")).toContain("320 * (310 / 320)");
    expect(source("app/page.tsx")).toContain(
      "points: calculateCurrentLevelPoints(level)",
    );
    expect(source("app/page.tsx")).toContain(
      "const recordPoints = calculateCurrentLevelPoints(record.level)",
    );
    expect(source("app/page.tsx")).not.toContain("points: level.points");
    expect(source("app/levels/[slug]/page.tsx")).toContain(
      "const currentLevelPoints = calculateCurrentLevelPoints(level)",
    );
    expect(source("app/levels/[slug]/page.tsx")).not.toContain(
      "<PointsPill points={level.points}",
    );
    expect(source("app/players/page.tsx")).toContain("level: true");
    expect(source("app/players/page.tsx")).toContain(
      "pointsAwarded: calculateCurrentLevelPoints(record.level)",
    );
    expect(source("app/players/[playerName]/page.tsx")).toContain(
      "currentPoints: calculateCurrentLevelPoints(record.level)",
    );
    expect(source("lib/submission-workflow.ts")).toContain(
      "const pointsAwarded = calculateLevelPoints(",
    );
    expect(source("lib/submission-workflow.ts")).not.toContain(
      "pointsAwarded: submission.level.points",
    );
  });

  it("wires the stored points recalculation script and docs", () => {
    expect(rootSource("package.json")).toContain(
      '"points:recalculate": "tsx scripts/recalculate-points.ts"',
    );
    expect(rootSource("scripts/recalculate-points.ts")).toContain(
      "recalculateStoredPoints",
    );
    expect(source("lib/points-recalculation.ts")).toContain(
      "calculateLevelPoints(level.rank, level.status)",
    );
    expect(rootSource("prisma/seed.ts")).toContain(
      "pointsAwarded: calculateLevelPoints(levels[0].rank, levels[0].status)",
    );
    expect(rootSource("prisma/seed.ts")).not.toContain(
      "pointsAwarded: levels[0].points",
    );
    expect(rootSource("README.md")).toContain("npm.cmd run points:recalculate");
    expect(rootSource("docs/deployment.md")).toContain(
      "npm.cmd run points:recalculate",
    );
  });
});
