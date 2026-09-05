"use client";

import {
  Flame,
  Hourglass,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { CopyButton } from "@/components/copy-button";
import { LevelVideoEmbed } from "@/components/level-video-embed";
import { SafeThumbnail } from "@/components/safe-thumbnail";
import { cx, SectionPanel, inputClass } from "@/components/ui";

export type UpcomingLevelItem = {
  id: string;
  name: string;
  originalName: string;
  slug: string;
  gdLevelId?: string | null;
  publisher: string;
  nerfCreator: string;
  verifier: string;
  verifierUserId?: string | null;
  showcaseUrl?: string | null;
  verificationVideoUrl?: string | null;
  thumbnailUrl: string;
  difficulty: string;
  description?: string | null;
  versionNotes?: string | null;
  isSuggestion?: boolean;
  submitterName?: string | null;
};

export function UpcomingView({
  currentlyVerifying,
  waitingLevels,
  isAdmin,
}: {
  currentlyVerifying: UpcomingLevelItem[];
  waitingLevels: UpcomingLevelItem[];
  isAdmin: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"verifying" | "waiting">("verifying");
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");

  const currentList = activeTab === "verifying" ? currentlyVerifying : waitingLevels;

  const filteredList = useMemo(() => {
    return currentList.filter((item) => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.originalName.toLowerCase().includes(search.toLowerCase()) ||
        item.verifier.toLowerCase().includes(search.toLowerCase()) ||
        item.nerfCreator.toLowerCase().includes(search.toLowerCase()) ||
        (item.gdLevelId && item.gdLevelId.includes(search));

      const matchesDifficulty =
        selectedDifficulty === "ALL" || item.difficulty === selectedDifficulty;

      return matchesSearch && matchesDifficulty;
    });
  }, [currentList, search, selectedDifficulty]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Queue & In-Verification
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Upcoming Nerfed Demons
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-zinc-400">
            Track nerfed demons in active verification or browse open levels waiting for a verifier to take them on.
          </p>

          {/* Quick Metrics */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-2xl">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Currently Verifying</span>
              <p className="mt-1 text-xl font-bold text-amber-400">{currentlyVerifying.length}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Waiting for Verifier</span>
              <p className="mt-1 text-xl font-bold text-emerald-400">{waitingLevels.length}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Total in Pipeline</span>
              <p className="mt-1 text-xl font-bold text-white">{currentlyVerifying.length + waitingLevels.length}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Verification Status</span>
              <p className="mt-1 text-base font-bold text-cyan-400">Open Roster</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("verifying")}
            className={cx(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all",
              activeTab === "verifying"
                ? "bg-amber-600 text-white shadow-md shadow-amber-500/25 border border-amber-500/50"
                : "border border-zinc-300 bg-white text-zinc-700 hover:border-amber-400 hover:text-amber-900 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white",
            )}
          >
            <Flame className="h-4 w-4 text-amber-400" />
            Currently Verifying ({currentlyVerifying.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("waiting")}
            className={cx(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all",
              activeTab === "waiting"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25 border border-emerald-500/50"
                : "border border-zinc-300 bg-white text-zinc-700 hover:border-emerald-400 hover:text-emerald-900 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white",
            )}
          >
            <Hourglass className="h-4 w-4 text-emerald-400" />
            Waiting Levels ({waitingLevels.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin ? (
            <Link
              href="/admin/upcoming"
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              Admin Queue Manager
            </Link>
          ) : null}
          <Link
            href="/suggest-level"
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition-colors"
          >
            Suggest a Level →
          </Link>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[18rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab === "verifying" ? "verifying" : "waiting"} levels by name, player, or GD ID...`}
            className={`${inputClass} w-full pl-9`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          {["ALL", "EXTREME", "MYTHIC", "ADVANCED", "ENTRY"].map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => setSelectedDifficulty(diff)}
              className={cx(
                "rounded-lg border px-3 py-1.5 transition-all",
                selectedDifficulty === diff
                  ? "border-cyan-500 bg-cyan-600 text-white shadow-sm dark:bg-cyan-500 dark:text-zinc-950"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-cyan-300 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-zinc-700",
              )}
            >
              {diff === "ALL" ? "All Tiers" : diff}
            </button>
          ))}
        </div>
      </div>

      {/* Cards List */}
      {filteredList.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredList.map((lvl) => (
            <UpcomingCard
              key={lvl.id}
              lvl={lvl}
              activeTab={activeTab}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        <SectionPanel className="p-12 text-center">
          <Hourglass className="mx-auto h-12 w-12 text-slate-400" />
          <h2 className="mt-4 text-xl font-black text-slate-950 dark:text-slate-50">
            {activeTab === "verifying"
              ? "No Levels Currently in Verification"
              : "No Waiting Levels Right Now"}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {activeTab === "verifying"
              ? "Check the 'Waiting Levels' tab to see open nerfed demons waiting for a verifier!"
              : "All approved nerfed demons currently have assigned verifiers!"}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => setActiveTab(activeTab === "verifying" ? "waiting" : "verifying")}
              className="inline-flex min-h-9 items-center justify-center rounded-md bg-cyan-700 px-4 text-xs font-black text-white hover:bg-cyan-800 dark:bg-cyan-500 dark:text-slate-950"
            >
              Switch to {activeTab === "verifying" ? "Waiting Levels" : "Currently Verifying"}
            </button>
            <Link
              href="/suggest-level"
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Suggest a Level
            </Link>
          </div>
        </SectionPanel>
      )}
    </div>
  );
}

function UpcomingCard({
  lvl,
  activeTab,
  isAdmin,
}: {
  lvl: UpcomingLevelItem;
  activeTab: "verifying" | "waiting";
  isAdmin: boolean;
}) {
  const hasVideo = Boolean(lvl.showcaseUrl || lvl.verificationVideoUrl);
  const [showVideo, setShowVideo] = useState(false);

  return (
    <SectionPanel className="group flex flex-col justify-between overflow-hidden p-5 transition hover:border-cyan-500/60 dark:hover:border-cyan-500/50">
      <div className="space-y-3">
        {/* Media Banner: Thumbnail Image with Video Toggle */}
        <div className="relative aspect-video w-full overflow-hidden rounded-md border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950">
          {showVideo && hasVideo ? (
            <div className="h-full w-full">
              <LevelVideoEmbed
                showcaseUrl={lvl.showcaseUrl}
                verificationUrl={lvl.verificationVideoUrl}
                levelName={lvl.name}
              />
            </div>
          ) : (
            <>
              <SafeThumbnail
                src={lvl.thumbnailUrl}
                alt={`${lvl.name} thumbnail`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />

              {/* Status & Tier Badges Overlaid on Thumbnail */}
              <div className="absolute left-2.5 top-2.5 flex flex-wrap items-center gap-1.5">
                <span
                  className={cx(
                    "rounded px-2 py-0.5 text-[11px] font-black shadow-sm",
                    activeTab === "verifying"
                      ? "bg-amber-500 text-slate-950"
                      : "bg-cyan-500 text-slate-950",
                  )}
                >
                  {activeTab === "verifying" ? "CURRENTLY VERIFYING" : "WAITING FOR VICTOR"}
                </span>
                <span className="rounded bg-slate-900/80 px-2 py-0.5 text-[11px] font-black text-white backdrop-blur-sm">
                  {lvl.difficulty}
                </span>
              </div>
            </>
          )}

          {/* Video Toggle Button */}
          {hasVideo ? (
            <div className="absolute bottom-2.5 right-2.5 z-10">
              <button
                type="button"
                onClick={() => setShowVideo(!showVideo)}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-950/85 px-2.5 py-1 text-xs font-black text-white shadow-md backdrop-blur transition hover:bg-cyan-600 hover:text-white"
              >
                {showVideo ? "🖼️ View Image" : "▶️ Watch Video"}
              </button>
            </div>
          ) : null}
        </div>

        {/* Level Title & GD Level ID */}
        <div className="flex flex-wrap items-start justify-between gap-2 pt-1">
          <div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-slate-50">
              {lvl.name}
            </h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Nerfed version of{" "}
              <span className="text-slate-800 dark:text-slate-200">
                {lvl.originalName}
              </span>
            </p>
          </div>

          {lvl.gdLevelId ? (
            <CopyButton
              text={lvl.gdLevelId}
              label={`GD: ${lvl.gdLevelId}`}
              className="text-xs font-mono"
            />
          ) : null}
        </div>

        {/* Info Box */}
        <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/40 sm:grid-cols-2">
          <div>
            <span className="font-bold text-slate-500 dark:text-slate-400">
              {activeTab === "verifying" ? "Verifier:" : "Status:"}
            </span>
            <p className="font-black text-slate-900 dark:text-slate-100">
              {lvl.verifier || "Open for Verification"}
            </p>
          </div>
          <div>
            <span className="font-bold text-slate-500 dark:text-slate-400">Nerf Creator:</span>
            <p className="font-black text-slate-900 dark:text-slate-100">
              {lvl.nerfCreator}
            </p>
          </div>
          <div>
            <span className="font-bold text-slate-500 dark:text-slate-400">Publisher:</span>
            <p className="font-bold text-slate-700 dark:text-slate-300">
              {lvl.publisher}
            </p>
          </div>
          <div>
            <span className="font-bold text-slate-500 dark:text-slate-400">GD Level ID:</span>
            <p className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {lvl.gdLevelId || "Unreleased"}
            </p>
          </div>
        </div>

        {lvl.description ? (
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            {lvl.description}
          </p>
        ) : null}
      </div>

      {/* Card Footer Actions */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
        <Link
          href={lvl.isSuggestion ? "/level-suggestions" : `/levels/${lvl.slug}`}
          className="inline-flex items-center gap-1 text-xs font-black text-cyan-700 hover:text-cyan-800 dark:text-cyan-400"
        >
          {lvl.isSuggestion ? "View Suggestion Details →" : "View Level Details →"}
        </Link>

        {isAdmin ? (
          <div className="flex items-center gap-2">
            <Link
              href="/admin/upcoming"
              className="inline-flex items-center gap-1 rounded bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200"
            >
              Manage →
            </Link>
          </div>
        ) : null}
      </div>
    </SectionPanel>
  );
}
