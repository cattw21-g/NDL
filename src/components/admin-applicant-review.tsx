"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  shortlistApplicationAction,
  decideApplicationAction,
  addApplicationNoteAction,
} from "@/actions/applications";
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
  Loader2,
  AlertTriangle,
  FileCheck,
} from "lucide-react";

export type QuestionDisplay = {
  id: string;
  order: number;
  prompt: string;
  description: string | null;
  type: string;
};

export type NoteDisplay = {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
};

export function AdminApplicantReview({
  submissionId,
  targetRole,
  maxPositions,
  currentlyAcceptedCount,
  currentStatus,
  applicant,
  questions,
  answers,
  notes,
}: {
  submissionId: string;
  openingId?: string;
  targetRole: string;
  maxPositions: number | null;
  currentlyAcceptedCount: number;
  currentStatus: string;
  applicant: {
    id: string;
    playerName: string;
    displayName: string;
    role: string;
    discordUsername: string | null;
    createdAt: string;
    rank: number | null;
    points: number;
    completionsCount: number;
  };
  questions: QuestionDisplay[];
  answers: Record<string, unknown>;
  notes: NoteDisplay[];
}) {
  const router = useRouter();

  const [noteContent, setNoteContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isDeciding, setIsDeciding] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [ignorePositionLimit, setIgnorePositionLimit] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isPositionLimitReached =
    typeof maxPositions === "number" && currentlyAcceptedCount >= maxPositions;

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setIsAddingNote(true);
    try {
      const res = await addApplicationNoteAction({
        submissionId,
        content: noteContent,
      });
      if (res.success) {
        setNoteContent("");
        router.refresh();
      }
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleShortlist = async () => {
    setIsDeciding(true);
    try {
      const res = await shortlistApplicationAction({ submissionId });
      if (res.success) {
        router.refresh();
      }
    } finally {
      setIsDeciding(false);
    }
  };

  const handleDecision = async (decision: "ACCEPTED" | "REJECTED") => {
    setIsDeciding(true);
    setErrorMsg(null);
    try {
      const res = await decideApplicationAction({
        submissionId,
        decision,
        decisionNotes,
        ignorePositionLimit,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Decision action failed.");
        setIsDeciding(false);
        return;
      }

      setShowAcceptModal(false);
      setShowRejectModal(false);
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error executing decision.");
      setIsDeciding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Applicant:</span>
            <span className="text-sm font-black text-slate-900 dark:text-slate-100">
              {applicant.displayName}
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              @{applicant.playerName}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <span>Status:</span>
            <span
              className={`rounded px-2 py-0.5 font-bold ${
                currentStatus === "ACCEPTED"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : currentStatus === "SHORTLISTED"
                    ? "bg-blue-500/10 text-blue-600"
                    : currentStatus === "REJECTED"
                      ? "bg-rose-500/10 text-rose-600"
                      : "bg-cyan-500/10 text-cyan-600"
              }`}
            >
              {currentStatus}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentStatus !== "SHORTLISTED" && currentStatus !== "ACCEPTED" && (
            <button
              type="button"
              onClick={handleShortlist}
              disabled={isDeciding}
              className="inline-flex items-center gap-1.5 rounded-md border border-blue-400 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-xs transition hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300"
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>Shortlist</span>
            </button>
          )}

          {currentStatus !== "ACCEPTED" && (
            <button
              type="button"
              onClick={() => setShowAcceptModal(true)}
              disabled={isDeciding}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Accept & Grant Role</span>
            </button>
          )}

          {currentStatus !== "REJECTED" && (
            <button
              type="button"
              onClick={() => setShowRejectModal(true)}
              disabled={isDeciding}
              className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 shadow-xs transition hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-400"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Reject</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main Column: Answers */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
              Candidate Responses ({questions.length})
            </h3>

            <div className="mt-5 space-y-6">
              {questions.map((q, idx) => {
                const rawVal = answers[q.id];
                const displayVal =
                  rawVal === undefined || rawVal === null
                    ? "(No answer provided)"
                    : typeof rawVal === "object"
                      ? JSON.stringify(rawVal)
                      : String(rawVal);

                return (
                  <div
                    key={q.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-black text-cyan-600">Q{idx + 1}.</span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {q.prompt}
                      </h4>
                    </div>
                    {q.description && (
                      <p className="mt-1 text-[11px] text-slate-500">{q.description}</p>
                    )}
                    <div className="mt-3 whitespace-pre-wrap rounded border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                      {displayVal}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar: Candidate Stats & Private Staff Notes */}
        <div className="space-y-6">
          {/* Candidate Profile Stats */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Applicant Stats
            </h4>

            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Role</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {applicant.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Discord</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {applicant.discordUsername || "Unlinked"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Leaderboard Rank</span>
                <span className="font-bold text-cyan-600">
                  {applicant.rank ? `#${applicant.rank}` : "Unranked"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Points</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {applicant.points.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">100% Completions</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {applicant.completionsCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Member Since</span>
                <span className="text-slate-600 dark:text-slate-400">
                  {new Date(applicant.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Private Notes Thread */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Private Staff Notes ({notes.length})</span>
            </h4>

            <div className="mt-3 space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {notes.length === 0 ? (
                <p className="text-[11px] text-slate-400">No staff notes yet.</p>
              ) : (
                notes.map((n) => (
                  <div
                    key={n.id}
                    className="rounded border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-cyan-600">{n.authorName}</span>
                      <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-1 text-slate-800 dark:text-slate-200">{n.content}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddNote} className="mt-4">
              <textarea
                rows={2}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add a private staff evaluation note..."
                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isAddingNote || !noteContent.trim()}
                  className="inline-flex items-center gap-1 rounded bg-slate-800 px-3 py-1 text-xs font-bold text-white transition hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50"
                >
                  <Send className="h-3 w-3" />
                  <span>Add Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Accept Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              Accept Candidate & Grant Role
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              This will mark the application as <strong>ACCEPTED</strong>, update{" "}
              <strong>{applicant.displayName}&apos;s</strong> role to <strong>{targetRole}</strong>,
              enqueue Discord role sync, and send an on-site notification.
            </p>

            {isPositionLimitReached && (
              <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Position Limit Reached</span>
                </div>
                <p className="mt-1">
                  Currently {currentlyAcceptedCount} / {maxPositions} positions have been filled.
                </p>
                <label className="mt-2 flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ignorePositionLimit}
                    onChange={(e) => setIgnorePositionLimit(e.target.checked)}
                    className="h-4 w-4 rounded text-amber-600"
                  />
                  <span>Override position limit</span>
                </label>
              </div>
            )}

            {errorMsg && (
              <div className="mt-3 rounded border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                {errorMsg}
              </div>
            )}

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Decision Notes / Welcome Message (Optional)
              </label>
              <textarea
                rows={2}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Congratulations on joining the team..."
                className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAcceptModal(false)}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDecision("ACCEPTED")}
                disabled={isDeciding || (isPositionLimitReached && !ignorePositionLimit)}
                className="inline-flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {isDeciding ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Confirm Accept</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              Reject Application
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              This will mark the application as <strong>REJECTED</strong> and notify the applicant.
            </p>

            {errorMsg && (
              <div className="mt-3 rounded border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                {errorMsg}
              </div>
            )}

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Feedback / Reason (Optional)
              </label>
              <textarea
                rows={2}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Thank you for applying..."
                className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDecision("REJECTED")}
                disabled={isDeciding}
                className="inline-flex items-center gap-1.5 rounded bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeciding ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Confirm Rejection</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
