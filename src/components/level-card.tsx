"use client";

import { ArrowRight, Clock, CheckCircle2, AlertCircle, XCircle, X } from "lucide-react";
import Link from "next/link";

import { SafeThumbnail } from "@/components/safe-thumbnail";
import { resolveLevelThumbnail } from "@/lib/media";
import { StatusBadge } from "@/components/status-badge";
import { cx, PointsPill, RankBadge } from "@/components/ui";
import type { UserLevelSubmissionInfo } from "@/lib/use-user-submissions";

export type LevelCardLevel = {
  slug: string;
  rank: number | null;
  name: string;
  originalName: string;
  publisher: string;
  nerfCreator: string;
  verifier: string;
  thumbnailUrl: string;
  status: string;
  difficulty: string;
  points: number;
  gdLevelId?: string;
  _count?: { records: number };
  userSubmission?: UserLevelSubmissionInfo;
};

export function LevelCard({
  level,
  userSubmission,
  onDismiss,
  isDismissed = false,
}: {
  level: LevelCardLevel;
  userSubmission?: UserLevelSubmissionInfo;
  onDismiss?: (submissionId: string) => void;
  isDismissed?: boolean;
}) {
  const isTopThree = level.rank !== null && level.rank <= 3;
  const isDemo = level.name.includes("[DEMO]");
  const rawSubmission = userSubmission ?? level.userSubmission;
  const activeSubmission = isDismissed ? undefined : rawSubmission;

  const isPending = activeSubmission?.status === "PENDING";
  const isAccepted = activeSubmission?.status === "ACCEPTED";
  const isRejected = activeSubmission?.status === "REJECTED";
  const isNeedsChanges = activeSubmission?.status === "NEEDS_CHANGES";

  return (
    <article
      className={cx(
        "group relative overflow-hidden rounded-xl border transition-all duration-200 hover:-translate-y-0.5",
        isPending
          ? "border-amber-400 bg-[linear-gradient(135deg,rgba(254,243,199,0.25)_0%,rgba(255,255,255,1)_100%)] shadow-[0_0_18px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/50 dark:border-amber-400 dark:bg-[linear-gradient(135deg,rgba(120,53,15,0.25)_0%,rgba(15,23,42,1)_100%)] dark:shadow-[0_0_22px_rgba(245,158,11,0.32)]"
          : isAccepted
            ? "border-emerald-500 bg-[linear-gradient(135deg,rgba(209,250,229,0.25)_0%,rgba(255,255,255,1)_100%)] shadow-[0_0_18px_rgba(16,185,129,0.25)] ring-2 ring-emerald-400/50 dark:border-emerald-400 dark:bg-[linear-gradient(135deg,rgba(6,78,59,0.25)_0%,rgba(15,23,42,1)_100%)] dark:shadow-[0_0_22px_rgba(16,185,129,0.32)]"
            : isRejected
              ? "border-rose-500 bg-[linear-gradient(135deg,rgba(255,228,230,0.25)_0%,rgba(255,255,255,1)_100%)] shadow-[0_0_18px_rgba(244,63,94,0.25)] ring-2 ring-rose-400/50 dark:border-rose-400 dark:bg-[linear-gradient(135deg,rgba(136,19,55,0.25)_0%,rgba(15,23,42,1)_100%)] dark:shadow-[0_0_22px_rgba(244,63,94,0.32)]"
              : isNeedsChanges
                ? "border-amber-500 bg-amber-50/20 shadow-[0_0_18px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/50 dark:border-amber-400 dark:bg-amber-950/20"
                : isTopThree
                  ? "border-cyan-400/60 bg-white shadow-lg hover:border-cyan-500 hover:shadow-xl dark:border-cyan-500/50 dark:bg-zinc-900/80 dark:hover:border-cyan-400"
                  : "border-zinc-200 bg-white shadow-md hover:border-cyan-500/60 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700",
      )}
    >
      {/* Dynamic Left Accent Bar */}
      <div
        className={cx(
          "absolute inset-y-0 left-0 w-1.5 transition duration-300",
          isPending
            ? "bg-amber-400 shadow-[0_0_10px_#f59e0b]"
            : isAccepted
              ? "bg-emerald-500 shadow-[0_0_10px_#10b981]"
              : isRejected
                ? "bg-rose-500 shadow-[0_0_10px_#f43f5e]"
                : isNeedsChanges
                  ? "bg-amber-500 shadow-[0_0_10px_#f59e0b]"
                  : level.rank === 1
                    ? "bg-amber-500"
                    : level.rank === 2
                      ? "bg-cyan-500"
                      : level.rank === 3
                        ? "bg-amber-700"
                        : "bg-zinc-300 dark:bg-zinc-700",
        )}
      />

      <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-0 md:grid-cols-[4.75rem_15rem_minmax(0,1fr)_10rem] md:items-center">
        {/* Col 1: Rank Badge */}
        <div className="flex items-center justify-center bg-zinc-50/80 p-2 dark:bg-zinc-950/50 md:self-stretch">
          <RankBadge rank={level.rank} />
        </div>

        {/* Col 2: Thumbnail with status ribbon */}
        <div className="min-w-0 p-2 md:w-60">
          <Link
            href={`/levels/${level.slug}`}
            className="relative block aspect-video w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <SafeThumbnail
              src={resolveLevelThumbnail(level.slug, level.name, undefined, level.thumbnailUrl)}
              alt={`${level.name} thumbnail`}
              className="block h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.05),rgba(15,23,42,0.08))]" />

            {isDemo ? (
              <span className="absolute left-1.5 top-1.5 rounded border border-amber-300 bg-white/92 px-1.5 py-0.5 text-[10px] font-black text-amber-800 dark:border-amber-400/60 dark:bg-slate-950/85 dark:text-amber-200">
                DEMO
              </span>
            ) : null}
          </Link>
        </div>

        {/* Col 3: Metadata and Title */}
        <div className="col-span-2 min-w-0 border-t border-zinc-200 p-3 dark:border-zinc-800 md:col-auto md:border-t-0 md:px-3 md:py-2.5">
          <div className="min-w-0">
            {/* Status Strip above title */}
            {activeSubmission ? (
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                {isPending ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400 bg-amber-500/15 px-2.5 py-0.5 text-xs font-black text-amber-900 shadow-sm dark:border-amber-400/80 dark:bg-amber-950/80 dark:text-amber-200">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                    </span>
                    <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Your Run: {activeSubmission.progress}% Pending Review</span>
                  </span>
                ) : isAccepted ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-black text-emerald-900 shadow-sm dark:border-emerald-400/80 dark:bg-emerald-950/80 dark:text-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Your Run: {activeSubmission.progress}% Accepted</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDismiss?.(activeSubmission.id);
                      }}
                      title="Remove accepted banner from this level"
                      className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-900 transition hover:bg-emerald-600/40 dark:bg-emerald-400/20 dark:text-emerald-200 dark:hover:bg-emerald-400/40"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : isRejected ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500 bg-rose-500/15 px-2.5 py-0.5 text-xs font-black text-rose-900 shadow-sm dark:border-rose-400/80 dark:bg-rose-950/80 dark:text-rose-200">
                    <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Your Run: Rejected</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDismiss?.(activeSubmission.id);
                      }}
                      title="Remove rejected banner from this level"
                      className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600/20 text-rose-900 transition hover:bg-rose-600/40 dark:bg-rose-400/20 dark:text-rose-200 dark:hover:bg-rose-400/40"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : isNeedsChanges ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500 bg-amber-500/15 px-2.5 py-0.5 text-xs font-black text-amber-900 shadow-sm dark:border-amber-400/80 dark:bg-amber-950/80 dark:text-amber-200">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Your Run: Needs Changes</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDismiss?.(activeSubmission.id);
                      }}
                      title="Dismiss banner"
                      className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600/20 text-amber-900 transition hover:bg-amber-600/40 dark:bg-amber-400/20 dark:text-amber-200 dark:hover:bg-amber-400/40"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : null}
              </div>
            ) : level.status !== "RANKED" ? (
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={level.status} />
              </div>
            ) : null}

            <div className="flex flex-wrap items-baseline gap-2">
              <Link
                href={`/levels/${level.slug}`}
                className={cx(
                  "truncate text-lg font-black leading-tight text-zinc-950 transition hover:text-cyan-600 dark:text-white dark:hover:text-cyan-400",
                  level.status !== "RANKED" && !activeSubmission && "mt-1",
                )}
              >
                {level.name}
              </Link>
              {level.originalName && level.originalName.toLowerCase() !== level.name.toLowerCase() ? (
                <span className="truncate rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400">
                  Original: {level.originalName}
                </span>
              ) : null}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm">
              <span>
                Nerfed by <strong className="font-semibold text-zinc-900 dark:text-zinc-200">{level.nerfCreator}</strong>
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span>
                Verified by <strong className="font-semibold text-zinc-900 dark:text-zinc-200">{level.verifier || "Open"}</strong>
              </span>
              {level.publisher && level.publisher !== level.nerfCreator ? (
                <>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Host: <span className="text-zinc-700 dark:text-zinc-300">{level.publisher}</span>
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Col 4: Points, Records, Details Link */}
        <div className="col-span-2 grid grid-cols-3 items-center gap-2 border-t border-zinc-100 bg-zinc-50/50 px-3 py-2 dark:border-zinc-800/60 dark:bg-zinc-950/40 md:flex md:flex-col md:items-end md:justify-center md:border-l md:border-t-0 md:px-3 md:py-2.5 md:self-stretch">
          <div className="flex items-center justify-center md:w-full md:justify-end">
            <PointsPill points={level.points} />
          </div>
          <span className="text-center text-xs font-semibold text-zinc-500 tabular-nums dark:text-zinc-400 md:text-right">
            {level._count?.records ?? 0} {level._count?.records === 1 ? "record" : "records"}
          </span>
          <div className="flex items-center justify-center md:w-full md:justify-end">
            <Link
              href={`/levels/${level.slug}`}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold text-cyan-600 transition hover:bg-cyan-50 hover:text-cyan-700 dark:text-cyan-400 dark:hover:bg-cyan-950/50 dark:hover:text-cyan-300 md:mt-1"
            >
              <span>Details</span>
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
