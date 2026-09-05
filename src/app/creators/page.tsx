import Link from "next/link";
import { prisma } from "@/lib/db";
import { publicLevelWhere } from "@/lib/demo-visibility";
import { calculateCreatorLeaderboard } from "@/lib/points";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Creator Leaderboard — Nerfed Demonlist",
  description: "Rankings and statistics for nerfed demon creators, level publishers, and verifiers.",
};

export default async function CreatorsPage() {
  const levels = await prisma.level.findMany({
    where: publicLevelWhere(),
    select: {
      id: true,
      name: true,
      slug: true,
      rank: true,
      status: true,
      nerfCreator: true,
      publisher: true,
      verifier: true,
    },
    orderBy: { rank: "asc" },
  });

  const creatorRows = calculateCreatorLeaderboard(levels);

  const totalCreators = creatorRows.length;
  const totalDemonsCreated = creatorRows.reduce((sum, c) => sum + c.createdCount, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-purple-400">
            Level Architects
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Creator Statistics & Leaderboard
          </h1>
          <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-2xl">
            Celebrating the architects behind the Nerfed Demonlist. Tracking levels nerfed, published, verified, and total creator points awarded across the list.
          </p>

          {/* Quick Metrics */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-2xl">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Active Creators</span>
              <p className="mt-1 text-xl font-bold text-white">{totalCreators}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Demons Nerfed</span>
              <p className="mt-1 text-xl font-bold text-purple-400">{totalDemonsCreated}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">#1 Creator</span>
              <p className="mt-1 text-base font-bold text-amber-400 truncate">
                {creatorRows[0]?.creatorName || "—"}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Top Demon</span>
              <p className="mt-1 text-sm font-bold text-zinc-200 truncate">
                {levels[0]?.name || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Creator Leaderboard Table */}
      <div className="mt-10 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 shadow-xl">
        <div className="border-b border-zinc-800 bg-zinc-900/80 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Creator Rankings ({creatorRows.length})
          </h2>
          <span className="text-xs text-zinc-500">Ranked by creator points & created levels</span>
        </div>

        {creatorRows.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            No creator statistics found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/40 text-xs font-semibold uppercase text-zinc-400">
                <tr>
                  <th scope="col" className="px-6 py-3.5 w-16">Rank</th>
                  <th scope="col" className="px-6 py-3.5">Creator Name</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Creator Score</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Demons Nerfed</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Demons Published</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Demons Verified</th>
                  <th scope="col" className="px-6 py-3.5">Highest Ranked Demon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {creatorRows.map((creator, idx) => (
                  <tr key={creator.creatorName} className="hover:bg-zinc-800/40 transition-colors">
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
                      <span className="font-bold text-white">{creator.creatorName}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-purple-400">
                      {creator.totalCreatorPoints.toLocaleString()} pts
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-zinc-200">
                      {creator.createdCount}
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-400">
                      {creator.publishedCount}
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-400">
                      {creator.verifiedCount}
                    </td>
                    <td className="px-6 py-4">
                      {creator.highestLevel ? (
                        <Link
                          href={`/levels/${creator.highestLevel.slug}`}
                          className="inline-flex items-center gap-1.5 font-medium text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-bold border border-amber-500/20">
                            #{creator.highestLevel.rank}
                          </span>
                          <span className="truncate max-w-xs">{creator.highestLevel.name}</span>
                        </Link>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
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
