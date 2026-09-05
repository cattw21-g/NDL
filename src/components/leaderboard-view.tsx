"use client";

import { Crown, Medal, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { cx, inputClass } from "@/components/ui";

export type LeaderboardRow = {
  playerId: string;
  playerName: string;
  displayName: string;
  rank: number | null;
  points: number;
  recordsCount: number;
};

export function LeaderboardView({ rows }: { rows: LeaderboardRow[] }) {
  const [query, setQuery] = useState("");

  const rankedOnly = useMemo(() => rows.filter((r) => r.rank !== null), [rows]);

  const displayedRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default view: Top 50 ranked players only
      return rankedOnly.slice(0, 50);
    }
    // Search view: Search across ALL registered users and ranked players
    return rows.filter(
      (r) =>
        r.displayName.toLowerCase().includes(q) ||
        r.playerName.toLowerCase().includes(q),
    );
  }, [rows, rankedOnly, query]);

  const top3 = rankedOnly.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top 3 Champion Podium (only on default view) */}
      {top3.length > 0 && !query ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {/* 2nd Place */}
          {top3[1] ? (
            <Link
              href={`/players/${top3[1].playerName}`}
              className="order-2 flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl transition hover:-translate-y-1 hover:border-zinc-700 sm:order-1 sm:mt-6"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-300 font-black text-zinc-950 text-xs">
                    #2
                  </span>
                  <Medal className="h-6 w-6 text-zinc-400" />
                </div>
                <div className="mt-3">
                  <h3 className="truncate text-lg font-black text-white">
                    {top3[1].displayName}
                  </h3>
                  <p className="text-xs font-semibold text-zinc-400">
                    @{top3[1].playerName}
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t border-zinc-800 pt-3">
                <span className="text-xl font-black text-cyan-400">
                  {top3[1].points.toLocaleString()} pts
                </span>
                <span className="block text-xs font-bold text-zinc-500">
                  {top3[1].recordsCount} {top3[1].recordsCount === 1 ? "record" : "records"}
                </span>
              </div>
            </Link>
          ) : <div className="hidden sm:block" />}

          {/* 1st Place Champion */}
          {top3[0] ? (
            <Link
              href={`/players/${top3[0].playerName}`}
              className="order-1 flex flex-col justify-between rounded-xl border-2 border-amber-500/80 bg-gradient-to-b from-amber-500/10 via-zinc-900/70 to-zinc-950 p-6 shadow-2xl shadow-amber-500/10 transition hover:-translate-y-1 hover:border-amber-400 sm:order-2"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 font-black text-zinc-950 shadow-md shadow-amber-500/50 text-sm">
                    #1
                  </span>
                  <Crown className="h-7 w-7 text-amber-400" />
                </div>
                <div className="mt-4">
                  <span className="inline-block rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300 border border-amber-500/30">
                    NDL Champion
                  </span>
                  <h3 className="mt-1 truncate text-xl font-black text-white">
                    {top3[0].displayName}
                  </h3>
                  <p className="text-xs font-semibold text-zinc-400">
                    @{top3[0].playerName}
                  </p>
                </div>
              </div>
              <div className="mt-5 border-t border-amber-500/20 pt-3">
                <span className="text-2xl font-black text-amber-400">
                  {top3[0].points.toLocaleString()} pts
                </span>
                <span className="block text-xs font-bold text-zinc-400">
                  {top3[0].recordsCount} {top3[0].recordsCount === 1 ? "record" : "records"}
                </span>
              </div>
            </Link>
          ) : null}

          {/* 3rd Place */}
          {top3[2] ? (
            <Link
              href={`/players/${top3[2].playerName}`}
              className="order-3 flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl transition hover:-translate-y-1 hover:border-zinc-700 sm:order-3 sm:mt-8"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-700 font-black text-white text-xs">
                    #3
                  </span>
                  <Medal className="h-6 w-6 text-amber-600" />
                </div>
                <div className="mt-3">
                  <h3 className="truncate text-lg font-black text-white">
                    {top3[2].displayName}
                  </h3>
                  <p className="text-xs font-semibold text-zinc-400">
                    @{top3[2].playerName}
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t border-zinc-800 pt-3">
                <span className="text-xl font-black text-cyan-400">
                  {top3[2].points.toLocaleString()} pts
                </span>
                <span className="block text-xs font-bold text-zinc-500">
                  {top3[2].recordsCount} {top3[2].recordsCount === 1 ? "record" : "records"}
                </span>
              </div>
            </Link>
          ) : <div className="hidden sm:block" />}
        </div>
      ) : null}

      {/* Main Leaderboard Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 shadow-xl">
        {/* Search Bar */}
        <div className="border-b border-zinc-800 bg-zinc-900/80 p-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any player or registered user (e.g. SpaceUK, @username)..."
              className={`${inputClass} w-full pl-9`}
            />
          </label>
        </div>

        {/* Table Header */}
        <div className="hidden grid-cols-[5rem_minmax(0,1fr)_8rem_9rem_auto] border-b border-zinc-800 bg-zinc-950/40 px-6 py-3.5 text-xs font-semibold uppercase text-zinc-400 md:grid">
          <span>Rank</span>
          <span>Player</span>
          <span className="text-right">Completions</span>
          <span className="text-right">Total Points</span>
          <span />
        </div>

        {/* Table Rows */}
        {displayedRows.length > 0 ? (
          <div className="divide-y divide-zinc-800/60 text-zinc-300">
            {displayedRows.map((row) => (
              <Link
                key={row.playerId}
                href={`/players/${row.playerName}`}
                className="grid gap-3 p-4 transition hover:bg-zinc-800/40 md:grid-cols-[5rem_minmax(0,1fr)_8rem_9rem_auto] md:items-center px-6"
              >
                {/* Rank / Badge */}
                <span className="font-bold">
                  {row.rank !== null ? (
                    <span
                      className={cx(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black",
                        row.rank === 1
                          ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/50"
                          : row.rank === 2
                            ? "bg-zinc-300 text-zinc-950"
                            : row.rank === 3
                              ? "bg-amber-700 text-white"
                              : "bg-zinc-800 text-zinc-400 font-semibold",
                      )}
                    >
                      #{row.rank}
                    </span>
                  ) : (
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-500">
                      Unranked
                    </span>
                  )}
                </span>

                {/* Player Name */}
                <span className="min-w-0">
                  <span className="block truncate text-base font-bold text-white">
                    {row.displayName}
                  </span>
                  <span className="text-xs text-zinc-400">
                    @{row.playerName}
                  </span>
                </span>

                {/* Completions */}
                <span className="text-sm font-semibold text-zinc-200 md:text-right">
                  {row.recordsCount > 0 ? row.recordsCount : "0"}
                </span>

                {/* Total Points */}
                <span
                  className={cx(
                    "text-lg font-black md:text-right",
                    row.points > 0 ? "text-amber-400" : "text-zinc-600",
                  )}
                >
                  {row.points.toLocaleString()} pts
                </span>

                {/* View Profile CTA */}
                <span className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 md:text-right">
                  View Profile →
                </span>
              </Link>
            ))}

            {!query && rankedOnly.length > 50 ? (
              <div className="bg-zinc-950/40 p-4 text-center text-xs font-semibold text-zinc-500">
                Showing Top 50 players ({rankedOnly.length} total ranked). Search above to find players beyond #50 or unranked members.
              </div>
            ) : null}
          </div>
        ) : (
          <div className="p-12 text-center text-zinc-400">
            {query ? `No player or user matches "${query}".` : "No public player scores yet."}
          </div>
        )}
      </div>
    </div>
  );
}
