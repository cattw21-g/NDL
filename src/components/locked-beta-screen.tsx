"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Lock, ArrowRight, Sparkles, ExternalLink, ShieldCheck } from "lucide-react";
import { unlockBetaSiteWithKeyAction, type BetaKeyActionResult } from "@/actions/beta-keys";

export function LockedBetaScreen() {
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUnlock = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!key.trim()) return;
    setError(null);

    const formData = new FormData();
    formData.append("key", key);

    startTransition(async () => {
      const res: BetaKeyActionResult = await unlockBetaSiteWithKeyAction(formData);
      if (res.success) {
        setSuccessMessage(res.message || "Key verified! Welcome to NDL Beta.");
        setTimeout(() => {
          window.location.reload();
        }, 600);
      } else {
        setError(res.error || "Invalid Beta Key. Please check the spelling.");
      }
    });
  };

  return (
    <div className="relative flex min-h-[85vh] w-full flex-col items-center justify-center px-4 py-12 text-center">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -top-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl dark:bg-purple-600/15" />

      {/* Main Locked Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200/90 bg-white/95 p-8 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 sm:p-10">
        {/* Glowing Lock Icon */}
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-purple-500/30 bg-purple-500/10 shadow-[0_0_25px_rgba(168,85,247,0.2)] dark:bg-purple-950/50">
          <Lock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>

        {/* Title */}
        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
          <Sparkles className="h-3 w-3" />
          <span>Private Beta Preview</span>
        </div>

        <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
          Nerfed Demonlist
        </h1>

        <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          This preview environment is strictly private. Enter your single-use Beta Key below to unlock access:
        </p>

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="mt-6 space-y-3">
          <div className="space-y-1 text-left">
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="NDL-XXXX-YYYY"
              autoFocus
              className="w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-center font-mono text-sm font-bold uppercase tracking-widest text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400/40 dark:border-slate-800 dark:bg-slate-900/70 dark:text-white dark:focus:bg-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || !key.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg transition hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
          >
            <span>{isPending ? "Verifying Key..." : "Unlock Access"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          {/* Feedback Messages */}
          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs font-bold text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>{successMessage}</span>
            </div>
          )}
        </form>

        {/* Bottom Utility Footer */}
        <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800/80">
          <p className="text-[11px]">
            Don&apos;t have a key? DM staff on Discord.
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 text-[11px] font-bold">
            <Link
              href="/login"
              className="text-slate-600 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-300 transition"
            >
              Staff Sign In
            </Link>
            <span>•</span>
            <a
              href="https://discord.gg/kyYBkQzTCq"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-600 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-300 transition"
            >
              <span>NDL Discord</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
