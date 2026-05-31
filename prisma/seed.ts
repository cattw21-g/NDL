import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

import {
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

const rulesContent = `## Record requirements
- Records must be completed on the accepted NDL level version and must show a full completion, endscreen, FPS, and enough context for moderators to identify the run.
- Completion video links are required. Raw footage links are required for high-ranked levels and can be requested for any suspicious or borderline record.
- Click audio is required for serious records. Fake, added, replaced, or edited click sounds are banned.
- Separate microphone/click tracks are required for high-ranked records and strongly recommended for all records.
- Game audio should be present unless a moderator explicitly accepts a documented reason.

## Allowed and banned tools
- CBF is allowed for records unless a future rules update changes this policy.
- Physics bypass is not allowed unless NDL publishes a specific exception for a level or category.
- Speedhack, noclip, macros, replay bots, auto-clickers, hitbox-changing tools, input correction, and level-modifying hacks are banned for records.
- Mega Hack-style overlays may be used for display and proof, but cheat indicators must be visible when relevant.

## Level eligibility
- Eligible nerfs need a real Geometry Dash level ID, clear publisher/host credit, original level credit, nerf creator credit, verifier credit, and a stable showcase.
- A nerfed level should preserve the original route, click timing, speed, portals, gamemode order, and progression closely enough that original replay or macro compatibility is plausible under matching conditions.
- Original replay or macro compatibility is only a structural level-eligibility check. It is never an allowed record method.
- Matching conditions include game version, physics expectations, FPS/CBF assumptions, intended route, and documented exceptions for bugfixes, impossible original transitions, or necessary compatibility changes.

## Moderation discretion
- Moderators may reject or request changes for missing proof, bad audio, suspicious footage, invalid versions, broken links, unclear input details, or rule violations.
- Staff decisions should leave clear notes so submitters understand what changed or what proof is missing.

## Ranking and points
- Ranked levels award computed points based on their current main-list rank.
- Legacy levels award a small fixed value.
- Pending, rejected, and removed levels do not award points.
- A player's leaderboard score counts their best accepted record per ranked or legacy level.`;

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
      pointsAwarded: levels[0].points,
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

  await prisma.changelogPost.create({
    data: {
      title: "Demo NDL environment seeded",
      slug: "demo-environment-seeded",
      content:
        "This local database contains clearly labeled demo levels, users, and records so the NDL MVP can be verified without presenting fake real-world claims.",
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
  const admin = await upsertAdminFromEnv(prisma);
  console.log(
    `Seeded production-safe baseline rules (${rulesVersion}). No demo users, levels, submissions, records, or changelog posts were created.`,
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
