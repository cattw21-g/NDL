import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { publicRecordWhere } from "@/lib/demo-visibility";
import { calculateLeaderboard, type LeaderboardRecord } from "@/lib/points";
import { getCountryMeta } from "@/lib/countries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ countryCode: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { countryCode } = await params;
  const meta = getCountryMeta(countryCode);
  return {
    title: meta ? `${meta.flag} ${meta.name} Rankings — Nerfed Demonlist` : "Country Rankings",
    description: `Top Geometry Dash players and record holders from ${meta?.name || "this country"}.`,
  };
}

export default async function CountryDetailPage({ params }: Props) {
  const { countryCode } = await params;
  const meta = getCountryMeta(countryCode);

  if (!meta) {
    notFound();
  }

  // Fetch records and players
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

  const globalLeaderboard = calculateLeaderboard(leaderboardRecords);

  // Filter players belonging to this country (or fallback for demo/default assignment)
  const countryPlayers = globalLeaderboard.filter((p) => {
    const playerRecord = records.find((r) => r.playerId === p.playerId);
    const assignedCode = playerRecord?.player.countryCode?.toUpperCase();
    if (assignedCode === meta.code) return true;

    // Fallback matching
    const lower = p.playerName.toLowerCase();
    if (meta.code === "PL" && (lower.includes("pl") || lower.includes("sambor"))) return true;
    if (meta.code === "DE" && (lower.includes("de") || lower.includes("cat"))) return true;
    if (meta.code === "GB" && (lower.includes("uk") || lower.includes("gb"))) return true;
    if (meta.code === "US" && !assignedCode && !lower.includes("pl") && !lower.includes("de") && !lower.includes("uk")) return true;

    return false;
  });

  const totalPoints = countryPlayers.reduce((sum, p) => sum + p.points, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-zinc-400">
        <Link href="/countries" className="hover:text-white transition-colors">
          🌍 Countries
        </Link>
        <span>/</span>
        <span className="text-white">{meta.name}</span>
      </nav>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-10 shadow-2xl backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <span className="text-5xl sm:text-6xl">{meta.flag}</span>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-0.5 text-xs font-semibold text-blue-400">
                {meta.continent}
              </div>
              <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
                {meta.name} National Ranking
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Top players and record holders representing {meta.name}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 text-center min-w-28">
              <span className="text-xs text-zinc-500 uppercase font-semibold">Total Points</span>
              <p className="mt-1 text-xl font-bold text-emerald-400">{totalPoints.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 text-center min-w-28">
              <span className="text-xs text-zinc-500 uppercase font-semibold">Ranked Players</span>
              <p className="mt-1 text-xl font-bold text-white">{countryPlayers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* National Leaderboard */}
      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 shadow-xl">
        <div className="border-b border-zinc-800 bg-zinc-900/80 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🏅</span> {meta.name} Players Leaderboard
          </h2>
          <span className="text-xs text-zinc-500">Sorted by score</span>
        </div>

        {countryPlayers.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            No registered players have set {meta.name} as their country yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/40 text-xs font-semibold uppercase text-zinc-400">
                <tr>
                  <th scope="col" className="px-6 py-3.5 w-16">National Rank</th>
                  <th scope="col" className="px-6 py-3.5">Player</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Points</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Accepted Records</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {countryPlayers.map((player, idx) => (
                  <tr key={player.playerId} className="hover:bg-zinc-800/40 transition-colors">
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
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/players/${player.playerName}`}
                        className="font-bold text-white hover:text-blue-400 transition-colors"
                      >
                        {player.displayName}
                      </Link>
                      <span className="text-xs text-zinc-500 ml-2">(@{player.playerName})</span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-400">
                      {player.points.toLocaleString()} pts
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-300">
                      {player.records} record(s)
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/players/${player.playerName}`}
                        className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-200 hover:border-blue-500 hover:text-white transition-colors"
                      >
                        Profile ↗
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
