import { AlertTriangle, type LucideIcon } from "lucide-react";

import { HelpTooltip } from "@/components/help-tooltip";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 border-b border-slate-300 pb-5 dark:border-slate-700 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="min-w-0">
        {eyebrow ? <div className="mb-3">{eyebrow}</div> : null}
        <h1 className="text-balance text-3xl font-black leading-tight text-slate-950 dark:text-slate-50 sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-300 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="min-w-0">{children}</div> : null}
    </section>
  );
}

export function Eyebrow({
  icon: Icon,
  children,
  tone = "cyan",
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
  tone?: "red" | "cyan" | "amber" | "emerald" | "zinc";
}) {
  const toneClass = {
    red: "border-red-500/30 bg-red-500/10 text-red-500 dark:text-red-400",
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    zinc: "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300",
  }[tone];

  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider",
        toneClass,
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </span>
  );
}

export function SectionPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function MetricTile({
  icon: Icon,
  label,
  value,
  tone = "cyan",
}: {
  icon?: LucideIcon;
  label: string;
  value: number | string;
  tone?: "red" | "cyan" | "amber" | "emerald" | "zinc";
}) {
  const toneClass = {
    red: "text-red-600 dark:text-red-400",
    cyan: "text-cyan-600 dark:text-cyan-400",
    amber: "text-amber-600 dark:text-amber-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    zinc: "text-zinc-700 dark:text-zinc-300",
  }[tone];

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        {label}
        {Icon ? <Icon className={cx("h-4 w-4", toneClass)} /> : null}
      </div>
      <div className={cx("mt-1 text-xl font-bold leading-tight", toneClass)}>
        {value}
      </div>
    </div>
  );
}

export function RankBadge({ rank }: { rank: number | null }) {
  const topRank =
    rank === 1
      ? "border-amber-400 bg-white text-amber-900 shadow-[inset_4px_0_0_#f59e0b] dark:border-amber-400 dark:bg-amber-950/30 dark:text-amber-100"
      : rank === 2
        ? "border-cyan-400 bg-white text-cyan-900 shadow-[inset_4px_0_0_#0891b2] dark:border-cyan-400 dark:bg-cyan-950/30 dark:text-cyan-100"
        : rank === 3
          ? "border-teal-400 bg-white text-teal-900 shadow-[inset_4px_0_0_#0f766e] dark:border-teal-400 dark:bg-teal-950/30 dark:text-teal-100"
          : "border-slate-300 bg-white text-slate-800 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100";

  return (
    <span
      className={cx(
        "inline-flex min-h-9 min-w-14 items-center justify-center rounded-md border px-2.5 font-black tabular-nums",
        topRank,
      )}
    >
      {rank ? `#${rank}` : "UNR"}
    </span>
  );
}

export function PointsPill({ points }: { points: number }) {
  return (
    <span className="inline-flex min-h-8 items-center justify-center rounded-md border border-emerald-300 bg-white px-3 text-sm font-black text-emerald-800 tabular-nums dark:border-emerald-500/50 dark:bg-emerald-950/30 dark:text-emerald-100">
      {points} pts
    </span>
  );
}

export function FactPill({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <span className="inline-flex min-h-8 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
      <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-bold text-slate-900 dark:text-slate-100">{value}</span>
    </span>
  );
}

export function MetaTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-950/60">
      <div className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">{label}</div>
      <div className="mt-1 truncate font-black text-slate-950 dark:text-slate-50">{value}</div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-950/40">
      <AlertTriangle className="mx-auto h-6 w-6 text-zinc-400" />
      <h2 className="mt-3 text-lg font-bold text-zinc-900 dark:text-white">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">{description}</p>
      ) : null}
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <legend className="px-1 text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
        {title}
      </legend>
      {description ? (
        <p className="mb-4 mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      ) : null}
      <div className="grid gap-4">{children}</div>
    </fieldset>
  );
}

export const inputClass =
  "min-h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 transition placeholder:text-zinc-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/30";

export const textareaClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 transition placeholder:text-zinc-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/30";

export function FieldLabel({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
        {label}
        {help ? <HelpTooltip text={help} /> : null}
      </span>
      {children}
    </label>
  );
}
