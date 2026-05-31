"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-cyan-800 bg-cyan-800 px-4 py-2 text-sm font-black text-white shadow-[0_6px_14px_rgba(15,23,42,0.16)] transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 dark:focus:ring-cyan-500/40 ${className}`}
    >
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
