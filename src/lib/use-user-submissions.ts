"use client";

import { useCallback, useEffect, useState } from "react";

export type UserLevelSubmissionInfo = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "NEEDS_CHANGES" | "REJECTED";
  progress: number;
  submittedAt: string;
  moderatorNotes: string | null;
};

const STORAGE_KEY = "ndl_dismissed_submission_badges";

export function getDismissedBadgeIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function saveDismissedBadgeId(id: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getDismissedBadgeIds();
    current.add(id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(current)));
  } catch {
    // Ignore localStorage errors
  }
}

export function useUserSubmissions() {
  const [submissionsBySlug, setSubmissionsBySlug] = useState<
    Record<string, UserLevelSubmissionInfo>
  >({});
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => getDismissedBadgeIds());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let isAuthenticated = true;
    let lastFetchedAt = 0;

    async function load(isBackgroundPoll = false) {
      if (isBackgroundPoll && typeof document !== "undefined" && document.hidden) {
        return;
      }
      if (isBackgroundPoll && !isAuthenticated) {
        return;
      }

      try {
        const res = await fetch("/api/submissions/my-status", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (active && data?.ok && data?.data) {
          lastFetchedAt = Date.now();
          if (data.data.authenticated === false) {
            isAuthenticated = false;
            if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }
          }
          if (data.data.submissions) {
            setSubmissionsBySlug(data.data.submissions);
          }
        }
      } catch {
        // Ignore network errors
      } finally {
        if (active) {
          setLoaded(true);
        }
      }
    }

    void load(false);

    const handleResume = () => {
      setDismissedIds(getDismissedBadgeIds());
      if (
        typeof document !== "undefined" &&
        !document.hidden &&
        Date.now() - lastFetchedAt > 45_000
      ) {
        void load(false);
      }
    };

    window.addEventListener("focus", handleResume);
    document.addEventListener("visibilitychange", handleResume);

    intervalId = setInterval(() => {
      void load(true);
    }, 60_000);

    return () => {
      active = false;
      window.removeEventListener("focus", handleResume);
      document.removeEventListener("visibilitychange", handleResume);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const dismissBadge = useCallback((submissionId: string) => {
    saveDismissedBadgeId(submissionId);
    setDismissedIds((prev) => new Set([...prev, submissionId]));
  }, []);

  return {
    submissionsBySlug,
    dismissedIds,
    dismissBadge,
    loaded,
  };
}
