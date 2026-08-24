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
  title: "Nerfed Demonlist v1.0 Release Candidate is Live!",
  slug: "ndl-v1-0-rc-release",
  category: "SITE_UPDATE" as const,
  summary:
    "Welcome to the official Release Candidate of Nerfed Demonlist (v1.0-RC)! We’ve completely overhauled the platform with the new Upcoming Levels tab (Currently Verifying & Waiting Levels), universal video playback for Medal.tv & TikTok, player profile champion banners, global member search, Top 50 leaderboards, and instant navigation.",
  content: `## 🗂️ Live Now: The Upcoming Levels Tab
[NEW] **Dual-View Upcoming Hub**: The **Upcoming** tab is now live! Explore nerfed demons before they are officially placed on the main list.
[FEATURE] **Currently Verifying**: Watch verified runners tackle approved nerfed demons. Track their progress runs, watch verification proof videos, and copy level IDs with 1 click.
[FEATURE] **Waiting Levels**: Browse approved nerfed demon versions that are open for verification. Grab a level ID, practice the nerfs, and submit your completion!

## 🎬 Universal In-Website Video Player
[VIDEO] **Medal.tv & TikTok Support**: You can now submit and watch verification proofs and showcase runs directly from **Medal.tv** and **TikTok** right inside the list.
[IMPROVED] **Multi-Platform Playback**: Built-in responsive video player support for **YouTube** (including Shorts & timestamp jumps), **Twitch**, and **Streamable**.
[FEATURE] **Dual-Proof Switcher**: Seamlessly toggle between official verification runs and showcases with one click.

## 👑 Complete Player Profiles & Champion Podiums
[PROFILE] **Champion Podiums & Crowns**: Profile headers now feature dynamic crowns honoring **NDL Champion #1 🥇**, **Top 3 Victors 🥈🥉**, and your official global rank.
[FEATURE] **Hardest Demon Spotlight**: Your profile automatically showcases your hardest beaten ranked demon with points earned, CBF/FPS info, and proof video.
[QOL] **4-Tile Statistics Grid**: Instant breakdown of your Total Points, Global Leaderboard Standing, 100% Victories, and Progress Runs.
[QOL] **1-Click Profile Share**: Copy and share your direct profile link with friends.

## 🏆 Top 50 Leaderboard & Global Player Search
[LEADERBOARD] **Top 50 Leaderboards**: View the top 50 runners battling for points on the community leaderboard.
[SEARCH] **Find Any Registered Member**: Search for any user across NDL in the players tab, even if they haven't submitted their first record yet.
[SEARCH] **Ctrl+K Command Palette**: Press **Ctrl+K** (or Cmd+K) anywhere on the website to instantly jump to any level, player profile, or page using your keyboard.

## 📋 Ranked Demons & 1-Click GD Tools
[LIST] **Real-Time Tier Filtering**: Filter the ranked list instantly by difficulty tier (**Top 10**, **Top 50**, **Extreme Nerfed**, **Insane Nerfed**, or **Legacy**).
[QOL] **1-Click GD ID Copying**: Copy level IDs straight to your clipboard with animated visual confirmation.

## 🔔 Submissions & On-Page Status Tracking
[NEW] **On-Page Run Status**: Level pages now show your submission status (**Pending Review**, **Accepted**, **Needs Changes**, or **Rejected**) with feedback from staff.
[FEATURE] **Automated Email Alerts**: Receive an instant email when your record is accepted (with points awarded!) or when your suggested level is approved.
[FEATURE] **Suggest Nerfed Demons**: Submit new or unverified nerfed demon candidates with custom thumbnails and video links for the list.

## ⚡ Instant 0ms Navigation & Cyberpunk Intro Screen
[SPEED] **Zero-Lag Tab Transitions**: All pages are pre-loaded in the background so you can switch between the List, Upcoming, Players, and Rules with 0ms delay.
[NEW] **NDL Startup Intro Screen**: A sleek cyberpunk intro screen welcoming you to the platform.`,
};

export const DEFAULT_POSTS = [
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
**[Join the Official Nerfed Demonlist Discord](https://discord.com/channels/1541532007304003595)**

Thank you for your incredible support as we continue pushing the limits of nerfed demon tracking!

*— The Nerfed Demonlist Team & @cattw_gd*`,
    isPinned: true,
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
