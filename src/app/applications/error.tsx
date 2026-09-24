"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ApplicationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Applications error boundary:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl border border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-600/40 dark:bg-amber-950/40 dark:text-amber-300 shadow-sm">
        <AlertCircle className="h-7 w-7" />
      </div>

      <h1 className="mt-4 text-2xl font-black text-slate-950 dark:text-slate-50 tracking-tight">
        Applications Temporarily Unavailable
      </h1>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
        The application system is experiencing a temporary connection issue. This usually resolves within a few minutes. Your data and any saved drafts are safe.
      </p>

      {error.digest && (
        <div className="mt-3 inline-block rounded-md bg-slate-100 dark:bg-slate-900 px-2.5 py-1 text-xs font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
          Reference: {error.digest}
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-cyan-700 px-5 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </button>

        <Link
          href="/"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to List
        </Link>
      </div>
    </div>
  );
}
