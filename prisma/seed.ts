import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

import {
  ChangelogCategory,
  DifficultyCategory,
  LevelStatus,
  ModerationActionType,
  PrismaClient,
  RecordStatus,
  Role,
} from "../src/generated/prisma/client";
import { upsertAdminFromEnv } from "../src/lib/admin-bootstrap";
import { calculateLevelPoints } from "../src/lib/points";
import { assertProductionEnv, requireDatabaseUrl } from "../src/lib/production-env";
import { demoSeedEnabled, demoSeedResetEnabled } from "../src/lib/seed-flags";

assertProductionEnv(process.env);

const connectionString = requireDatabaseUrl(process.env, "seed NDL");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const seedDemoData = demoSeedEnabled(process.env);
const resetForDemo = demoSeedResetEnabled(process.env);
const rulesVersion =
  process.env.NDL_RULES_VERSION ?? (seedDemoData ? "demo-v1" : "production-v1");

const rulesContent = `## General policy
- NDL ranks approved nerfed Geometry Dash demon versions and accepted records on those versions.
- Every record and level suggestion is reviewed by staff before it affects public rankings or points.
- High-ranked means main-list rank #1-#50 unless staff states otherwise.
- Staff may request extra proof when a run, level version, link, or technical detail is unclear.

## Record requirements
- Records must be completed on the accepted NDL level version and show a full completion, endscreen, FPS, and enough context for moderators to identify the run.
- The submitted completion video must be watchable by staff and must match the player, level, and version being claimed.
- Players must report FPS, CBF usage, input method, click/audio proof, and any relevant recording notes.
- A record is not public and does not award points until staff accepts it.

## Video and raw footage
- Completion video links are the primary proof method and should use stable public or reviewer-accessible URLs.
- Raw footage is required for high-ranked records and may be requested for any suspicious, borderline, or technically unusual run.
- Raw footage links are visible only to staff unless the submitter chooses to make them public.
- Do not cut away from the run before the completion and endscreen are clear enough to review.

## Click audio and microphone proof
- Click audio is required for serious records. Fake, added, replaced, or edited click sounds are banned.
- Separate microphone or click tracks are required for high-ranked records and strongly recommended for all records.
- Game audio should be present unless a moderator explicitly accepts a documented reason.
- Audio should line up with visible inputs and gameplay timing.

## Overlays and visibility
- FPS, CPS, cheat indicators, and other proof overlays should remain visible when they are relevant to the run.
- Overlay-only tools may be used for display and proof, but they must not alter gameplay, inputs, hitboxes, physics, or level data.
- Staff may reject proof that hides important UI, crops essential context, or makes the run difficult to verify.

## Allowed tools and settings
- CBF is allowed for records unless a future rules update changes this policy.
- Standard recording, streaming, input display, FPS display, and non-gameplay overlay tools are allowed.
- Practice, start position, or macro tools may be used for routing and verification work outside submitted record attempts.

## Banned tools and methods
- Physics bypass is not allowed unless NDL publishes a specific exception for a level or category.
- Speedhack, noclip, macros, replay bots, auto-clickers, hitbox-changing tools, input correction, and level-modifying hacks are banned for records.
- Original replay or macro compatibility is only a structural level-eligibility check. It is never an allowed record method.
- Submitted records must be human completions, not replayed or automated completions.

## Level eligibility
- Eligible nerfs need a real Geometry Dash level ID, clear publisher or host credit, original level credit, nerf creator credit, verifier credit, and a stable showcase.
- A nerfed level should preserve the original route, click timing, speed, portals, gamemode order, and progression closely enough that original replay or macro compatibility is plausible under matching conditions.
- Matching conditions include game version, physics expectations, FPS/CBF assumptions, intended route, and documented exceptions for bugfixes, impossible original transitions, or necessary compatibility changes.
- Staff may reject a suggestion if the level is not identifiable, is too far from the original, or cannot be reviewed safely.

## Submissions and review
- Submitters should provide working links, accurate credits, and enough detail for staff to reproduce the review decision.
- Staff may accept, reject, or mark a record or suggestion as needs changes.
- Broken links, missing proof, unclear versions, bad audio, suspicious footage, or rule violations can delay or prevent acceptance.
- Private submission details, staff notes, and private proof links stay off public pages.

## Ranking and points
- Ranked levels award computed points based on their current main-list rank. Rank #1 awards 320 points and lower ranks decrease from the same formula.
- Legacy levels award a fixed 25 points in the current implementation.
- Pending, rejected, and removed levels do not award points.
- A player's leaderboard score counts their best accepted record per ranked or legacy level.

## Moderation discretion
- Rules cannot cover every edge case. NDL staff may use judgment when evidence, level structure, or technical setup creates uncertainty.
- Staff decisions should leave clear notes so submitters understand what changed or what proof is missing.
- Rankings, records, and points may change after review if new information becomes available.`;

