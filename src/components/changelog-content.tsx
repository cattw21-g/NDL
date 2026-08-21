import React from "react";
import { CheckCircle2, Sparkles, Zap } from "lucide-react";

import { cx } from "@/components/ui";

const TAG_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  NEW: {
    label: "NEW",
    bg: "bg-emerald-100 dark:bg-emerald-950/60",
    text: "text-emerald-800 dark:text-emerald-300",
    border: "border-emerald-300 dark:border-emerald-700",
  },
  FEATURE: {
    label: "FEATURE",
    bg: "bg-indigo-100 dark:bg-indigo-950/60",
    text: "text-indigo-800 dark:text-indigo-300",
    border: "border-indigo-300 dark:border-indigo-700",
  },
  IMPROVED: {
    label: "IMPROVED",
    bg: "bg-cyan-100 dark:bg-cyan-950/60",
    text: "text-cyan-800 dark:text-cyan-300",
    border: "border-cyan-300 dark:border-cyan-700",
  },
  QOL: {
    label: "QUALITY OF LIFE",
    bg: "bg-amber-100 dark:bg-amber-950/60",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-700",
  },
  LEADERBOARD: {
    label: "LEADERBOARD",
    bg: "bg-amber-100 dark:bg-amber-950/60",
    text: "text-amber-900 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-700",
  },
  PROMETHEUS: {
    label: "SYSTEM",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-800 dark:text-slate-200",
    border: "border-slate-300 dark:border-slate-700",
  },
  VIDEO: {
    label: "VIDEO",
    bg: "bg-rose-100 dark:bg-rose-950/60",
    text: "text-rose-800 dark:text-rose-300",
    border: "border-rose-300 dark:border-rose-700",
  },
  PROFILE: {
    label: "PROFILES",
    bg: "bg-purple-100 dark:bg-purple-950/60",
    text: "text-purple-800 dark:text-purple-300",
    border: "border-purple-300 dark:border-purple-700",
  },
  SPEED: {
    label: "SPEED",
    bg: "bg-teal-100 dark:bg-teal-950/60",
    text: "text-teal-800 dark:text-teal-300",
    border: "border-teal-300 dark:border-teal-700",
  },
};

function renderFormattedInline(text: string): React.ReactNode {
  // Parse **bold** text
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong
          key={index}
          className="font-black text-slate-950 dark:text-slate-100"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

type ParsedLine =
  | { type: "tag-item"; tag: string; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "bullet"; text: string }
  | { type: "numbered"; num: string; text: string }
  | { type: "paragraph"; text: string };

function parseLine(line: string): ParsedLine {
  const trimmed = line.trim();

  // Match tag prefixes like [NEW], [IMPROVED], [FEATURE], [QOL]
  const tagMatch = trimmed.match(/^\[([A-Z_]+)\]\s*(.*)$/);
  if (tagMatch) {
    const tagKey = tagMatch[1].toUpperCase();
    const rest = tagMatch[2];
    return { type: "tag-item", tag: tagKey, text: rest };
  }

  // Heading 2 or 3
  if (trimmed.startsWith("### ")) {
    return { type: "h3", text: trimmed.replace(/^###\s*/, "") };
  }
  if (trimmed.startsWith("## ")) {
    return { type: "h2", text: trimmed.replace(/^##\s*/, "") };
  }

  // Bullet point
  if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
    return { type: "bullet", text: trimmed.replace(/^[-*]\s*/, "") };
  }

  // Numbered item (e.g. "1. ")
  const numMatch = trimmed.match(/^(\d+)\.\s*(.*)$/);
  if (numMatch) {
    return { type: "numbered", num: numMatch[1], text: numMatch[2] };
  }

  return { type: "paragraph", text: trimmed };
}

export function ChangelogContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-4">
      {lines.map((rawLine, index) => {
        if (!rawLine.trim()) {
          return null;
        }

        const parsed = parseLine(rawLine);

        if (parsed.type === "h2") {
          return (
            <div
              key={index}
              className="mt-6 flex items-center gap-2 border-b border-slate-300 pb-2 first:mt-0 dark:border-slate-700"
            >
              <Sparkles className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-xl font-black text-slate-950 dark:text-slate-50 sm:text-2xl">
                {parsed.text}
              </h2>
            </div>
          );
        }

        if (parsed.type === "h3") {
          return (
            <h3
              key={index}
              className="mt-4 text-lg font-black text-slate-900 dark:text-slate-100"
            >
              {parsed.text}
            </h3>
          );
        }

        if (parsed.type === "tag-item") {
          const config = TAG_CONFIG[parsed.tag] || {
            label: parsed.tag,
            bg: "bg-cyan-100 dark:bg-cyan-950/60",
            text: "text-cyan-800 dark:text-cyan-300",
            border: "border-cyan-300 dark:border-cyan-700",
          };

          return (
            <div
              key={index}
              className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cx(
                    "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-black tracking-wider uppercase border",
                    config.bg,
                    config.text,
                    config.border,
                  )}
                >
                  <Zap className="h-3 w-3" />
                  {config.label}
                </span>
              </div>
              <div className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300 sm:text-base">
                {renderFormattedInline(parsed.text)}
              </div>
            </div>
          );
        }

        if (parsed.type === "bullet") {
          return (
            <div key={index} className="flex items-start gap-2.5 pl-2">
              <CheckCircle2 className="h-4 w-4 mt-1 shrink-0 text-cyan-600 dark:text-cyan-400" />
              <div className="text-sm leading-7 text-slate-700 dark:text-slate-300 sm:text-base">
                {renderFormattedInline(parsed.text)}
              </div>
            </div>
          );
        }

        if (parsed.type === "numbered") {
          return (
            <div key={index} className="flex items-start gap-3 pl-1">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-black text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300">
                {parsed.num}
              </span>
              <div className="text-sm leading-7 text-slate-700 dark:text-slate-300 sm:text-base">
                {renderFormattedInline(parsed.text)}
              </div>
            </div>
          );
        }

        return (
          <p
            key={index}
            className="text-sm leading-7 text-slate-700 dark:text-slate-300 sm:text-base"
          >
            {renderFormattedInline(parsed.text)}
          </p>
        );
      })}
    </div>
  );
}
