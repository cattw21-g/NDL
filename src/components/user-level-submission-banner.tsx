import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { cx, SectionPanel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";

export async function UserLevelSubmissionBanner({
  levelId,
}: {
  levelId: string;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const submissions = await prisma.recordSubmission.findMany({
    where: {
      playerId: currentUser.id,
      levelId,
    },
    orderBy: {
      submittedAt: "desc",
    },
    take: 3,
    select: {
      id: true,
      status: true,
      progress: true,
      videoUrl: true,
      rawFootageUrl: true,
      fps: true,
      cbfUsed: true,
      submittedAt: true,
      reviewedAt: true,
      moderatorNotes: true,
      reviewer: {
        select: {
          displayName: true,
          playerName: true,
        },
      },
    },
  });

  if (!submissions || submissions.length === 0) {
    return null;
  }

  const latestSubmission = submissions[0];

  return (
    <SectionPanel
      className={cx(
        "overflow-hidden border-2 p-5 shadow-sm transition",
        latestSubmission.status === "PENDING" &&
          "border-amber-400 bg-[linear-gradient(135deg,rgba(254,243,199,0.5)_0%,rgba(255,255,255,1)_100%)] dark:border-amber-500/60 dark:bg-[linear-gradient(135deg,rgba(120,53,15,0.25)_0%,rgba(15,23,42,1)_100%)]",
        latestSubmission.status === "ACCEPTED" &&
          "border-emerald-500 bg-[linear-gradient(135deg,rgba(209,250,229,0.5)_0%,rgba(255,255,255,1)_100%)] dark:border-emerald-500/60 dark:bg-[linear-gradient(135deg,rgba(6,78,59,0.25)_0%,rgba(15,23,42,1)_100%)]",
        latestSubmission.status === "NEEDS_CHANGES" &&
          "border-amber-500 bg-[linear-gradient(135deg,rgba(254,243,199,0.6)_0%,rgba(255,255,255,1)_100%)] dark:border-amber-500/70 dark:bg-[linear-gradient(135deg,rgba(120,53,15,0.35)_0%,rgba(15,23,42,1)_100%)]",
        latestSubmission.status === "REJECTED" &&
          "border-rose-500 bg-[linear-gradient(135deg,rgba(255,228,230,0.5)_0%,rgba(255,255,255,1)_100%)] dark:border-rose-500/60 dark:bg-[linear-gradient(135deg,rgba(136,19,55,0.25)_0%,rgba(15,23,42,1)_100%)]",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {latestSubmission.status === "PENDING" && (
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              )}
              {latestSubmission.status === "ACCEPTED" && (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              )}
              {latestSubmission.status === "NEEDS_CHANGES" && (
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              )}
              {latestSubmission.status === "REJECTED" && (
                <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              )}
              Your Submission Status:
            </span>
            <StatusBadge value={latestSubmission.status} />
            <span className="rounded bg-slate-900/10 px-2 py-0.5 font-mono text-xs font-black text-slate-900 dark:bg-white/10 dark:text-white">
              {latestSubmission.progress}% RUN
            </span>
          </div>

          <p className="text-sm font-semibold leading-relaxed text-slate-900 dark:text-slate-100">
            {latestSubmission.status === "PENDING" && (
              <>
                You submitted a <strong>{latestSubmission.progress}% run</strong> on{" "}
                {formatDate(latestSubmission.submittedAt)}. It is currently in the staff review queue. Once reviewed by a moderator, it will be added to the leaderboard.
              </>
            )}
            {latestSubmission.status === "ACCEPTED" && (
              <>
                🎉 Your <strong>{latestSubmission.progress}% run</strong> has been accepted and verified! Points have been credited to your profile.
              </>
            )}
            {latestSubmission.status === "NEEDS_CHANGES" && (
              <>
                ⚠️ Staff requested changes:{" "}
                <span className="font-bold">
                  {latestSubmission.moderatorNotes || "Please update your proof or raw footage."}
                </span>
              </>
            )}
            {latestSubmission.status === "REJECTED" && (
              <>
                ❌ Your submission was not accepted:{" "}
                <span className="font-bold">
                  {latestSubmission.moderatorNotes || "Did not meet list proof or guidelines."}
                </span>
              </>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600 dark:text-slate-400">
            <span>Submitted: {formatDateTime(latestSubmission.submittedAt)}</span>
            {latestSubmission.fps ? <span>• {latestSubmission.fps} FPS</span> : null}
            {latestSubmission.cbfUsed !== undefined ? (
              <span>• CBF: {latestSubmission.cbfUsed ? "Yes" : "No"}</span>
            ) : null}
            {latestSubmission.videoUrl ? (
              <a
                href={latestSubmission.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-cyan-700 underline hover:text-cyan-900 dark:text-cyan-400"
              >
                View submitted video <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
          <Link
            href="/submissions"
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-black text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            My Submissions Hub &rarr;
          </Link>
          {latestSubmission.status === "NEEDS_CHANGES" ||
          latestSubmission.status === "REJECTED" ? (
            <Link
              href="/submit"
              className="inline-flex min-h-9 items-center justify-center rounded-md bg-cyan-700 px-3.5 text-xs font-black text-white shadow transition hover:bg-cyan-800 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
            >
              Submit Updated Proof
            </Link>
          ) : null}
        </div>
      </div>
    </SectionPanel>
  );
}