const launchPost = {
  title: "NDL public beta is live",
  slug: "ndl-public-beta-is-live",
  category: ChangelogCategory.ANNOUNCEMENT,
  summary:
    "Nerfed Demonlist is open for public beta with ranked levels, record submissions, level suggestions, rules, and staff review.",
  content:
    "NDL is now ready for public beta. Players can view ranked nerfed demon versions, submit records for review, suggest new level candidates, and read the official v1.0 rules. Staff will continue to review submissions, tune rankings, and publish updates as the list grows.",
};

const rcUpdatePost = {
  title: "Nerfed Demonlist v1.0 Release Candidate is Live!",
  slug: "ndl-v1-0-rc-release",
  category: ChangelogCategory.SITE_UPDATE,
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

const recordsSuggestionsPost = {
  title: "Records & Suggestions Update",
  slug: "records-suggestions-update",
  category: ChangelogCategory.MODERATION_NOTE,
  summary:
    "Records and suggestions will not be reviewed until 17/08/26 as we work on an upcoming update and our new Discord server.",
  content: `Hey everyone!

Just a quick update: Records and Suggestions will not be reviewed until 17/08/26 while we focus on preparing our upcoming update and getting the new Discord server ready.

We appreciate your patience and understanding while we work on everything behind the scenes. In the meantime, keep playing, have fun, and good luck trying to beat the levels on NDL!

More updates will be shared soon, so stay tuned!`,
};

async function seedRules(version: string) {
  const existingRules = await prisma.rulesDocument.findFirst({
    where: {
      version,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  const activeRules = existingRules
    ? await prisma.rulesDocument.update({
        where: {
          id: existingRules.id,
        },
        data: {
          content: rulesContent,
          isActive: true,
        },
      })
    : await prisma.rulesDocument.create({
        data: {
          version,
          content: rulesContent,
          isActive: true,
        },
      });

  await prisma.rulesDocument.updateMany({
    where: {
      isActive: true,
      id: {
        not: activeRules.id,
      },
    },
    data: {
      isActive: false,
    },
  });

  return activeRules;
}

async function seedLaunchPost() {
  await prisma.changelogPost.upsert({
    where: {
      slug: launchPost.slug,
    },
    update: {
      title: launchPost.title,
      category: launchPost.category,
      summary: launchPost.summary,
      content: launchPost.content,
      isPublished: true,
      isPinned: false,
      isDemo: false,
      archivedAt: null,
      publishedAt: new Date("2026-06-01T00:00:00.000Z"),
    },
    create: {
      ...launchPost,
      isPublished: true,
      isPinned: false,
      isDemo: false,
      publishedAt: new Date("2026-06-01T00:00:00.000Z"),
    },
  });

  await prisma.changelogPost.upsert({
    where: {
      slug: recordsSuggestionsPost.slug,
    },
    update: {
      title: recordsSuggestionsPost.title,
      category: recordsSuggestionsPost.category,
      summary: recordsSuggestionsPost.summary,
      content: recordsSuggestionsPost.content,
      isPublished: true,
      isPinned: false,
      isDemo: false,
      archivedAt: null,
      publishedAt: new Date("2026-08-13T19:52:00.000Z"),
    },
    create: {
      ...recordsSuggestionsPost,
      isPublished: true,
      isPinned: false,
      isDemo: false,
      publishedAt: new Date("2026-08-13T19:52:00.000Z"),
    },
  });

  return prisma.changelogPost.upsert({
    where: {
      slug: rcUpdatePost.slug,
    },
    update: {
      title: rcUpdatePost.title,
      category: rcUpdatePost.category,
      summary: rcUpdatePost.summary,
      content: rcUpdatePost.content,
      isPublished: true,
      isPinned: true,
      isDemo: false,
      archivedAt: null,
      publishedAt: new Date("2026-08-21T21:20:00.000Z"),
    },
    create: {
      ...rcUpdatePost,
      isPublished: true,
      isPinned: true,
      isDemo: false,
      publishedAt: new Date("2026-08-21T21:20:00.000Z"),
    },
  });
}

async function resetDemoTables() {
  await prisma.moderationAction.deleteMany();
  await prisma.record.deleteMany();
  await prisma.recordSubmission.deleteMany();
  await prisma.levelHistory.deleteMany();
  await prisma.changelogPost.deleteMany();
  await prisma.rulesDocument.deleteMany();
  await prisma.level.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
}

async function seedDemo() {
  if (!resetForDemo) {
    throw new Error(
      "Refusing to create demo data without NDL_SEED_RESET=true. Demo seeding is destructive and should not be used for production data.",
    );
  }

  await resetDemoTables();

  const [admin, moderator, player, secondPlayer] = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@ndl.local",
        emailVerifiedAt: new Date("2026-05-01T00:00:00.000Z"),
        playerName: "ndl_admin",
        displayName: "NDL Admin",
        role: Role.ADMIN,
        isDemo: true,
        passwordHash: await hash("AdminPass123!", 12),
      },
    }),
    prisma.user.create({
      data: {
        email: "mod@ndl.local",
        emailVerifiedAt: new Date("2026-05-01T00:00:00.000Z"),
        playerName: "queue_mod",
        displayName: "Queue Moderator",
        role: Role.MODERATOR,
        isDemo: true,
        passwordHash: await hash("ModPass123!", 12),
      },
    }),
    prisma.user.create({
      data: {
        email: "player@ndl.local",
        emailVerifiedAt: new Date("2026-05-01T00:00:00.000Z"),
        playerName: "demo_player",
        displayName: "Demo Player",
        role: Role.PLAYER,
        isDemo: true,
        passwordHash: await hash("PlayerPass123!", 12),
      },
    }),
    prisma.user.create({
      data: {
        email: "rival@ndl.local",
        emailVerifiedAt: new Date("2026-05-01T00:00:00.000Z"),
        playerName: "rival_runner",
        displayName: "Rival Runner",
        role: Role.PLAYER,
        isDemo: true,
        passwordHash: await hash("PlayerPass123!", 12),
      },
    }),
  ]);

  const levelInputs = [
    {
      rank: 1,
      slug: "demo-abyssal-mercy",
      name: "[DEMO] Abyssal Mercy",
      originalName: "Abyss of Darkness",
      gdLevelId: "100000001",
      publisher: "NDL Demo Host",
      nerfCreator: "Demo Nerf Team",
      verifier: "Demo Player",
      thumbnailUrl: "/demo-thumbnails/level-1.svg",
      showcaseUrl: "https://example.com/demo-abyssal-mercy-showcase",
      status: LevelStatus.RANKED,
      difficulty: DifficultyCategory.MYTHIC,
      description:
        "Clearly labeled demo entry for validating the top-list, proof, and record flows. This is not a real ranked NDL claim.",
    },
    {
      rank: 2,
      slug: "demo-solar-drift",
      name: "[DEMO] Solar Drift",
      originalName: "Sonic Wave",
      gdLevelId: "100000002",
      publisher: "NDL Demo Host",
      nerfCreator: "Route Lab",
      verifier: "Rival Runner",
      thumbnailUrl: "/demo-thumbnails/level-2.svg",
      showcaseUrl: "https://example.com/demo-solar-drift-showcase",
      status: LevelStatus.RANKED,
      difficulty: DifficultyCategory.EXTREME,
      description:
        "Clearly labeled demo level used to verify ranking, record visibility, and player leaderboard scoring.",
    },
    {
      rank: 3,
      slug: "demo-neon-descent",
      name: "[DEMO] Neon Descent",
      originalName: "Bloodbath",
      gdLevelId: "100000003",
      publisher: "NDL Demo Host",
      nerfCreator: "Practice Guild",
      verifier: "Queue Moderator",
      thumbnailUrl: "/demo-thumbnails/level-3.svg",
      showcaseUrl: "https://example.com/demo-neon-descent-showcase",
      status: LevelStatus.LEGACY,
      difficulty: DifficultyCategory.ADVANCED,
      description:
        "Clearly labeled legacy demo level for checking legacy visibility and reduced points behavior.",
    },
  ];

  const levels = await Promise.all(
    levelInputs.map((level) =>
      prisma.level.create({
        data: {
          ...level,
          points: calculateLevelPoints(level.rank, level.status),
          placementDate: new Date("2026-05-01T00:00:00.000Z"),
          isDemo: true,
          versionNotes:
            "Demo version locked for local workflow testing. Replace before public launch.",
          history: {
            create: {
              actorId: admin.id,
              action: "Seeded",
              notes: "Clearly labeled demo data for local verification.",
            },
          },
        },
      }),
    ),
  );

  const accepted = await prisma.recordSubmission.create({
    data: {
      playerId: player.id,
      levelId: levels[0].id,
      videoUrl: "https://example.com/demo-player-abyssal-mercy",
      rawFootageUrl: "https://example.com/demo-player-abyssal-mercy-raw",
      fps: 240,
      cbfUsed: true,
      clickAudioIncluded: true,
      separateMicClickTrack: true,
      gameAudioIncluded: true,
      rawFootageIncluded: true,
      fpsOverlayVisible: true,
      cpsCounterVisible: true,
      cheatIndicatorVisible: true,
      microphoneModel: "Demo USB microphone",
      inputDevice: "Keyboard, space key",
      proofNotes:
        "Demo-only structured proof entry for validating moderator display.",
      clickAudioNotes:
        "Demo submission with visible clicks and separated audio noted for workflow testing.",
      deviceNotes: "Keyboard, 240 FPS, CPS counter visible.",
      comments: "Clearly labeled seeded accepted record.",
      isDemo: true,
      status: RecordStatus.ACCEPTED,
      reviewerId: moderator.id,
      reviewedAt: new Date("2026-05-10T12:00:00.000Z"),
      moderatorNotes: "Accepted as seeded demo data.",
    },
  });

  await prisma.record.create({
    data: {
      playerId: player.id,
      levelId: levels[0].id,
      submissionId: accepted.id,
      videoUrl: accepted.videoUrl,
      rawFootageUrl: accepted.rawFootageUrl,
      fps: accepted.fps,
      cbfUsed: accepted.cbfUsed,
      pointsAwarded: calculateLevelPoints(levels[0].rank, levels[0].status),
      isDemo: true,
      acceptedAt: new Date("2026-05-10T12:00:00.000Z"),
    },
  });

  await prisma.recordSubmission.create({
    data: {
      playerId: secondPlayer.id,
      levelId: levels[1].id,
      videoUrl: "https://example.com/rival-runner-solar-drift",
      rawFootageUrl: "https://example.com/rival-runner-solar-drift-raw",
      fps: 360,
      cbfUsed: false,
      clickAudioIncluded: true,
      separateMicClickTrack: false,
      gameAudioIncluded: true,
      rawFootageIncluded: true,
      fpsOverlayVisible: true,
      cpsCounterVisible: true,
      cheatIndicatorVisible: false,
      microphoneModel: "Demo headset microphone",
      inputDevice: "Mouse, left click",
      proofNotes:
        "Demo-only pending structured proof item for review queue testing.",
      clickAudioNotes:
        "Demo pending submission with click notes ready for moderation.",
      deviceNotes: "Mouse, 360 FPS, endscreen visible.",
      comments: "Seeded pending item for the review queue.",
      isDemo: true,
    },
  });

  await seedRules(rulesVersion);
  await seedLaunchPost();

  await prisma.changelogPost.create({
    data: {
      title: "Demo NDL environment seeded",
      slug: "demo-environment-seeded",
      category: "SITE_UPDATE",
      summary:
        "Demo-only changelog entry confirming that local seeded data was created.",
      content:
        "This local database contains clearly labeled demo levels, users, and records so the NDL MVP can be verified without presenting fake real-world claims.",
      isPublished: true,
      isPinned: false,
      publishedAt: new Date(),
      authorId: admin.id,
      isDemo: true,
    },
  });

  await prisma.moderationAction.create({
    data: {
      actorId: moderator.id,
      type: ModerationActionType.SUBMISSION_ACCEPTED,
      targetType: "RecordSubmission",
      targetId: accepted.id,
      summary:
        "Queue Moderator accepted Demo Player's [DEMO] Abyssal Mercy record as seeded demo data.",
    },
  });

  console.log("Seeded destructive demo data. Do not run this against production.");
}

async function main() {
  if (seedDemoData) {
    await seedDemo();
    const admin = await upsertAdminFromEnv(prisma);
    if (admin) {
      console.log(`Environment admin ready: ${admin.email} (${admin.playerName}).`);
    }
    return;
  }

  await seedRules(rulesVersion);
  await seedLaunchPost();
  const admin = await upsertAdminFromEnv(prisma);
  console.log(
    `Seeded production-safe baseline rules (${rulesVersion}) and launch changelog post. No demo users, levels, submissions, or records were created.`,
  );
  if (admin) {
    console.log(`Environment admin ready: ${admin.email} (${admin.playerName}).`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
