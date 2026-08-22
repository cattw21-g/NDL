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

    async function load() {
      try {
        const res = await fetch("/api/submissions/my-status", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (active && data?.ok && data?.data?.submissions) {
          setSubmissionsBySlug(data.data.submissions);
        }
      } catch {
        // Ignore network errors
      } finally {
        if (active) {
          setLoaded(true);
        }
      }
    }

    void load();

    const handleFocus = () => {
      setDismissedIds(getDismissedBadgeIds());
      void load();
    };

    window.addEventListener("focus", handleFocus);
    const interval = setInterval(load, 30_000);

    return () => {
      active = false;
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
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
