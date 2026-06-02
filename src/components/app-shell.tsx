import { LogIn, LogOut, UserRound } from "lucide-react";
import Link from "next/link";

import { logoutAction } from "@/actions/auth";
import { NavLink } from "@/components/nav-link";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/lib/auth";
import { demoModeEnabled } from "@/lib/demo-visibility";
import { isAdminRole, isModeratorRole } from "@/lib/permissions";

const navItems = [
  { href: "/", label: "List", icon: "list" },
  { href: "/players", label: "Players", icon: "trophy" },
  { href: "/submit", label: "Submit", icon: "upload" },
  { href: "/suggest-level", label: "Suggest", icon: "suggest" },
  { href: "/rules", label: "Rules", icon: "book" },
  { href: "/changelog", label: "News", icon: "news" },
] as const;

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const isDemoMode = demoModeEnabled();

  return (
    <div
      id="top"
      className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#f6f8fb] text-slate-950 dark:bg-[#080c13] dark:text-slate-100"
    >
      <div className="pointer-events-none fixed inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,#eaf6fb_0%,rgba(246,248,251,0)_100%)] dark:bg-[linear-gradient(180deg,rgba(14,116,144,0.22)_0%,rgba(8,12,19,0)_100%)]" />
      <DecorativeRail side="left" />
      <DecorativeRail side="right" />

      <header className="sticky top-0 z-30 border-b border-slate-300 bg-white/95 shadow-[0_2px_14px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-950/92 dark:shadow-[0_2px_18px_rgba(0,0,0,0.34)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-3 px-3 py-3 sm:px-5">
          <Link
            href="/"
              className="group flex min-w-[17rem] flex-1 items-center gap-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md border border-cyan-900 bg-cyan-800 text-sm font-black text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18),0_6px_16px_rgba(15,23,42,0.16)]">
              <span className="absolute left-0 top-0 h-4 w-4 border-b border-r border-white/35 bg-cyan-400/40" />
              <span className="absolute bottom-0 right-0 h-5 w-5 border-l border-t border-white/30 bg-teal-400/30" />
              NDL
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xl font-black uppercase leading-none text-slate-950">
                Nerfed Demonlist
              </span>
              <span className="mt-1 block truncate text-xs font-semibold text-slate-600">
                Community list for reviewed nerfed demon records
              </span>
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-1.5 text-sm lg:justify-center">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
              />
            ))}
            {user && isModeratorRole(user.role) ? (
              <NavLink
                href="/moderation"
                label="Review"
                icon="review"
                tone="cyan"
              />
            ) : null}
            {user && isAdminRole(user.role) ? (
              <NavLink
                href="/admin"
                label="Admin"
                icon="shield"
                tone="amber"
              />
            ) : null}
          </nav>

          <div className="flex min-w-fit items-center gap-2 sm:ml-auto">
            {user ? (
              <>
                <Link
                  href={`/players/${user.playerName}`}
                  className="inline-flex min-h-9 min-w-0 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950 dark:hover:text-cyan-100"
                >
                  <UserRound className="h-4 w-4" />
                  <span className="max-w-32 truncate">{user.displayName}</span>
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-red-400 dark:hover:bg-red-950 dark:hover:text-red-100"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex min-h-9 items-center gap-2 rounded-md border border-cyan-800 bg-cyan-800 px-3 text-sm font-black text-white transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {isDemoMode ? (
        <div className="relative z-20 border-b border-amber-300 bg-amber-50 px-3 py-2 text-center text-sm font-black text-amber-900 dark:border-amber-500/50 dark:bg-amber-950/50 dark:text-amber-100">
          Demo mode is enabled. Demo levels, users, records, and thumbnails may
          be visible.
        </div>
      ) : null}

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-3 py-5 sm:px-5 sm:py-7">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

function DecorativeRail({ side }: { side: "left" | "right" }) {
  const position = side === "left" ? "left-3" : "right-3";
  const blocks = [
    "h-16 w-24",
    "h-10 w-16",
    "h-20 w-20",
    "h-12 w-28",
    "h-14 w-14",
    "h-24 w-20",
    "h-10 w-24",
  ];

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed top-32 hidden w-28 ${position} 2xl:block`}
    >
      <div className="flex flex-col gap-3 opacity-30">
        {blocks.map((block, index) => (
          <span
            key={block}
            className={`rounded-md border border-slate-300 bg-white/80 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 ${
              index % 2 === 0 ? "self-start" : "self-end"
            } ${block}`}
          />
        ))}
        <span className="mt-2 h-28 w-1 self-center rounded-full bg-cyan-700/25" />
      </div>
    </div>
  );
}
