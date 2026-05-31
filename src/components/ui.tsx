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
    red: "border-red-300 bg-white text-red-700 shadow-[inset_3px_0_0_#ef4444] dark:border-red-500/50 dark:bg-red-950/30 dark:text-red-200",
    cyan: "border-cyan-300 bg-white text-cyan-800 shadow-[inset_3px_0_0_#0891b2] dark:border-cyan-500/50 dark:bg-cyan-950/30 dark:text-cyan-100",
    amber: "border-amber-300 bg-white text-amber-800 shadow-[inset_3px_0_0_#f59e0b] dark:border-amber-500/50 dark:bg-amber-950/30 dark:text-amber-100",
    emerald: "border-emerald-300 bg-white text-emerald-800 shadow-[inset_3px_0_0_#059669] dark:border-emerald-500/50 dark:bg-emerald-950/30 dark:text-emerald-100",
    zinc: "border-slate-300 bg-white text-slate-700 shadow-[inset_3px_0_0_#64748b] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200",
  }[tone];

  return (
    <span
      className={cx(
        "inline-flex min-h-8 items-center gap-2 rounded-md border px-3 text-xs font-bold uppercase",
        toneClass,
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
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
        "rounded-md border border-slate-300 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_14px_30px_rgba(0,0,0,0.28)]",
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
    red: "text-red-700",
    cyan: "text-cyan-800",
    amber: "text-amber-800",
    emerald: "text-emerald-700",
    zinc: "text-slate-700",
  }[tone];

  return (
    <div className="rounded-md border border-slate-300 bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-slate-700 dark:bg-slate-950/60 dark:shadow-none">
      <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
        {label}
        {Icon ? <Icon className={cx("h-4 w-4", toneClass)} /> : null}
      </div>
      <div className={cx("mt-2 text-2xl font-black leading-none", toneClass)}>
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
    <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
      <AlertTriangle className="mx-auto h-6 w-6 text-slate-400" />
      <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-slate-50">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
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
    <fieldset className="rounded-md border border-slate-300 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-950/40">
      <legend className="px-1 text-sm font-black uppercase text-slate-950 dark:text-slate-50">
        {title}
      </legend>
      {description ? (
        <p className="mb-4 mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {description}
        </p>
      ) : null}
      <div className="grid gap-4">{children}</div>
    </fieldset>
  );
}

export const inputClass =
  "min-h-10 rounded-md border border-slate-400 bg-white px-3 text-sm text-slate-950 shadow-inner shadow-slate-100 transition placeholder:text-slate-400 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:shadow-none dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/30";

export const textareaClass =
  "rounded-md border border-slate-400 bg-white px-3 py-2 text-sm text-slate-950 shadow-inner shadow-slate-100 transition placeholder:text-slate-400 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:shadow-none dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/30";

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
