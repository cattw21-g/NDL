"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowUpDown, Search, Video, Filter } from "lucide-react";
import { formatDate } from "@/lib/format";

export type CompletionItem = {
  id: string;
  level: {
    id: string;
    name: string;
    slug: string;
    rank: number | null;
    status: string;
  };
  currentPoints: number;
  progress: number;
  fps: number;
  cbfUsed: boolean;
  isVerifier: boolean;
  videoUrl?: string | null;
  acceptedAt: string | Date;
};

type SortKey = "rank_asc" | "rank_desc" | "points_desc" | "date_desc" | "date_asc" | "name_asc";
type FilterCategory = "all" | "main" | "extended" | "legacy";

export function PlayerCompletionsList({
  completions,
}: {
  completions: CompletionItem[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("rank_asc");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAndSorted = useMemo(() => {
    let list = [...completions];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((r) => r.level.name.toLowerCase().includes(q));
    }

    // Filter by list tier
    if (filterCategory === "main") {
      list = list.filter((r) => r.level.rank !== null && r.level.rank >= 1 && r.level.rank <= 75);
    } else if (filterCategory === "extended") {
      list = list.filter((r) => r.level.rank !== null && r.level.rank >= 76 && r.level.rank <= 150);
    } else if (filterCategory === "legacy") {
      list = list.filter((r) => r.level.status === "LEGACY" || (r.level.rank !== null && r.level.rank > 150));
    }

    // Sort
    list.sort((a, b) => {
      if (sortKey === "rank_asc") {
        const rankA = a.level.rank ?? 9999;
        const rankB = b.level.rank ?? 9999;
        return rankA - rankB;
      }
      if (sortKey === "rank_desc") {
        const rankA = a.level.rank ?? 9999;
        const rankB = b.level.rank ?? 9999;
        return rankB - rankA;
      }
      if (sortKey === "points_desc") {
        return b.currentPoints - a.currentPoints;
      }
      if (sortKey === "date_desc") {
        return new Date(b.acceptedAt).getTime() - new Date(a.acceptedAt).getTime();
      }
      if (sortKey === "date_asc") {
        return new Date(a.acceptedAt).getTime() - new Date(b.acceptedAt).getTime();
      }
      if (sortKey === "name_asc") {
        return a.level.name.localeCompare(b.level.name);
      }
      return 0;
    });

    return list;
  }, [completions, sortKey, filterCategory, searchQuery]);

  const totalPoints = filteredAndSorted.reduce((sum, r) => sum + r.currentPoints, 0);

  return (
    <section className="space-y-3">
      {/* Header with Title & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-slate-50">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            100% Completions ({filteredAndSorted.length})
          </h2>
          <p className="text-xs font-bold text-slate-500">
            {totalPoints} Total Points
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search demon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-white pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortKey}
              aria-label="Sort completions"
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs font-bold text-slate-700 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="rank_asc">Sort: List Rank (Highest first)</option>
              <option value="rank_desc">Sort: List Rank (Lowest first)</option>
              <option value="points_desc">Sort: Points (Highest first)</option>
              <option value="date_desc">Sort: Completion Date (Newest first)</option>
              <option value="date_asc">Sort: Completion Date (Oldest first)</option>
              <option value="name_asc">Sort: Demon Name (A–Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
        <button
          type="button"
          onClick={() => setFilterCategory("all")}
          className={`rounded-md px-2.5 py-1 transition ${
            filterCategory === "all"
              ? "bg-cyan-700 text-white dark:bg-cyan-600"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          All ({completions.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory("main")}
          className={`rounded-md px-2.5 py-1 transition ${
            filterCategory === "main"
              ? "bg-amber-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          Main List (#1–75)
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory("extended")}
          className={`rounded-md px-2.5 py-1 transition ${
            filterCategory === "extended"
              ? "bg-cyan-700 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          Extended (#76–150)
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory("legacy")}
          className={`rounded-md px-2.5 py-1 transition ${
            filterCategory === "legacy"
              ? "bg-slate-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          Legacy
        </button>
      </div>

      {/* Completions List */}
      {filteredAndSorted.length > 0 ? (
        <div className="divide-y divide-slate-200 rounded-lg border border-slate-300 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-900">
          {filteredAndSorted.map((record, index) => (
            <div
              key={record.id}
              className="grid gap-3 p-4 transition hover:bg-slate-50 sm:grid-cols-[3rem_minmax(0,1fr)_6rem_6rem_auto] sm:items-center dark:hover:bg-slate-850"
            >
              <span className="text-base font-black text-slate-400 tabular-nums">
                #{index + 1}
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/levels/${record.level.slug}`}
                    className="text-base font-black text-slate-950 hover:underline dark:text-slate-50"
                  >
                    {record.level.name}
                  </Link>
                  {record.level.rank ? (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      #{record.level.rank}
                    </span>
                  ) : (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-800">
                      Legacy
                    </span>
                  )}
                  {record.isVerifier ? (
                    <span className="rounded border border-amber-400 bg-amber-100 px-1.5 py-0.5 text-[10px] font-black uppercase text-amber-900 dark:border-amber-500/60 dark:bg-amber-900/50 dark:text-amber-200">
                      Verifier
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {record.fps} FPS {record.cbfUsed ? "• CBF" : ""} • Accepted {formatDate(record.acceptedAt)}
                </p>
              </div>

              <span className="font-black text-emerald-700 tabular-nums sm:text-right dark:text-emerald-400">
                100%
              </span>

              <span className="text-right text-lg font-black text-cyan-800 tabular-nums dark:text-cyan-300">
                {record.currentPoints} pts
              </span>

              {record.videoUrl ? (
                <a
                  href={record.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-8 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 sm:justify-self-end"
                >
                  <Video className="h-3.5 w-3.5 text-slate-500" />
                  Proof
                </a>
              ) : (
                <span />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          No completions match the selected filter.
        </div>
      )}
    </section>
  );
}
