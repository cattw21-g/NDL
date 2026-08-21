"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { cx } from "@/components/ui";

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied!",
  className,
  iconOnly = false,
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? copiedLabel : label}
      aria-label={copied ? copiedLabel : label}
      className={cx(
        "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border text-xs font-black transition focus:outline-none focus:ring-2 focus:ring-cyan-300",
        copied
          ? "border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300"
          : "border-slate-300 bg-white text-slate-700 hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950 dark:hover:text-cyan-100",
        iconOnly ? "h-9 w-9 px-0" : "px-3",
        className,
      )}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-50 duration-200" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {!iconOnly ? <span>{copied ? copiedLabel : label}</span> : null}
    </button>
  );
}
