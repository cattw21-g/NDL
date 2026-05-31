"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import { LevelCard, type LevelCardLevel } from "@/components/level-card";
import { cx, EmptyState, inputClass, SectionPanel } from "@/components/ui";

type SortMode = "rank" | "points" | "records" | "name";
type TabMode = "RANKED" | "LEGACY" | "ALL";

const tabs: Array<{ value: TabMode; label: string }> = [
  { value: "RANKED", label: "Ranked List" },
  { value: "LEGACY", label: "Legacy" },
  { value: "ALL", label: "All Entries" },
];

export function LevelList({ levels }: { levels: LevelCardLevel[] }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabMode>("RANKED");
  const [sort, setSort] = useState<SortMode>("rank");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return levels
      .filter((level) => {
        const matchesTab = tab === "ALL" || level.status === tab;
        const haystack = [
          level.name,
          level.originalName,
          level.nerfCreator,
          level.verifier,
          level.publisher,
        ]
          .join(" ")
          .toLowerCase();

        return matchesTab && (!needle || haystack.includes(needle));
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
  }, [levels, query, tab, sort]);

  return (
    <SectionPanel className="overflow-hidden">
      <div className="border-b border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950/60">
        <div className="flex flex-wrap gap-1.5 px-3 pt-3">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={cx(
                "min-h-9 rounded-t-md border border-b-0 px-4 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-cyan-300",
                tab === item.value
                  ? "border-slate-300 bg-white text-cyan-900 shadow-[inset_0_3px_0_#0891b2] dark:border-slate-700 dark:bg-slate-900 dark:text-cyan-100"
                  : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 p-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search levels, originals, creators, verifiers"
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
      </div>

      <div className="space-y-2 bg-white p-2.5 dark:bg-slate-950/30 sm:p-3">
        {filtered.length > 0 ? (
          filtered.map((level) => <LevelCard key={level.slug} level={level} />)
        ) : (
          <EmptyState
            title="No levels match"
            description="Adjust the search, tab, or sort to bring more entries back into view."
          />
        )}
      </div>
    </SectionPanel>
  );
}
