"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export type CurrentUser = {
  id: string;
  playerName: string;
  displayName: string;
  role: string;
  isAdmin: boolean;
  isModerator: boolean;
  isReviewer?: boolean;
  isBetaTester: boolean;
};

let cachedUser: CurrentUser | null | undefined = undefined;
let activeFetch: Promise<CurrentUser | null> | null = null;
const listeners = new Set<(user: CurrentUser | null) => void>();

function notify(user: CurrentUser | null) {
  cachedUser = user;
  listeners.forEach((fn) => {
    try {
      fn(user);
    } catch {
      // Ignore listener error
    }
  });
}

export async function fetchCurrentUser(force = false): Promise<CurrentUser | null> {
  if (activeFetch && !force) return activeFetch;

  activeFetch = (async () => {
    try {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      if (!res.ok) {
        notify(null);
        return null;
      }
      const json = await res.json();
      const user = json?.data?.user ?? null;
      notify(user);
      return user;
    } catch {
      notify(null);
      return null;
    } finally {
      activeFetch = null;
    }
  })();

  return activeFetch;
}

export function invalidateCurrentUser() {
  cachedUser = undefined;
  void fetchCurrentUser(true);
}

export function useCurrentUser() {
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return cachedUser;
  });
  const [loading, setLoading] = useState<boolean>(() => cachedUser === undefined);

  // Subscribe to changes from any fetchCurrentUser call
  useEffect(() => {
    let mounted = true;

    const listener = (newUser: CurrentUser | null) => {
      if (mounted) {
        setUser(newUser);
        setLoading(false);
      }
    };

    listeners.add(listener);

    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  // Fetch or re-check on mount and whenever pathname changes
  useEffect(() => {
    let mounted = true;

    // Always fetch if we don't have a user, or if navigating from login/register
    const shouldFetch =
      cachedUser === undefined ||
      cachedUser === null ||
      pathname === "/submissions" ||
      pathname?.startsWith("/admin") ||
      pathname === "/settings";

    if (shouldFetch) {
      void fetchCurrentUser(true).then((u) => {
        if (mounted) {
          setUser(u);
          setLoading(false);
        }
      });
    } else {
      setUser(cachedUser);
      setLoading(false);
    }

    const handleFocus = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        void fetchCurrentUser(true);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      mounted = false;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [pathname]);

  return { user: user ?? null, loading };
}
