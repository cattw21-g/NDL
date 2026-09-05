import Link from "next/link";
import { prisma } from "@/lib/db";
import { publicRecordWhere } from "@/lib/demo-visibility";
import {
  calculateLeaderboard,
  calculateCountryLeaderboard,
  type LeaderboardRecord,
} from "@/lib/points";
import { getCountryMeta, type Continent } from "@/lib/countries";

export const dynamic = "force-dynamic";

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-400">
              Global Standings
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Country & Continental Rankings
            </h1>
            <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-2xl">
              Compare national demonlist power across the world. Filter by continent, explore national leaderboards, and discover each country&apos;s top victors.
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

        {/* Continental Filter Tabs */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-zinc-800 pb-4">
          {CONTINENTS.map((c) => {
            const isActive = continent === c;
            return (
              <Link
                key={c}
                href={c === "All" ? "/countries" : `/countries?continent=${encodeURIComponent(c)}`}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800"
                }`}
              >
                {c === "All" ? "All Continents" : c}
              </Link>
            );
          })}
        </div>

      {/* Interactive Continent Visual Grid */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {CONTINENTS.filter((c) => c !== "All").map((cont) => {
          const count = allCountryRows.filter((c) => c.continent === cont).length;
          const points = allCountryRows
            .filter((c) => c.continent === cont)
            .reduce((sum, c) => sum + c.points, 0);
          const isSelected = continent === cont;

          return (
            <Link
              key={cont}
              href={`/countries?continent=${encodeURIComponent(cont)}`}
              className={`rounded-xl border p-4 transition-all hover:scale-105 ${
                isSelected
                  ? "border-blue-500 bg-blue-950/40 shadow-lg shadow-blue-500/20"
                  : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
              }`}
            >
              <p className="text-xs font-semibold text-zinc-400">{cont}</p>
              <p className="mt-1 text-lg font-black text-white">{points.toLocaleString()} pts</p>
              <p className="mt-1 text-xs text-zinc-500">{count} country/countries</p>
            </Link>
          );
        })}
      </div>

      {/* Country Leaderboard Table */}
      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 shadow-xl">
        <div className="border-b border-zinc-800 bg-zinc-900/80 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
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
              <thead className="border-b border-zinc-800 bg-zinc-950/40 text-xs font-semibold uppercase text-zinc-400">
                <tr>
                  <th scope="col" className="px-6 py-3.5 w-16">Rank</th>
                  <th scope="col" className="px-6 py-3.5">Country</th>
                  <th scope="col" className="px-6 py-3.5">Continent</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Points</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Victors</th>
                  <th scope="col" className="px-6 py-3.5">Top Victor</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {filteredCountries.map((country, idx) => (
                  <tr
                    key={country.countryCode}
                    className="hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                          idx === 0
                            ? "bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/50"
                            : idx === 1
                              ? "bg-zinc-300 text-zinc-950 font-black"
                              : idx === 2
                                ? "bg-amber-700 text-white font-black"
                                : "bg-zinc-800 text-zinc-400 font-semibold"
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/countries/${country.countryCode.toLowerCase()}`}
                        className="flex items-center gap-3 font-semibold text-white hover:text-blue-400 transition-colors"
                      >
                        <span className="text-2xl">{country.flag}</span>
                        <span>{country.countryName}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{country.continent}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-400">
                      {country.points.toLocaleString()} pts
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-200">
                      {country.victorsCount}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/players/${country.topPlayerHandle}`}
                        className="font-medium text-white hover:text-amber-400 transition-colors"
                      >
                        {country.topPlayerName}
                      </Link>
                      <span className="text-xs text-zinc-500 ml-1.5">
                        ({country.topPlayerPoints} pts)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/countries/${country.countryCode.toLowerCase()}`}
                        className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-200 hover:border-blue-500 hover:text-white transition-colors"
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
