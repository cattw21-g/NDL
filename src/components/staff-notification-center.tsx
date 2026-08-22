"use client";

import {
  Bell,
  BellRing,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Lightbulb,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { cx } from "@/components/ui";

export type StaffNotificationData = {
  pendingRecordsCount: number;
  pendingSuggestionsCount: number;
  totalPendingCount: number;
  recentPendingRecords: Array<{
    id: string;
    playerName: string;
    levelName: string;
    levelSlug: string;
    progress: number;
    submittedAt: string;
  }>;
  recentPendingSuggestions: Array<{
    id: string;
    name: string;
    originalName: string;
    submitterName: string;
    submittedAt: string;
  }>;
  timestamp: string;
};

export function StaffNotificationCenter({
  initialData,
}: {
  initialData?: StaffNotificationData;
}) {
  const [data, setData] = useState<StaffNotificationData>(
    initialData ?? {
      pendingRecordsCount: 0,
      pendingSuggestionsCount: 0,
      totalPendingCount: 0,
      recentPendingRecords: [],
      recentPendingSuggestions: [],
      timestamp: new Date().toISOString(),
    },
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasNewItemPulse, setHasNewItemPulse] = useState(false);
  const prevTotalRef = useRef(initialData?.totalPendingCount ?? 0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.ok && json.data) {
        const newData = json.data as StaffNotificationData;
        if (newData.totalPendingCount > prevTotalRef.current) {
          setHasNewItemPulse(true);
          setTimeout(() => setHasNewItemPulse(false), 5000);
        }
        prevTotalRef.current = newData.totalPendingCount;
        setData(newData);
      }
    } catch {
      // Background poll failure handled gracefully
    } finally {
      if (manual) setIsRefreshing(false);
    }
  }, []);

  // Background polling every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 20000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  const hasPending = data.totalPendingCount > 0;

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications(true);
          }
        }}
        aria-label={`Staff review notifications: ${data.totalPendingCount} pending items`}
        aria-expanded={isOpen}
        className={cx(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-cyan-300",
          hasPending
            ? "border-amber-400 bg-amber-50 text-amber-900 shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:bg-amber-100 dark:border-amber-500/50 dark:bg-amber-950/60 dark:text-amber-200 dark:hover:bg-amber-900/60"
            : "border-slate-300 bg-white text-slate-700 hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950",
          hasNewItemPulse && "animate-bounce ring-2 ring-amber-400",
        )}
      >
        {hasPending ? (
          <BellRing className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        ) : (
          <Bell className="h-4 w-4" />
        )}

        {/* Counter Badge Pill */}
        {hasPending ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-white bg-red-600 px-1 text-[10px] font-black text-white shadow-md dark:border-slate-950 dark:bg-red-500">
            {data.totalPendingCount > 99 ? "99+" : data.totalPendingCount}
          </span>
        ) : null}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[22rem] sm:w-[26rem] origin-top-right rounded-lg border border-slate-300 bg-white p-0 shadow-[0_14px_38px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_18px_42px_rgba(0,0,0,0.55)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/70">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                Staff Review Queue
              </span>
              {hasPending ? (
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-800 dark:text-amber-300">
                  {data.totalPendingCount} Pending
                </span>
              ) : (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-800 dark:text-emerald-300">
                  All Clear
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fetchNotifications(true)}
              disabled={isRefreshing}
              title="Refresh notification status"
              className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <RefreshCw
                className={cx("h-3.5 w-3.5", isRefreshing && "animate-spin text-cyan-600")}
              />
            </button>
          </div>

          <div className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto p-2 dark:divide-slate-800/60">
            {/* Section 1: Record Submissions */}
            <div className="p-2">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200">
                  <ClipboardCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Record Submissions</span>
                </div>
                <span
                  className={cx(
                    "rounded px-1.5 py-0.2 text-[10px] font-black",
                    data.pendingRecordsCount > 0
                      ? "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                  )}
                >
                  {data.pendingRecordsCount} Pending
                </span>
              </div>

              {data.recentPendingRecords.length > 0 ? (
                <div className="space-y-1.5">
                  {data.recentPendingRecords.map((rec) => (
                    <Link
                      key={rec.id}
                      href="/moderation"
                      onClick={() => setIsOpen(false)}
                      className="group block rounded-md border border-slate-200 bg-slate-50 p-2.5 transition hover:border-cyan-400 hover:bg-cyan-50/50 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-cyan-500/50 dark:hover:bg-cyan-950/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="truncate text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-cyan-700 dark:group-hover:text-cyan-300">
                          {rec.playerName}
                        </span>
                        <span className="rounded bg-cyan-100 px-1.5 py-0.2 font-mono text-[10px] font-black text-cyan-950 dark:bg-cyan-950 dark:text-cyan-300">
                          {rec.progress}%
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        {rec.levelName}
                      </p>
                      <span className="mt-1 block text-[10px] text-slate-600 dark:text-slate-400">
                        {formatRelativeTime(rec.submittedAt)}
                      </span>
                    </Link>
                  ))}

                  <Link
                    href="/moderation"
                    onClick={() => setIsOpen(false)}
                    className="mt-1 flex items-center justify-between rounded-md bg-cyan-700 px-3 py-1.5 text-xs font-black text-white transition hover:bg-cyan-800 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                  >
                    <span>Open Record Review Queue ({data.pendingRecordsCount})</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>No records waiting for review.</span>
                </div>
              )}
            </div>

            {/* Section 2: Level Suggestions */}
            <div className="p-2">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span>Level Suggestions</span>
                </div>
                <span
                  className={cx(
                    "rounded px-1.5 py-0.2 text-[10px] font-black",
                    data.pendingSuggestionsCount > 0
                      ? "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                  )}
                >
                  {data.pendingSuggestionsCount} Pending
                </span>
              </div>

              {data.recentPendingSuggestions.length > 0 ? (
                <div className="space-y-1.5">
                  {data.recentPendingSuggestions.map((sug) => (
                    <Link
                      key={sug.id}
                      href="/level-suggestions"
                      onClick={() => setIsOpen(false)}
                      className="group block rounded-md border border-slate-200 bg-slate-50 p-2.5 transition hover:border-amber-400 hover:bg-amber-50/50 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-amber-500/50 dark:hover:bg-amber-950/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="truncate text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-300">
                          {sug.name}
                        </span>
                        <span className="rounded bg-slate-200 px-1 py-0.2 text-[9px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          SUGGESTION
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-slate-600 dark:text-slate-400">
                        Original: {sug.originalName} • by {sug.submitterName}
                      </p>
                      <span className="mt-1 block text-[10px] text-slate-600 dark:text-slate-400">
                        {formatRelativeTime(sug.submittedAt)}
                      </span>
                    </Link>
                  ))}

                  <Link
                    href="/level-suggestions"
                    onClick={() => setIsOpen(false)}
                    className="mt-1 flex items-center justify-between rounded-md bg-amber-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-amber-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                  >
                    <span>Open Suggestions Queue ({data.pendingSuggestionsCount})</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>No level suggestions waiting.</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Shortcuts */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-950/70">
            <Link
              href="/moderation"
              onClick={() => setIsOpen(false)}
              className="font-bold text-cyan-700 underline hover:text-cyan-900 dark:text-cyan-400"
            >
              Review Hub &rarr;
            </Link>
            <Link
              href="/admin/upcoming"
              onClick={() => setIsOpen(false)}
              className="font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Upcoming Queue &rarr;
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  } catch {
    return dateString;
  }
}
