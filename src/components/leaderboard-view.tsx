"use client";

import { Crown, Medal, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { cx, EmptyState, inputClass, SectionPanel } from "@/components/ui";

export type LeaderboardRow = {
  playerId: string;
  playerName: string;
  displayName: string;
  points: number;
  recordsCount: number;
};

export function LeaderboardView({ rows }: { rows: LeaderboardRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter(
      (r) =>
        r.displayName.toLowerCase().includes(q) ||
        r.playerName.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const top3 = rows.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top 3 Champion Podium */}
      {top3.length > 0 && !query ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {/* 2nd Place */}
          {top3[1] ? (
            <Link
              href={`/players/${top3[1].playerName}`}
              className="order-2 flex flex-col justify-between rounded-xl border border-slate-300 bg-gradient-to-b from-slate-100 to-white p-5 shadow-md transition hover:-translate-y-1 hover:border-slate-400 dark:border-slate-700 dark:from-slate-850 dark:to-slate-900 sm:order-1 sm:mt-6"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 font-black text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    #2
                  </span>
                  <Medal className="h-6 w-6 text-slate-400" />
                </div>
                <div className="mt-3">
                  <h3 className="truncate text-lg font-black text-slate-950 dark:text-slate-50">
                    {top3[1].displayName}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    @{top3[1].playerName}
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
                <span className="text-xl font-black text-cyan-800 dark:text-cyan-300">
                  {top3[1].points} pts
                </span>
                <span className="block text-xs font-bold text-slate-500">
                  {top3[1].recordsCount} {top3[1].recordsCount === 1 ? "record" : "records"}
                </span>
              </div>
            </Link>
          ) : <div className="hidden sm:block" />}

          {/* 1st Place Champion */}
          {top3[0] ? (
            <Link
              href={`/players/${top3[0].playerName}`}
              className="order-1 flex flex-col justify-between rounded-xl border-2 border-amber-400 bg-gradient-to-b from-amber-50 to-white p-5 shadow-xl shadow-amber-500/10 transition hover:-translate-y-1 hover:border-amber-500 dark:border-amber-500/60 dark:from-amber-950/40 dark:to-slate-900 sm:order-2"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 font-black text-slate-950 shadow-sm">
                    #1
                  </span>
                  <Crown className="h-7 w-7 text-amber-500" />
                </div>
                <div className="mt-3">
                  <span className="inline-block rounded bg-amber-200/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                    NDL Champion
                  </span>
                  <h3 className="truncate text-xl font-black text-slate-950 dark:text-slate-50">
                    {top3[0].displayName}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    @{top3[0].playerName}
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t border-amber-200 pt-3 dark:border-amber-800/60">
                <span className="text-2xl font-black text-amber-900 dark:text-amber-300">
                  {top3[0].points} pts
                </span>
                <span className="block text-xs font-bold text-slate-500">
                  {top3[0].recordsCount} {top3[0].recordsCount === 1 ? "record" : "records"}
                </span>
              </div>
            </Link>
          ) : null}

          {/* 3rd Place */}
          {top3[2] ? (
            <Link
              href={`/players/${top3[2].playerName}`}
              className="order-3 flex flex-col justify-between rounded-xl border border-amber-300 bg-gradient-to-b from-amber-50/50 to-white p-5 shadow-md transition hover:-translate-y-1 hover:border-amber-400 dark:border-amber-800/60 dark:from-amber-950/20 dark:to-slate-900 sm:order-3 sm:mt-8"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-200 font-black text-amber-900 dark:bg-amber-900/80 dark:text-amber-200">
                    #3
                  </span>
                  <Medal className="h-6 w-6 text-amber-700 dark:text-amber-500" />
                </div>
                <div className="mt-3">
                  <h3 className="truncate text-lg font-black text-slate-950 dark:text-slate-50">
                    {top3[2].displayName}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    @{top3[2].playerName}
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
                <span className="text-xl font-black text-cyan-800 dark:text-cyan-300">
                  {top3[2].points} pts
                </span>
                <span className="block text-xs font-bold text-slate-500">
                  {top3[2].recordsCount} {top3[2].recordsCount === 1 ? "record" : "records"}
                </span>
              </div>
            </Link>
          ) : <div className="hidden sm:block" />}
        </div>
      ) : null}

      {/* Main Leaderboard Table */}
      <SectionPanel className="overflow-hidden">
        {/* Search Bar */}
        <div className="border-b border-slate-300 bg-slate-100 p-3 dark:border-slate-700 dark:bg-slate-950/60">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search players by name or handle..."
              className={`${inputClass} w-full pl-9`}
            />
          </label>
        </div>

        {/* Table Header */}
        <div className="hidden grid-cols-[5rem_minmax(0,1fr)_7rem_8rem_auto] border-b border-slate-300 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400 md:grid">
          <span>Rank</span>
          <span>Player</span>
          <span className="text-right">Completions</span>
          <span className="text-right">Total Points</span>
          <span />
        </div>

        {/* Table Rows */}
        {filtered.length > 0 ? (
          filtered.map((row) => {
            const actualRank = rows.findIndex((r) => r.playerId === row.playerId) + 1;
            return (
              <Link
                key={row.playerId}
                href={`/players/${row.playerName}`}
                className="grid gap-3 border-b border-slate-300 p-3.5 transition last:border-b-0 hover:bg-cyan-50/60 dark:border-slate-700 dark:hover:bg-cyan-950/30 md:grid-cols-[5rem_minmax(0,1fr)_7rem_8rem_auto] md:items-center"
              >
                <span className="inline-flex items-center gap-2 text-xl font-black text-slate-800 dark:text-slate-200 tabular-nums">
                  <Medal
                    className={cx(
                      "h-5 w-5",
                      actualRank === 1
                        ? "text-amber-500"
                        : actualRank === 2
                          ? "text-slate-400"
                          : actualRank === 3
                            ? "text-amber-700 dark:text-amber-500"
                            : "text-slate-300 dark:text-slate-600",
                    )}
                  />
                  #{actualRank}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-lg font-black text-slate-950 dark:text-slate-50">
                    {row.displayName}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    @{row.playerName}
                  </span>
                </span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 md:text-right">
                  {row.recordsCount}
                </span>
                <span className="text-xl font-black text-cyan-800 dark:text-cyan-300 md:text-right">
                  {row.points} pts
                </span>
                <span className="text-xs font-bold text-cyan-700 underline md:text-right dark:text-cyan-400">
                  View Profile →
                </span>
              </Link>
            );
          })
        ) : (
          <div className="p-6">
            <EmptyState
              title="No players found"
              description={query ? `No players match "${query}".` : "No public player scores yet."}
            />
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
