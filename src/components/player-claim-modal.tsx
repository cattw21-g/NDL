"use client";

import { useState } from "react";
import { ShieldCheck, UserCheck, ExternalLink, X, Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type Props = {
  playerName: string;
  displayName: string;
  isClaimed: boolean;
  isSubmissionLocked: boolean;
  isLoggedIn: boolean;
};

export function PlayerClaimModal({
  playerName,
  displayName,
  isClaimed,
  isSubmissionLocked,
  isLoggedIn,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 text-xs font-bold text-cyan-700 transition hover:border-cyan-500 hover:bg-cyan-500/20 dark:border-cyan-400/30 dark:bg-cyan-950/40 dark:text-cyan-300 dark:hover:border-cyan-400 dark:hover:bg-cyan-900/50"
      >
        <UserCheck className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
        <span>{isClaimed ? "Claimed Profile" : "Claim Player"}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl text-left">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Player Profile Claiming
                </h3>
                <p className="text-xs text-zinc-400">
                  {displayName} (@{playerName})
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed text-zinc-300">
              {isClaimed ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-300">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    This player profile is verified & claimed
                  </div>
                  <p className="mt-1 text-zinc-300">
                    This profile is connected to an active registered account.
                    {isSubmissionLocked
                      ? " Submission locking is active: unauthorized third-party submissions are locked."
                      : " Submission locking is optional."}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-300">
                  <div className="flex items-center gap-2 font-bold">
                    <UserCheck className="h-4 w-4 text-amber-400" />
                    Unclaimed Demonlist Profile
                  </div>
                  <p className="mt-1 text-zinc-300">
                    Are you the owner of this Geometry Dash profile? You can claim this player identity to manage your stats, lock your submissions against impersonation, and link your social links.
                  </p>
                </div>
              )}

              <div className="space-y-2.5 pt-2">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                  <p className="font-bold text-white">Step 1: Link Discord or GD Identity</p>
                  <p className="mt-0.5 text-zinc-400">
                    Join our Official Discord and verify your Geometry Dash in-game account, or link Discord directly to your NDL account in settings.
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                  <p className="font-bold text-white">Step 2: Submission Locking (Anti-Impersonation)</p>
                  <p className="mt-0.5 text-zinc-400">
                    Once claimed, turn on <strong>Submission Locking</strong> in your account settings. This guarantees that all future record submissions under your name must be submitted while logged into your verified account.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <a
                href="https://discord.gg/kyYBkQzTCq"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#5865F2] px-4 py-2 text-xs font-bold text-white hover:bg-[#4752c4] transition"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Join Discord Verification
              </a>
              {isLoggedIn ? (
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold text-white hover:border-cyan-500 hover:bg-zinc-700 transition"
                >
                  <Lock className="h-3.5 w-3.5 text-cyan-400" />
                  Account Settings & Locking
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold text-white hover:border-cyan-500 hover:bg-zinc-700 transition"
                >
                  Sign In to Claim
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
