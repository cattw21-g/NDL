"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateBetaFeedbackStatusAction } from "@/actions/applications";
import type { BetaFeedbackStatus } from "@/generated/prisma/enums";
import {
  Bug,
  Filter,
  Loader2,
  Send,
} from "lucide-react";

export type AdminFeedbackItem = {
  id: string;
  type: string;
  status: string;
  title: string;
  description: string;
  pageUrl: string | null;
  browserInfo: string | null;
  adminNotes: string | null;
  createdAt: string;
  user: {
    displayName: string;
    playerName: string;
    role: string;
  };
};

export function AdminBetaFeedbackList({ feedbacks }: { feedbacks: AdminFeedbackItem[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});

  const handleUpdateStatus = async (
    feedbackId: string,
    status: BetaFeedbackStatus,
    adminNotes?: string,
  ) => {
    setUpdatingId(feedbackId);
    try {
      await updateBetaFeedbackStatusAction({
        feedbackId,
        status,
        adminNotes,
      });
      router.refresh();
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = feedbacks.filter((fb) => {
    if (statusFilter !== "ALL" && fb.status !== statusFilter) return false;
    if (typeFilter !== "ALL" && fb.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-xs focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="ALL">All Statuses ({feedbacks.length})</option>
            <option value="NEW">New</option>
            <option value="REVIEWING">Reviewing</option>
            <option value="FIXED">Fixed</option>
            <option value="WONT_FIX">Won&apos;t Fix</option>
          </select>
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-xs focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="ALL">All Types</option>
            <option value="BUG">Bugs</option>
            <option value="UI_UX">UI / UX</option>
            <option value="PERFORMANCE">Performance</option>
            <option value="SUGGESTION">Suggestions</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
          <Bug className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
          <p className="mt-2 font-bold">No feedback entries found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((fb) => {
            const isUpdating = updatingId === fb.id;
            const currentDraft = notesDrafts[fb.id] ?? (fb.adminNotes || "");

            const statusClass = {
              NEW: "border-cyan-500/30 bg-cyan-500/10 text-cyan-600",
              REVIEWING: "border-amber-500/30 bg-amber-500/10 text-amber-600",
              FIXED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
              WONT_FIX: "border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-800",
            }[fb.status] || "border-slate-200 text-slate-600";

            return (
              <div
                key={fb.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        {fb.type}
                      </span>
                      <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${statusClass}`}>
                        {fb.status}
                      </span>
                      <span className="text-xs text-slate-400">
                        Submitted by{" "}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {fb.user.displayName}
                        </strong>{" "}
                        (@{fb.user.playerName}) on {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="mt-2 text-base font-black text-slate-900 dark:text-slate-100">
                      {fb.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={fb.status}
                      disabled={isUpdating}
                      onChange={(e) =>
                        handleUpdateStatus(
                          fb.id,
                          e.target.value as BetaFeedbackStatus,
                          currentDraft,
                        )
                      }
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-800 shadow-xs focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <option value="NEW">NEW</option>
                      <option value="REVIEWING">REVIEWING</option>
                      <option value="FIXED">FIXED</option>
                      <option value="WONT_FIX">WONT FIX</option>
                    </select>

                    {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-500" />}
                  </div>
                </div>

                <div className="mt-3 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs leading-relaxed text-slate-800 dark:bg-slate-950 dark:text-slate-200">
                  {fb.description}
                </div>

                {(fb.pageUrl || fb.browserInfo) && (
                  <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-slate-400">
                    {fb.pageUrl && <span>URL: {fb.pageUrl}</span>}
                    {fb.browserInfo && <span>Device: {fb.browserInfo}</span>}
                  </div>
                )}

                {/* Admin Note Input */}
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="text"
                    value={currentDraft}
                    placeholder="Add feedback response note (visible to tester)..."
                    onChange={(e) =>
                      setNotesDrafts((prev) => ({ ...prev, [fb.id]: e.target.value }))
                    }
                    className="flex-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateStatus(
                        fb.id,
                        fb.status as BetaFeedbackStatus,
                        currentDraft,
                      )
                    }
                    disabled={isUpdating}
                    className="inline-flex items-center gap-1 rounded bg-slate-800 px-3 py-1 text-xs font-bold text-white transition hover:bg-slate-900 dark:bg-slate-700 disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" />
                    <span>Save Note</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
