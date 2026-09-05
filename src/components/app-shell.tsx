import { LogIn, LogOut, UserRound } from "lucide-react";
import Link from "next/link";

import { logoutAction } from "@/actions/auth";
import { CommandPalette, CommandPaletteTrigger } from "@/components/command-palette";
import { NavLink } from "@/components/nav-link";
import { SiteFooter } from "@/components/site-footer";
import { SplashScreen } from "@/components/splash-screen";
import {
  StaffNotificationCenter,
  type StaffNotificationData,
} from "@/components/staff-notification-center";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { demoModeEnabled, publicChangelogWhere } from "@/lib/demo-visibility";
import { isAdminRole, isModeratorRole } from "@/lib/permissions";

const navItems = [
  { href: "/", label: "List", icon: "list" },
  { href: "/upcoming", label: "Upcoming", icon: "hourglass" },
  { href: "/players", label: "Players", icon: "trophy" },
  { href: "/countries", label: "Countries", icon: "globe" },
  { href: "/creators", label: "Creators", icon: "palette" },
  { href: "/time-machine", label: "Time Machine", icon: "history" },
  { href: "/submit", label: "Submit", icon: "upload" },
  { href: "/suggest-level", label: "Suggest", icon: "suggest" },
  { href: "/rules", label: "Rules", icon: "book" },
  { href: "/changelog", label: "News", icon: "news" },
] as const;

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const isDemoMode = demoModeEnabled();

  const fortyEightHoursAgo = new Date();
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

  const recentNewsPosts = await prisma.changelogPost.findMany({
    where: publicChangelogWhere({
      publishedAt: {
        gte: fortyEightHoursAgo,
      },
    }),
    select: { slug: true },
  });

  const recentNewsSlugs = recentNewsPosts.map((p) => p.slug);

  let notificationData: StaffNotificationData | undefined;
  let pendingTotalCount = 0;

  if (user && isModeratorRole(user.role)) {
    const [
      pendingRecordsCount,
      pendingSuggestionsCount,
      recentPendingRecords,
      recentPendingSuggestions,
    ] = await Promise.all([
      prisma.recordSubmission.count({
        where: {
          status: "PENDING",
        },
      }),
      prisma.levelSuggestion.count({
        where: {
          status: "PENDING",
        },
      }),
      prisma.recordSubmission.findMany({
        where: {
          status: "PENDING",
        },
        take: 4,
        orderBy: {
          submittedAt: "desc",
        },
        include: {
          player: {
            select: {
              playerName: true,
              displayName: true,
            },
          },
          level: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.levelSuggestion.findMany({
        where: {
          status: "PENDING",
        },
        take: 4,
        orderBy: {
          submittedAt: "desc",
        },
        include: {
          submitter: {
            select: {
              playerName: true,
              displayName: true,
            },
          },
        },
      }),
    ]);

    pendingTotalCount = pendingRecordsCount + pendingSuggestionsCount;
    notificationData = {
      pendingRecordsCount,
      pendingSuggestionsCount,
      totalPendingCount: pendingTotalCount,
      recentPendingRecords: recentPendingRecords.map((rec) => ({
        id: rec.id,
        playerName: rec.player.displayName || rec.player.playerName,
        levelName: rec.level.name,
        levelSlug: rec.level.slug,
        progress: rec.progress,
        submittedAt: rec.submittedAt.toISOString(),
      })),
      recentPendingSuggestions: recentPendingSuggestions.map((sug) => ({
        id: sug.id,
        name: sug.name,
        originalName: sug.originalName,
        submitterName: sug.submitter.displayName || sug.submitter.playerName,
        submittedAt: sug.submittedAt.toISOString(),
      })),
      timestamp: new Date().toISOString(),
    };
  }

  return (
    <div
      id="top"
      className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#f6f8fb] text-slate-950 dark:bg-[#080c13] dark:text-slate-100"
    >
      <SplashScreen />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,#eaf6fb_0%,rgba(246,248,251,0)_100%)] dark:bg-[linear-gradient(180deg,rgba(14,116,144,0.22)_0%,rgba(8,12,19,0)_100%)]" />
      <DecorativeRail side="left" />
      <DecorativeRail side="right" />

      <header className="sticky top-0 z-30 border-b border-slate-300 bg-white/95 shadow-[0_2px_14px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-950/92 dark:shadow-[0_2px_18px_rgba(0,0,0,0.34)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-3 px-3 py-3 sm:px-5">
          <Link
            href="/"
            prefetch={true}
            className="group flex min-w-0 flex-[1_1_14rem] items-center gap-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-300"
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
                recentNewsSlugs={item.href === "/changelog" ? recentNewsSlugs : undefined}
              />
            ))}
            {user && isModeratorRole(user.role) ? (
              <NavLink
                href="/moderation"
                label="Review"
                icon="review"
                tone="cyan"
                badgeCount={pendingTotalCount}
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
            {user && isModeratorRole(user.role) ? (
              <StaffNotificationCenter initialData={notificationData} />
            ) : null}
            <CommandPaletteTrigger />
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
            <a
              href="https://discord.gg/kyYBkQzTCq"
              target="_blank"
              rel="noopener noreferrer"
              title="Join Official NDL Discord Server"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#5865F2]/40 bg-[#5865F2]/10 text-[#5865F2] transition hover:border-[#5865F2] hover:bg-[#5865F2] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]/40 dark:border-[#5865F2]/50 dark:bg-[#5865F2]/20 dark:text-[#7289da] dark:hover:bg-[#5865F2] dark:hover:text-white"
              aria-label="Discord Server"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@cattw_gd"
              target="_blank"
              rel="noopener noreferrer"
              title="Follow @cattw_gd on TikTok"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950 dark:hover:text-cyan-100"
              aria-label="TikTok @cattw_gd"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3 15.28a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.18 8.18 0 0 0 4.91 1.63V6.89a4.85 4.85 0 0 1-1-.2z" />
              </svg>
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <CommandPalette />

      {isDemoMode ? (
        <div className="relative z-20 border-b border-amber-300 bg-amber-50 px-3 py-2 text-center text-sm font-black text-amber-900 dark:border-amber-500/50 dark:bg-amber-950/50 dark:text-amber-100">
          Demo mode is enabled. Demo levels, users, records, and thumbnails may
          be visible.
        </div>
      ) : null}

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-3 py-5 sm:px-5 sm:py-7">
        {children}
      </main>
      <SiteFooter
        user={
          user
            ? {
                playerName: user.playerName,
                isModerator: isModeratorRole(user.role),
                isAdmin: isAdminRole(user.role),
              }
            : null
        }
      />
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
      <div className="flex flex-col gap-3 opacity-15">
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
