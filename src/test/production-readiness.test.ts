import { readFileSync } from "node:fs";

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
    expect(source("app/moderation/page.tsx")).toContain(
      "levelSuggestion.findMany",
    );
    expect(source("components/app-shell.tsx")).toContain("/suggest-level");
  });

  it("keeps production environment safety checks wired in", () => {
    expect(source("lib/db.ts")).toContain("requireDatabaseUrl");
    expect(source("lib/auth.ts")).toContain("requireSessionSecret");
    expect(source("lib/auth.ts")).toContain("createHmac");
    expect(source("lib/upload-storage.ts")).toContain(
      "productionLocalUploadsDisabledReason",
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

  it("keeps the theme system wired for light, dark, and system modes", () => {
    expect(source("app/globals.css")).toContain("@custom-variant dark");
    expect(source("app/layout.tsx")).toContain("ndl-theme");
    expect(source("app/layout.tsx")).toContain("suppressHydrationWarning");
    expect(source("components/app-shell.tsx")).toContain("ThemeToggle");
    expect(source("components/theme-toggle.tsx")).toContain("system");
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

  it("keeps rank changes tied to level and record point recalculation", () => {
    const ranking = source("lib/level-ranking.ts");

    expect(ranking).toContain("calculateLevelPoints(item.rank, LevelStatus.RANKED)");
    expect(ranking).toContain("await updateRecordsForLevel(tx, item.id, points)");
    expect(ranking).toContain("pointsAwarded: points");
  });
});
