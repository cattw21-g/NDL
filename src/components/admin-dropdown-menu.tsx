"use client";

import {
  ChevronDown,
  Clock,
  FileCheck,
  FolderKanban,
  Hourglass,
  Layers,
  LayoutDashboard,
  Lightbulb,
  Shield,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function AdminDropdownMenu({ badgeCount }: { badgeCount?: number } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-amber-500/50 bg-amber-500/10 px-2.5 text-xs font-black text-amber-900 transition hover:bg-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-300 dark:hover:bg-amber-400/20"
      >
        <Shield className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span>Admin</span>
        {badgeCount && badgeCount > 0 ? (
          <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-black text-white shadow-xs">
            {badgeCount}
          </span>
        ) : null}
        <ChevronDown
          className={`h-3 w-3 text-amber-600 transition-transform duration-200 dark:text-amber-400 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-56 origin-top-right rounded-lg border border-slate-300 bg-white p-1.5 shadow-xl ring-1 ring-black/5 dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-0 zoom-in-95">
          <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Admin Navigation
          </div>

          <div className="space-y-0.5">
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-amber-50 hover:text-amber-900 dark:text-slate-200 dark:hover:bg-amber-950/40 dark:hover:text-amber-300"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-amber-500" />
              <span>Admin Dashboard</span>
            </Link>

            <Link
              href="/moderation"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-900 dark:text-slate-200 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-300"
            >
              <div className="flex items-center gap-2.5">
                <FileCheck className="h-3.5 w-3.5 text-cyan-500" />
                <span>Review Submissions</span>
              </div>
              {badgeCount && badgeCount > 0 ? (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-black text-white shadow-xs">
                  {badgeCount}
                </span>
              ) : null}
            </Link>

            <Link
              href="/admin/upcoming"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-amber-50 hover:text-amber-900 dark:text-slate-200 dark:hover:bg-amber-950/40 dark:hover:text-amber-300"
            >
              <Hourglass className="h-3.5 w-3.5 text-amber-500" />
              <span>Upcoming Queue</span>
            </Link>

            <Link
              href="/admin/levels"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-900 dark:text-slate-200 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-300"
            >
              <Layers className="h-3.5 w-3.5 text-cyan-500" />
              <span>Manage Levels</span>
            </Link>

            <Link
              href="/admin/records"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900 dark:text-slate-200 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
            >
              <Trophy className="h-3.5 w-3.5 text-emerald-500" />
              <span>Manage Records</span>
            </Link>

            <Link
              href="/level-suggestions"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-purple-50 hover:text-purple-900 dark:text-slate-200 dark:hover:bg-purple-950/40 dark:hover:text-purple-300"
            >
              <Lightbulb className="h-3.5 w-3.5 text-purple-500" />
              <span>Level Suggestions</span>
            </Link>

            <Link
              href="/admin/users"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-900 dark:text-slate-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
            >
              <FolderKanban className="h-3.5 w-3.5 text-blue-500" />
              <span>Manage Users</span>
            </Link>

            <Link
              href="/admin/audit"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
            >
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>Audit Log</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
