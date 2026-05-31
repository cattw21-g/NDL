import { Info } from "lucide-react";

export function HelpTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex items-center">
      <span
        tabIndex={0}
        aria-label={`Help: ${text}`}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 transition hover:border-cyan-400 hover:text-cyan-700 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-200 dark:focus:ring-cyan-500/30"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-6 z-30 w-72 -translate-x-1/2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-700 opacity-0 shadow-lg transition group-focus-within:opacity-100 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
      >
        {text}
      </span>
    </span>
  );
}
