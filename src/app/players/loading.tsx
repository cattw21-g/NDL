import { SectionPanel } from "@/components/ui";

export default function PlayersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-300/80 bg-slate-200/60 dark:border-slate-800 dark:bg-slate-900/60 p-6 sm:p-8 h-36" />

      {/* Leaderboard Table Container */}
      <SectionPanel className="p-4 sm:p-6 space-y-4">
        {/* Search / Filter Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="h-9 w-64 rounded-md bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-32 rounded-md bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Player Rows */}
        <div className="space-y-2 mt-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800/60 bg-slate-100/50 dark:bg-slate-900/40"
            >
              <div className="flex items-center gap-3">
                <div className="h-7 w-8 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 w-36 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </SectionPanel>
    </div>
  );
}
