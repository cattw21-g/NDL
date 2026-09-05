import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const METADATA: Record<
  string,
  {
    songName: string;
    songArtist: string;
    songId: string;
    songLink: string;
    levelLength: string;
    objectCount: number;
    gameVersion: string;
    inGameDifficulty: string;
    copyPassword: string;
    minimumProgress: number;
  }
> = {
  "kocmoc-unleashed": {
    songName: "Theory of Everything 2 (Remix)",
    songArtist: "dj-Nate",
    songId: "542289",
    songLink: "https://www.newgrounds.com/audio/listen/542289",
    levelLength: "Long (1m 45s)",
    objectCount: 42100,
    gameVersion: "2.2",
    inGameDifficulty: "Extreme Demon",
    copyPassword: "Free copy",
    minimumProgress: 45,
  },
  "amethyst": {
    songName: "Amethyst (Original Mix)",
    songArtist: "Waterflame",
    songId: "812390",
    songLink: "https://www.newgrounds.com/audio/listen/812390",
    levelLength: "XL (2m 10s)",
    objectCount: 68500,
    gameVersion: "2.2",
    inGameDifficulty: "Extreme Demon",
    copyPassword: "Free copy",
    minimumProgress: 50,
  },
  "tidal-wave": {
    songName: "Shiawase (VIP)",
    songArtist: "Dion Timmer",
    songId: "1002341",
    songLink: "https://www.newgrounds.com/audio/listen/1002341",
    levelLength: "XL (2m 24s)",
    objectCount: 89400,
    gameVersion: "2.2",
    inGameDifficulty: "Extreme Demon",
    copyPassword: "Free copy",
    minimumProgress: 50,
  },
  "acheron": {
    songName: "Thermodynamix",
    songArtist: "dj-Nate",
    songId: "518598",
    songLink: "https://www.newgrounds.com/audio/listen/518598",
    levelLength: "Long (1m 38s)",
    objectCount: 38200,
    gameVersion: "2.2",
    inGameDifficulty: "Extreme Demon",
    copyPassword: "Free copy",
    minimumProgress: 50,
  },
  "silent-clubstep": {
    songName: "Clubstep",
    songArtist: "DJVI",
    songId: "Official",
    songLink: "https://www.newgrounds.com/audio/listen/396093",
    levelLength: "Long (1m 27s)",
    objectCount: 14200,
    gameVersion: "2.2",
    inGameDifficulty: "Extreme Demon",
    copyPassword: "Free copy",
    minimumProgress: 50,
  },
  "cataclysm": {
    songName: "At the Speed of Light",
    songArtist: "Dimrain47",
    songId: "467339",
    songLink: "https://www.newgrounds.com/audio/listen/467339",
    levelLength: "Long (1m 32s)",
    objectCount: 22100,
    gameVersion: "2.2",
    inGameDifficulty: "Extreme Demon",
    copyPassword: "Free copy",
    minimumProgress: 50,
  },
};

export async function GET() {
  try {
    // 1. Ensure all schema columns, tables, and constraints exist on the database
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Level" ADD COLUMN IF NOT EXISTS "songName" TEXT;
      ALTER TABLE "Level" ADD COLUMN IF NOT EXISTS "songArtist" TEXT;
      ALTER TABLE "Level" ADD COLUMN IF NOT EXISTS "songId" TEXT;
      ALTER TABLE "Level" ADD COLUMN IF NOT EXISTS "songLink" TEXT;
      ALTER TABLE "Level" ADD COLUMN IF NOT EXISTS "levelLength" TEXT;
      ALTER TABLE "Level" ADD COLUMN IF NOT EXISTS "objectCount" INTEGER;
      ALTER TABLE "Level" ADD COLUMN IF NOT EXISTS "gameVersion" TEXT;
      ALTER TABLE "Level" ADD COLUMN IF NOT EXISTS "inGameDifficulty" TEXT;
      ALTER TABLE "Level" ADD COLUMN IF NOT EXISTS "copyPassword" TEXT;
      ALTER TABLE "Level" ADD COLUMN IF NOT EXISTS "minimumProgress" INTEGER NOT NULL DEFAULT 50;
      ALTER TABLE "Level" ADD COLUMN IF NOT EXISTS "creatorUserId" TEXT;
      ALTER TABLE "Level" ADD COLUMN IF NOT EXISTS "publisherUserId" TEXT;

      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "countryCode" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subdivision" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "youtubeUrl" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twitchUrl" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twitterUrl" TEXT;

      CREATE TABLE IF NOT EXISTS "LevelPositionSnapshot" (
        "id" TEXT NOT NULL,
        "levelId" TEXT NOT NULL,
        "status" "LevelStatus" NOT NULL,
        "action" TEXT NOT NULL,
        "rank" INTEGER,
        "notes" TEXT,
        "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LevelPositionSnapshot_pkey" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "LevelPositionSnapshot_levelId_recordedAt_idx" ON "LevelPositionSnapshot"("levelId", "recordedAt");
      CREATE INDEX IF NOT EXISTS "LevelPositionSnapshot_recordedAt_idx" ON "LevelPositionSnapshot"("recordedAt");
    `);

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "LevelPositionSnapshot" ADD CONSTRAINT "LevelPositionSnapshot_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch {
      // Constraint may already exist
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Level" ADD CONSTRAINT "Level_creatorUserId_fkey" FOREIGN KEY ("creatorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      `);
    } catch {
      // Constraint may already exist
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Level" ADD CONSTRAINT "Level_publisherUserId_fkey" FOREIGN KEY ("publisherUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      `);
    } catch {
      // Constraint may already exist
    }

    const levels = await prisma.level.findMany();
    let updatedCount = 0;
    let snapshotCount = 0;

    for (const lvl of levels) {
      const key = Object.keys(METADATA).find((k) => lvl.slug.toLowerCase().includes(k));
      const meta = key ? METADATA[key] : null;

      await prisma.level.update({
        where: { id: lvl.id },
        data: {
          songName: lvl.songName || meta?.songName || "Geometry Dash Theme",
          songArtist: lvl.songArtist || meta?.songArtist || "Waterflame",
          songId: lvl.songId || meta?.songId || "Official",
          songLink: lvl.songLink || meta?.songLink || "https://www.newgrounds.com",
          levelLength: lvl.levelLength || meta?.levelLength || "Long (1m 40s)",
          objectCount: lvl.objectCount || meta?.objectCount || 35000,
          gameVersion: lvl.gameVersion || meta?.gameVersion || "2.2",
          inGameDifficulty: lvl.inGameDifficulty || meta?.inGameDifficulty || "Extreme Demon",
          copyPassword: lvl.copyPassword || meta?.copyPassword || "Free copy",
          minimumProgress: lvl.minimumProgress || meta?.minimumProgress || 50,
        },
      });
      updatedCount++;

      const existingSnapshot = await prisma.levelPositionSnapshot.findFirst({
        where: { levelId: lvl.id },
      });

      if (!existingSnapshot && lvl.rank) {
        await prisma.levelPositionSnapshot.create({
          data: {
            levelId: lvl.id,
            rank: lvl.rank,
            status: lvl.status,
            action: "PLACED",
            notes: `Placed at #${lvl.rank}`,
            recordedAt: lvl.placementDate || lvl.createdAt || new Date(),
          },
        });
        snapshotCount++;
      }
    }

    return NextResponse.json({
      status: "ok",
      levelsChecked: levels.length,
      levelsUpdated: updatedCount,
      snapshotsCreated: snapshotCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", error: message }, { status: 500 });
  }
}
