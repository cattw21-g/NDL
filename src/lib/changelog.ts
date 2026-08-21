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
  title: "Upcoming Hub, Universal Video Player, & Profile Overhaul",
  slug: "upcoming-hub-universal-video-profiles",
  category: "SITE_UPDATE" as const,
  summary:
    "A massive update brings the new Upcoming Levels Hub with dual sub-tabs, universal video playback for Medal.tv & TikTok, completely redesigned player profiles with Champion crowns, Top 50 leaderboards with global player search, and instant zero-lag page navigation!",
  content: `## 🗂️ The New Upcoming Levels Hub
[NEW] **Dual-Tab Upcoming Page**: Explore nerfed demons in active development and verification via the new **Upcoming** hub.
[FEATURE] **Currently Verifying**: Watch assigned verifiers progress on approved nerfed demons with embedded video previews and 1-click GD ID copying.
[FEATURE] **Waiting Levels**: Browse approved nerfed demons open for verification. Grab a level and submit your verification run!

## 📱 Universal Video Player Support
[VIDEO] **Medal.tv & TikTok Integration**: You can now submit and watch verification proofs and level showcases from **Medal.tv** and **TikTok** directly within the site.
[IMPROVED] **Enhanced Playback**: Full responsive playback support for YouTube (including Shorts and timestamps), Twitch, Streamable, Medal, and TikTok.

## 👑 Redesigned Player Profiles
[PROFILE] **Champion & Rank Badges**: Profiles now feature an elevated banner with dynamic rank crowns (NDL Champion #1 🥇, Top 3 Victor 🥈🥉, or Global Rank #X).
[FEATURE] **Hardest Demon Spotlight**: Your profile automatically spotlights the hardest ranked demon you've beaten with rank, points earned, and direct proof video.
[QOL] **4-Tile Statistics Grid**: Instant breakdown of your Total Points, Global Leaderboard Standing, 100% Victories count, and Verified Demon milestones.
[QOL] **1-Click Profile Share**: Easily share your personal profile with a custom copied link.

## 🏆 Top 50 Leaderboard & Global Player Search
[LEADERBOARD] **Top 50 Rankings**: The public Player Leaderboard now showcases the top 50 players competing for the highest points.
[NEW] **Global Member Search**: Search for any registered member or runner across the entire site, even if they're still working toward their first record.

## ⚡ Instant 0ms Navigation & Intro Splash
[SPEED] **Zero-Lag Tab Switching**: All main pages are pre-loaded in the background so you can switch between the List, Upcoming, Players, and Rules with 0ms delay.
[NEW] **NDL Intro Screen**: A sleek startup intro screen highlighting the community project.`,
};

export async function ensureLatestChangelogPost(prismaClient: PrismaClient) {
  try {
    const existing = await prismaClient.changelogPost.findUnique({
      where: { slug: LATEST_RELEASE_POST.slug },
    });

    if (!existing) {
      await prismaClient.changelogPost.create({
        data: {
          title: LATEST_RELEASE_POST.title,
          slug: LATEST_RELEASE_POST.slug,
          category: LATEST_RELEASE_POST.category,
          summary: LATEST_RELEASE_POST.summary,
          content: LATEST_RELEASE_POST.content,
          isPublished: true,
          isPinned: true,
          isDemo: false,
          publishedAt: new Date("2026-08-21T21:00:00.000Z"),
        },
      });
    }
  } catch {
    // Fail-safe
  }
}

