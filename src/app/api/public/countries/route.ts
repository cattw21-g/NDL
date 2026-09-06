import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publicRecordWhere } from "@/lib/demo-visibility";
import {
  calculateCountryLeaderboard,
  calculateLeaderboard,
  type LeaderboardRecord,
} from "@/lib/points";
import { getCountryMeta } from "@/lib/countries";

export const dynamic = "force-dynamic";

export async function GET() {
  const records = await prisma.record.findMany({
    where: publicRecordWhere(),
    select: {
      playerId: true,
      pointsAwarded: true,
      levelId: true,
      acceptedAt: true,
      progress: true,
      player: {
        select: {
          id: true,
          playerName: true,
          displayName: true,
          countryCode: true,
        },
      },
    },
  });

  const leaderboardRecords: LeaderboardRecord[] = records.map((r) => ({
    playerId: r.player.id,
    playerName: r.player.playerName,
    displayName: r.player.displayName,
    levelId: r.levelId,
    pointsAwarded: r.pointsAwarded,
    acceptedAt: r.acceptedAt,
    progress: r.progress,
  }));

  const playerRows = calculateLeaderboard(leaderboardRecords);

  const playerCountries = new Map<
    string,
    { countryCode: string; countryName: string; flag: string; continent: string }
  >();

  for (const r of records) {
    if (r.player.countryCode && !playerCountries.has(r.player.id)) {
      const meta = getCountryMeta(r.player.countryCode);
      if (meta) {
        playerCountries.set(r.player.id, {
          countryCode: meta.code,
          countryName: meta.name,
          flag: meta.flag,
          continent: meta.continent,
        });
      }
    }
  }

  const countryLeaderboard = calculateCountryLeaderboard(
    playerRows,
    playerCountries,
  );

  const data = countryLeaderboard.map((entry, index) => {
    return {
      rank: index + 1,
      countryCode: entry.countryCode,
      name: entry.countryName,
      flag: entry.flag,
      continent: entry.continent,
      totalPoints: entry.points,
      playersCount: entry.playersCount,
    };
  });

  return NextResponse.json({
    data,
    totalCountries: data.length,
  });
}
