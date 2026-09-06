import { Globe, MapPin, Trophy } from "lucide-react";
import { prisma } from "@/lib/db";
import { publicRecordWhere } from "@/lib/demo-visibility";
import { calculateCountryLeaderboard, calculateLeaderboard, type LeaderboardRecord } from "@/lib/points";
import { COUNTRIES, getCountryMeta } from "@/lib/countries";
import { InteractiveWorldMap, type CountryPointData } from "@/components/interactive-world-map";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Interactive World Map — Nerfed Demonlist",
  description: "Explore international Geometry Dash demonlist activity, points heat map, and country rankings.",
  openGraph: {
    title: "Interactive World Map — Nerfed Demonlist",
    description: "Explore international Geometry Dash demonlist activity, points heat map, and country rankings.",
    siteName: "Nerfed Demonlist",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Interactive World Map — Nerfed Demonlist",
    description: "Explore international Geometry Dash demonlist activity, points heat map, and country rankings.",
  },
};

export default async function WorldMapPage() {
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

  const playerRanks = calculateLeaderboard(leaderboardRecords);
  const playerCountryMap = new Map<string, string>();
  const playerCountries = new Map<
    string,
    { countryCode: string; countryName: string; flag: string; continent: string }
  >();

  for (const r of records) {
    if (r.player.countryCode && !playerCountries.has(r.player.id)) {
      playerCountryMap.set(r.player.id, r.player.countryCode.toUpperCase());
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
    playerRanks,
    playerCountries,
  );

  const countryData: CountryPointData[] = [];

  for (let i = 0; i < countryLeaderboard.length; i++) {
    const entry = countryLeaderboard[i];
    const meta = getCountryMeta(entry.countryCode);
    if (!meta) continue;

    // Find top player from this country
    const countryPlayers = playerRanks.filter(
      (p) => playerCountryMap.get(p.playerId) === entry.countryCode,
    );
    const topP = countryPlayers[0];

    countryData.push({
      code: entry.countryCode,
      name: meta.name,
      flag: meta.flag,
      continent: meta.continent,
      rank: i + 1,
      totalPoints: entry.points,
      playersCount: entry.playersCount,
      topPlayer: topP
        ? {
            playerName: topP.playerName,
            displayName: topP.displayName,
            points: topP.points,
          }
        : undefined,
    });
  }

  // Include any remaining known countries with 0 points
  for (const [code, meta] of Object.entries(COUNTRIES)) {
    if (!countryData.find((c) => c.code === code)) {
      countryData.push({
        code,
        name: meta.name,
        flag: meta.flag,
        continent: meta.continent,
        rank: countryData.length + 1,
        totalPoints: 0,
        playersCount: 0,
      });
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-b from-sky-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-cyan-400">
            <Globe className="h-6 w-6" />
            <span className="text-xs font-black uppercase tracking-widest">Global Activity</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Interactive World Map
          </h1>
          <p className="mt-2 max-w-3xl text-sm sm:text-base text-zinc-400 leading-relaxed">
            Geographic activity heat map across all registered countries and territories.
            Click any country to explore its national leaderboard, top victors, and regional records.
          </p>
        </div>
      </div>

      <InteractiveWorldMap countryData={countryData} />
    </div>
  );
}
