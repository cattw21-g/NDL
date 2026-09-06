import {
  BarChart3,
  Trophy,
  Award,
  ShieldCheck,
  Flame,
  Globe,
  Activity,
  CheckCircle2,
  TrendingUp,
  Cpu,
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { publicLevelWhere, publicRecordWhere } from "@/lib/demo-visibility";
import { calculateCurrentLevelPoints, calculateLeaderboard, calculateCountryLeaderboard } from "@/lib/points";
import { getCountryMeta } from "@/lib/countries";
import { PageHeader, SectionPanel, MetricTile } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Advanced Stats Viewer — Nerfed Demonlist",
  description: "Comprehensive platform statistics, completion analytics, difficulty distribution, and leaderboard metrics.",
  openGraph: {
    title: "Advanced Stats Viewer — Nerfed Demonlist",
    description: "Comprehensive platform statistics, completion analytics, difficulty distribution, and leaderboard metrics.",
    siteName: "Nerfed Demonlist",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Advanced Stats Viewer — Nerfed Demonlist",
    description: "Comprehensive platform statistics, completion analytics, difficulty distribution, and leaderboard metrics.",
  },
};

export default async function StatsPage() {
  const [levels, records, users] = await Promise.all([
    prisma.level.findMany({
      where: publicLevelWhere(),
      select: {
        id: true,
        name: true,
        slug: true,
        rank: true,
        status: true,
        difficulty: true,
        points: true,
        verifier: true,
        nerfCreator: true,
        _count: {
          select: {
            records: {
              where: {
                progress: 100,
              },
            },
          },
        },
      },
      orderBy: [{ rank: { sort: "asc", nulls: "last" } }],
    }),
    prisma.record.findMany({
      where: publicRecordWhere(),
      select: {
        id: true,
        playerId: true,
        levelId: true,
        progress: true,
        pointsAwarded: true,
        fps: true,
        cbfUsed: true,
        isVerifier: true,
        acceptedAt: true,
        player: {
          select: {
            id: true,
            playerName: true,
            displayName: true,
            countryCode: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        isDemo: false,
      },
      select: {
        id: true,
        playerName: true,
        displayName: true,
        countryCode: true,
      },
    }),
  ]);

  // Compute points and classifications
  const mainListLevels = levels.filter((l) => l.status === "RANKED" && l.rank !== null && l.rank <= 75);
  const extendedListLevels = levels.filter((l) => l.status === "RANKED" && l.rank !== null && l.rank > 75 && l.rank <= 150);
  const legacyLevels = levels.filter((l) => l.status === "LEGACY" || (l.rank !== null && l.rank > 150));

  const completions100 = records.filter((r) => r.progress === 100);
  const progressRecords = records.filter((r) => r.progress < 100);

  const totalPointsAwarded = records.reduce((sum, r) => sum + r.pointsAwarded, 0);

  // Difficulty Distribution
  const difficultyCounts: Record<string, number> = {
    ENTRY: 0,
    ADVANCED: 0,
    EXTREME: 0,
    MYTHIC: 0,
    ASCENT: 0,
  };
  for (const lvl of levels) {
    if (lvl.difficulty in difficultyCounts) {
      difficultyCounts[lvl.difficulty]++;
    }
  }

  // FPS Distribution
  const fpsGroups: Record<number, number> = {};
  let cbfTrueCount = 0;
  for (const rec of records) {
    fpsGroups[rec.fps] = (fpsGroups[rec.fps] || 0) + 1;
    if (rec.cbfUsed) {
      cbfTrueCount++;
    }
  }
  const sortedFps = Object.entries(fpsGroups)
    .map(([fps, count]) => ({ fps: Number(fps), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const cbfPercentage = records.length > 0 ? Math.round((cbfTrueCount / records.length) * 100) : 0;

  // Global Leaderboard
  const leaderboardRecords = records.map((r) => ({
    playerId: r.player.id,
    playerName: r.player.playerName,
    displayName: r.player.displayName,
    levelId: r.levelId,
    pointsAwarded: r.pointsAwarded,
    acceptedAt: r.acceptedAt,
    progress: r.progress,
  }));
  const playerLeaderboard = calculateLeaderboard(leaderboardRecords);
  const topPlayers = playerLeaderboard.slice(0, 10);
  const userCountryMap = new Map(users.map((u) => [u.id, u.countryCode]));

  // Top Verifiers
  const verifierCounts: Record<string, number> = {};
  for (const lvl of levels) {
    if (lvl.verifier) {
      verifierCounts[lvl.verifier] = (verifierCounts[lvl.verifier] || 0) + 1;
    }
  }
  const topVerifiers = Object.entries(verifierCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top Creators / Nerfers
  const creatorCounts: Record<string, number> = {};
  for (const lvl of levels) {
    if (lvl.nerfCreator) {
      creatorCounts[lvl.nerfCreator] = (creatorCounts[lvl.nerfCreator] || 0) + 1;
    }
  }
  const topCreators = Object.entries(creatorCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-b from-sky-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-cyan-400">
            <BarChart3 className="h-6 w-6" />
            <span className="text-xs font-black uppercase tracking-widest">Platform Analytics</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Advanced Stats Viewer
          </h1>
          <p className="mt-2 max-w-3xl text-sm sm:text-base text-zinc-400 leading-relaxed">
            Live analytics across all nerfed demons, player completions, national rankings, and hardware settings.
          </p>
        </div>
      </div>

      {/* Primary KPI Metrics Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricTile label="Total Points" value={`${totalPointsAwarded.toLocaleString()} pts`} tone="cyan" />
        <MetricTile label="Accepted Runs" value={records.length.toLocaleString()} tone="emerald" />
        <MetricTile label="100% Victories" value={completions100.length.toLocaleString()} tone="amber" />
        <MetricTile label="Main List" value={mainListLevels.length} tone="amber" />
        <MetricTile label="Extended List" value={extendedListLevels.length} tone="cyan" />
        <MetricTile label="Legacy Demons" value={legacyLevels.length} />
      </div>

      {/* Two Column Section: Difficulty Breakdown & Hardware Adoption */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Difficulty Tier Distribution */}
        <SectionPanel className="p-5 space-y-4 border-zinc-800 bg-zinc-900/70">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Award className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-extrabold text-white">Difficulty Distribution</h2>
          </div>
          <p className="text-xs text-zinc-400">
            Categorization of ranked and legacy demons across official list tiers.
          </p>
          <div className="space-y-2.5">
            {Object.entries(difficultyCounts).map(([cat, count]) => {
              const pct = levels.length > 0 ? Math.round((count / levels.length) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-zinc-200">{cat}</span>
                    <span className="text-zinc-400">{count} demons ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-amber-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionPanel>

        {/* Hardware & Physics Metrics */}
        <SectionPanel className="p-5 space-y-4 border-zinc-800 bg-zinc-900/70">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Cpu className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-extrabold text-white">Hardware & Physics Metrics</h2>
          </div>
          <p className="text-xs text-zinc-400">
            Record submission settings, CBF adoption rate, and player display refresh rates.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 text-center">
              <p className="text-3xl font-black text-purple-300">{cbfPercentage}%</p>
              <p className="text-xs font-bold text-purple-200/80 mt-1">CBF Adoption Rate</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">{cbfTrueCount} of {records.length} runs</p>
            </div>
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-center">
              <p className="text-3xl font-black text-cyan-300">{completions100.length}</p>
              <p className="text-xs font-bold text-cyan-200/80 mt-1">100% Victories</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">{progressRecords.length} qualifying progress</p>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-zinc-800/80 pt-3">
            <p className="text-xs font-bold text-zinc-300">Top Refresh Rates (FPS):</p>
            <div className="grid grid-cols-3 gap-2">
              {sortedFps.map((item) => (
                <div key={item.fps} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-2 text-center">
                  <p className="font-mono text-sm font-black text-white">{item.fps} FPS</p>
                  <p className="text-[11px] text-zinc-400">{item.count} records</p>
                </div>
              ))}
            </div>
          </div>
        </SectionPanel>
      </div>

      {/* Top Players Leaderboard Snapshot */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl font-extrabold text-white">Top 10 Player Standings</h2>
          </div>
          <Link
            href="/players"
            className="text-xs font-bold text-cyan-400 hover:underline"
          >
            View Full Leaderboard &rarr;
          </Link>
        </div>

        <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          {topPlayers.map((player, index) => {
            const countryCode = userCountryMap.get(player.playerId);
            const country = countryCode ? getCountryMeta(countryCode) : null;
            return (
              <div
                key={player.playerId}
                className="grid gap-2 p-3.5 sm:grid-cols-[3rem_minmax(0,1fr)_6rem_6rem] sm:items-center hover:bg-zinc-850 transition"
              >
                <span className="font-black text-slate-400 text-sm">
                  #{index + 1}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/players/${player.playerName}`}
                    className="font-black text-white hover:text-cyan-400 transition"
                  >
                    {player.displayName}
                  </Link>
                  {country ? (
                    <span className="ml-2 text-xs text-zinc-400">
                      {country.flag} {country.name}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-zinc-400 sm:text-right">
                  {player.records} {player.records === 1 ? "Record" : "Records"}
                </span>
                <span className="text-right font-mono font-black text-cyan-400">
                  {player.points} pts
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top Verifiers & Top Nerf Creators */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Verifiers */}
        <SectionPanel className="p-5 space-y-3 border-zinc-800 bg-zinc-900/70">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-extrabold text-white">Top List Verifiers</h3>
          </div>
          <div className="divide-y divide-zinc-800/80">
            {topVerifiers.map((v, i) => (
              <div key={v.name} className="flex items-center justify-between py-2 text-xs">
                <span className="font-bold text-zinc-200">
                  #{i + 1} {v.name}
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {v.count} {v.count === 1 ? "Demon" : "Demons"}
                </span>
              </div>
            ))}
          </div>
        </SectionPanel>

        {/* Top Nerf Creators */}
        <SectionPanel className="p-5 space-y-3 border-zinc-800 bg-zinc-900/70">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
            <Flame className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-extrabold text-white">Top Nerf Creators</h3>
          </div>
          <div className="divide-y divide-zinc-800/80">
            {topCreators.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between py-2 text-xs">
                <span className="font-bold text-zinc-200">
                  #{i + 1} {c.name}
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  {c.count} {c.count === 1 ? "Demon" : "Demons"}
                </span>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}
