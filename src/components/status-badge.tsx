import { statusLabel } from "@/lib/format";

const toneByStatus: Record<string, string> = {
  RANKED: "border-emerald-300 bg-white text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-200",
  LEGACY: "border-cyan-300 bg-white text-cyan-800 dark:border-cyan-500/50 dark:bg-cyan-950/40 dark:text-cyan-200",
  PENDING: "border-amber-300 bg-white text-amber-800 dark:border-amber-500/50 dark:bg-amber-950/40 dark:text-amber-200",
  NEEDS_CHANGES: "border-orange-300 bg-white text-orange-800 dark:border-orange-500/50 dark:bg-orange-950/40 dark:text-orange-200",
  ACCEPTED: "border-emerald-300 bg-white text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-200",
  APPROVED: "border-emerald-300 bg-white text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-200",
  REJECTED: "border-red-300 bg-white text-red-700 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-200",
  REMOVED: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200",
  ADMIN: "border-blue-300 bg-white text-blue-800 dark:border-blue-500/50 dark:bg-blue-950/40 dark:text-blue-200",
  MODERATOR: "border-cyan-300 bg-white text-cyan-800 dark:border-cyan-500/50 dark:bg-cyan-950/40 dark:text-cyan-200",
  PLAYER: "border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-md border px-2 py-1 text-xs font-black uppercase shadow-[inset_0_-1px_0_rgba(15,23,42,0.06)] ${
        toneByStatus[value] ?? "border-slate-300 bg-white text-slate-700"
      }`}
    >
      {statusLabel(value)}
    </span>
  );
}
