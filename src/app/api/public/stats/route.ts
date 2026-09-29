import { NextRequest } from "next/server";
import { cachedJson } from "@/lib/api-cache";
import { prisma } from "@/lib/db";
import { publicLevelWhere, publicRecordWhere } from "@/lib/demo-visibility";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

  let finalRecords = records;
  if (records.length === 0) {
    const { getFallbackRecords } = await import("@/lib/fallback-records");
    finalRecords = getFallbackRecords().map((r) => ({
      id: r.id,
      playerId: r.playerId,
      pointsAwarded: r.pointsAwarded,
      progress: r.progress,
      fps: r.fps,
      cbfUsed: r.cbfUsed,
    }));
  }

  const mainList = levels.filter((l) => l.status === "RANKED" && l.rank !== null && l.rank <= 75);
  const extendedList = levels.filter((l) => l.status === "RANKED" && l.rank !== null && l.rank > 75 && l.rank <= 150);
  const legacyList = levels.filter((l) => l.status === "LEGACY" || (l.rank !== null && l.rank > 150));

  const totalPoints = finalRecords.reduce((sum, r) => sum + r.pointsAwarded, 0);
  const completions100 = finalRecords.filter((r) => r.progress === 100);
  const cbfCount = finalRecords.filter((r) => r.cbfUsed).length;

  const difficultyCounts: Record<string, number> = {
    EXTREME: levels.length,
  };

  return cachedJson(
    request,
    {
      demons: {
        total: levels.length,
        mainList: mainList.length,
        extendedList: extendedList.length,
        legacyList: legacyList.length,
      },
      records: {
        totalAccepted: records.length,
        completions100: completions100.length,
        progressRuns: finalRecords.length - completions100.length,
        totalPointsAwarded: totalPoints,
        cbfAdoptionRatePercent: records.length > 0 ? Math.round((cbfCount / records.length) * 100) : 0,
      },
      difficultyDistribution: difficultyCounts,
    },
    { sMaxAge: 120, staleWhileRevalidate: 600 },
  );
}
