import type { PrismaClient } from "@/generated/prisma/client";
import { slugify } from "@/lib/slug";

export const changelogCategoryValues = [
  "ANNOUNCEMENT",
  "RANKING_UPDATE",
  "RULE_UPDATE",
  "SITE_UPDATE",
  "MODERATION_NOTE",
  "OTHER",
] as const;

export type ChangelogCategoryValue = (typeof changelogCategoryValues)[number];

export const changelogCategoryOptions = [
  { value: "ANNOUNCEMENT", label: "Announcement" },
  { value: "RANKING_UPDATE", label: "Ranking update" },
  { value: "RULE_UPDATE", label: "Rule update" },
  { value: "SITE_UPDATE", label: "Site update" },
  { value: "MODERATION_NOTE", label: "Moderation note" },
  { value: "OTHER", label: "Other" },
] as const satisfies ReadonlyArray<{
  value: ChangelogCategoryValue;
  label: string;
}>;

export function changelogCategoryLabel(value: string) {
  return (
    changelogCategoryOptions.find((option) => option.value === value)?.label ??
    "Other"
  );
}

export function normalizeChangelogSlug(input: string | undefined, title: string) {
  return slugify(input?.trim() || title);
}

export function summarizeChangelogContent(content: string, maxLength = 220) {
  const summary = content.replace(/\s+/g, " ").trim();

  if (summary.length <= maxLength) {
    return summary;
  }

  return `${summary.slice(0, maxLength - 1).trimEnd()}...`;
}

