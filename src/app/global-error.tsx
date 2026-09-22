"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("NDL Global Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#080c13] text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full rounded-2xl border border-rose-900/60 bg-zinc-900/90 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-rose-500/40 bg-rose-950/50 text-rose-300 text-2xl">
            ⚠️
          </div>
          <h1 className="text-2xl font-black text-white">Nerfed Demonlist</h1>
          <p className="mt-2 text-sm text-zinc-400">
            A critical system error occurred. Please refresh or try again.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 focus:outline-none"
            >
              Reload application
            </button>
            <Link
              href="/"
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-bold text-zinc-200 transition hover:bg-zinc-700"
            >
              Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
