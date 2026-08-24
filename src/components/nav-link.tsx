"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  BookOpen,
  ClipboardCheck,
  Hourglass,
  ListOrdered,
  Newspaper,
  ShieldCheck,
  Lightbulb,
  Trophy,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cx } from "@/components/ui";

const icons = {
  book: BookOpen,
  hourglass: Hourglass,
  list: ListOrdered,
  news: Newspaper,
  review: ClipboardCheck,
  shield: ShieldCheck,
  suggest: Lightbulb,
  trophy: Trophy,
  upload: Upload,
};

function subscribeNewsStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("ndl_news_read", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("ndl_news_read", callback);
  };
}

function getNewsSnapshot() {
  try {
    return localStorage.getItem("ndl_last_read_news_ts") || "";
  } catch {
    return "";
  }
}

function getServerNewsSnapshot() {
  return "";
}

export function NavLink({
  href,
  label,
  icon,
  tone = "default",
  badgeCount,
  latestItemTimestamp,
}: {
  href: string;
  label: string;
  icon: keyof typeof icons;
  tone?: "default" | "cyan" | "amber";
  badgeCount?: number;
  latestItemTimestamp?: string;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  const Icon = icons[icon];

  const isNewsPage = pathname.startsWith("/changelog") || pathname.startsWith("/news");
  const lastReadIso = useSyncExternalStore(subscribeNewsStorage, getNewsSnapshot, getServerNewsSnapshot);

  useEffect(() => {
    if ((href === "/changelog" || href === "/news") && isNewsPage) {
      try {
        localStorage.setItem("ndl_last_read_news_ts", new Date().toISOString());
        window.dispatchEvent(new Event("ndl_news_read"));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [href, isNewsPage]);

  const isNewsLink = href === "/changelog" || href === "/news";
  const isNewsRead = isNewsLink
    ? isNewsPage || Boolean(lastReadIso && (!latestItemTimestamp || new Date(lastReadIso).getTime() >= new Date(latestItemTimestamp).getTime()))
    : false;

  const effectiveBadgeCount = isNewsLink && isNewsRead ? 0 : (badgeCount || 0);

  const toneClass =
    tone === "cyan"
      ? "hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900 dark:hover:border-cyan-400 dark:hover:bg-cyan-950 dark:hover:text-cyan-100"
      : tone === "amber"
        ? "hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900 dark:hover:border-amber-400 dark:hover:bg-amber-950 dark:hover:text-amber-100"
        : "hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900 dark:hover:border-cyan-400 dark:hover:bg-cyan-950 dark:hover:text-cyan-100";

  return (
    <Link
      href={href}
      prefetch={true}
      aria-current={active ? "page" : undefined}
      className={cx(
        "inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-cyan-300",
        active
          ? "border-cyan-800 bg-cyan-800 text-white shadow-[0_3px_8px_rgba(15,23,42,0.12)] dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950"
          : "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
        toneClass,
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {effectiveBadgeCount > 0 ? (
        <span
          className={cx(
            "rounded-full px-1.5 py-0.2 text-[10px] font-black tabular-nums shadow-sm",
            active
              ? "bg-white text-cyan-950 dark:bg-slate-950 dark:text-cyan-300"
              : "bg-red-500 text-white dark:bg-red-500",
          )}
        >
          {effectiveBadgeCount > 99 ? "99+" : effectiveBadgeCount}
        </span>
      ) : null}
    </Link>
  );
}
