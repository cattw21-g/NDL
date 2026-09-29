"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  GitCompareArrows,
  CheckCircle2,
  Columns2,
  FileText,
  Filter,
  Layers,
  Sparkles,
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  HelpCircle,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import { SectionPanel } from "@/components/ui";
import {
  type RuleVersion,
  computeSideBySideDiff,
  type SectionDiff,
} from "@/lib/rules-history";

export function RulesCompareView({
  versions,
  initialFromId,
  initialToId,
}: {
  versions: RuleVersion[];
  initialFromId?: string;
  initialToId?: string;
}) {
  const [fromId, setFromId] = useState<string>(
    initialFromId && versions.some((v) => v.id === initialFromId || v.version === initialFromId)
      ? initialFromId
      : versions[1]?.id || versions[0]?.id || "",
  );
  const [toId, setToId] = useState<string>(
    initialToId && versions.some((v) => v.id === initialToId || v.version === initialToId)
      ? initialToId
      : versions[0]?.id || "",
  );

  const [viewMode, setViewMode] = useState<"split" | "unified">("split");
  const [filterChangedOnly, setFilterChangedOnly] = useState<boolean>(true);

  const fromDoc = useMemo(
    () =>
      versions.find((v) => v.id === fromId || v.version === fromId) ||
      versions[1] ||
      versions[0],
    [versions, fromId],
  );

  const toDoc = useMemo(
    () =>
      versions.find((v) => v.id === toId || v.version === toId) ||
      versions[0],
    [versions, toId],
  );

  // Compute diff by section
  const sectionDiffs = useMemo(() => {
    if (!fromDoc || !toDoc) return [];
    return computeSideBySideDiff(fromDoc.content, toDoc.content);
  }, [fromDoc, toDoc]);

  const totalAdditions = useMemo(
    () => sectionDiffs.reduce((sum, s) => sum + s.additions, 0),
    [sectionDiffs],
  );
  const totalDeletions = useMemo(
    () => sectionDiffs.reduce((sum, s) => sum + s.deletions, 0),
    [sectionDiffs],
  );
  const changedSectionsCount = useMemo(
    () => sectionDiffs.filter((s) => s.hasChanges).length,
    [sectionDiffs],
  );

  const displayedSections = useMemo(() => {
    if (!filterChangedOnly) return sectionDiffs;
    return sectionDiffs.filter((s) => s.hasChanges);
  }, [sectionDiffs, filterChangedOnly]);

  // Quick preset helper
  const applyPreset = (fromVer: string, toVer: string) => {
    const f = versions.find((v) => v.version.startsWith(fromVer) || v.id.includes(fromVer));
    const t = versions.find((v) => v.version.startsWith(toVer) || v.id.includes(toVer));
    if (f) setFromId(f.id);
    if (t) setToId(t.id);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-b from-rose-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-400">
              <GitCompareArrows className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-wider">
                Revision Diff & Policy History
              </span>
            </div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Compare Rule Versions
            </h1>
            <p className="mt-2 max-w-2xl text-sm sm:text-base text-zinc-400">
              See exactly what was added, changed, or removed between Nerfed Demonlist guideline versions.
            </p>
          </div>
          <Link
            href="/rules"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-200 transition hover:bg-zinc-700 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Active Rules
          </Link>
        </div>

        {/* Quick Presets */}
        <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-zinc-800/80">
          <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 mr-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Common Comparisons:
          </span>
          <button
            type="button"
            onClick={() => applyPreset("v1.0", "v1.6")}
            className="rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1 text-xs font-bold text-zinc-200 transition hover:border-rose-500 hover:text-white"
          >
            v1.0 → v1.6 (All Changes Since Launch)
          </button>
          <button
            type="button"
            onClick={() => applyPreset("v1.5", "v1.6")}
            className="rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1 text-xs font-bold text-zinc-200 transition hover:border-rose-500 hover:text-white"
          >
            v1.5 → v1.6 (Microphone Audio & Progress Rules)
          </button>
          <button
            type="button"
            onClick={() => applyPreset("v1.0", "v1.5")}
            className="rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1 text-xs font-bold text-zinc-200 transition hover:border-rose-500 hover:text-white"
          >
            v1.0 → v1.5 (Unverified Demon Eligibility)
          </button>
        </div>
      </div>

      {/* Version Selector & View Options Toolbar */}
      <SectionPanel className="p-4 sm:p-5 border-zinc-800 bg-zinc-900/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                Before (Original Version):
              </label>
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="h-9 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-xs font-bold text-white focus:border-rose-500 focus:outline-none"
              >
                {versions.map((v) => (
                  <option key={`from-${v.id}`} value={v.id}>
                    {v.version} — {formatDate(v.publishedAt)} {v.isActive ? "(Active)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-5 text-zinc-500 font-black">
              &rarr;
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                After (New Version):
              </label>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="h-9 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-xs font-bold text-white focus:border-rose-500 focus:outline-none"
              >
                {versions.map((v) => (
                  <option key={`to-${v.id}`} value={v.id}>
                    {v.version} — {formatDate(v.publishedAt)} {v.isActive ? "(Active)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Metrics */}
            <div className="pt-5 flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 font-bold text-emerald-400">
                +{totalAdditions} added
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 font-bold text-rose-400">
                -{totalDeletions} removed
              </span>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
            {/* View Mode Toggle: Split vs Unified */}
            <div className="inline-flex rounded-lg border border-zinc-700 bg-zinc-950 p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode("split")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
                  viewMode === "split"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Columns2 className="h-3.5 w-3.5" />
                Side-by-Side
              </button>
              <button
                type="button"
                onClick={() => setViewMode("unified")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
                  viewMode === "unified"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Unified
              </button>
            </div>

            {/* Filter Toggle: Changed Sections vs Full Document */}
            <button
              type="button"
              onClick={() => setFilterChangedOnly(!filterChangedOnly)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                filterChangedOnly
                  ? "border-rose-500/50 bg-rose-500/10 text-rose-300"
                  : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-white"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              {filterChangedOnly ? "Showing Changed Sections" : "Showing Full Document"}
            </button>
          </div>
        </div>
      </SectionPanel>

      {/* EXECUTIVE SUMMARY: What Changed in this Version */}
      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-zinc-900/80 to-zinc-950 p-5 shadow-xl">
        <div className="flex items-center gap-2 border-b border-amber-500/20 pb-3">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <h2 className="text-base font-black text-white sm:text-lg">
            What Changed in {toDoc?.version || "this Version"}?
          </h2>
          <span className="ml-auto rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-500/30">
            {changedSectionsCount} {changedSectionsCount === 1 ? "Section Modified" : "Sections Modified"}
          </span>
        </div>

        <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
          {toDoc?.summary ||
            `Comparison between ${fromDoc?.version} (${formatDate(fromDoc?.publishedAt)}) and ${toDoc?.version} (${formatDate(toDoc?.publishedAt)}).`}
        </p>

        {toDoc?.keyChanges && toDoc.keyChanges.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {toDoc.keyChanges.map((change, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase text-amber-400 tracking-wide">
                      {change.section}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        change.type === "added"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : change.type === "modified"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {change.type === "added" ? (
                        <>
                          <PlusCircle className="h-3 w-3" /> New Rule
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3 w-3" /> Policy Change
                        </>
                      )}
                    </span>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-white leading-relaxed">
                    {change.description}
                  </p>
                </div>

                {change.beforeText && (
                  <div className="mt-3 space-y-1.5 pt-2.5 border-t border-zinc-800/80 text-[11px]">
                    <div className="text-rose-400/90 line-through">
                      <span className="font-bold">Before: </span>
                      {change.beforeText}
                    </div>
                    {change.afterText && (
                      <div className="text-emerald-400 font-medium">
                        <span className="font-bold">Now: </span>
                        {change.afterText}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* SECTION-BY-SECTION COMPARISON DISPLAY */}
      {displayedSections.length > 0 ? (
        <div className="space-y-6">
          {displayedSections.map((sec, secIdx) => (
            <div
              key={secIdx}
              className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl"
            >
              {/* Section Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/90 px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-white">
                    {sec.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {sec.hasChanges ? (
                    <>
                      {sec.additions > 0 && (
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-400 border border-emerald-500/20 text-[11px]">
                          +{sec.additions} added
                        </span>
                      )}
                      {sec.deletions > 0 && (
                        <span className="rounded bg-rose-500/10 px-2 py-0.5 font-bold text-rose-400 border border-rose-500/20 text-[11px]">
                          -{sec.deletions} removed
                        </span>
                      )}
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 font-black uppercase text-[10px] text-amber-400 border border-amber-500/20">
                        Modified
                      </span>
                    </>
                  ) : (
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-bold text-zinc-400">
                      Unchanged
                    </span>
                  )}
                </div>
              </div>

              {/* SIDE-BY-SIDE (SPLIT) VIEW */}
              {viewMode === "split" ? (
                <div>
                  {/* Split Column Headers */}
                  <div className="grid grid-cols-2 border-b border-zinc-800 text-[11px] font-bold uppercase tracking-wider">
                    <div className="border-r border-zinc-800 bg-rose-950/20 px-4 py-2 text-rose-400 flex items-center justify-between">
                      <span>Before: {fromDoc.version} ({formatDate(fromDoc.publishedAt)})</span>
                      <MinusCircle className="h-3.5 w-3.5 text-rose-400/60" />
                    </div>
                    <div className="bg-emerald-950/20 px-4 py-2 text-emerald-400 flex items-center justify-between">
                      <span>After: {toDoc.version} ({formatDate(toDoc.publishedAt)})</span>
                      <PlusCircle className="h-3.5 w-3.5 text-emerald-400/60" />
                    </div>
                  </div>

                  {/* Split Diff Rows */}
                  <div className="divide-y divide-zinc-900/60 font-mono text-xs">
                    {sec.rows.map((row, rIdx) => {
                      const isLeftRemoved = row.type === "removed" || row.type === "modified";
                      const isRightAdded = row.type === "added" || row.type === "modified";

                      return (
                        <div key={rIdx} className="grid grid-cols-2">
                          {/* Left Column (Old Version) */}
                          <div
                            className={`flex items-start gap-2 border-r border-zinc-800 p-2 break-words leading-relaxed ${
                              isLeftRemoved
                                ? "bg-rose-950/30 text-rose-200 border-l-2 border-l-rose-500"
                                : row.leftText
                                ? "text-zinc-300"
                                : "bg-zinc-950/50 text-transparent select-none"
                            }`}
                          >
                            <span className="w-5 shrink-0 select-none text-[10px] text-zinc-600 text-right">
                              {row.leftLineNumber ?? ""}
                            </span>
                            <span className="w-3 shrink-0 select-none font-bold text-rose-400">
                              {isLeftRemoved ? "-" : " "}
                            </span>
                            <span className="flex-1 break-words font-sans">
                              {row.leftText || (row.type === "added" ? "\u00A0" : "")}
                            </span>
                          </div>

                          {/* Right Column (New Version) */}
                          <div
                            className={`flex items-start gap-2 p-2 break-words leading-relaxed ${
                              isRightAdded
                                ? "bg-emerald-950/30 text-emerald-200 border-l-2 border-l-emerald-500 font-medium"
                                : row.rightText
                                ? "text-zinc-300"
                                : "bg-zinc-950/50 text-transparent select-none"
                            }`}
                          >
                            <span className="w-5 shrink-0 select-none text-[10px] text-zinc-600 text-right">
                              {row.rightLineNumber ?? ""}
                            </span>
                            <span className="w-3 shrink-0 select-none font-bold text-emerald-400">
                              {isRightAdded ? "+" : " "}
                            </span>
                            <span className="flex-1 break-words font-sans">
                              {row.rightText || (row.type === "removed" ? "\u00A0" : "")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* UNIFIED DIFF VIEW */
                <div className="divide-y divide-zinc-900/60 font-mono text-xs">
                  {sec.rows.map((row, rIdx) => {
                    const isMod = row.type === "modified";
                    const isAdd = row.type === "added";
                    const isRem = row.type === "removed";

                    return (
                      <div key={rIdx}>
                        {/* If modified, show removed line then added line */}
                        {(isRem || isMod) && row.leftText && (
                          <div className="flex items-start gap-3 bg-rose-950/40 p-2 text-rose-200 border-l-2 border-rose-500">
                            <span className="w-4 shrink-0 select-none text-center font-bold text-rose-400">
                              -
                            </span>
                            <span className="flex-1 break-words font-sans">
                              {row.leftText}
                            </span>
                          </div>
                        )}
                        {(isAdd || isMod) && row.rightText && (
                          <div className="flex items-start gap-3 bg-emerald-950/40 p-2 text-emerald-200 border-l-2 border-emerald-500 font-medium">
                            <span className="w-4 shrink-0 select-none text-center font-bold text-emerald-400">
                              +
                            </span>
                            <span className="flex-1 break-words font-sans">
                              {row.rightText}
                            </span>
                          </div>
                        )}
                        {row.type === "unchanged" && row.leftText && (
                          <div className="flex items-start gap-3 p-2 text-zinc-300 hover:bg-zinc-900/30">
                            <span className="w-4 shrink-0 select-none text-center text-zinc-600">
                              {" "}
                            </span>
                            <span className="flex-1 break-words font-sans">
                              {row.leftText}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-12 text-center text-zinc-400">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
          <h3 className="text-base font-bold text-white">No Differences Found</h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
            {fromDoc.version} and {toDoc.version} have identical rule text in these selected sections.
          </p>
        </div>
      )}

      {/* Explanatory Footer */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-400 flex items-start gap-3">
        <HelpCircle className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          The revision comparator aligns rule documents section-by-section. Highlighted lines with <span className="font-bold text-rose-400">(-)</span> were present in the earlier base version, while lines with <span className="font-bold text-emerald-400">(+)</span> are new additions or amendments.
        </p>
      </div>
    </div>
  );
}
