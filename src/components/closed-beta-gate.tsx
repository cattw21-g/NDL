"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sparkles, Shield, LogIn, ExternalLink, UserPlus, FileText } from "lucide-react";
import { useCurrentUser } from "@/lib/use-current-user";
import { isAllowedInClosedBeta, isClosedBetaExemptPath } from "@/lib/closed-beta";

interface ClosedBetaGateProps {
  children: React.ReactNode;
  isClosedBetaActive: boolean;
}

export function ClosedBetaGate({
  children,
  isClosedBetaActive,
}: ClosedBetaGateProps) {
  const pathname = usePathname() || "/";
  const { user, loading } = useCurrentUser();

  // If closed beta mode is disabled, render children normally
  if (!isClosedBetaActive) {
    return <>{children}</>;
  }

  // Exempt authentication, verification, and application routes
  if (isClosedBetaExemptPath(pathname)) {
    return <>{children}</>;
  }

  // While user session is loading, show a subtle loading skeleton
  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center py-24 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Checking beta authorization...
        </p>
      </div>
    );
  }

  // If user is logged in and authorized as Beta Tester or Staff
  if (user && isAllowedInClosedBeta(user.role, user.playerName)) {
    return (
      <div className="w-full">
        {/* Closed Beta Status Notification Pill */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs text-purple-700 dark:border-purple-500/30 dark:bg-purple-950/40 dark:text-purple-300">
          <div className="flex items-center gap-2 font-bold">
            <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            <span>NDL Closed Beta Active</span>
            <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
              {user.isAdmin ? "Admin" : user.isModerator ? "Moderator" : user.isReviewer ? "Reviewer" : "Beta Tester"}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link
              href="/beta/feedback"
              className="text-purple-600 underline hover:text-purple-900 dark:text-purple-300 dark:hover:text-purple-100 transition"
            >
              Report Feedback
            </Link>
            <a
              href="https://discord.gg/kyYBkQzTCq"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-900 dark:text-purple-300 dark:hover:text-purple-100 transition"
            >
              <span>Beta Discord</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {children}
      </div>
    );
  }

  // Not authorized: Render Closed Beta Gate Screen
  const isPlayerLoggedIn = Boolean(user);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-purple-600 dark:border-purple-500/30 dark:bg-purple-950/60 dark:text-purple-400">
        <Sparkles className="h-3.5 w-3.5 text-purple-500" />
        <span>Private Closed Beta</span>
      </div>

      {/* Main Title */}
      <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
        Nerfed Demonlist is in Closed Beta
      </h1>

      {/* Description */}
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
        We are conducting private testing with appointed staff and verified Beta Testers to finalize rankings, stress-test the moderation workflow, and ensure maximum stability before our official public launch.
      </p>

      {/* Account Status Card */}
      <div className="mt-8 w-full rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
        {isPlayerLoggedIn ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Shield className="h-4 w-4 text-amber-500" />
              <span>
                Signed in as <strong className="text-slate-900 dark:text-white">@{user?.playerName}</strong> (Player)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Your account does not currently hold a Beta Tester or Staff role. If you would like early access to participate in testing, apply below!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/applications/beta-tester"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <FileText className="h-4 w-4" />
                <span>Apply as Beta Tester</span>
              </Link>
              <a
                href="https://discord.gg/kyYBkQzTCq"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-100 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-200 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <span>Join Official Discord</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Are you an invited Beta Tester or NDL Staff member? Sign in to unlock full access.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/login?redirect=${encodeURIComponent(pathname)}`}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In to Access</span>
              </Link>
              <Link
                href="/applications/beta-tester"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <UserPlus className="h-4 w-4" />
                <span>Apply for Beta Tester</span>
              </Link>
              <a
                href="https://discord.gg/kyYBkQzTCq"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <span>NDL Discord</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Testing Highlights */}
      <div className="mt-8 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white/50 p-4 dark:border-slate-800/80 dark:bg-slate-900/50">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            1. Apply & Verify
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Submit a Beta Tester application. Staff reviews applications directly through the admin panel.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white/50 p-4 dark:border-slate-800/80 dark:bg-slate-900/50">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            2. Discord Sync
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Approved testers automatically receive the hoisted @Beta Tester Discord role and access to #beta-chat.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white/50 p-4 dark:border-slate-800/80 dark:bg-slate-900/50">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            3. Test & Feedback
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Explore levels, submit test completions, and report bugs via the built-in Beta Feedback Hub.
          </p>
        </div>
      </div>
    </div>
  );
}
