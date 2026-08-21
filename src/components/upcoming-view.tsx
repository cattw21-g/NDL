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
import { cx, Eyebrow, MetricTile, SectionPanel, inputClass } from "@/components/ui";

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
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
        <div className="grid gap-4 border-b border-slate-300 bg-[linear-gradient(120deg,#ffffff_0%,#f0fdfa_100%)] p-5 dark:border-slate-700 dark:bg-[linear-gradient(120deg,#101722_0%,#09232c_100%)] lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Eyebrow icon={Hourglass} tone="cyan">
                Queue & Progress
              </Eyebrow>
              <span className="rounded-full border border-teal-500/30 bg-teal-50 px-2.5 py-0.5 text-xs font-black text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                Upcoming Nerfed Demons
              </span>
            </div>
            <h1 className="text-balance text-4xl font-black leading-tight text-slate-950 sm:text-5xl dark:text-slate-50">
              Upcoming Levels
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-300">
              Track nerfed demons in active verification or browse open levels waiting for a verifier to take them on.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <MetricTile
              icon={Flame}
              label="Verifying"
              value={currentlyVerifying.length}
              tone="amber"
            />
            <MetricTile
              icon={Hourglass}
              label="Waiting"
              value={waitingLevels.length}
              tone="cyan"
            />
          </div>
        </div>

        {/* Sub-Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-3 dark:bg-slate-950/70">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("verifying")}
              className={cx(
                "inline-flex min-h-9 items-center gap-2 rounded-md px-4 text-xs font-black transition",
                activeTab === "verifying"
                  ? "bg-amber-600 text-white shadow-sm dark:bg-amber-500 dark:text-slate-950"
                  : "bg-white text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
              )}
            >
              <Flame className="h-4 w-4" />
              Currently Verifying
              <span className="ml-1 rounded-full bg-black/20 px-1.5 py-0.2 text-[10px]">
                {currentlyVerifying.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("waiting")}
              className={cx(
                "inline-flex min-h-9 items-center gap-2 rounded-md px-4 text-xs font-black transition",
                activeTab === "waiting"
                  ? "bg-cyan-700 text-white shadow-sm dark:bg-cyan-500 dark:text-slate-950"
                  : "bg-white text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
              )}
            >
              <Hourglass className="h-4 w-4" />
              Waiting Levels
              <span className="ml-1 rounded-full bg-black/20 px-1.5 py-0.2 text-[10px]">
                {waitingLevels.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Link
                href="/admin/upcoming"
                className="inline-flex min-h-8 items-center gap-1 rounded border border-amber-400 bg-amber-50 px-3 text-xs font-black text-amber-900 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-950/60 dark:text-amber-200"
              >
                ⚙️ Admin Queue Manager
              </Link>
            ) : null}
            <Link
              href="/suggest-level"
              className="text-xs font-bold text-cyan-700 underline hover:text-cyan-800 dark:text-cyan-400"
            >
              Suggest a Level &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[18rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
              onClick={() => setSelectedDifficulty(diff)}
              className={cx(
                "rounded px-2.5 py-1 transition",
                selectedDifficulty === diff
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
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
            <SectionPanel key={lvl.id} className="flex flex-col justify-between p-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cx(
                          "rounded px-2 py-0.5 text-xs font-black",
                          activeTab === "verifying"
                            ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
                            : "bg-cyan-100 text-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300",
                        )}
                      >
                        {activeTab === "verifying" ? "CURRENTLY VERIFYING" : "WAITING FOR VICTOR"}
                      </span>
                      <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {lvl.difficulty}
                      </span>
                    </div>
                    <h2 className="mt-1.5 text-2xl font-black text-slate-950 dark:text-slate-50">
                      {lvl.name}
                    </h2>
                    <p className="text-xs font-bold text-slate-500">
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
                      className="text-xs"
                    />
                  ) : null}
                </div>

                {/* Info Box */}
                <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/40 sm:grid-cols-2">
                  <div>
                    <span className="font-bold text-slate-500">
                      {activeTab === "verifying" ? "Verifier:" : "Status:"}
                    </span>
                    <p className="font-black text-slate-900 dark:text-slate-100">
                      {lvl.verifier || "Open for Verification"}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Nerf Creator:</span>
                    <p className="font-black text-slate-900 dark:text-slate-100">
                      {lvl.nerfCreator}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Publisher:</span>
                    <p className="font-bold text-slate-700 dark:text-slate-300">
                      {lvl.publisher}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">GD Level ID:</span>
                    <p className="font-bold text-slate-700 dark:text-slate-300">
                      {lvl.gdLevelId || "Unreleased"}
                    </p>
                  </div>
                </div>

                {/* Video Showcase Player */}
                {lvl.showcaseUrl || lvl.verificationVideoUrl ? (
                  <div className="mt-3">
                    <span className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-400">
                      Showcase / Preview:
                    </span>
                    <LevelVideoEmbed
                      showcaseUrl={lvl.showcaseUrl}
                      verificationUrl={lvl.verificationVideoUrl}
                      levelName={lvl.name}
                    />
                  </div>
                ) : (
                  <div className="relative aspect-video overflow-hidden rounded-md border border-slate-200 dark:border-slate-800">
                    <SafeThumbnail
                      src={lvl.thumbnailUrl}
                      alt={lvl.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

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
                  {lvl.isSuggestion ? "View Suggestion Details &rarr;" : "View Level Details &rarr;"}
                </Link>

                {isAdmin ? (
                  <Link
                    href="/admin/upcoming"
                    className="inline-flex items-center gap-1 rounded bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200"
                  >
                    Manage / Promote &rarr;
                  </Link>
                ) : (
                  <Link
                    href="/submit"
                    className="inline-flex items-center gap-1 rounded bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300"
                  >
                    Submit Run
                  </Link>
                )}
              </div>
            </SectionPanel>
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
