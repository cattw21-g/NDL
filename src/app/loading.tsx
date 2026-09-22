import { SectionPanel } from "@/components/ui";

export default function HomeLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-300/80 bg-slate-200/60 dark:border-slate-800 dark:bg-slate-900/60 p-6 sm:p-10 h-44 sm:h-52" />

      {/* Main Layout: List & Sidebar */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          {/* Controls Bar */}
          <SectionPanel className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="h-9 w-64 rounded-md bg-slate-200 dark:bg-slate-800" />
            <div className="flex gap-2">
              <div className="h-9 w-24 rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="h-9 w-24 rounded-md bg-slate-200 dark:bg-slate-800" />
            </div>
          </SectionPanel>

          {/* Demon Cards List Skeletons */}
          {Array.from({ length: 6 }).map((_, i) => (
            <SectionPanel key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="h-10 w-14 shrink-0 rounded-md bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-32 rounded bg-slate-200/70 dark:bg-slate-800/70" />
                </div>
              </div>
              <div className="h-8 w-20 shrink-0 rounded-full bg-slate-200 dark:bg-slate-800" />
            </SectionPanel>
          ))}
        </div>

        {/* Sidebar Skeletons */}
        <div className="hidden lg:flex flex-col gap-4">
          <SectionPanel className="p-5 h-44 space-y-3">
            <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-16 w-full rounded bg-slate-200/60 dark:bg-slate-800/60" />
            <div className="h-8 w-full rounded bg-slate-200 dark:bg-slate-800" />
          </SectionPanel>

          <SectionPanel className="p-5 h-44 space-y-3">
            <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-16 w-full rounded bg-slate-200/60 dark:bg-slate-800/60" />
            <div className="h-8 w-full rounded bg-slate-200 dark:bg-slate-800" />
          </SectionPanel>
        </div>
      </div>
    </div>
  );
}
