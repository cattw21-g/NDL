import { SectionPanel } from "@/components/ui";

export default function LevelLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Navigation Action Skeleton */}
      <div className="flex gap-2">
        <div className="h-8 w-36 rounded-md bg-slate-200 dark:bg-slate-800" />
        <div className="h-8 w-28 rounded-md bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Hero Header Card */}
      <SectionPanel className="p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-cyan-700/20 dark:bg-cyan-400/20" />
            <div className="h-8 sm:h-10 w-64 sm:w-96 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-48 rounded bg-slate-200/70 dark:bg-slate-800/70" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>

        {/* Video / Showcase Placeholder */}
        <div className="mt-4 aspect-video w-full rounded-xl bg-slate-200 dark:bg-slate-800/80" />

        {/* Meta Tiles Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-slate-200/70 dark:bg-slate-800/60 p-3 space-y-2">
              <div className="h-3 w-16 rounded bg-slate-300 dark:bg-slate-700" />
              <div className="h-5 w-24 rounded bg-slate-300 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </SectionPanel>

      {/* Victors Table Skeleton */}
      <SectionPanel className="p-6 space-y-4">
        <div className="h-6 w-44 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 w-full rounded bg-slate-200/60 dark:bg-slate-800/40" />
          ))}
        </div>
      </SectionPanel>
    </div>
  );
}
