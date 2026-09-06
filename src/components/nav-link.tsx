"use client";

import {
  BarChart3,
  BookOpen,
  Bot,
  ClipboardCheck,
  Globe,
  History,
  Hourglass,
  Lightbulb,
  ListOrdered,
  MapPin,
  Newspaper,
  Palette,
  ShieldCheck,
  Terminal,
  Trophy,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cx } from "@/components/ui";
import { useReadNewsSlugs } from "@/lib/news-read-store";
import { useTranslation } from "@/lib/i18n/use-translation";

const icons = {
  book: BookOpen,
  bot: Bot,
  globe: Globe,
  history: History,
  hourglass: Hourglass,
  list: ListOrdered,
  map: MapPin,
  news: Newspaper,
  palette: Palette,
  review: ClipboardCheck,
  shield: ShieldCheck,
  stats: BarChart3,
  suggest: Lightbulb,
  terminal: Terminal,
  trophy: Trophy,
  upload: Upload,
};

export function NavLink({
  href,
  label,
  icon,
  tone = "default",
  badgeCount,
  recentNewsSlugs,
}: {
  href: string;
  label: string;
  icon: keyof typeof icons;
  tone?: "default" | "cyan" | "amber";
  badgeCount?: number;
  recentNewsSlugs?: string[];
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  const Icon = icons[icon];

  const readSlugs = useReadNewsSlugs();

  const isNewsLink = href === "/changelog" || href === "/news";
  const unreadNewsCount = recentNewsSlugs
    ? recentNewsSlugs.filter((slug) => !readSlugs.includes(slug)).length
    : (badgeCount || 0);

  const effectiveBadgeCount = isNewsLink ? unreadNewsCount : (badgeCount || 0);

  const toneClass =
    tone === "cyan"
      ? "hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900 dark:hover:border-cyan-400 dark:hover:bg-cyan-950 dark:hover:text-cyan-100"
      : tone === "amber"
        ? "hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900 dark:hover:border-amber-400 dark:hover:bg-amber-950 dark:hover:text-amber-100"
        : "hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900 dark:hover:border-cyan-400 dark:hover:bg-cyan-950 dark:hover:text-cyan-100";

  const { t } = useTranslation();
  const translationKeyMap: Record<string, string> = {
    "/": "list",
    "/upcoming": "upcoming",
    "/players": "players",
    "/countries": "countries",
    "/stats": "stats",
    "/creators": "creators",
    "/archive": "archive",
    "/submit": "submit",
    "/suggest-level": "suggest",
    "/staff": "staff",
    "/rules": "rules",
    "/changelog": "news",
  };
  const key = translationKeyMap[href] || label.toLowerCase();
  const displayLabel = t(key, label);

  const isSubmitLink = href === "/submit";

  return (
    <Link
      href={href}
      prefetch={true}
      aria-current={active ? "page" : undefined}
      className={cx(
        "group inline-flex min-h-8 sm:min-h-8.5 items-center gap-1.5 sm:gap-2 rounded-lg px-2.5 sm:px-3 text-xs sm:text-[13px] font-bold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-300",
        active
          ? "border border-cyan-700 bg-cyan-700 text-white shadow-sm shadow-cyan-900/20 dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950 font-black"
          : isSubmitLink
            ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-900 hover:border-emerald-500/60 hover:bg-emerald-500/20 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:border-emerald-400"
            : "border border-slate-300/80 bg-white/90 text-slate-700 hover:border-cyan-400 hover:bg-cyan-50/80 hover:text-cyan-900 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-cyan-500/50 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-200 shadow-xs",
        toneClass,
      )}
    >
      <Icon
        className={cx(
          "h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-transform group-hover:scale-105",
          active
            ? "text-white dark:text-slate-950"
            : isSubmitLink
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-slate-400 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400",
        )}
      />
      <span className="whitespace-nowrap">{displayLabel}</span>
      {effectiveBadgeCount > 0 ? (
        <span
          className={cx(
            "ml-0.5 inline-flex items-center rounded-full px-1.5 py-0.2 text-[10px] font-black tabular-nums shadow-xs",
            active
              ? "bg-white text-cyan-950 dark:bg-slate-950 dark:text-cyan-300"
              : "bg-rose-500 text-white animate-pulse",
          )}
        >
          {effectiveBadgeCount > 99 ? "99+" : effectiveBadgeCount}
        </span>
      ) : null}
    </Link>
  );
}
