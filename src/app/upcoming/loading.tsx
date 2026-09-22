import { SectionPanel } from "@/components/ui";

export default function UpcomingLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-300/80 bg-slate-200/60 dark:border-slate-800 dark:bg-slate-900/60 p-6 sm:p-8 h-36" />

      {/* Tabs Skeleton */}
      <div className="flex gap-2">
        <div className="h-9 w-36 rounded-md bg-slate-200 dark:bg-slate-800" />
        <div className="h-9 w-36 rounded-md bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Level Cards Grid Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SectionPanel key={i} className="p-4 space-y-3">
            <div className="aspect-video w-full rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-28 rounded bg-slate-200/60 dark:bg-slate-800/60" />
          </SectionPanel>
        ))}
      </div>
    </div>
  );
}
