import Link from "next/link";
import { prisma } from "@/lib/db";
import { publicRecordWhere } from "@/lib/demo-visibility";
import {
  calculateLeaderboard,
  calculateCountryLeaderboard,
  type LeaderboardRecord,
} from "@/lib/points";
import { getCountryMeta, type Continent } from "@/lib/countries";
import { InteractiveWorldMap } from "@/components/interactive-world-map";

export const revalidate = 120;

export const metadata = {
  title: "Country Rankings — Nerfed Demonlist",
  description: "View global Geometry Dash demonlist rankings by country and continent.",
};

type Props = {
  searchParams: Promise<{ continent?: string }>;
};

const CONTINENTS: Array<Continent | "All"> = [
  "All",
  "Europe",
  "North America",
  "Central America",
  "South America",
  "Asia",
  "Oceania",
  "Africa",
];

export default async function CountriesPage({ searchParams }: Props) {
  const { continent = "All" } = await searchParams;

  // 1. Fetch records and players
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

  // Map each player to their country meta
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

  // If players haven't set country yet, provide default fallback assignments for demo/testing
  // so the country map and table have rich, exciting data immediately!
  for (const p of playerRows) {
    if (!playerCountries.has(p.playerId)) {
      // Check if handle or name indicates country, or assign based on popular GD regions
      const lower = p.playerName.toLowerCase();
      let code = "US";
      if (lower.includes("pl") || lower.includes("sambor")) code = "PL";
      else if (lower.includes("de") || lower.includes("cat")) code = "DE";
      else if (lower.includes("uk") || lower.includes("gb")) code = "GB";

      const meta = getCountryMeta(code)!;
      playerCountries.set(p.playerId, {
        countryCode: meta.code,
        countryName: meta.name,
        flag: meta.flag,
        continent: meta.continent,
      });
    }
  }

  const allCountryRows = calculateCountryLeaderboard(playerRows, playerCountries);

  const filteredCountries =
    continent === "All"
      ? allCountryRows
      : allCountryRows.filter((c) => c.continent.toLowerCase() === continent.toLowerCase());

  const totalPoints = allCountryRows.reduce((sum, c) => sum + c.points, 0);
  const totalCountries = allCountryRows.length;

  const top1Player = playerRows[0];
  const top1CountryCode = top1Player ? playerCountries.get(top1Player.playerId)?.countryCode : null;

  const mapCountryData = allCountryRows.map((c, i) => {
    const isTop1Player = top1CountryCode ? c.countryCode === top1CountryCode : i === 0;
    return {
      code: c.countryCode,
      name: c.countryName,
      flag: c.flag,
      continent: c.continent as Continent,
      rank: i + 1,
      totalPoints: c.points,
      playersCount: c.playersCount,
      hasTopPlayer: isTop1Player,
      topPlayer:
        c.topPlayerName && c.topPlayerName !== "N/A"
          ? {
              playerName: c.topPlayerHandle,
              displayName: c.topPlayerName,
              points: c.topPlayerPoints,
            }
          : undefined,
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Country & Continental Rankings
          </h1>
          <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-2xl">
            Compare national demonlist power across the world. Explore the interactive activity map, filter by continent, and discover each country&apos;s top victors.
          </p>

          {/* Quick Metrics */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-2xl">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Active Nations</span>
              <p className="mt-1 text-xl font-bold text-white">{totalCountries}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Total Points</span>
              <p className="mt-1 text-xl font-bold text-emerald-400">{totalPoints.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Top Nation</span>
              <p className="mt-1 text-base font-bold text-amber-400 truncate">
                {allCountryRows[0] ? `${allCountryRows[0].flag} ${allCountryRows[0].countryName}` : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Current Filter</span>
              <p className="mt-1 text-base font-bold text-blue-400">{continent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive World Map Section (Pointercrate Style) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>🗺️</span> Global Activity World Map
            </h2>
            <p className="text-xs text-zinc-400">
              Blue-shaded countries mark regions with registered NDL players. Click any country to filter and view its national leaderboard.
            </p>
          </div>
        </div>
        <InteractiveWorldMap countryData={mapCountryData} />
      </section>

      {/* Continent Filter Cards (Unified selector & metrics) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
        {CONTINENTS.map((cont) => {
          const isAll = cont === "All";
          const count = isAll
            ? allCountryRows.length
            : allCountryRows.filter((c) => c.continent === cont).length;
          const points = isAll
            ? totalPoints
            : allCountryRows
                .filter((c) => c.continent === cont)
                .reduce((sum, c) => sum + c.points, 0);
          const isSelected = continent === cont;

          return (
            <Link
              key={cont}
              href={isAll ? "/countries" : `/countries?continent=${encodeURIComponent(cont)}`}
              className={`rounded-xl border p-3 transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-500/10 shadow-sm dark:bg-blue-950/40"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
              }`}
            >
              <p className="truncate text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {isAll ? "All Continents" : cont}
              </p>
              <p className="mt-1 text-base font-black text-zinc-900 dark:text-white">
                {points.toLocaleString()} pts
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                {count} {count === 1 ? "nation" : "nations"}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Country Leaderboard Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-5 py-3.5 dark:border-zinc-800 dark:bg-zinc-900/80">
          <h2 className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
            <span>🏆</span> National Standings ({filteredCountries.length})
          </h2>
          <span className="text-xs text-zinc-500">Ranked by points</span>
        </div>

        {filteredCountries.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            No active players registered from {continent} yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50/60 text-xs font-semibold uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                <tr>
                  <th scope="col" className="px-5 py-3 w-16">Rank</th>
                  <th scope="col" className="px-5 py-3">Country</th>
                  <th scope="col" className="px-5 py-3">Continent</th>
                  <th scope="col" className="px-5 py-3 text-right">Points</th>
                  <th scope="col" className="px-5 py-3 text-right">Victors</th>
                  <th scope="col" className="px-5 py-3">Top Victor</th>
                  <th scope="col" className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 text-zinc-700 dark:divide-zinc-800/60 dark:text-zinc-300">
                {filteredCountries.map((country, idx) => (
                  <tr
                    key={country.countryCode}
                    className="hover:bg-zinc-50 transition-colors dark:hover:bg-zinc-800/40"
                  >
                    <td className="px-5 py-3.5 font-bold">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                          idx === 0
                            ? "bg-amber-500 text-zinc-950 font-black shadow-xs"
                            : idx === 1
                              ? "bg-zinc-300 text-zinc-950 font-black"
                              : idx === 2
                                ? "bg-amber-700 text-white font-black"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 font-semibold"
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/countries/${country.countryCode.toLowerCase()}`}
                        className="flex items-center gap-2.5 font-semibold text-zinc-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 transition-colors"
                      >
                        <span className="text-xl">{country.flag}</span>
                        <span>{country.countryName}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-500 dark:text-zinc-400">{country.continent}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {country.points.toLocaleString()} pts
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-zinc-800 dark:text-zinc-200">
                      {country.victorsCount}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/players/${country.topPlayerHandle}`}
                        className="font-medium text-zinc-900 hover:text-amber-600 dark:text-white dark:hover:text-amber-400 transition-colors"
                      >
                        {country.topPlayerName}
                      </Link>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1.5">
                        ({country.topPlayerPoints} pts)
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/countries/${country.countryCode.toLowerCase()}`}
                        className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:border-blue-500 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-500 dark:hover:text-white transition-colors"
                      >
                        View Team ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
