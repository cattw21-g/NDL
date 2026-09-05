"use client";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { cx } from "@/components/ui";

export type ArchivePreset = {
  key: string;
  label: string;
  dateIso: string;
  badge?: string;
};

export function ArchiveDatePicker({
  currentDateIso,
  todayIso,
  formattedDate,
  activePreset,
  presets,
  steppers,
}: {
  currentDateIso: string;
  todayIso: string;
  formattedDate: string;
  activePreset: string;
  presets: ArchivePreset[];
  steppers: {
    prevDayIso: string;
    nextDayIso: string;
    canGoNextDay: boolean;
    prevWeekIso: string;
    nextWeekIso: string;
    canGoNextWeek: boolean;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isToday = currentDateIso === todayIso;

  function handleDateChange(newDate: string) {
    if (!newDate) return;
    startTransition(() => {
      router.push(`/archive?date=${newDate}`);
    });
  }

  return (
    <div className="space-y-4">
      {/* Quick Presets Bar */}
      <div>
        <div className="flex items-center justify-between gap-2 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400/90">
            Archive Milestones & Presets
          </span>
          {!isToday && (
            <Link
              href="/archive"
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
            >
              <RotateCcw className="h-3 w-3" />
              Reset to Current List
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const isActive = activePreset === preset.key;
            return (
              <Link
                key={preset.key}
                href={preset.key === "today" ? "/archive" : `/archive?date=${preset.dateIso}`}
                className={cx(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all shadow-sm",
                  isActive
                    ? "border-amber-500 bg-amber-500 text-zinc-950 shadow-amber-500/20 ring-2 ring-amber-500/40"
                    : "border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:border-amber-500/40 hover:bg-zinc-800 hover:text-white"
                )}
              >
                {preset.label}
                {preset.badge && (
                  <span
                    className={cx(
                      "rounded-full px-1.5 py-0.2 text-[10px] uppercase tracking-wide",
                      isActive
                        ? "bg-zinc-950/20 text-zinc-950 font-black"
                        : "bg-amber-500/20 text-amber-400 font-semibold"
                    )}
                  >
                    {preset.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {activePreset === "custom" && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500 bg-amber-500 px-3 py-1.5 text-xs font-bold text-zinc-950 shadow-sm shadow-amber-500/20 ring-2 ring-amber-500/40">
              <Calendar className="h-3.5 w-3.5" />
              Custom: {formattedDate}
            </span>
          )}
        </div>
      </div>

      {/* Date Navigation & Stepper Controls */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Stepper Navigation: -1 Week, -1 Day, Calendar Input, +1 Day, +1 Week */}
          <div className="flex items-center flex-wrap gap-1.5">
            <Link
              href={`/archive?date=${steppers.prevWeekIso}`}
              title="Step back 1 week"
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs font-bold text-zinc-300 transition hover:border-amber-500/40 hover:text-white"
            >
              <ChevronsLeft className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">-1 Wk</span>
            </Link>

            <Link
              href={`/archive?date=${steppers.prevDayIso}`}
              title="Step back 1 day"
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs font-bold text-zinc-300 transition hover:border-amber-500/40 hover:text-white"
            >
              <ChevronLeft className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">-1 Day</span>
            </Link>

            {/* Direct Date Input (auto-submits on change) */}
            <div className="relative flex-1 sm:flex-none">
              <input
                type="date"
                id="archive-date-input"
                value={currentDateIso}
                max={todayIso}
                disabled={isPending}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm font-semibold text-white transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {steppers.canGoNextDay ? (
              <Link
                href={`/archive?date=${steppers.nextDayIso}`}
                title="Step forward 1 day"
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs font-bold text-zinc-300 transition hover:border-amber-500/40 hover:text-white"
              >
                <span className="hidden sm:inline">+1 Day</span>
                <ChevronRight className="h-3.5 w-3.5 text-amber-400" />
              </Link>
            ) : (
              <span
                title="Cannot step into the future"
                className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-zinc-900 bg-zinc-950/50 px-2.5 py-1.5 text-xs font-bold text-zinc-600"
              >
                <span className="hidden sm:inline">+1 Day</span>
                <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
              </span>
            )}

            {steppers.canGoNextWeek ? (
              <Link
                href={`/archive?date=${steppers.nextWeekIso}`}
                title="Step forward 1 week"
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs font-bold text-zinc-300 transition hover:border-amber-500/40 hover:text-white"
              >
                <span className="hidden sm:inline">+1 Wk</span>
                <ChevronsRight className="h-3.5 w-3.5 text-amber-400" />
              </Link>
            ) : (
              <span
                title="Cannot step into the future"
                className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-zinc-900 bg-zinc-950/50 px-2.5 py-1.5 text-xs font-bold text-zinc-600"
              >
                <span className="hidden sm:inline">+1 Wk</span>
                <ChevronsRight className="h-3.5 w-3.5 text-zinc-600" />
              </span>
            )}
          </div>

          {/* Current Viewing Status */}
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              Viewing list on: <strong className="text-white">{formattedDate}</strong>
            </span>
          </div>
        </div>

        {/* Quick Month Jump Chips */}
        <div className="flex items-center flex-wrap gap-1.5 pt-2 border-t border-zinc-800/60 text-xs">
          <span className="text-zinc-500 font-medium mr-1">Fast Month Jump:</span>
          {[
            { label: "Jun 2026 (Launch)", dateIso: "2026-06-01" },
            { label: "Jul 2026", dateIso: "2026-07-01" },
            { label: "Aug 2026", dateIso: "2026-08-01" },
            { label: "Sep 2026 (Current)", dateIso: todayIso },
          ].map((m) => (
            <Link
              key={m.dateIso}
              href={`/archive?date=${m.dateIso}`}
              className={cx(
                "rounded px-2 py-0.5 font-medium transition",
                currentDateIso.startsWith(m.dateIso.slice(0, 7))
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              )}
            >
              {m.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
