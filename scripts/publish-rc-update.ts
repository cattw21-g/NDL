import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { ChangelogCategory, PrismaClient } from "../src/generated/prisma/client";
import { requireDatabaseUrl } from "../src/lib/production-env";

const connectionString = requireDatabaseUrl(process.env, "publish changelog update");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const newPost = {
  title: "Upcoming Hub, Universal Video Player, & Profile Overhaul",
  slug: "upcoming-hub-universal-video-profiles",
  category: ChangelogCategory.SITE_UPDATE,
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

async function main() {
  const author = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  const post = await prisma.changelogPost.upsert({
    where: { slug: newPost.slug },
    update: {
      title: newPost.title,
      category: newPost.category,
      summary: newPost.summary,
      content: newPost.content,
      isPublished: true,
      isPinned: true,
      isDemo: false,
      publishedAt: new Date(),
      authorId: author?.id || null,
    },
    create: {
      ...newPost,
      isPublished: true,
      isPinned: true,
      isDemo: false,
      publishedAt: new Date(),
      authorId: author?.id || null,
    },
  });

  console.log("Successfully published changelog post:", post.title, post.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
