"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ndl_read_changelog_slugs";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("ndl_news_read", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("ndl_news_read", callback);
  };
}

function getSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  try {
    return localStorage.getItem(STORAGE_KEY) || "[]";
  } catch {
    return "[]";
  }
}

function getServerSnapshot(): string {
  return "[]";
}

export function useReadNewsSlugs(): string[] {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markNewsPostAsRead(slug: string) {
  if (typeof window === "undefined" || !slug) return;
  try {
    const currentRaw = localStorage.getItem(STORAGE_KEY) || "[]";
    let list: string[] = [];
    try {
      const parsed = JSON.parse(currentRaw);
      if (Array.isArray(parsed)) list = parsed;
    } catch {
      list = [];
    }

    if (!list.includes(slug)) {
      list.push(slug);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event("ndl_news_read"));
    }
  } catch {
    // Ignore localStorage failures
  }
}
