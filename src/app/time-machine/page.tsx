import Link from "next/link";
import Image from "next/image";
import { getListStateAtDate } from "@/lib/time-machine";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Time Machine — Nerfed Demonlist",
  description: "View the entire Nerfed Demonlist exactly as it looked on any past date.",
};

type Props = {
  searchParams: Promise<{ date?: string }>;
};

export default async function TimeMachinePage({ searchParams }: Props) {
  const { date } = await searchParams;
  const targetDate = date ? new Date(date) : new Date();

  // If invalid date was passed, default to now
  const validDate = isNaN(targetDate.getTime()) ? new Date() : targetDate;
  const state = await getListStateAtDate(validDate);

  const formattedDate = validDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dateValueForInput = validDate.toISOString().split("T")[0];
  const targetMs = validDate.getTime();
  const weekAgoIso = new Date(targetMs - 7 * 86400000).toISOString().split("T")[0];
  const monthAgoIso = new Date(targetMs - 30 * 86400000).toISOString().split("T")[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
                <span>🕒</span> Historical Archive
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Demonlist Time Machine
              </h1>
              <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-2xl">
                Travel back in time to inspect past list standings, historical level positions, and player leaderboards exactly as they existed.
              </p>
            </div>

            {/* Date Selector Form */}
            <form method="GET" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
              <label htmlFor="date" className="text-xs font-medium text-zinc-400 self-center">
                Select Date:
              </label>
              <input
                type="date"
                id="date"
                name="date"
                defaultValue={dateValueForInput}
                max={new Date().toISOString().split("T")[0]}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors shadow-sm"
              >
                Travel 🚀
              </button>
            </form>
          </div>

          {/* Quick Presets */}
          <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-zinc-800/80">
            <span className="text-xs text-zinc-500 self-center mr-1">Quick Presets:</span>
            <Link
              href="/time-machine"
              className="rounded-md border border-zinc-800 bg-zinc-900/90 px-2.5 py-1 text-xs text-zinc-300 hover:border-amber-500/40 hover:text-white transition-colors"
            >
              Today (Live)
            </Link>
            <Link
              href={`/time-machine?date=${weekAgoIso}`}
              className="rounded-md border border-zinc-800 bg-zinc-900/90 px-2.5 py-1 text-xs text-zinc-300 hover:border-amber-500/40 hover:text-white transition-colors"
            >
              1 Week Ago
            </Link>
            <Link
              href={`/time-machine?date=${monthAgoIso}`}
              className="rounded-md border border-zinc-800 bg-zinc-900/90 px-2.5 py-1 text-xs text-zinc-300 hover:border-amber-500/40 hover:text-white transition-colors"
            >
              1 Month Ago
            </Link>
            <Link
              href="/time-machine?date=2026-08-15"
              className="rounded-md border border-zinc-800 bg-zinc-900/90 px-2.5 py-1 text-xs text-zinc-300 hover:border-amber-500/40 hover:text-white transition-colors"
            >
              August 2026
            </Link>
          </div>
        </div>
      </div>

      {/* Snapshot Summary Cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-400">Archive Date</p>
          <p className="mt-1 text-base font-bold text-amber-400 truncate">{formattedDate}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-400">Demons on List</p>
          <p className="mt-1 text-xl font-bold text-white">{state.stats.totalDemons}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-400">Top #1 Demon</p>
          <p className="mt-1 text-sm font-bold text-white truncate">
            {state.stats.topDemonName || "None"}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-400">#1 Victor</p>
          <p className="mt-1 text-sm font-bold text-emerald-400 truncate">
            {state.stats.topPlayerName || "None"}
          </p>
        </div>
      </div>

      {/* Two Column Layout: Historical Demons & Historical Leaderboard */}
      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left 2 Cols: Historical Level List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📜</span> Historical Rankings ({state.levels.length})
            </h2>
            <span className="text-xs text-zinc-500">As of {formattedDate}</span>
          </div>

          {state.levels.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-zinc-400">
              No levels were ranked on this date yet. Try picking a more recent date!
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60 rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              {state.levels.map((lvl) => (
                <div
                  key={lvl.id}
                  className="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-zinc-200 border border-zinc-700">
                      #{lvl.rank ?? "—"}
                    </span>
                    {lvl.thumbnailUrl && (
                      <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md border border-zinc-800">
                        <Image
                          src={lvl.thumbnailUrl}
                          alt={lvl.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/levels/${lvl.slug}`}
                        className="font-semibold text-white hover:text-amber-400 transition-colors truncate block"
                      >
                        {lvl.name}
                      </Link>
                      <p className="text-xs text-zinc-400 truncate">
                        By {lvl.nerfCreator || lvl.publisher} • Verifier: {lvl.verifier}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="rounded-md bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
                      {lvl.points} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Historical Player Leaderboard */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🏆</span> Historical Standings
            </h2>
            <span className="text-xs text-zinc-500">Top Players</span>
          </div>

          {state.leaderboard.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-zinc-400">
              No accepted records existed on this date.
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 divide-y divide-zinc-800/60 overflow-hidden">
              {state.leaderboard.slice(0, 20).map((player) => (
                <div
                  key={player.playerId}
                  className="flex items-center justify-between p-3.5 hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        player.rank === 1
                          ? "bg-amber-500 text-zinc-950 shadow-sm shadow-amber-500/50"
                          : player.rank === 2
                            ? "bg-zinc-300 text-zinc-950"
                            : player.rank === 3
                              ? "bg-amber-700 text-white"
                              : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {player.rank}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/players/${player.playerName}`}
                        className="font-medium text-sm text-white hover:text-amber-400 transition-colors truncate block"
                      >
                        {player.displayName}
                      </Link>
                      <p className="text-xs text-zinc-500">{player.recordsCount} record(s)</p>
                    </div>
                  </div>
                  <span className="font-semibold text-sm text-emerald-400">
                    {player.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
