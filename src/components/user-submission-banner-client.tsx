"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import { cx, SectionPanel } from "@/components/ui";

const STORAGE_KEY = "ndl_dismissed_submission_badges";

export function UserSubmissionBannerClient({
  submission,
  submittedDateFormatted,
  submittedDateTimeFormatted,
}: {
  submission: {
    id: string;
    status: "PENDING" | "ACCEPTED" | "NEEDS_CHANGES" | "REJECTED";
    progress: number;
    videoUrl: string;
    fps?: number | null;
    cbfUsed?: boolean | null;
    moderatorNotes?: string | null;
  };
  submittedDateFormatted: string;
  submittedDateTimeFormatted: string;
}) {
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed: string[] = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.includes(submission.id);
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: string[] = raw ? JSON.parse(raw) : [];
      if (!parsed.includes(submission.id)) {
        parsed.push(submission.id);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch {
      // Ignore
    }
  };

  // PENDING submissions cannot be dismissed
  if (isDismissed && submission.status !== "PENDING") {
    return null;
  }

  return (
    <SectionPanel
      className={cx(
        "relative overflow-hidden border-2 p-5 shadow-sm transition",
        submission.status === "PENDING" &&
          "border-amber-400 bg-[linear-gradient(135deg,rgba(254,243,199,0.5)_0%,rgba(255,255,255,1)_100%)] shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/40 dark:border-amber-400 dark:bg-[linear-gradient(135deg,rgba(120,53,15,0.25)_0%,rgba(15,23,42,1)_100%)]",
        submission.status === "ACCEPTED" &&
          "border-emerald-500 bg-[linear-gradient(135deg,rgba(209,250,229,0.5)_0%,rgba(255,255,255,1)_100%)] shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-2 ring-emerald-400/40 dark:border-emerald-400 dark:bg-[linear-gradient(135deg,rgba(6,78,59,0.25)_0%,rgba(15,23,42,1)_100%)]",
        submission.status === "NEEDS_CHANGES" &&
          "border-amber-500 bg-[linear-gradient(135deg,rgba(254,243,199,0.6)_0%,rgba(255,255,255,1)_100%)] dark:border-amber-500/70 dark:bg-[linear-gradient(135deg,rgba(120,53,15,0.35)_0%,rgba(15,23,42,1)_100%)]",
        submission.status === "REJECTED" &&
          "border-rose-500 bg-[linear-gradient(135deg,rgba(255,228,230,0.5)_0%,rgba(255,255,255,1)_100%)] shadow-[0_0_20px_rgba(244,63,94,0.25)] ring-2 ring-rose-400/40 dark:border-rose-400 dark:bg-[linear-gradient(135deg,rgba(136,19,55,0.25)_0%,rgba(15,23,42,1)_100%)]",
      )}
    >
      {/* Dismiss Button for Accepted / Rejected / Needs Changes */}
      {submission.status !== "PENDING" ? (
        <button
          type="button"
          onClick={handleDismiss}
          title="Dismiss this notification"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/10 text-slate-700 transition hover:bg-slate-900/20 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pr-8 sm:pr-0">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {submission.status === "PENDING" && (
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              )}
              {submission.status === "ACCEPTED" && (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              )}
              {submission.status === "NEEDS_CHANGES" && (
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              )}
              {submission.status === "REJECTED" && (
                <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              )}
              Your Submission Status:
            </span>
            <StatusBadge value={submission.status} />
            <span className="rounded bg-slate-900/10 px-2 py-0.5 font-mono text-xs font-black text-slate-900 dark:bg-white/10 dark:text-white">
              {submission.progress}% RUN
            </span>
          </div>

          <p className="text-sm font-semibold leading-relaxed text-slate-900 dark:text-slate-100">
            {submission.status === "PENDING" && (
              <>
                You submitted a <strong>{submission.progress}% run</strong> on{" "}
                {submittedDateFormatted}. It is currently in the moderation review queue. Once approved by staff, it will appear on the leaderboard!
              </>
            )}
            {submission.status === "ACCEPTED" && (
              <>
                🎉 Your <strong>{submission.progress}% run</strong> has been accepted and verified! Points have been credited.
              </>
            )}
            {submission.status === "NEEDS_CHANGES" && (
              <>
                ⚠️ Staff requested changes:{" "}
                <span className="font-bold">
                  {submission.moderatorNotes || "Please update your proof or raw footage."}
                </span>
              </>
            )}
            {submission.status === "REJECTED" && (
              <>
                ❌ Your submission was not accepted:{" "}
                <span className="font-bold">
                  {submission.moderatorNotes || "Did not meet list proof or guidelines."}
                </span>
              </>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600 dark:text-slate-400">
            <span>Submitted: {submittedDateTimeFormatted}</span>
            {submission.fps ? <span>• {submission.fps} FPS</span> : null}
            {submission.cbfUsed !== undefined ? (
              <span>• CBF: {submission.cbfUsed ? "Yes" : "No"}</span>
            ) : null}
            {submission.videoUrl ? (
              <a
                href={submission.videoUrl}
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
          {submission.status === "NEEDS_CHANGES" ||
          submission.status === "REJECTED" ? (
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
