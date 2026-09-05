"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import { LevelCard, type LevelCardLevel } from "@/components/level-card";
import { cx, EmptyState, inputClass, SectionPanel } from "@/components/ui";
import { useUserSubmissions } from "@/lib/use-user-submissions";

type SortMode = "rank" | "points" | "records" | "name";
type TabMode = "MAIN" | "EXTENDED" | "LEGACY" | "ALL";
type TierFilter = "ALL" | "TOP_10" | "TOP_50" | "EXTREME" | "INSANE";

const tabs: Array<{ value: TabMode; label: string }> = [
  { value: "MAIN", label: "Main List (#1–75)" },
  { value: "EXTENDED", label: "Extended List (#76–150)" },
  { value: "LEGACY", label: "Legacy" },
  { value: "ALL", label: "All Demons" },
];

const tierChips: Array<{ value: TierFilter; label: string }> = [
  { value: "ALL", label: "All Tiers" },
  { value: "TOP_10", label: "Top 10" },
  { value: "TOP_50", label: "Top 50" },
  { value: "EXTREME", label: "Extreme Nerfed" },
  { value: "INSANE", label: "Insane Nerfed" },
];

export function LevelList({ levels }: { levels: LevelCardLevel[] }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabMode>("MAIN");
  const [tier, setTier] = useState<TierFilter>("ALL");
  const [sort, setSort] = useState<SortMode>("rank");

  const { submissionsBySlug, dismissedIds, dismissBadge } = useUserSubmissions();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return levels
      .filter((level) => {
        let matchesTab = true;
        if (tab === "MAIN") {
          matchesTab =
            level.status === "RANKED" &&
            level.rank !== null &&
            level.rank <= 75;
        } else if (tab === "EXTENDED") {
          matchesTab =
            level.status === "RANKED" &&
            level.rank !== null &&
            level.rank > 75 &&
            level.rank <= 150;
        } else if (tab === "LEGACY") {
          matchesTab =
            level.status === "LEGACY" ||
            (level.rank !== null && level.rank > 150);
        }

        let matchesTier = true;
        if (tier === "TOP_10") {
          matchesTier = level.rank !== null && level.rank <= 10;
        } else if (tier === "TOP_50") {
          matchesTier = level.rank !== null && level.rank <= 50;
        } else if (tier === "EXTREME") {
          matchesTier = level.difficulty === "EXTREME_NERFED";
        } else if (tier === "INSANE") {
          matchesTier = level.difficulty === "INSANE_NERFED";
        }

        const haystack = [
          level.name,
          level.originalName,
          level.nerfCreator,
          level.verifier,
          level.publisher,
          level.gdLevelId,
        ]
          .join(" ")
          .toLowerCase();

        return matchesTab && matchesTier && (!needle || haystack.includes(needle));
      })
      .toSorted((a, b) => {
        if (sort === "points") {
          return b.points - a.points;
        }
        if (sort === "records") {
          return (b._count?.records ?? 0) - (a._count?.records ?? 0);
        }
        if (sort === "name") {
          return a.name.localeCompare(b.name);
        }

        return (a.rank ?? 9999) - (b.rank ?? 9999);
      });
  }, [levels, query, tab, tier, sort]);

  return (
    <SectionPanel className="overflow-hidden">
      <div className="border-b border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950/60">
        {/* Main List Tier Filter (Matching Country & Creator Rankings) */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-100/70 p-3 dark:border-slate-800 dark:bg-slate-950/70">
          {tabs.map((item) => {
            const isActive = tab === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setTab(item.value)}
                className={cx(
                  "rounded-lg px-4 py-2 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-cyan-300",
                  isActive
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/25 border border-cyan-500/50"
                    : "border border-slate-300 bg-white text-slate-700 hover:border-cyan-400 hover:text-cyan-900 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="grid gap-3 p-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search levels, originals, creators, verifiers, GD ID"
              className={`${inputClass} w-full pl-9`}
            />
          </label>
          <label className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-cyan-700" />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortMode)}
              className={inputClass}
            >
              <option value="rank">Sort by rank</option>
              <option value="points">Sort by points</option>
              <option value="records">Sort by records</option>
              <option value="name">Sort by name</option>
            </select>
          </label>
        </div>

        {/* Difficulty Quick Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/60 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-slate-500 mr-1">Difficulty:</span>
            {tierChips.map((chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => setTier(chip.value)}
                className={cx(
                  "rounded-md border px-2.5 py-1 text-xs font-bold transition-all",
                  tier === chip.value
                    ? "border-cyan-500 bg-cyan-600 text-white shadow-sm dark:bg-cyan-500 dark:text-slate-950"
                    : "border-slate-300 bg-white text-slate-700 hover:border-cyan-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700",
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <span className="font-bold text-slate-500 dark:text-slate-400">
            Showing {filtered.length} of {levels.length} {levels.length === 1 ? "level" : "levels"}
          </span>
        </div>
      </div>

      {/* Level Cards List */}
      <div className="space-y-2 bg-white p-2.5 dark:bg-slate-950/30 sm:p-3">
        {filtered.length > 0 ? (
          filtered.map((level) => {
            const userSub = submissionsBySlug[level.slug];
            const isDismissed = userSub ? dismissedIds.has(userSub.id) : false;

            return (
              <LevelCard
                key={level.slug}
                level={level}
                userSubmission={userSub}
                isDismissed={isDismissed}
                onDismiss={dismissBadge}
              />
            );
          })
        ) : (
          <EmptyState
            title="No levels match"
            description="Adjust the search, tier filter, or tab to bring more entries back into view."
          />
        )}
      </div>
    </SectionPanel>
  );
}
