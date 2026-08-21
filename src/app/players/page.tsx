import { BookOpen, ShieldCheck, Trophy } from "lucide-react";
import Link from "next/link";

import { LeaderboardView } from "@/components/leaderboard-view";
import { Eyebrow, MetricTile, SectionPanel } from "@/components/ui";
import { prisma } from "@/lib/db";
import { publicRecordWhere } from "@/lib/demo-visibility";
import {
  calculateCurrentLevelPoints,
  calculateLeaderboard,
} from "@/lib/points";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Players - NDL",
  description:
    "View Nerfed Demonlist player standings based on accepted public records.",
};

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

  const leaderboardRows = leaderboard.map((row) => ({
    playerId: row.playerId,
    playerName: row.playerName,
    displayName: row.displayName,
    points: row.points,
    recordsCount: row.records,
  }));

  return (
    <div className="space-y-5">
      <section className="grid gap-4 rounded-md border border-slate-300 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_14px_30px_rgba(0,0,0,0.28)] lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
        <div>
          <div className="mb-3">
            <Eyebrow icon={Trophy}>Community points</Eyebrow>
          </div>
          <h1 className="text-4xl font-black leading-tight text-slate-950 dark:text-slate-50">
            Player leaderboard
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            Only accepted records count. If a player has multiple accepted
            records on one level, only their best score for that level counts.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MetricTile label="Players" value={leaderboard.length} />
          <MetricTile label="Records" value={records.length} tone="emerald" />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <main className="min-w-0">
          <LeaderboardView rows={leaderboardRows} />
        </main>

        <aside className="space-y-3">
          <SectionPanel className="p-4">
            <div className="flex items-center gap-2 border-b border-slate-300 pb-3 font-black text-slate-950">
              <ShieldCheck className="h-5 w-5 text-cyan-800" />
              Scoring notes
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Accepted records only. Points count each player&apos;s best accepted
              record per ranked or legacy level. Pending and rejected
              submissions do not affect standings.
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
            <Link
              href="/submit"
              className="mt-4 inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950/50"
            >
              Submit a record
            </Link>
          </SectionPanel>
        </aside>
      </div>
    </div>
  );
}
