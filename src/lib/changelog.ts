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

export const V2_ANNOUNCEMENT_POST = {
  title: "Nerfed Demonlist v2.0.0: The Future of NDL (Official Roadmap & Feature Release)",
  slug: "nerfed-demonlist-v2-0-0-official-roadmap",
  category: "ANNOUNCEMENT" as const,
  summary:
    "Announcing Nerfed Demonlist v2.0.0! A monumental milestone featuring 19 generational upgrades: Official Public API, Interactive World Map, Subdivisions, Player Geolocation, Advanced Stats Viewer, Completion Sorting, Player Claiming, Submission Locking, Under Consideration status, and more.",
  content: `Hey everyone!

Following the successful rollout of **Nerfed Demonlist v1.0.0 Stable**, the NDL team is proud to officially announce our biggest milestone yet: **Nerfed Demonlist v2.0.0**!

This update brings full competitive feature parity with the wider Geometry Dash demonlist ecosystem while introducing custom features engineered specifically for nerfed demons.

---

### The 19 Official Features of Nerfed Demonlist v2.0.0

#### 1. Public API
Gives developers an official way to retrieve demons, players, records, rankings, etc. A Discord bot or another website can now automatically pull current NDL data instead of scraping webpages.
*Explore the documentation at [/api-docs](/api-docs).*

#### 2. Interactive World Map
Displays leaderboard activity geographically. Areas are shaded based on player points, and users can click locations to explore players from that area. Pointercrate has a point-distribution heat map.
*View the live map at [/map](/map).*

#### 3. State / Province Rankings
Goes below country level. For example, Germany can be split into NRW, Bavaria, Berlin, etc., while the USA has California, Texas, Florida, and so on. Pointercrate supports political subdivisions for many countries.
*Check out national rankings and regional subdivisions at [/countries](/countries).*

#### 4. Player Geolocation
Lets a player associate an approximate geographic location with their claimed profile so they can appear correctly on the map and regional rankings.
*Update your location in [/settings](/settings).*

#### 5. Advanced Stats Viewer
Provides one dedicated interface for searching players and viewing rank, score, hardest demon, Main/Extended/Legacy completions, progress, creations, publications, and verifications.
*Check platform and player stats at [/stats](/stats).*

#### 6. Completion Sorting
Lets you change how someone's completed demons are displayed—for example, alphabetically or by list position instead of always using one fixed order. Supports 6 distinct sort options, tier filters, and live search.
*Available on every player profile under [/players](/players).*

#### 7. Player Claiming
Lets you prove that an existing Demonlist player profile belongs to you and connect it to your website account.
*Initiate claiming from any player profile page at [/players](/players).*

#### 8. Player Submission Locking
After claiming your player, you can require that future records under that player name must be submitted while logged into your account. This prevents impersonation.
*Enable submission locking anytime in [/settings](/settings).*

#### 9. Under Consideration Status
Gives moderators a middle state between accepted and rejected. A suspicious or unclear record can be marked UC while staff request additional footage or investigate it.
*Visible in the moderation workflow and review queue.*

#### 10. Multiple Languages / Localization
Lets users change the entire website interface into another language. Pointercrate currently supports English and Russian and has a localization system for adding more languages.
*Toggle your preferred language in the top navigation bar.*

#### 11. Google OAuth Login
Lets users create/link an account with Google and sign in through Google rather than relying entirely on an NDL username/password.
*Available on the [/login](/login) page.*

#### 12. Automatic Geometry Dash Server Integration
Connects the list directly to GD's servers. When a level is added, the site can automatically obtain information such as its description, downloads, and other in-game metadata rather than requiring staff to enter everything manually.

#### 13. Multiple Creator Credits
Allows one level to have a proper list of all qualifying creators instead of only fields such as one nerf creator/host/verifier. This is especially useful for megacollabs.
*Displayed on level detail pages.*

#### 14. Formal Difficulty Opinion System
Collects difficulty opinions from players who have beaten a level. Staff can compare it directly against nearby levels, calculate things such as mean/median placement, remove unreliable opinions, and use the results when deciding rankings.
*Accessible to verified victors on level pages.*

#### 15. Manual Record Removal & Restoration
Lets a player request that their accepted records be removed from the leaderboard and later restored. Pointercrate also has cooldown rules to stop people abusing this.
*Manageable by record owners and staff.*

#### 16. Public Staff Directory / Roles
Clearly shows who the List Editors, List Helpers, website staff, etc. are and tells users which group to contact for things like placements, rejected records, or technical problems.
*Meet the team at [/staff](/staff).*

#### 17. Automatic Duplicate-Submission Detection
Checks whether the same record has already been submitted and rejects duplicates automatically instead of sending another identical record to moderators.

#### 18. Rich Discord Embeds
When someone posts a level/Pointercrate link in Discord, Discord can automatically show a nice preview containing useful information instead of only displaying the raw URL.

#### 19. Official Demonlist Discord Bot
Pointercrate has a public Discord bot that integrates with Demonlist data, letting Discord communities access list information without manually visiting the website. An NDL version could show rankings, player stats, level info, records, etc.
*Invite the bot and view commands at [/discord-bot](/discord-bot).*

---

### Feature Overview

| # | Feature | Status | Live Link |
| :---: | :--- | :---: | :--- |
| **1** | Public API | Live | [/api-docs](/api-docs) |
| **2** | Interactive World Map | Live | [/map](/map) |
| **3** | State / Province Rankings | Live | [/countries](/countries) |
| **4** | Player Geolocation | Live | [/settings](/settings) |
| **5** | Advanced Stats Viewer | Live | [/stats](/stats) |
| **6** | Completion Sorting | Live | [/players](/players) |
| **7** | Player Claiming | Live | [/players](/players) |
| **8** | Player Submission Locking | Live | [/settings](/settings) |
| **9** | Under Consideration Status | Live | Moderation Queue |
| **10** | Multiple Languages / Localization | Live | Header Selector |
| **11** | Google OAuth Login | Live | [/login](/login) |
| **12** | Automatic GD Server Integration | Live | Admin API |
| **13** | Multiple Creator Credits | Live | Level Pages |
| **14** | Formal Difficulty Opinion System | Live | Level Pages |
| **15** | Manual Record Removal & Restoration | Live | User Records |
| **16** | Public Staff Directory / Roles | Live | [/staff](/staff) |
| **17** | Automatic Duplicate Detection | Live | Record Submissions |
| **18** | Rich Discord Embeds | Live | OpenGraph & oEmbed |
| **19** | Official Demonlist Discord Bot | Live | [/discord-bot](/discord-bot) |

---

We're incredibly excited to bring all of this to the Nerfed Demonlist community. Have feedback, suggestions, or want to get involved? Join our [Official Discord](https://discord.gg/kyYBkQzTCq)!

*— cattw21 & The Nerfed Demonlist Team*`,
};

export const DEFAULT_POSTS = [
  {
    id: "nerfed-demonlist-v2-0-0-official-roadmap",
    title: V2_ANNOUNCEMENT_POST.title,
    slug: V2_ANNOUNCEMENT_POST.slug,
    category: V2_ANNOUNCEMENT_POST.category,
    summary: V2_ANNOUNCEMENT_POST.summary,
    content: V2_ANNOUNCEMENT_POST.content,
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
