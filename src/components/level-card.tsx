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

  const recordsCount = level._count?.records ?? 0;

  return (
    <article
      className={cx(
        "group relative overflow-hidden rounded-xl border transition-all duration-150 hover:shadow-md",
        isPending
          ? "border-amber-400/80 bg-amber-50/20 dark:border-amber-500/50 dark:bg-amber-950/10"
          : isAccepted
            ? "border-emerald-400/80 bg-emerald-50/20 dark:border-emerald-500/50 dark:bg-emerald-950/10"
            : isRejected
              ? "border-rose-400/80 bg-rose-50/20 dark:border-rose-500/50 dark:bg-rose-950/10"
              : isNeedsChanges
                ? "border-amber-400/80 bg-amber-50/20 dark:border-amber-500/50 dark:bg-amber-950/10"
                : isTopThree
                  ? "border-zinc-200/90 bg-white hover:border-cyan-400/80 dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:hover:border-cyan-500/60"
                  : "border-zinc-200/80 bg-white hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:hover:border-zinc-700",
      )}
    >
      {/* Active User Submission Status Ribbon (compact top bar) */}
      {activeSubmission ? (
        <div
          className={cx(
            "flex items-center justify-between border-b px-3.5 py-1.5 text-xs font-semibold",
            isPending && "border-amber-300/50 bg-amber-500/10 text-amber-900 dark:border-amber-500/30 dark:text-amber-200",
            isAccepted && "border-emerald-300/50 bg-emerald-500/10 text-emerald-900 dark:border-emerald-500/30 dark:text-emerald-200",
            isRejected && "border-rose-300/50 bg-rose-500/10 text-rose-900 dark:border-rose-500/30 dark:text-rose-200",
            isNeedsChanges && "border-amber-300/50 bg-amber-500/10 text-amber-900 dark:border-amber-500/30 dark:text-amber-200",
          )}
        >
          <div className="flex min-w-0 items-center gap-1.5 truncate">
            {isPending ? (
              <>
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                </span>
                <Clock className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="truncate">Your Run: {activeSubmission.progress}% Pending Review</span>
              </>
            ) : isAccepted ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate">Your Run: {activeSubmission.progress}% Accepted</span>
              </>
            ) : isRejected ? (
              <>
                <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                <span className="truncate">Your Run: Rejected</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="truncate">Your Run: Needs Changes</span>
              </>
            )}
          </div>
          {isAccepted || isRejected || isNeedsChanges ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDismiss?.(activeSubmission.id);
              }}
              title={
                isAccepted
                  ? "Remove accepted banner from this level"
                  : isRejected
                    ? "Remove rejected banner from this level"
                    : "Dismiss banner"
              }
              className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded opacity-70 transition hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-current"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Main Level Card Row (prominent Pointercrate-style layout) */}
      <div className="flex flex-col gap-3.5 p-3.5 lg:flex-row lg:items-center lg:gap-5 lg:p-4">
        {/* Left: Rank & Thumbnail */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          {/* 1. Rank */}
          <div className="flex shrink-0 items-center justify-center">
            <RankBadge rank={level.rank} />
          </div>

          {/* 2. Thumbnail (generous 16:9 aspect) */}
          <div className="shrink-0">
            <Link
              href={`/levels/${level.slug}`}
              className="relative block aspect-video w-36 overflow-hidden rounded-lg border border-zinc-200/90 bg-zinc-100 shadow-sm transition group-hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:group-hover:border-zinc-700 sm:w-44 md:w-52 lg:w-56"
              tabIndex={-1}
              aria-hidden="true"
            >
              <SafeThumbnail
                src={resolveLevelThumbnail(level.slug, level.name, undefined, level.thumbnailUrl)}
                alt={`${level.name} thumbnail`}
                className="block h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
              />
              {isDemo ? (
                <span className="absolute left-1.5 top-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-black text-amber-300">
                  DEMO
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        {/* Center: Title, Original, Metadata */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <Link
              href={`/levels/${level.slug}`}
              className="font-black text-lg leading-snug text-zinc-950 transition hover:text-cyan-600 dark:text-white dark:hover:text-cyan-400 sm:text-xl md:text-2xl line-clamp-2"
            >
              {level.name}
            </Link>
            {level.originalName && level.originalName.toLowerCase() !== level.name.toLowerCase() ? (
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:text-sm">
                (Original: {level.originalName})
              </span>
            ) : null}
            {level.status !== "RANKED" ? (
              <span className="shrink-0">
                <StatusBadge value={level.status} />
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm">
            <span>
              Nerfed by <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{level.nerfCreator}</strong>
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span>
              Verified by <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{level.verifier || "Open"}</strong>
            </span>
            {level.publisher && level.publisher !== level.nerfCreator ? (
              <>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  Host: <span className="font-medium text-zinc-700 dark:text-zinc-300">{level.publisher}</span>
                </span>
              </>
            ) : null}
          </div>
        </div>

        {/* Right: Points, Records, Details Button */}
        <div className="flex shrink-0 items-center justify-between border-t border-zinc-100 pt-2.5 dark:border-zinc-800/80 lg:border-t-0 lg:pt-0 lg:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <PointsPill points={level.points} />
            <span className="text-xs font-semibold tabular-nums text-zinc-500 dark:text-zinc-400 sm:text-sm whitespace-nowrap">
              {recordsCount} {recordsCount === 1 ? "record" : "records"}
            </span>
          </div>
          <Link
            href={`/levels/${level.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-cyan-600 transition hover:border-cyan-400 hover:bg-cyan-50 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-cyan-400 dark:hover:bg-cyan-950/40 sm:text-sm"
          >
            <span>Details</span>
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
