import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { cx, SectionPanel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export async function UserLevelSubmissionBanner({
  levelId,
}: {
  levelId: string;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const submission = await prisma.recordSubmission.findFirst({
    where: {
      playerId: currentUser.id,
      levelId,
    },
    orderBy: {
      submittedAt: "desc",
    },
    select: {
      id: true,
      status: true,
      progress: true,
      submittedAt: true,
      reviewedAt: true,
      moderatorNotes: true,
    },
  });

  if (!submission) {
    return null;
  }

  return (
    <SectionPanel
      className={cx(
        "p-4 sm:p-5 border-l-4",
        submission.status === "PENDING" &&
          "border-l-cyan-600 bg-cyan-50/70 dark:border-l-cyan-400 dark:bg-cyan-950/30",
        submission.status === "ACCEPTED" &&
          "border-l-emerald-600 bg-emerald-50/70 dark:border-l-emerald-400 dark:bg-emerald-950/30",
        submission.status === "NEEDS_CHANGES" &&
          "border-l-amber-600 bg-amber-50/70 dark:border-l-amber-400 dark:bg-amber-950/30",
        submission.status === "REJECTED" &&
          "border-l-rose-600 bg-rose-50/70 dark:border-l-rose-400 dark:bg-rose-950/30",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Your Record Submission:
            </span>
            <StatusBadge value={submission.status} />
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {submission.status === "PENDING" &&
              `You submitted a ${submission.progress}% run on ${formatDate(submission.submittedAt)}. It is currently in the moderation queue awaiting review.`}
            {submission.status === "ACCEPTED" &&
              `Your ${submission.progress}% record on this level has been accepted and verified!`}
            {submission.status === "NEEDS_CHANGES" &&
              `Your submission needs changes: ${submission.moderatorNotes || "Staff requested updated proof or information."}`}
            {submission.status === "REJECTED" &&
              `Your submission was not accepted: ${submission.moderatorNotes || "Did not meet list proof or eligibility guidelines."}`}
          </p>
        </div>
        {submission.status === "NEEDS_CHANGES" || submission.status === "REJECTED" ? (
          <Link
            href="/submit"
            className="inline-flex min-h-9 items-center justify-center rounded-md bg-cyan-700 px-3 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
          >
            Submit updated run
          </Link>
        ) : null}
      </div>
    </SectionPanel>
  );
}
