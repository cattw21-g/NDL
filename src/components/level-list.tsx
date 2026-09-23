"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { LevelCard, type LevelCardLevel } from "@/components/level-card";
import { cx, EmptyState, inputClass, SectionPanel } from "@/components/ui";
import { useUserSubmissions } from "@/lib/use-user-submissions";

type SortMode = "rank" | "points" | "records" | "name";
type TabMode = "MAIN" | "EXTENDED" | "LEGACY" | "ALL";
type TierFilter = "ALL" | "TOP_10" | "TOP_50";

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
];

export function LevelList({ levels }: { levels: LevelCardLevel[] }) {
  const [query, setQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("q") ?? "";
  });
  const [tab, setTab] = useState<TabMode>(() => {
    if (typeof window === "undefined") return "MAIN";
    const val = new URLSearchParams(window.location.search).get("tab")?.toUpperCase();
    return val && ["MAIN", "EXTENDED", "LEGACY", "ALL"].includes(val) ? (val as TabMode) : "MAIN";
  });
  const [tier, setTier] = useState<TierFilter>(() => {
    if (typeof window === "undefined") return "ALL";
    const val = new URLSearchParams(window.location.search).get("tier")?.toUpperCase();
    return val && ["ALL", "TOP_10", "TOP_50"].includes(val) ? (val as TierFilter) : "ALL";
  });
  const [sort, setSort] = useState<SortMode>("rank");

  const tabButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const { submissionsBySlug, dismissedIds, dismissBadge } = useUserSubmissions();

  const updateUrlParams = useCallback((newTab: TabMode, newTier: TierFilter, newQuery: string) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (newTab !== "MAIN") url.searchParams.set("tab", newTab);
    else url.searchParams.delete("tab");

    if (newTier !== "ALL") url.searchParams.set("tier", newTier);
    else url.searchParams.delete("tier");

    if (newQuery.trim()) url.searchParams.set("q", newQuery.trim());
    else url.searchParams.delete("q");

    window.history.replaceState({}, "", url.toString());
  }, []);

  const handleTabKeyDown = (index: number, e: React.KeyboardEvent<HTMLButtonElement>) => {
    let nextIndex = index;
    if (e.key === "ArrowRight") {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    const nextTab = tabs[nextIndex].value;
    setTab(nextTab);
    const nextTier = nextTab === "EXTENDED" || nextTab === "LEGACY" ? "ALL" : tier;
    if (nextTab === "EXTENDED" || nextTab === "LEGACY") {
      setTier("ALL");
    }
    updateUrlParams(nextTab, nextTier, query);
    tabButtonRefs.current[nextIndex]?.focus();
  };

  const needle = query.trim().toLowerCase();
  const filtered = levels
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

  return (
    <SectionPanel className="overflow-hidden">
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {/* Primary Scope Tabs */}
        <div className="flex overflow-x-auto border-b border-zinc-200/80 p-2 sm:p-3 dark:border-zinc-800/80 [scrollbar-width:none]">
          <div role="tablist" aria-label="Level scopes" className="inline-flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
            {tabs.map((item, index) => {
              const isActive = tab === item.value;
              return (
                <button
                  key={item.value}
                  ref={(el) => {
                    tabButtonRefs.current[index] = el;
                  }}
                  type="button"
                  role="tab"
                  tabIndex={isActive ? 0 : -1}
                  aria-selected={isActive}
                  onKeyDown={(e) => handleTabKeyDown(index, e)}
                  onClick={() => {
                    setTab(item.value);
                    const nextTier = item.value === "EXTENDED" || item.value === "LEGACY" ? "ALL" : tier;
                    if (item.value === "EXTENDED" || item.value === "LEGACY") {
                      setTier("ALL");
                    }
                    updateUrlParams(item.value, nextTier, query);
                  }}
                  className={cx(
                    "rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-cyan-400",
                    isActive
                      ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search, Filter & Sort Bar */}
        <div className="flex flex-col gap-2.5 p-2.5 sm:flex-row sm:items-center sm:justify-between sm:p-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setQuery(nextQuery);
                updateUrlParams(tab, tier, nextQuery);
              }}
              placeholder="Search demons, creators, verifiers, GD ID..."
              aria-label="Search demons by name, creator, verifier, or GD ID"
              className={`${inputClass} w-full pl-9 text-xs sm:text-sm`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tier Filter Chips (only active on Main List or All) */}
            {(tab === "MAIN" || tab === "ALL") && (
              <div role="group" aria-label="Tier filter" className="inline-flex rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-900">
                {tierChips.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    aria-pressed={tier === chip.value}
                    onClick={() => {
                      setTier(chip.value);
                      updateUrlParams(tab, chip.value, query);
                    }}
                    className={cx(
                      "rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
                      tier === chip.value
                        ? "bg-white text-cyan-700 shadow-sm dark:bg-zinc-800 dark:text-cyan-400 font-bold"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            {/* Sort Select */}
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400" />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortMode)}
                aria-label="Sort demons by"
                className={`${inputClass} py-1 text-xs font-medium`}
              >
                <option value="rank">Rank</option>
                <option value="points">Points</option>
                <option value="records">Records</option>
                <option value="name">Name</option>
              </select>
            </div>

            <span className="text-xs font-medium text-zinc-400">
              {filtered.length} {filtered.length === 1 ? "demon" : "demons"}
            </span>
          </div>
        </div>
      </div>

      {/* Level Cards List */}
      <div className="space-y-3 bg-zinc-50/30 p-2.5 dark:bg-zinc-950/30 sm:p-3">
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
