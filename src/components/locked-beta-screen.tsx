"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Lock, ArrowRight, Sparkles, ExternalLink, ShieldCheck, KeyRound } from "lucide-react";
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
        setSuccessMessage(res.message || "Key verified! Loading Nerfed Demonlist...");
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setError(res.error || "Invalid Beta Key. Please check the spelling and try again.");
      }
    });
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#060910] px-4 py-8 text-white select-none">
      {/* Background Neon Ambient Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[34rem] w-[34rem] rounded-full bg-cyan-500/12 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-purple-600/15 blur-[90px]" />
        {/* Subtle Cyberpunk Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
      </div>

      {/* Main Locked Glass Card */}
      <div className="relative z-10 w-full max-w-[440px] rounded-3xl border border-cyan-500/20 bg-slate-950/80 p-8 shadow-[0_0_80px_rgba(6,182,212,0.14)] backdrop-blur-2xl sm:p-10">
        {/* Top Glowing Brand Header */}
        <div className="flex flex-col items-center text-center">
          {/* Logo with Neon Border */}
          <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-cyan-400/80 bg-gradient-to-br from-cyan-950 via-slate-900 to-black p-2.5 shadow-[0_0_40px_rgba(6,182,212,0.4)]">
            <Image
              src="/logo.png"
              alt="NDL Logo"
              width={64}
              height={64}
              priority
              className="h-full w-full object-contain"
            />
            {/* Corner Accent Triangles */}
            <span className="absolute left-0 top-0 h-2 w-2 border-b border-r border-cyan-300 bg-cyan-400/40" />
            <span className="absolute bottom-0 right-0 h-2 w-2 border-l border-t border-purple-300 bg-purple-400/40" />
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Sparkles className="h-3 w-3 text-purple-400 animate-pulse" />
            <span>Private Beta Preview</span>
          </div>

          <h1 className="mt-3 text-2xl font-black uppercase tracking-wider text-white">
            Nerfed Demonlist
          </h1>

          <p className="mt-1 text-xs text-slate-400">
            Enter your single-use Beta Key to access this test build:
          </p>
        </div>

        {/* Key Unlock Form */}
        <form onSubmit={handleUnlock} className="mt-7 space-y-4">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
              <KeyRound className="h-4 w-4 text-cyan-400/70" />
            </div>

            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="NDL-XXXX-YYYY"
              autoFocus
              autoComplete="off"
              spellCheck="false"
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-10 pr-4 py-3.5 text-center font-mono text-sm font-black uppercase tracking-[0.2em] text-white placeholder-slate-600 shadow-inner transition focus:border-cyan-400 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || !key.trim()}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_25px_rgba(6,182,212,0.3)] transition hover:from-cyan-400 hover:to-purple-500 hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:opacity-40"
          >
            <span>{isPending ? "Verifying Key..." : "Unlock Access"}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Feedback Error / Success */}
          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/15 p-3 text-center text-xs font-bold text-rose-300 shadow-sm animate-in fade-in">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-center text-xs font-bold text-emerald-300 shadow-sm animate-in fade-in">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}
        </form>

        {/* Minimal Footer Info */}
        <div className="mt-7 flex items-center justify-between border-t border-slate-800/80 pt-4 text-[11px] text-slate-500">
          <Link
            href="/login"
            className="font-bold text-slate-400 hover:text-cyan-300 transition"
          >
            Staff Login
          </Link>

          <a
            href="https://discord.gg/kyYBkQzTCq"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-slate-400 hover:text-purple-300 transition"
          >
            <span>Discord Server</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
