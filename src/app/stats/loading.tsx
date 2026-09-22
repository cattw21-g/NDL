import { SectionPanel } from "@/components/ui";

export default function StatsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-300/80 bg-slate-200/60 dark:border-slate-800 dark:bg-slate-900/60 p-6 sm:p-8 h-36" />

      {/* Metric Tiles Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SectionPanel key={i} className="p-5 space-y-2">
            <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-28 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-16 rounded bg-slate-200/60 dark:bg-slate-800/60" />
          </SectionPanel>
        ))}
      </div>

      {/* Large Analytics Panels */}
      <div className="grid gap-6 md:grid-cols-2">
        <SectionPanel className="p-6 h-64 space-y-3">
          <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-44 w-full rounded bg-slate-200/60 dark:bg-slate-800/40" />
        </SectionPanel>
        <SectionPanel className="p-6 h-64 space-y-3">
          <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-44 w-full rounded bg-slate-200/60 dark:bg-slate-800/40" />
        </SectionPanel>
      </div>
    </div>
  );
}
