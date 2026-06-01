"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

export function CooldownSubmitButton({
  children,
  cooldownSeconds,
  className = "",
}: {
  children: React.ReactNode;
  cooldownSeconds: number;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setRemainingSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [remainingSeconds]);

  const coolingDown = remainingSeconds > 0;

  return (
    <button
      type="submit"
      disabled={pending || coolingDown}
      onClick={() => setRemainingSeconds(cooldownSeconds)}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-cyan-800 bg-cyan-800 px-4 py-2 text-sm font-black text-white shadow-[0_6px_14px_rgba(15,23,42,0.16)] transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 dark:focus:ring-cyan-500/40 ${className}`}
    >
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {coolingDown ? `Please wait ${remainingSeconds}s` : children}
    </button>
  );
}
