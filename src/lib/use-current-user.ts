"use client";

import { useEffect, useState } from "react";

export type CurrentUser = {
  id: string;
  playerName: string;
  displayName: string;
  role: string;
  isAdmin: boolean;
  isModerator: boolean;
  isBetaTester: boolean;
};

let cachedUser: CurrentUser | null | undefined = undefined;
let activeFetch: Promise<CurrentUser | null> | null = null;
const listeners = new Set<(user: CurrentUser | null) => void>();

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  if (activeFetch) return activeFetch;

  activeFetch = (async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        cachedUser = null;
        listeners.forEach((fn) => fn(null));
        return null;
      }
      const json = await res.json();
      const user = json?.data?.user ?? null;
      cachedUser = user;
      listeners.forEach((fn) => fn(user));
      return user;
    } catch {
      cachedUser = null;
      listeners.forEach((fn) => fn(null));
      return null;
    } finally {
      activeFetch = null;
    }
  })();

  return activeFetch;
}

export function invalidateCurrentUser() {
  cachedUser = undefined;
  void fetchCurrentUser();
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return cachedUser;
  });
  const [loading, setLoading] = useState<boolean>(() => cachedUser === undefined);

  useEffect(() => {
    let mounted = true;

    const listener = (newUser: CurrentUser | null) => {
      if (mounted) {
        setUser(newUser);
        setLoading(false);
      }
    };

    listeners.add(listener);

    if (cachedUser === undefined) {
      void fetchCurrentUser().then((u) => {
        if (mounted) {
          setUser(u);
          setLoading(false);
        }
      });
    } else {
      setUser(cachedUser);
      setLoading(false);
    }

    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  return { user: user ?? null, loading };
}
