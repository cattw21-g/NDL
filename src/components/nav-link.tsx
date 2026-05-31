"use client";

import {
  BookOpen,
  ClipboardCheck,
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
  list: ListOrdered,
  news: Newspaper,
  review: ClipboardCheck,
  shield: ShieldCheck,
  suggest: Lightbulb,
  trophy: Trophy,
  upload: Upload,
};

export function NavLink({
  href,
  label,
  icon,
  tone = "default",
}: {
  href: string;
  label: string;
  icon: keyof typeof icons;
  tone?: "default" | "cyan" | "amber";
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  const Icon = icons[icon];
  const toneClass =
    tone === "cyan"
      ? "hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900 dark:hover:border-cyan-400 dark:hover:bg-cyan-950 dark:hover:text-cyan-100"
      : tone === "amber"
        ? "hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900 dark:hover:border-amber-400 dark:hover:bg-amber-950 dark:hover:text-amber-100"
        : "hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900 dark:hover:border-cyan-400 dark:hover:bg-cyan-950 dark:hover:text-cyan-100";

  return (
    <Link
      href={href}
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
      {label}
    </Link>
  );
}
