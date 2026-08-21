"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function SplashScreen() {
  const [mounted, setMounted] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Check if already dismissed in session
    if (sessionStorage.getItem("ndl_splash_seen")) {
      const dismissTimer = setTimeout(() => {
        setMounted(false);
      }, 0);
      return () => clearTimeout(dismissTimer);
    }

    sessionStorage.setItem("ndl_splash_seen", "true");

    const timer1 = setTimeout(() => {
      setFadeOut(true);
    }, 1150);

    const timer2 = setTimeout(() => {
      document.documentElement.classList.add("splash-dismissed");
      setMounted(false);
    }, 1450);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      id="ndl-splash-screen"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#070b12] text-white transition-all duration-300 select-none ${
        fadeOut ? "opacity-0 scale-98 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Dynamic Cyberpunk Glow Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[28rem] w-[28rem] rounded-full bg-cyan-500/15 blur-[90px]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-teal-500/20 blur-[60px]" />
        {/* Subtle grid lines */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Main Brand Card */}
      <div className="relative z-10 flex flex-col items-center px-4 text-center">
        {/* Logo Container with Neon Glowing Border */}
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-cyan-400/80 bg-gradient-to-br from-cyan-950 via-slate-900 to-black p-3 shadow-[0_0_50px_rgba(6,182,212,0.5)]">
          <Image
            src="/logo.png"
            alt="NDL Official Logo"
            width={80}
            height={80}
            className="h-full w-full object-contain drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black uppercase tracking-[0.15em] text-white sm:text-4xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          Nerfed Demonlist
        </h1>

        {/* Creator Badge with TikTok Link */}
        <a
          href="https://www.tiktok.com/@cattw_gd"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/70 px-3.5 py-1 text-xs font-black text-cyan-300 shadow-sm transition hover:border-cyan-400 hover:text-cyan-200"
        >
          <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3 15.28a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.18 8.18 0 0 0 4.91 1.63V6.89a4.85 4.85 0 0 1-1-.2z" />
          </svg>
          Made by @cattw_gd
        </a>

        {/* Progress Bar & Status */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="h-1.5 w-44 overflow-hidden rounded-full border border-cyan-500/30 bg-slate-900/80 p-0.5">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 animate-pulse shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            INITIALIZING NDL...
          </span>
        </div>
      </div>
    </div>
  );
}
