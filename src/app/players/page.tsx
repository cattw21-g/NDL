import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { LeaderboardView } from "@/components/leaderboard-view";
import { SectionPanel } from "@/components/ui";
import { prisma } from "@/lib/db";
import { demoModeEnabled, publicRecordWhere } from "@/lib/demo-visibility";
import {
  calculateCurrentLevelPoints,
  calculateLeaderboard,
  type ScoredLevelStatus,
} from "@/lib/points";

export const revalidate = 60;
export const metadata = {
  title: "Players - NDL",
  description:
    "View Nerfed Demonlist player standings based on accepted public records.",
};

export default async function PlayersPage() {
  const isDemoMode = demoModeEnabled();
  let records: Array<{
    playerId: string;
    levelId: string;
    acceptedAt: Date;
    player: {
      playerName: string;
      displayName: string;
    };
    level: {
      rank: number | null;
      status: ScoredLevelStatus;
      points: number;
    };
  }> = [];
  let allUsers: Array<{
    id: string;
    playerName: string;
    displayName: string;
  }> = [];

  try {
    const results = await Promise.all([
      prisma.record.findMany({
        where: publicRecordWhere({
          level: {
            status: {
              in: ["RANKED", "LEGACY"],
            },
          },
        }),
        select: {
          playerId: true,
          levelId: true,
          acceptedAt: true,
          player: {
            select: {
              playerName: true,
              displayName: true,
            },
          },
          level: {
            select: {
              rank: true,
              status: true,
              points: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        where: isDemoMode ? {} : { isDemo: false },
        select: {
          id: true,
          playerName: true,
          displayName: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    records = results[0] as typeof records;
    allUsers = results[1];
  } catch (err) {
    console.warn("Database unavailable on /players, using fallback:", err);
  }

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

  const leaderboardMap = new Map(
    leaderboard.map((row, index) => [
      row.playerId,
      {
        rank: index + 1,
        points: row.points,
        recordsCount: row.records,
      },
    ]),
  );

  const rankedRows = leaderboard.map((row, index) => ({
    playerId: row.playerId,
    playerName: row.playerName,
    displayName: row.displayName,
    rank: index + 1,
    points: row.points,
    recordsCount: row.records,
  }));

  const unrankedUsers = allUsers
    .filter((u) => !leaderboardMap.has(u.id))
    .map((u) => ({
      playerId: u.id,
      playerName: u.playerName,
      displayName: u.displayName,
      rank: null,
      points: 0,
      recordsCount: 0,
    }));

  const leaderboardRows = [...rankedRows, ...unrankedUsers];

  const totalPoints = leaderboard.reduce((sum, r) => sum + r.points, 0);
  const champion = leaderboard[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Player Leaderboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-zinc-400">
            Player rankings, point totals, completion records, and national affiliations.
          </p>

          {/* Quick Metrics */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-2xl">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Ranked Victors</span>
              <p className="mt-1 text-xl font-bold text-white">{leaderboard.length}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Total Points</span>
              <p className="mt-1 text-xl font-bold text-amber-400">{totalPoints.toLocaleString()} pts</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">#1 Champion</span>
              <p className="mt-1 text-base font-bold text-emerald-400 truncate">
                {champion ? champion.displayName : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Accepted Records</span>
              <p className="mt-1 text-xl font-bold text-cyan-400">{records.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <main className="min-w-0">
          <LeaderboardView rows={leaderboardRows} />
        </main>

        <aside className="space-y-4">
          <SectionPanel className="p-4 sm:p-5">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 font-bold text-zinc-900 dark:border-zinc-800 dark:text-white">
              <ShieldCheck className="h-4 w-4 text-amber-500" />
              <span>Leaderboard & Scoring</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              Points are awarded automatically based on demon difficulty and rank placement. Position shifts recalculate player standings in real-time.
            </p>

            <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <Link
                href="/submit"
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-cyan-600 px-3 text-xs font-bold text-white shadow-md shadow-cyan-500/20 transition hover:bg-cyan-500"
              >
                Submit a Record
              </Link>
              <Link
                href="/rules"
                className="inline-flex min-h-8 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-xs font-bold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Ranking Rules
              </Link>
            </div>
          </SectionPanel>
        </aside>
      </div>
    </div>
  );
}