export function plainTextParagraphs(content: string) {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export const LATEST_RELEASE_POST = {
  title: "Nerfed Demonlist v1.0.0: Official Stable Release",
  slug: "ndl-v1-0-0-official-stable-release",
  category: "ANNOUNCEMENT" as const,
  summary:
    "Nerfed Demonlist has officially graduated out of Release Candidate into our v1.0.0 Stable Release! Featuring Main List & Extended List tiers (#1–75 / #76–150), partial progress scoring, Country Rankings, Creator Leaderboards, historical List Archive, Level Position History, and a complete site-wide modern redesign.",
  content: `Hey everyone!

Today marks a huge milestone for Nerfed Demonlist: we are officially moving out of Release Candidate status and launching **Nerfed Demonlist v1.0.0 Stable**!

Over the past few weeks we've been working non-stop on all of this to turn NDL into a complete, high-quality demonlist with everything you'd expect and more.

Here is everything included in the official v1.0.0 release:

### 1. Main List (#1–75) & Extended List (#76–150)
The list is now structured into three clear competitive tiers:
- **Main List (#1–75)**: The hardest nerfed extreme demons. Main list runs are eligible for partial progress points.
- **Extended List (#76–150)**: Secondary competitive bracket. Only 100% completions award points.
- **Legacy List**: Demons ranked #151+ or historically archived.

### 2. Partial Points for Qualifying Progress Runs
You no longer walk away empty-handed after putting up massive progress on top demons! If you score a qualifying run (e.g. 50%+) on any Main List level, you now earn partial leaderboard points scaled to the level's rank and how far past the requirement you reached.

### 3. Country Rankings & Continental Maps
Check out the **Countries** tab to see how nations around the world rank by total player points. You can filter by continent (Europe, North America, South America, Asia, Oceania, Africa) and click into any country to inspect its national roster and top victors.

### 4. Creator Leaderboards
We added a dedicated **Creators** tab to celebrate the architects who build, publish, and verify nerfed demons, awarding creator points based on level difficulty.

### 5. Historical List Archive
Curious what the list looked like weeks ago or at launch? The **Archive** tab lets you pick any date on the calendar and instantly reconstruct the exact rankings, points, and player leaderboards as of that day.

### 6. Level Position History & Peak Ranks
Every level detail page now features an interactive **Position History** timeline showing placement dates, rank shifts (rises and drops), and the level's all-time Peak Rank badge.

### 7. Deep Geometry Dash Metadata
Levels now display Newgrounds song titles and direct links, song IDs, object counts, level lengths, in-game difficulties, copy passwords, and minimum qualifying progress.

### 8. Site-Wide Modern Redesign & Clean Navigation
The entire site has been redesigned with sleek gradient hero banners, unified pill button controls, responsive 2-tier header navigation, and clean tables across every page.

We put a ton of hard work into getting everything ready for this release. Enjoy the v1.0.0 update, and we'll see you on the leaderboard!

*— cattw21 & NDL Staff*`,
};

export const V1_5_ANNOUNCEMENT_POST = {
  title: "Nerfed Demonlist v1.5.0 is Live!",
  slug: "nerfed-demonlist-v1-5-0-official-release",
  category: "ANNOUNCEMENT" as const,
  summary:
    "Welcome to the official v1.5.0 release of Nerfed Demonlist! We’ve completely upgraded the platform with the Interactive World Map on Countries, official Public REST API, State & Province rankings, Player Profile Claiming, Submission Locking, Advanced Stats Viewer, and more.",
  content: `## 🗺️ Live Now: Interactive World Map & Regional Rankings
[NEW] **Interactive World Map**: Leaderboard activity is now displayed geographically right inside the [Countries](/countries) tab! Nations with registered players are shaded in vibrant blue based on total points, while the nation hosting the world's **#1 Top Player** is crowned in glowing golden yellow 👑. Click any country to instantly view its national roster and top victors.
[FEATURE] **State & Province Rankings**: Competition goes deeper than country level! Explore regional leaderboards for subdivisions like US States (California, Texas, Florida, etc.), German States (Bavaria, NRW, Berlin), and provinces across the globe.
[PROFILE] **Player Geolocation**: Associate your approximate home region or state with your player profile in [Settings](/settings) to appear on the world map and climb regional leaderboards.

## ⚡ Official Public REST API & Developer Ecosystem
[API] **Public Developer API**: Build Discord bots, external leaderboards, or community dashboards using our official REST API at [/api/public](/api/public) without scraping HTML. Retrieve ranked demons, player stats, submissions, and list records.
[DOCS] **Interactive Documentation**: Full API endpoint references, response schemas, and query parameters are documented at [/api-docs](/api-docs).
[BOT] **Official Discord Bot Integration**: Connect with the NDL Discord bot for real-time \`/top\`, \`/level\`, \`/player\`, \`/leaderboard\`, \`/rules\`, and \`/changelog\` queries, paired with 24/7 automated acceptance alerts. Check out [/discord-bot](/discord-bot) to invite the bot.

## 👤 Player Claiming, Security & Profile Customization
[CLAIM] **Player Profile Claiming**: Verify ownership of your Geometry Dash runner profile and connect it directly to your website account from any player page at [/players](/players).
[SECURITY] **Player Submission Locking**: Protect your name and legacy! Once claimed, lock submissions in [Settings](/settings) to ensure future records under your player name can only be submitted while logged into your verified account.
[SORT] **6-Way Completion Sorting**: Customize how completed demons appear on player profiles—sort alphabetically, by list rank, by points, or by date, complete with Main/Extended tier toggles and instant search.
[AUTH] **Google OAuth Login**: Sign in or link your account with Google alongside standard credentials at [/login](/login).
[RECORDS] **Manual Record Removal & Restoration**: Manage your active list presence with self-service record unlisting and reinstatement controls.

## 📊 Advanced Stats Viewer & Demon Metadata
[STATS] **Advanced Stats Viewer**: Explore in-depth analytics at [/stats](/stats), featuring dedicated search tools for player points, hardest demons, Main/Extended completions, verifications, and creator accomplishments.
[METADATA] **Multiple Creator Credits**: Megacollabs and team projects now properly credit all creators, layout designers, and decorators with direct links on level detail pages.
[RATINGS] **Victors Difficulty Opinion System**: Verified victors can submit formal difficulty ratings and placement opinions directly on level pages to help staff calibrate list positions.
[INTEGRATION] **Automatic GD Server Integration**: Fast automated metadata fetching directly from Geometry Dash servers to sync level IDs, song IDs, descriptions, and downloads.

## 🛡️ Moderation System & Platform Upgrades
[MOD] **Under Consideration (UC) Queue**: A dedicated review state for records undergoing deep verification, raw footage analysis, or click audio inspection.
[ANTISPAM] **Automatic Duplicate-Submission Detection**: System-level duplicate detection stops duplicate pending submissions before they enter the moderator queue.
[I18N] **Multi-Language Interface**: Experience the entire NDL interface in your preferred language via the header language selector.
[STAFF] **Public Staff Directory & Roles**: Browse list editors, helper teams, and administrators with clear contact instructions at [/staff](/staff).
[SOCIAL] **Rich Discord & OpenGraph Embeds**: Level links, player profiles, and records now generate high-resolution Discord cards with thumbnails, demon points, and rankings.

---

We put a ton of hard work into getting everything ready for this release. Enjoy the v1.5.0 update, and we'll see you on the leaderboard!

*— cattw21 & NDL Staff*`,
};

export const DEFAULT_POSTS = [
  {
    id: "nerfed-demonlist-v1-5-0-official-release",
    title: V1_5_ANNOUNCEMENT_POST.title,
    slug: V1_5_ANNOUNCEMENT_POST.slug,
    category: V1_5_ANNOUNCEMENT_POST.category,
    summary: V1_5_ANNOUNCEMENT_POST.summary,
    content: V1_5_ANNOUNCEMENT_POST.content,
    isPinned: true,
    isPublished: true,
    isDemo: false,
    publishedAt: new Date("2026-09-06T11:00:00.000Z"),
    updatedAt: new Date("2026-09-06T11:00:00.000Z"),
    archivedAt: null,
    author: { displayName: "cattw21" },
  },
  {
    id: "major-update-tiers-countries-archive-partial-points",
    title: "Nerfed Demonlist v1.0.0: Official Stable Release",
    slug: "major-update-tiers-countries-archive-partial-points",
    category: "ANNOUNCEMENT" as const,
    summary:
      "Nerfed Demonlist has officially graduated out of Release Candidate into our v1.0.0 Stable Release! Featuring Main List & Extended List tiers (#1–75 / #76–150), partial progress scoring, Country Rankings, Creator Leaderboards, historical List Archive, Level Position History, and a complete site-wide modern redesign.",
    content: LATEST_RELEASE_POST.content,
    isPinned: false,
    isPublished: true,
    isDemo: false,
    publishedAt: new Date("2026-09-05T12:00:00.000Z"),
    updatedAt: new Date("2026-09-05T12:00:00.000Z"),
    archivedAt: null,
    author: { displayName: "cattw21" },
  },
  {
    id: "official-discord-server-and-bot-launched",
    title: "🎉 Official Nerfed Demonlist Discord Server & Bot is Live!",
    slug: "official-discord-server-and-bot-launched",
    category: "ANNOUNCEMENT" as const,
    summary:
      "We are thrilled to officially launch the Nerfed Demonlist Discord Server, featuring 24/7 automated record broadcasts, live bot commands, interactive role selection, and an active community hub for Geometry Dash nerfed extremes!",
    content: `## Welcome to the Official Nerfed Demonlist Community!

We are excited to announce that the **Official Nerfed Demonlist Discord Server & Bot** is now fully launched and open to the entire Geometry Dash community!

### 🌟 What's New in the Server?
- **🔴 24/7 Live Website Auto-Broadcasting**: All newly accepted list records, upcoming demon previews, and list updates are automatically broadcast directly to our Discord channels in real-time!
- **🤖 High-Powered Bot Commands**: Use \`/top\`, \`/level\`, \`/player\`, \`/leaderboard\`, \`/rules\`, and \`/changelog\` directly inside Discord to pull live data from the website.
- **🎭 Self-Assignable Notification Roles**: Check out the \`#🎭・roles\` channel to click and toggle \`🔔 Announcements Ping\` and \`📰 List Updates Ping\` with zero hassle.
- **💬 Active Community & Demon Discussion**: Dedicated channels for sharing your progress runs, click audio showcases, nerfed demon balance discussions, and creative artwork.

### 🔗 Join the Server Now
Click the Discord icon at the top of the website or join via our direct server link:
**[Join the Official Nerfed Demonlist Discord](https://discord.gg/kyYBkQzTCq)**

Thank you for your incredible support as we continue pushing the limits of nerfed demon tracking!

*— The Nerfed Demonlist Team & @cattw_gd*`,
    isPinned: false,
    isPublished: true,
    isDemo: false,
    publishedAt: new Date("2026-08-24T22:00:00.000Z"),
    updatedAt: new Date("2026-08-24T22:00:00.000Z"),
    archivedAt: null,
    author: { displayName: "cattw21" },
  },
  {
    id: "rc-v1-release",
    title: "Nerfed Demonlist v1.0 Release Candidate is Live!",
    slug: "ndl-v1-0-rc-release",
    category: "SITE_UPDATE" as const,
    summary:
      "Welcome to the official Release Candidate of Nerfed Demonlist (v1.0-RC)! We’ve completely overhauled the platform with the new Upcoming Levels tab (Currently Verifying & Waiting Levels), universal video playback for Medal.tv & TikTok, player profile champion banners, global member search, Top 50 leaderboards, and instant navigation.",
    content: LATEST_RELEASE_POST.content,
    isPinned: false,
    isPublished: true,
    isDemo: false,
    publishedAt: new Date("2026-08-21T21:20:00.000Z"),
    updatedAt: new Date("2026-08-21T21:20:00.000Z"),
    archivedAt: null,
    author: { displayName: "cattw21" },
  },
  {
    id: "records-suggestions-update",
    title: "Records & Suggestions Update",
    slug: "records-suggestions-update",
    category: "MODERATION_NOTE" as const,
    summary:
      "Records and suggestions will not be reviewed until 17/08/26 as we work on an upcoming update and our new Discord server.",
    content: `Hey everyone!

Just a quick update: Records and Suggestions will not be reviewed until 17/08/26 while we focus on preparing our upcoming update and getting the new Discord server ready.

We appreciate your patience and understanding while we work on everything behind the scenes. In the meantime, keep playing, have fun, and good luck trying to beat the levels on NDL!

More updates will be shared soon, so stay tuned!`,
    isPinned: false,
    isPublished: true,
    isDemo: false,
    publishedAt: new Date("2026-08-13T19:52:00.000Z"),
    updatedAt: new Date("2026-08-13T19:52:00.000Z"),
    archivedAt: null,
    author: { displayName: "cattw21" },
  },
  {
    id: "ndl-public-beta-is-live",
    title: "NDL public beta is live",
    slug: "ndl-public-beta-is-live",
    category: "ANNOUNCEMENT" as const,
    summary:
      "Nerfed Demonlist is open for public beta with ranked levels, record submissions, level suggestions, rules, and staff review.",
    content: `NDL is now ready for public beta. Players can view ranked nerfed demon versions, submit records for review, suggest new level candidates, and read the official v1.0 rules. Staff will continue to review submissions, tune rankings, and publish updates as the list grows.`,
    isPinned: false,
    isPublished: true,
    isDemo: false,
    publishedAt: new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: new Date("2026-06-03T16:15:00.000Z"),
    archivedAt: null,
    author: { displayName: "NDL Staff" },
  },
];

export async function ensureLatestChangelogPost(prismaClient: PrismaClient) {
  try {
    await prismaClient.changelogPost.deleteMany({
      where: {
        OR: [
          { slug: "nerfed-demonlist-v2-0-0-official-roadmap" },
          { title: { contains: "v2.0.0" } },
        ],
      },
    });

    for (const post of DEFAULT_POSTS) {
      await prismaClient.changelogPost.upsert({
        where: { slug: post.slug },
        update: {
          title: post.title,
          category: post.category,
          summary: post.summary,
          content: post.content,
          isPublished: true,
          isPinned: post.isPinned,
          isDemo: false,
          archivedAt: null,
        },
        create: {
          title: post.title,
          slug: post.slug,
          category: post.category,
          summary: post.summary,
          content: post.content,
          isPublished: true,
          isPinned: post.isPinned,
          isDemo: false,
          publishedAt: post.publishedAt,
        },
      });
    }
  } catch {
    // Fail-safe
  }
}
