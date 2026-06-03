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
      "app/admin/audit/page.tsx",
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
    expect(seed).toContain("No demo users, levels, submissions");
    expect(seed).toContain("isDemo: true");
    expect(seed).toContain("if (seedDemoData)");
    expect(seed).toContain("await seedRules(rulesVersion)");
    expect(seed).toContain("ndl-public-beta-is-live");
    expect(seed).toContain("seedLaunchPost");
    expect(seed).toContain("prisma.changelogPost.upsert");
    expect(seed).toContain("isPublished: true");
    expect(seed).toContain("isPinned: true");
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

  it("keeps moderation queue filters, pagination, and final-status handling wired", () => {
    const moderationPage = source("app/moderation/page.tsx");
    const queueHelper = source("lib/moderation-queue.ts");

    expect(moderationPage).toContain("await requireModerator()");
    expect(moderationPage).toContain("parseModerationFilters(params)");
    expect(moderationPage).toContain("getFilteredRecordSubmissions");
    expect(moderationPage).toContain("countFilteredRecordSubmissions");
    expect(moderationPage).toContain("getFilteredLevelSuggestions");
    expect(moderationPage).toContain("countFilteredLevelSuggestions");

    for (const param of [
      'name="recordStatus"',
      'name="suggestionStatus"',
      'name="q"',
      'name="recordSort"',
      'name="suggestionSort"',
      "recordPage",
      "suggestionPage",
    ]) {
      expect(moderationPage).toContain(param);
    }

    expect(moderationPage).toContain(
      "No record submissions match these filters.",
    );
    expect(moderationPage).toContain(
      "No level suggestions match these filters.",
    );
    expect(moderationPage).toContain('submission.status === "PENDING"');
    expect(moderationPage).toContain('submission.status === "NEEDS_CHANGES"');
    expect(moderationPage).toContain('suggestion.status === "PENDING"');
    expect(moderationPage).toContain('suggestion.status === "NEEDS_CHANGES"');
    expect(moderationPage).toContain("ReviewSummary");
    expect(moderationPage).toContain('id="record-submissions"');
    expect(moderationPage).toContain('id="level-suggestions"');
    expect(moderationPage).toContain('id="recent-accepted"');
    expect(moderationPage).toContain('take: 10');
    expect(source("app/review/page.tsx")).toContain('redirect("/moderation")');

    expect(queueHelper).toContain("moderationPageSize = 25");
    expect(queueHelper).toContain("recordSubmissionWhere");
    expect(queueHelper).toContain("levelSuggestionWhere");
    expect(queueHelper).toContain("moderatorNotes");
    expect(queueHelper).toContain("createdLevelId: null");
  });

  it("keeps suggestion thumbnails optional without disabled upload copy", () => {
    const form = source("components/level-suggestion-form.tsx");

    expect(form).toContain(
      "Upload or link a proposed thumbnail. Staff may replace it during review.",
    );
    expect(form).toContain("Optional thumbnail");
    expect(form).toContain("Thumbnail URL (optional)");
    expect(form).toContain("Proposed preview");
    expect(form).toContain("SafeThumbnail");
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

  it("keeps public v1 launch polish copy production-safe", () => {
    const publicSources = [
      source("app/page.tsx"),
      source("app/submit/page.tsx"),
      source("components/submit-record-form.tsx"),
      source("app/suggest-level/page.tsx"),
      source("components/level-suggestion-form.tsx"),
      source("app/players/page.tsx"),
      source("app/players/[playerName]/page.tsx"),
      source("app/rules/page.tsx"),
      source("app/changelog/page.tsx"),
    ].join("\n").toLowerCase();

    for (const phrase of [
      "demo entries are hidden",
      "demo local accounts",
      "db:seed:demo",
      "seed commands",
      "self-hosted",
      "local uploads",
      "uploads are disabled on this ndl instance",
      "local image uploads are disabled",
      "terminal",
      "dev console",
      "smtp fallback",
      "admin bootstrap",
    ]) {
      expect(publicSources).not.toContain(phrase);
    }

    expect(source("app/page.tsx")).toContain(
      "No accepted records yet. Submit a record to appear here after",
    );
    expect(source("components/submit-record-form.tsx")).toContain(
      "Before you submit",
    );
    expect(source("components/submit-record-form.tsx")).toContain(
      "selectedLevel",
    );
    expect(source("components/submit-record-form.tsx")).not.toContain(
      "Uploads are disabled on this NDL instance.",
    );
    expect(source("components/level-suggestion-form.tsx")).toContain(
      "Upload or link a proposed thumbnail. Staff may replace it during review.",
    );
    expect(source("components/level-suggestion-form.tsx")).not.toContain(
      "Thumbnail uploads are disabled on this NDL instance.",
    );
    expect(source("app/players/[playerName]/page.tsx")).toContain(
      "Your public profile",
    );
    expect(source("app/players/[playerName]/page.tsx")).toContain(
      "Share profile",
    );
  });

  it("keeps the public rules page readable and tied to v1 rule content", () => {
    const rulesPage = source("app/rules/page.tsx");
    const seed = rootSource("prisma/seed.ts");

    expect(rulesPage).toContain("Table of contents");
    expect(rulesPage).toContain("Version v1.0");
    expect(rulesPage).toContain("Last updated");
    expect(rulesPage).toContain('href="/submit"');
    expect(rulesPage).toContain('href="/suggest-level"');
    expect(rulesPage).toContain("sectionId");
    expect(seed).toContain("High-ranked means main-list rank #1-#50");
    expect(seed).toContain(
      "Raw footage links are visible only to staff unless the submitter chooses to make them public.",
    );
    expect(seed).toContain("Rank #1 awards 320 points");
    expect(seed).toContain("Legacy levels award a fixed 25 points");
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

  it("keeps Discord bot API routes JSON-only, filtered, and protected", () => {
    const publicRoutes = [
      "app/api/public/levels/route.ts",
      "app/api/public/levels/[slug]/route.ts",
      "app/api/public/players/route.ts",
      "app/api/public/players/[handle]/route.ts",
      "app/api/public/players/[handle]/records/route.ts",
      "app/api/public/recent-records/route.ts",
      "app/api/public/search/route.ts",
      "app/api/public/rules/route.ts",
      "app/api/public/changelog/route.ts",
    ];
    const staffRoutes = [
      "app/api/bot/staff/pending-records/route.ts",
      "app/api/bot/staff/pending-suggestions/route.ts",
      "app/api/bot/staff/record-submissions/[id]/route.ts",
      "app/api/bot/staff/level-suggestions/[id]/route.ts",
      "app/api/bot/staff/audit/route.ts",
      "app/api/bot/staff/stats/route.ts",
    ];

    for (const route of publicRoutes) {
      const routeSource = source(route);

      expect(routeSource).toContain("apiOk");
      expect(routeSource).toContain('enforceApiRateLimit("public-api")');
      expect(routeSource).not.toContain("requireBotApiSecret");
      expect(routeSource).not.toContain("redirect(");
    }

    expect(source("app/api/public/levels/route.ts")).toContain(
      "publicLevelWhere",
    );
    expect(source("app/api/public/levels/[slug]/route.ts")).toContain(
      "publicRecordWhere",
    );
    expect(source("app/api/public/players/route.ts")).toContain(
      "publicRecordWhere",
    );
    expect(source("app/api/public/players/[handle]/route.ts")).toContain(
      "publicUserWhere",
    );
    expect(source("app/api/public/changelog/route.ts")).toContain(
      "publicChangelogWhere",
    );

    for (const route of staffRoutes) {
      const routeSource = source(route);

      expect(routeSource).toContain("requireBotApiSecret");
      expect(routeSource).toContain("apiOk");
      expect(routeSource).not.toContain("process.env");
      expect(routeSource).not.toContain("passwordHash");
      expect(routeSource).not.toContain("tokenHash");
      expect(routeSource).not.toContain("DATABASE_URL");
    }

    expect(source("lib/api-auth.ts")).toContain("BOT_API_SECRET");
    expect(source("lib/api-auth.ts")).toContain("authorization");
    expect(source("lib/api-auth.ts")).toContain("timingSafeEqual");
    expect(source("lib/api-response.ts")).toContain("ok: true");
    expect(source("lib/api-response.ts")).toContain("ok: false");
    expect(source("lib/api-serializers.ts")).toContain(
      "calculateCurrentLevelPoints",
    );
    expect(source("lib/api-serializers.ts")).not.toContain("passwordHash");
    expect(source("lib/rate-limit.ts")).toContain('"public-api"');
    expect(source("lib/rate-limit.ts")).toContain('"bot-staff-api"');
    expect(rootSource(".env.example")).toContain("BOT_API_SECRET");
    expect(rootSource("docs/discord-bot.md")).toContain("/pending-records");
    expect(rootSource("docs/discord-bot.md")).toContain("ephemeral replies");
  });

  it("keeps global SEO and social metadata configured", () => {
    const layout = source("app/layout.tsx");
    const siteUrl = source("lib/site-url.ts");

    expect(layout).toContain("NDL - Nerfed Demonlist");
    expect(layout).toContain(
      "A moderated Geometry Dash community leaderboard",
    );
    expect(layout).toContain("getSiteUrl");
    expect(siteUrl).toContain("https://www.nerfeddemonlist.net");
    expect(layout).toContain("openGraph");
    expect(layout).toContain("alternates");
    expect(layout).toContain("/og-image.svg");
    expect(layout).toContain("/favicon.ico");
    expect(source("app/sitemap.ts")).toContain("absoluteSiteUrl");
    expect(source("app/robots.ts")).toContain("sitemap");
    expect(source("app/robots.ts")).toContain('disallow: ["/admin", "/moderation", "/review", "/api/bot"]');
    expect(source("app/not-found.tsx")).toContain("Page not found");
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
    expect(appShell).toContain("<SiteFooter");
    expect(appShell).toContain("isModerator: isModeratorRole(user.role)");
    expect(appShell).toContain("isAdmin: isAdminRole(user.role)");
    expect(footer).toContain("usePathname");
    expect(footer).toContain('pathname === "/moderation"');
    expect(footer).toContain('pathname === "/review"');
    expect(footer).toContain('pathname.startsWith("/admin")');
    expect(footer).toContain("&copy; 2026 Nerfed Demonlist");
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
      "/news",
      "/login",
      "/register",
      "/verify-email",
      "/moderation",
      "/admin",
    ]) {
      expect(footer).toContain(`href: "${href}"`);
    }

    expect(footer).toContain("dark:border-slate");
    expect(footer).toContain("dark:bg-slate");
    expect(footer).toContain("dark:text-slate");
    expect(footer).not.toContain(forbiddenPointercrateCopy);
  });

  it("keeps the admin audit log schema, helper, workflows, and page wired", () => {
    const schema = rootSource("prisma/schema.prisma");
    const migration = rootSource(
      "prisma/migrations/20260602120000_add_admin_audit_log/migration.sql",
    );
    const auditHelper = source("lib/audit-log.ts");
    const adminActions = source("actions/admin.ts");
    const submissionWorkflow = source("lib/submission-workflow.ts");
    const suggestionActions = source("actions/level-suggestions.ts");
    const auditPage = source("app/admin/audit/page.tsx");

    expect(schema).toContain("model AdminAuditLog");
    expect(schema).toContain("actorUserId");
    expect(schema).toContain("beforeJson");
    expect(schema).toContain("afterJson");
    expect(schema).toContain("@@index([action, createdAt])");
    expect(schema).toContain("@@index([entityType, entityId])");
    expect(migration).toContain('CREATE TABLE "AdminAuditLog"');
    expect(migration).toContain('"ipHash" TEXT');
    expect(migration).toContain('"userAgentHash" TEXT');

    expect(auditHelper).toContain("writeAuditLog");
    expect(auditHelper).toContain("safeWriteAuditLog");
    expect(auditHelper).toContain("redactAuditValue");
    expect(auditHelper).toContain("passwordhash");
    expect(auditHelper).toContain("rawfootageurl");
    expect(auditHelper).toContain("createHmac");

    for (const action of [
      "LEVEL_CREATED",
      "LEVEL_UPDATED",
      "LEVEL_RANK_CHANGED",
      "LEVEL_STATUS_CHANGED",
      "LEVEL_THUMBNAIL_CHANGED",
      "LEVEL_SUGGESTION_CONVERTED",
      "USER_ROLE_CHANGED",
      "RULES_UPDATED",
      "CHANGELOG_CREATED",
      "CHANGELOG_EDITED",
      "CHANGELOG_PUBLISHED",
      "CHANGELOG_UNPUBLISHED",
      "CHANGELOG_PINNED",
      "CHANGELOG_UNPINNED",
      "CHANGELOG_ARCHIVED",
    ]) {
      expect(adminActions).toContain(action);
    }

    for (const action of [
      "RECORD_ACCEPTED",
      "RECORD_REJECTED",
      "RECORD_NEEDS_CHANGES",
    ]) {
      expect(submissionWorkflow).toContain(action);
    }

    for (const action of [
      "LEVEL_SUGGESTION_APPROVED",
      "LEVEL_SUGGESTION_REJECTED",
      "LEVEL_SUGGESTION_NEEDS_CHANGES",
    ]) {
      expect(suggestionActions).toContain(action);
    }

    expect(rootSource("scripts/recalculate-points.ts")).toContain(
      "RECORD_POINTS_RECALCULATED",
    );
    expect(source("app/admin/page.tsx")).toContain("/admin/audit");
    expect(auditPage).toContain("await requireAdmin()");
    expect(auditPage).toContain("prisma.adminAuditLog.findMany");
    expect(auditPage).toContain('name="action"');
    expect(auditPage).toContain('name="entityType"');
    expect(auditPage).toContain('name="actor"');
    expect(auditPage).toContain('name="from"');
    expect(auditPage).toContain('name="to"');
    expect(auditPage).toContain('name="q"');
    expect(auditPage).toContain("<details");
    expect(auditPage).not.toContain("passwordHash");
    expect(auditPage).not.toContain("tokenHash");
    expect(auditPage).not.toContain("rawFootageUrl");
  });

  it("keeps /news available as the public news alias", () => {
    expect(source("app/news/page.tsx")).toContain('redirect("/changelog")');
    expect(source("app/news/[slug]/page.tsx")).toContain(
      "redirect(`/changelog/${slug}`)",
    );
  });

  it("keeps the public changelog/news system production-ready", () => {
    const schema = rootSource("prisma/schema.prisma");
    const migration = rootSource(
      "prisma/migrations/20260602133000_expand_changelog_posts/migration.sql",
    );
    const changelogPage = source("app/changelog/page.tsx");
    const postPage = source("app/changelog/[slug]/page.tsx");
    const adminPage = source("app/admin/changelog/page.tsx");
    const adminActions = source("actions/admin.ts");
    const homePage = source("app/page.tsx");

    expect(schema).toContain("enum ChangelogCategory");
    expect(schema).toContain("ANNOUNCEMENT");
    expect(schema).toContain("RANKING_UPDATE");
    expect(schema).toContain("RULE_UPDATE");
    expect(schema).toContain("SITE_UPDATE");
    expect(schema).toContain("MODERATION_NOTE");
    expect(schema).toContain("summary");
    expect(schema).toContain("isPublished");
    expect(schema).toContain("isPinned");
    expect(schema).toContain("archivedAt");
    expect(schema).toContain("@@index([isPublished, archivedAt, isPinned, publishedAt])");
    expect(migration).toContain('CREATE TYPE "ChangelogCategory"');
    expect(migration).toContain('ADD COLUMN "summary"');
    expect(migration).toContain('ADD COLUMN "archivedAt"');
    expect(migration).toContain("DROP NOT NULL");

    expect(source("lib/demo-visibility.ts")).toContain("isPublished: true");
    expect(source("lib/demo-visibility.ts")).toContain("archivedAt: null");
    expect(changelogPage).toContain("publicChangelogWhere()");
    expect(changelogPage).toContain("orderBy: [{ isPinned: \"desc\" }, { publishedAt: \"desc\" }]");
    expect(changelogPage).toContain("Featured");
    expect(changelogPage).toContain("Read full update");
    expect(postPage).toContain("publicChangelogWhere({");
    expect(postPage).toContain("notFound()");
    expect(postPage).toContain("Back to changelog");
    expect(postPage).toContain("plainTextParagraphs(post.content)");
    expect(changelogPage).not.toContain("dangerouslySetInnerHTML");
    expect(postPage).not.toContain("dangerouslySetInnerHTML");

    expect(homePage).toContain("title=\"Latest update\"");
    expect(homePage).toContain("latestPost.summary");
    expect(homePage).toContain("href={`/changelog/${latestPost.slug}`}");

    expect(adminPage).toContain("await requireAdmin()");
    expect(adminPage).toContain("createChangelogAction");
    expect(adminPage).toContain("updateChangelogAction");
    expect(adminPage).toContain("archiveChangelogAction");
    expect(adminPage).toContain('name="category"');
    expect(adminPage).toContain('name="summary"');
    expect(adminPage).toContain('name="isPublished"');
    expect(adminPage).toContain('name="isPinned"');
    expect(adminPage).toContain("Archive post");

    for (const action of [
      "CHANGELOG_CREATED",
      "CHANGELOG_EDITED",
      "CHANGELOG_PUBLISHED",
      "CHANGELOG_UNPUBLISHED",
      "CHANGELOG_PINNED",
      "CHANGELOG_UNPINNED",
      "CHANGELOG_ARCHIVED",
    ]) {
      expect(adminActions).toContain(action);
    }

    expect(source("lib/validation.ts")).toContain("changelogSchema");
    expect(source("lib/changelog.ts")).toContain("normalizeChangelogSlug");
    expect(source("lib/changelog.ts")).toContain("plainTextParagraphs");
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

  it("keeps the public level detail page complete and privacy-safe", () => {
    const levelPage = source("app/levels/[slug]/page.tsx");

    expect(levelPage).toContain("SafeThumbnail");
    expect(levelPage).toContain("aspect-video");
    expect(levelPage).toContain(
      "lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]",
    );
    expect(levelPage).toContain("lg:min-h-[24rem]");
    expect(levelPage).toContain("const currentLevelPoints = calculateCurrentLevelPoints(level)");
    expect(levelPage).not.toContain("<PointsPill points={level.points}");
    expect(levelPage).not.toContain("{record.pointsAwarded}");
    expect(levelPage).not.toContain("1000");

    for (const label of [
      "Original level",
      "Publisher/host",
      "Nerf creator",
      "Verifier",
      "GD level ID",
      "Placement date",
      "Current status",
      "Current rank",
    ]) {
      expect(levelPage).toContain(label);
    }

    expect(levelPage).toContain("No description provided.");
    expect(levelPage).toContain("No version notes provided.");
    expect(levelPage).toContain("No accepted records yet");
    expect(levelPage).toContain("100%");
    expect(levelPage).toContain("Completion video");
    expect(levelPage).toContain("Video linked");
    expect(levelPage).toContain("Raw footage on file");
    expect(levelPage).toContain("Submitted");
    expect(levelPage).toContain("Accepted");

    for (const href of ['href="/"', 'href="/submit"', 'href="/rules"', 'href="/suggest-level"']) {
      expect(levelPage).toContain(href);
    }

    expect(levelPage).toContain("min-w-0");
    expect(levelPage).toContain("sm:grid-cols-2");
    expect(levelPage).toContain("md:grid-cols-[4rem_minmax(0,1fr)_6rem_7rem_8rem_10rem]");
    expect(levelPage).not.toContain("player: true");
    expect(levelPage).not.toContain("email");
    expect(levelPage).not.toContain("password");
    expect(levelPage).not.toContain("session.delete");
    expect(levelPage).not.toContain("moderatorNotes");
    expect(levelPage).not.toContain("proofNotes");
    expect(levelPage).not.toContain("clickAudioNotes");
    expect(levelPage).not.toContain("deviceNotes");
    expect(levelPage).not.toContain("href={record.rawFootageUrl}");
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
