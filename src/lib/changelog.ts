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

export async function ensureLatestChangelogPost(prismaClient: PrismaClient) {
  try {
    await prismaClient.changelogPost.upsert({
      where: { slug: LATEST_RELEASE_POST.slug },
      update: {
        title: LATEST_RELEASE_POST.title,
        category: LATEST_RELEASE_POST.category,
        summary: LATEST_RELEASE_POST.summary,
        content: LATEST_RELEASE_POST.content,
        isPublished: true,
        isPinned: true,
        isDemo: false,
        archivedAt: null,
      },
      create: {
        title: LATEST_RELEASE_POST.title,
        slug: LATEST_RELEASE_POST.slug,
        category: LATEST_RELEASE_POST.category,
        summary: LATEST_RELEASE_POST.summary,
        content: LATEST_RELEASE_POST.content,
        isPublished: true,
        isPinned: true,
        isDemo: false,
        publishedAt: new Date("2026-08-21T21:20:00.000Z"),
      },
    });
  } catch {
    // Fail-safe
  }
}

