"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem("ndl_splash_seen");
    if (hasSeen) return;

    sessionStorage.setItem("ndl_splash_seen", "true");
    const showTimer = setTimeout(() => {
      setMounted(true);
    }, 0);

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1100);

    const hideTimer = setTimeout(() => {
      setMounted(false);
    }, 1500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#080c13] text-white transition-opacity duration-400 select-none ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background glow */}
      <div className="absolute h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="absolute h-48 w-48 rounded-full bg-teal-500/10 blur-2xl -translate-y-6" />

      {/* Centered Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 animate-in fade-in zoom-in-95 duration-500">
        {/* Glowing NDL Cube Logo */}
        <div className="relative mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-cyan-400/60 bg-gradient-to-br from-cyan-900 to-slate-950 p-2 shadow-[0_0_40px_rgba(6,182,212,0.4)]">
          <Image
            src="/logo.png"
            alt="NDL Logo"
            width={64}
            height={64}
            className="h-full w-full object-contain"
            priority
          />
        </div>

        <h1 className="text-3xl font-black uppercase tracking-wider text-slate-50 sm:text-4xl">
          Nerfed Demonlist
        </h1>

        <p className="mt-2 text-sm font-bold text-cyan-400">
          Made by{" "}
          <a
            href="https://www.tiktok.com/@cattw_gd"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-cyan-300"
          >
            @cattw_gd
          </a>
        </p>

        {/* Minimal Progress Bar */}
        <div className="mt-6 h-1 w-36 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-full origin-left bg-gradient-to-r from-cyan-400 to-teal-300 animate-[pulse_1s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
