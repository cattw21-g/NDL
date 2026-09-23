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
            "flex items-center justify-between border-b px-3 py-1 text-xs font-semibold",
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

      {/* Main Level Card Row (compact, scannable layout) */}
      <div className="flex flex-col sm:flex-row sm:items-center">
        {/* Mobile Top Row / Desktop Left & Center Cluster */}
        <div className="flex min-w-0 flex-1 items-center gap-2 p-2 sm:gap-3 sm:px-3 sm:py-2">
          {/* 1. Rank */}
          <div className="flex shrink-0 items-center justify-center">
            <RankBadge rank={level.rank} />
          </div>

          {/* 2. Thumbnail (compact 16:9 aspect) */}
          <div className="shrink-0">
            <Link
              href={`/levels/${level.slug}`}
              className="relative block aspect-video w-20 sm:w-28 overflow-hidden rounded-md border border-zinc-200/90 bg-zinc-100 transition group-hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:group-hover:border-zinc-700"
              tabIndex={-1}
              aria-hidden="true"
            >
              <SafeThumbnail
                src={resolveLevelThumbnail(level.slug, level.name, undefined, level.thumbnailUrl)}
                alt={`${level.name} thumbnail`}
                className="block h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
              />
              {isDemo ? (
                <span className="absolute left-1 top-1 rounded bg-black/75 px-1 py-0.2 text-[9px] font-black text-amber-300">
                  DEMO
                </span>
              ) : null}
            </Link>
          </div>

          {/* 3. Name, Original & Desktop Metadata */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
              <Link
                href={`/levels/${level.slug}`}
                className="truncate font-extrabold text-sm sm:text-base leading-snug text-zinc-950 transition hover:text-cyan-600 dark:text-white dark:hover:text-cyan-400"
              >
                {level.name}
              </Link>
              {level.originalName && level.originalName.toLowerCase() !== level.name.toLowerCase() ? (
                <span className="shrink min-w-0 truncate text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  (Original: {level.originalName})
                </span>
              ) : null}
              {level.status !== "RANKED" ? (
                <span className="shrink-0">
                  <StatusBadge value={level.status} />
                </span>
              ) : null}
            </div>

            {/* Desktop-only secondary metadata line */}
            <div className="mt-0.5 hidden items-center gap-x-2 text-xs text-zinc-500 dark:text-zinc-400 sm:flex">
              <span className="truncate">
                Nerfed by <strong className="font-semibold text-zinc-800 dark:text-zinc-200">{level.nerfCreator}</strong>
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="truncate">
                Verified by <strong className="font-semibold text-zinc-800 dark:text-zinc-200">{level.verifier || "Open"}</strong>
              </span>
              {level.publisher && level.publisher !== level.nerfCreator ? (
                <>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <span className="truncate text-zinc-500 dark:text-zinc-400">
                    Host: <span className="text-zinc-700 dark:text-zinc-300">{level.publisher}</span>
                  </span>
                </>
              ) : null}
            </div>
          </div>

          {/* Mobile-only Points Pill in top row */}
          <div className="shrink-0 sm:hidden">
            <PointsPill points={level.points} />
          </div>
        </div>

        {/* Desktop Right Cluster: Points, Records, Details Button */}
        <div className="hidden shrink-0 items-center gap-3 px-3 py-2 sm:flex sm:gap-4 sm:pr-4">
          <PointsPill points={level.points} />
          <span className="text-xs font-semibold text-zinc-500 tabular-nums dark:text-zinc-400 whitespace-nowrap">
            {recordsCount} {recordsCount === 1 ? "record" : "records"}
          </span>
          <Link
            href={`/levels/${level.slug}`}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold text-cyan-600 transition hover:bg-cyan-50 hover:text-cyan-700 dark:text-cyan-400 dark:hover:bg-cyan-950/50 dark:hover:text-cyan-300"
          >
            <span>Details</span>
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Mobile-only Bottom Bar: Nerfer, Verifier, Records & Details */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-2.5 py-1.5 text-[11px] text-zinc-500 dark:border-zinc-800/60 dark:bg-zinc-950/30 dark:text-zinc-400 sm:hidden">
          <div className="min-w-0 truncate pr-2">
            <span>By {level.nerfCreator}</span>
            <span className="mx-1 text-zinc-300 dark:text-zinc-700">•</span>
            <span>{level.verifier || "Open"}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-medium tabular-nums">
              {recordsCount} {recordsCount === 1 ? "rec" : "recs"}
            </span>
            <Link
              href={`/levels/${level.slug}`}
              className="inline-flex items-center gap-0.5 font-bold text-cyan-600 dark:text-cyan-400"
            >
              <span>Details</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
