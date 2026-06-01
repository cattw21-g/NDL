import { BookOpen, Medal, ShieldCheck, Trophy } from "lucide-react";
import Link from "next/link";

import { EmptyState, Eyebrow, MetricTile, SectionPanel } from "@/components/ui";
import { prisma } from "@/lib/db";
import { publicRecordWhere } from "@/lib/demo-visibility";
import {
  calculateCurrentLevelPoints,
  calculateLeaderboard,
} from "@/lib/points";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const records = await prisma.record.findMany({
    where: publicRecordWhere({
      level: {
        status: {
          in: ["RANKED", "LEGACY"],
        },
      },
    }),
    include: {
      player: true,
      level: true,
    },
  });

  const leaderboard = calculateLeaderboard(
    records.map((record) => ({
      playerId: record.playerId,
      playerName: record.player.playerName,
      displayName: record.player.displayName,
      levelId: record.levelId,
      pointsAwarded: calculateCurrentLevelPoints(record.level),
      acceptedAt: record.acceptedAt,
    })),
  );

  return (
    <div className="space-y-5">
      <section className="grid gap-4 rounded-md border border-slate-300 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_14px_30px_rgba(0,0,0,0.28)] lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
        <div>
          <div className="mb-3">
            <Eyebrow icon={Trophy}>Community points</Eyebrow>
          </div>
          <h1 className="text-4xl font-black leading-tight text-slate-950">
            Player leaderboard
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Accepted records only. If a player has multiple accepted records on
            one level, only their best score for that level counts.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MetricTile label="Players" value={leaderboard.length} />
          <MetricTile label="Records" value={records.length} tone="emerald" />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <SectionPanel className="overflow-hidden">
          <div className="hidden grid-cols-[5rem_minmax(0,1fr)_7rem_8rem_auto] border-b border-slate-300 bg-slate-100 px-4 py-3 text-xs font-black uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-400 md:grid">
            <span>Rank</span>
            <span>Player</span>
            <span className="text-right">Records</span>
            <span className="text-right">Points</span>
            <span />
          </div>
          {leaderboard.length > 0 ? (
            leaderboard.map((row, index) => (
              <Link
                key={row.playerId}
                href={`/players/${row.playerName}`}
                className="grid gap-3 border-b border-slate-300 p-3.5 transition last:border-b-0 hover:bg-cyan-50/60 dark:border-slate-700 dark:hover:bg-cyan-950/30 md:grid-cols-[5rem_minmax(0,1fr)_7rem_8rem_auto] md:items-center"
              >
                <span className="inline-flex items-center gap-2 text-xl font-black text-slate-800 tabular-nums">
                  <Medal
                    className={`h-5 w-5 ${
                      index === 0
                        ? "text-amber-500"
                        : index === 1
                          ? "text-cyan-700"
                          : index === 2
                            ? "text-teal-700"
                            : "text-slate-400"
                    }`}
                  />
                  #{index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-lg font-black text-slate-950">
                    {row.displayName}
                  </span>
                  <span className="text-sm text-slate-500">@{row.playerName}</span>
                </span>
                <span className="text-left font-black text-cyan-800 tabular-nums md:text-right">
                  {row.records}
                </span>
                <span className="text-left text-xl font-black text-emerald-700 tabular-nums md:text-right">
                  {row.points}
                </span>
                <span className="inline-flex min-h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-black text-slate-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200">
                  Profile
                </span>
              </Link>
            ))
          ) : (
            <div className="p-4">
              <EmptyState
                title="No accepted records yet"
                description="The leaderboard will populate after moderators accept player submissions."
              />
            </div>
          )}
        </SectionPanel>

        <aside className="space-y-3">
          <SectionPanel className="p-4">
            <div className="flex items-center gap-2 border-b border-slate-300 pb-3 font-black text-slate-950">
              <ShieldCheck className="h-5 w-5 text-cyan-800" />
              Scoring notes
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Points count each player&apos;s best accepted record per ranked
              or legacy level. Pending and rejected submissions do not affect
              standings.
            </p>
          </SectionPanel>
          <SectionPanel className="p-4">
            <div className="flex items-center gap-2 border-b border-slate-300 pb-3 font-black text-slate-950">
              <BookOpen className="h-5 w-5 text-cyan-800" />
              New runs
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Records must include proof links, FPS, CBF usage, click/audio
              notes, and device details before review.
            </p>
          </SectionPanel>
        </aside>
      </div>
    </div>
  );
}
