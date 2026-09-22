"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home, Shield } from "lucide-react";
import Link from "next/link";
import { SectionPanel } from "@/components/ui";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected runtime errors for diagnostics
    console.error("NDL Application Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="grid min-h-[55vh] place-items-center px-4 py-8">
      <SectionPanel className="max-w-xl w-full p-6 sm:p-8 text-center border-rose-300 dark:border-rose-900/60 shadow-xl">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl border border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-600/40 dark:bg-rose-950/40 dark:text-rose-300 shadow-sm">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h1 className="mt-4 text-2xl sm:text-3xl font-black text-slate-950 dark:text-slate-50 tracking-tight">
          System Temporarily Unavailable
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
          An unexpected error occurred while processing this request. Your data and progress remain safe.
        </p>

        {error.digest ? (
          <div className="mt-3 inline-block rounded-md bg-slate-100 dark:bg-slate-900 px-2.5 py-1 text-xs font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
            Reference ID: {error.digest}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-cyan-700 px-5 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>

          <Link
            href="/"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-500"
          >
            <Home className="h-4 w-4" />
            Ranked List
          </Link>

          <Link
            href="/rules"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-500"
          >
            <Shield className="h-4 w-4" />
            Rules
          </Link>
        </div>
      </SectionPanel>
    </div>
  );
}
