import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role, DifficultyCategory, LevelStatus } from "../src/generated/prisma/client";
import { FALLBACK_PLAYERS, FALLBACK_RECORDS } from "../src/lib/fallback-records";
import { FALLBACK_RANKED_LEVELS } from "../src/lib/fallback-levels";
import { requireDatabaseUrl } from "../src/lib/production-env";

const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012";

export async function seedVerifierRecords(prisma: PrismaClient) {
  console.log("Seeding baseline verifiers and their 100% completion records...");

  // 1. Upsert verifier players
  const playerMap = new Map<string, string>(); // playerName -> userId

  for (const p of FALLBACK_PLAYERS) {
    const existing = await prisma.user.findFirst({
      where: { playerName: { equals: p.playerName, mode: "insensitive" } },
    });

    if (existing) {
      playerMap.set(p.playerName.toLowerCase(), existing.id);
      playerMap.set(p.displayName.toLowerCase(), existing.id);
    } else {
      const created = await prisma.user.create({
        data: {
          id: p.id,
          playerName: p.playerName,
          displayName: p.displayName,
          email: `${p.playerName}@nerfeddemonlist.net`,
          passwordHash: DUMMY_HASH,
          countryCode: p.countryCode,
          subdivision: p.subdivision,
          bio: p.bio,
          youtubeUrl: p.youtubeUrl,
          role: p.role as Role,
          isDemo: false,
        },
      });
      playerMap.set(p.playerName.toLowerCase(), created.id);
      playerMap.set(p.displayName.toLowerCase(), created.id);
    }
  }

  // 2. Upsert ranked levels if missing, or update their verifierUserId
  const levelMap = new Map<string, string>(); // level slug/id -> levelId

  for (const lvl of FALLBACK_RANKED_LEVELS) {
    const verifierUserId = playerMap.get(lvl.verifier.toLowerCase()) || null;

    const existingLevel = await prisma.level.findFirst({
      where: {
        OR: [{ id: lvl.id }, { slug: lvl.slug }],
      },
    });

    if (existingLevel) {
      if (!existingLevel.verifierUserId && verifierUserId) {
        await prisma.level.update({
          where: { id: existingLevel.id },
          data: { verifierUserId },
        });
      }
      levelMap.set(lvl.slug, existingLevel.id);
      levelMap.set(lvl.id, existingLevel.id);
    } else {
      const createdLevel = await prisma.level.create({
        data: {
          id: lvl.id,
          slug: lvl.slug,
          rank: lvl.rank,
          name: lvl.name,
          originalName: lvl.originalName,
          gdLevelId: lvl.gdLevelId,
          publisher: lvl.publisher,
          nerfCreator: lvl.nerfCreator,
          verifier: lvl.verifier,
          verifierUserId,
          thumbnailUrl: lvl.thumbnailUrl,
          showcaseUrl: lvl.showcaseUrl,
          status: lvl.status as LevelStatus,
          difficulty: DifficultyCategory.EXTREME,
          points: lvl.points,
          description: lvl.description,
          isDemo: false,
        },
      });
      levelMap.set(lvl.slug, createdLevel.id);
      levelMap.set(lvl.id, createdLevel.id);
    }
  }

  // 3. Upsert 100% verifier completion records
  let createdCount = 0;
  for (const rec of FALLBACK_RECORDS) {
    const dbLevelId = levelMap.get(rec.level.slug) || levelMap.get(rec.levelId);
    const dbPlayerId = playerMap.get(rec.player.playerName.toLowerCase()) || rec.playerId;

    if (!dbLevelId || !dbPlayerId) continue;

    const existingRecord = await prisma.record.findFirst({
      where: {
        levelId: dbLevelId,
        playerId: dbPlayerId,
        progress: 100,
      },
    });

    if (!existingRecord) {
      await prisma.record.create({
        data: {
          id: rec.id,
          playerId: dbPlayerId,
          levelId: dbLevelId,
          progress: 100,
          isVerifier: true,
          videoUrl: rec.videoUrl,
          fps: rec.fps,
          cbfUsed: rec.cbfUsed,
          pointsAwarded: rec.pointsAwarded,
          acceptedAt: rec.acceptedAt,
          isDemo: false,
        },
      });
      createdCount++;
    }
  }

  console.log(`Successfully verified baseline verifiers. Inserted ${createdCount} missing verifier records.`);
}

async function main() {
  let connectionString: string;
  try {
    connectionString = requireDatabaseUrl(process.env, "seed verifiers");
  } catch (err) {
    console.warn("DATABASE_URL not available, skipping database seed execution:", err);
    return;
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    await seedVerifierRecords(prisma);
  } catch (err) {
    console.error("Error seeding verifier records:", err);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.includes("seed-verifier-records")) {
  main().catch(console.error);
}
