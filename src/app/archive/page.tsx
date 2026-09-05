import Link from "next/link";
import Image from "next/image";
import { getListStateAtDate } from "@/lib/time-machine";
import { ArchiveDatePicker, type ArchivePreset } from "@/components/archive-date-picker";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "List Archive — Nerfed Demonlist",
  description: "View the entire Nerfed Demonlist and player leaderboards exactly as they existed on any past date.",
};

type Props = {
  searchParams: Promise<{ date?: string }>;
};

export default async function ArchivePage({ searchParams }: Props) {
  const { date } = await searchParams;
  const today = new Date();
  const todayIso = today.toISOString().split("T")[0];

  // Parse requested date safely
  let validDate: Date;
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-").map(Number);
    validDate = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
  } else if (date) {
    validDate = new Date(date);
  } else {
    validDate = new Date();
  }

  // Prevent selecting future dates or NaN
  if (isNaN(validDate.getTime()) || validDate.getTime() > today.getTime()) {
    validDate = new Date();
  }

  const state = await getListStateAtDate(validDate);

  const formattedDate = validDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const currentDateIso = validDate.toISOString().split("T")[0];
  const isToday = !date || currentDateIso === todayIso;

  // Compute preset dates strictly relative to today
  const yesterday = new Date(today.getTime() - 1 * 86400000);
  const yesterdayIso = yesterday.toISOString().split("T")[0];

  const oneWeekAgo = new Date(today.getTime() - 7 * 86400000);
  const oneWeekAgoIso = oneWeekAgo.toISOString().split("T")[0];

  const oneMonthAgo = new Date(today.getTime() - 30 * 86400000);
  const oneMonthAgoIso = oneMonthAgo.toISOString().split("T")[0];

  const firstWeekReleaseIso = "2026-06-08"; // 1st week of release
  const launchDayIso = "2026-06-01"; // Release launch day

  // Determine active preset key
  let activePreset = "custom";
  if (isToday) {
    activePreset = "today";
  } else if (currentDateIso === yesterdayIso) {
    activePreset = "yesterday";
  } else if (currentDateIso === oneWeekAgoIso) {
    activePreset = "1week";
  } else if (currentDateIso === oneMonthAgoIso) {
    activePreset = "1month";
  } else if (currentDateIso === firstWeekReleaseIso) {
    activePreset = "1stweek";
  } else if (currentDateIso === launchDayIso) {
    activePreset = "launch";
  }

  const presets: ArchivePreset[] = [
    { key: "today", label: "Today (Current)", dateIso: todayIso },
    { key: "yesterday", label: "Yesterday", dateIso: yesterdayIso },
    { key: "1week", label: "1 Week Ago", dateIso: oneWeekAgoIso },
    { key: "1month", label: "1 Month Ago", dateIso: oneMonthAgoIso },
    { key: "1stweek", label: "1st Week of Release", dateIso: firstWeekReleaseIso, badge: "Jun 8" },
    { key: "launch", label: "Launch Day", dateIso: launchDayIso, badge: "Jun 1" },
  ];

  // Step dates relative to validDate
  const prevDay = new Date(validDate.getTime() - 1 * 86400000);
  const prevDayIso = prevDay.toISOString().split("T")[0];

  const nextDay = new Date(validDate.getTime() + 1 * 86400000);
  const nextDayIso = nextDay.toISOString().split("T")[0];
  const canGoNextDay = nextDayIso <= todayIso;

  const prevWeek = new Date(validDate.getTime() - 7 * 86400000);
  const prevWeekIso = prevWeek.toISOString().split("T")[0];

  const nextWeek = new Date(validDate.getTime() + 7 * 86400000);
  const nextWeekIso = nextWeek.toISOString().split("T")[0];
  const canGoNextWeek = nextWeekIso <= todayIso;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Demonlist Archive
            </h1>
            <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-2xl">
              Inspect past list standings, historical level positions, and player leaderboards exactly as they existed on any past date.
            </p>
          </div>

          <div className="mt-6">
            <ArchiveDatePicker
              currentDateIso={currentDateIso}
              todayIso={todayIso}
              formattedDate={formattedDate}
              activePreset={activePreset}
              presets={presets}
              steppers={{
                prevDayIso,
                nextDayIso,
                canGoNextDay,
                prevWeekIso,
                nextWeekIso,
                canGoNextWeek,
              }}
            />
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
              Historical Rankings ({state.levels.length})
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
                    <span className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400 border border-amber-500/20">
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
              Historical Standings
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
