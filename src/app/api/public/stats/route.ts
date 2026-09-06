import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publicLevelWhere, publicRecordWhere } from "@/lib/demo-visibility";
import { calculateLeaderboard } from "@/lib/points";

export const dynamic = "force-dynamic";

export async function GET() {
  const [levels, records] = await Promise.all([
    prisma.level.findMany({
      where: publicLevelWhere(),
      select: {
        id: true,
        rank: true,
        status: true,
        difficulty: true,
      },
    }),
    prisma.record.findMany({
      where: publicRecordWhere(),
      select: {
        id: true,
        playerId: true,
        pointsAwarded: true,
        progress: true,
        fps: true,
        cbfUsed: true,
      },
    }),
  ]);

  const mainList = levels.filter((l) => l.status === "RANKED" && l.rank !== null && l.rank <= 75);
  const extendedList = levels.filter((l) => l.status === "RANKED" && l.rank !== null && l.rank > 75 && l.rank <= 150);
  const legacyList = levels.filter((l) => l.status === "LEGACY" || (l.rank !== null && l.rank > 150));

  const totalPoints = records.reduce((sum, r) => sum + r.pointsAwarded, 0);
  const completions100 = records.filter((r) => r.progress === 100);
  const cbfCount = records.filter((r) => r.cbfUsed).length;

  const difficultyCounts: Record<string, number> = {
    ENTRY: 0,
    ADVANCED: 0,
    EXTREME: 0,
    MYTHIC: 0,
    ASCENT: 0,
  };
  for (const lvl of levels) {
    if (lvl.difficulty in difficultyCounts) {
      difficultyCounts[lvl.difficulty]++;
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    demons: {
      total: levels.length,
      mainList: mainList.length,
      extendedList: extendedList.length,
      legacyList: legacyList.length,
    },
    records: {
      totalAccepted: records.length,
      completions100: completions100.length,
      progressRuns: records.length - completions100.length,
      totalPointsAwarded: totalPoints,
      cbfAdoptionRatePercent: records.length > 0 ? Math.round((cbfCount / records.length) * 100) : 0,
    },
    difficultyDistribution: difficultyCounts,
  });
}
