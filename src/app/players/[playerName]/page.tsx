import {
  Award,
  Calendar,
  CheckCircle2,
  Crown,
  Flame,
  Gamepad2,
  Medal,
  Play,
  Shield,
  Trophy,
  User,
  Video,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyButton } from "@/components/copy-button";
import { DiscordLinkCard } from "@/components/discord-link-card";
import { StatusBadge } from "@/components/status-badge";
import {
  MetricTile,
  SectionPanel,
} from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  publicLevelWhere,
  publicRecordWhere,
  publicUserWhere,
} from "@/lib/demo-visibility";
import { formatDate, formatDateTime } from "@/lib/format";
import { canSeeSubmission } from "@/lib/permissions";
import {
  calculateCurrentLevelPoints,
  calculateLeaderboard,
} from "@/lib/points";
import { absoluteSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Player Profile - Nerfed Demonlist",
  description:
    "View player standings, 100% completions, progress runs, and verified demons.",
};

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ playerName: string }>;
}) {
  const { playerName } = await params;
  const [viewer, player, allRecords] = await Promise.all([
    getCurrentUser(),
    prisma.user.findFirst({
      where: publicUserWhere({
        playerName,
      }),
      include: {
        verifiedLevels: {
          where: publicLevelWhere(),
          select: {
            id: true,
            slug: true,
            name: true,
            originalName: true,
            rank: true,
            status: true,
            points: true,
            thumbnailUrl: true,
            verificationVideoUrl: true,
            showcaseUrl: true,
          },
          orderBy: { rank: "asc" },
        },
        records: {
          where: publicRecordWhere(),
          include: {
            level: true,
          },
          orderBy: [
            { isVerifier: "desc" },
            { progress: "desc" },
            { acceptedAt: "desc" },
          ],
        },
        submissions: {
          include: {
            level: true,
            reviewer: true,
          },
          orderBy: {
            submittedAt: "desc",
          },
        },
      },
    }),
    prisma.record.findMany({
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
    }),
  ]);

  if (!player) {
    notFound();
  }

  // Calculate Global Leaderboard Rank
  const globalLeaderboard = calculateLeaderboard(
    allRecords.map((record) => ({
      playerId: record.playerId,
      playerName: record.player.playerName,
      displayName: record.player.displayName,
      levelId: record.levelId,
      pointsAwarded: calculateCurrentLevelPoints(record.level),
      acceptedAt: record.acceptedAt,
    })),
  );

  const globalRankIndex = globalLeaderboard.findIndex(
    (row) => row.playerId === player.id,
  );
  const globalRank = globalRankIndex !== -1 ? globalRankIndex + 1 : null;

  const acceptedRecords = player.records.map((record) => ({
    ...record,
    currentPoints: calculateCurrentLevelPoints(record.level),
  }));

  const fullCompletions = acceptedRecords.filter(
    (record) => (record.progress ?? 100) === 100,
  );
  const progressRecords = acceptedRecords.filter(
    (record) => (record.progress ?? 100) < 100,
  );

  const summary = globalRankIndex !== -1 ? globalLeaderboard[globalRankIndex] : null;
  const totalPoints = summary?.points ?? 0;

  // Hardest beaten demon
  const hardestCompletion = fullCompletions
    .filter((r) => r.level.rank !== null && r.level.status === "RANKED")
    .sort((a, b) => (a.level.rank ?? 999) - (b.level.rank ?? 999))[0];

  const canViewPrivate =
    viewer && canSeeSubmission(viewer.role, viewer.id, player.id);
  const isOwnProfile = Boolean(viewer && viewer.id === player.id);
  const profileUrl = absoluteSiteUrl(`/players/${player.playerName}`);

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden rounded-xl border border-slate-300 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          {/* Avatar & Player Details */}
          <div className="flex flex-wrap items-center gap-5">
            {/* Avatar Badge */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 text-3xl font-black text-slate-800 shadow-inner dark:border-slate-700 dark:from-slate-800 dark:to-slate-950 dark:text-slate-100">
              {globalRank === 1 ? (
                <div className="absolute -top-3 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-md">
                  <Crown className="h-5 w-5" />
                </div>
              ) : null}
              {player.displayName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              {isOwnProfile ? (
                <p className="mb-2 text-xs font-black uppercase tracking-[0.08em] text-cyan-800 dark:text-cyan-300">
                  Your public profile
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-3xl font-black text-slate-950 sm:text-4xl dark:text-slate-50">
                  {player.displayName}
                </h1>
                <span className="text-sm font-bold text-slate-500">
                  @{player.playerName}
                </span>

                {/* Role / Rank Pill */}
                {globalRank === 1 ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400 bg-amber-100 px-3 py-0.5 text-xs font-black text-amber-950 dark:border-amber-500/60 dark:bg-amber-950/80 dark:text-amber-300">
                    <Crown className="h-3.5 w-3.5 text-amber-600" />
                    NDL Champion #1
                  </span>
                ) : globalRank === 2 || globalRank === 3 ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-3 py-0.5 text-xs font-black text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                    <Medal className="h-3.5 w-3.5 text-amber-500" />
                    Top 3 Victor (#{globalRank})
                  </span>
                ) : globalRank !== null ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300 bg-cyan-50 px-3 py-0.5 text-xs font-black text-cyan-900 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                    <Trophy className="h-3.5 w-3.5 text-cyan-600" />
                    Rank #{globalRank}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    <User className="h-3.5 w-3.5" />
                    Registered Member
                  </span>
                )}

                <StatusBadge value={player.role} />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Member since {formatDate(player.createdAt)}
                </span>
                {player.verifiedLevels.length > 0 ? (
                  <span className="inline-flex items-center gap-1 text-amber-600 font-bold dark:text-amber-400">
                    <Flame className="h-3.5 w-3.5" /> {player.verifiedLevels.length} Verified {player.verifiedLevels.length === 1 ? "Demon" : "Demons"}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton
              text={profileUrl}
              label="Share profile"
              copiedLabel="Link Copied!"
            />
            {isOwnProfile ? (
              <Link
                href="/submit"
                className="inline-flex min-h-9 items-center justify-center gap-1 rounded-md bg-cyan-700 px-4 text-xs font-black text-white hover:bg-cyan-800 dark:bg-cyan-500 dark:text-slate-950"
              >
                Submit Run
              </Link>
            ) : null}
          </div>
        </div>

        {/* 2. STATS TILES BAR */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:grid-cols-4">
          <MetricTile
            label="Total Points"
            value={`${totalPoints} pts`}
            tone="cyan"
          />
          <MetricTile
            label="Global Rank"
            value={globalRank ? `#${globalRank}` : "Unranked"}
            tone={globalRank === 1 ? "amber" : undefined}
          />
          <MetricTile
            label="100% Victories"
            value={fullCompletions.length}
            tone="emerald"
          />
          <MetricTile
            label="Progress Runs"
            value={progressRecords.length}
          />
        </div>
      </section>

      {/* DISCORD AUTOMATED ROLE INTEGRATION */}
      <DiscordLinkCard
        isOwner={isOwnProfile}
        discordUserId={player.discordUserId}
        discordUsername={player.discordUsername}
        discordLinkedAt={player.discordLinkedAt}
      />

      {/* 3. HARDEST DEMON SPOTLIGHT */}
      {hardestCompletion ? (
        <section className="overflow-hidden rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50/40 p-5 shadow-md dark:border-amber-500/40 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-slate-950">
                  👑
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  Hardest Demon Beaten
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-slate-50">
                <Link
                  href={`/levels/${hardestCompletion.level.slug}`}
                  className="hover:text-cyan-700 hover:underline dark:hover:text-cyan-400"
                >
                  {hardestCompletion.level.name}
                </Link>{" "}
                <span className="text-lg text-amber-700 dark:text-amber-400">
                  (Rank #{hardestCompletion.level.rank})
                </span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Earned <span className="font-black text-amber-900 dark:text-amber-300">{hardestCompletion.currentPoints} pts</span> • Beaten at {hardestCompletion.fps} FPS {hardestCompletion.cbfUsed ? "• CBF Enabled" : ""}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/levels/${hardestCompletion.level.slug}`}
                className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3.5 text-xs font-black text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                View Demon Page &rarr;
              </Link>
              {hardestCompletion.videoUrl ? (
                <a
                  href={hardestCompletion.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-amber-500 px-3.5 text-xs font-black text-slate-950 transition hover:bg-amber-400"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Watch Proof
                </a>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* 4. MAIN CONTENT TABS & CARDS */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="space-y-6">
          {/* 100% COMPLETIONS LIST */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-slate-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                100% Completions ({fullCompletions.length})
              </h2>
              <span className="text-xs font-bold text-slate-500">
                {fullCompletions.reduce((sum, r) => sum + r.currentPoints, 0)} Total Points
              </span>
            </div>

            {fullCompletions.length > 0 ? (
              <div className="divide-y divide-slate-200 rounded-lg border border-slate-300 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-900">
                {fullCompletions.map((record, index) => (
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
                        ) : null}
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
              <SectionPanel className="p-8 text-center">
                <Gamepad2 className="mx-auto h-10 w-10 text-slate-400" />
                <h3 className="mt-3 text-base font-black text-slate-950 dark:text-slate-50">
                  No 100% completions recorded yet
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Once a completion run is submitted and approved by staff, it will appear here with points!
                </p>
                <div className="mt-4">
                  <Link
                    href="/submit"
                    className="inline-flex min-h-9 items-center justify-center rounded-md bg-cyan-700 px-4 text-xs font-black text-white hover:bg-cyan-800 dark:bg-cyan-500 dark:text-slate-950"
                  >
                    Submit a Run
                  </Link>
                </div>
              </SectionPanel>
            )}
          </section>

          {/* PROGRESS RUNS (<100%) */}
          {progressRecords.length > 0 ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                <h2 className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-slate-50">
                  <Award className="h-5 w-5 text-cyan-600" />
                  Progress Records ({progressRecords.length})
                </h2>
              </div>

              <div className="divide-y divide-slate-200 rounded-lg border border-slate-300 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-900">
                {progressRecords.map((record, index) => (
                  <div
                    key={record.id}
                    className="grid gap-3 p-4 transition hover:bg-slate-50 sm:grid-cols-[3rem_minmax(0,1fr)_6rem_6rem_auto] sm:items-center dark:hover:bg-slate-850"
                  >
                    <span className="text-base font-black text-slate-400 tabular-nums">
                      #{index + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
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
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-500">
                        {record.fps} FPS • Accepted {formatDate(record.acceptedAt)}
                      </p>
                    </div>

                    <span className="font-black text-cyan-700 tabular-nums sm:text-right dark:text-cyan-400">
                      {record.progress}%
                    </span>

                    <span className="text-right text-xs font-bold text-slate-400">
                      0 pts
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
            </section>
          ) : null}

          {/* VERIFIED DEMONS */}
          {player.verifiedLevels.length > 0 ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                <h2 className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-slate-50">
                  <Flame className="h-5 w-5 text-amber-500" />
                  Officially Verified Demons ({player.verifiedLevels.length})
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {player.verifiedLevels.map((lvl) => (
                  <SectionPanel key={lvl.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                          {lvl.status === "RANKED" ? `Rank #${lvl.rank}` : "Upcoming / Pending"}
                        </span>
                        <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-slate-50">
                          <Link href={`/levels/${lvl.slug}`} className="hover:underline">
                            {lvl.name}
                          </Link>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Original: {lvl.originalName}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-xs dark:border-slate-800">
                      <Link
                        href={`/levels/${lvl.slug}`}
                        className="font-bold text-cyan-700 underline hover:text-cyan-800 dark:text-cyan-400"
                      >
                        View Level &rarr;
                      </Link>
                      {lvl.verificationVideoUrl ? (
                        <a
                          href={lvl.verificationVideoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-amber-700 underline hover:text-amber-800 dark:text-amber-400"
                        >
                          Verification Video &rarr;
                        </a>
                      ) : null}
                    </div>
                  </SectionPanel>
                ))}
              </div>
            </section>
          ) : null}
        </main>

        {/* ASIDE / SIDEBAR */}
        <aside className="space-y-4">
          <SectionPanel className="p-5">
            <h3 className="flex items-center gap-2 border-b border-slate-200 pb-3 text-sm font-black text-slate-950 dark:border-slate-800 dark:text-slate-50">
              <Trophy className="h-4 w-4 text-amber-500" />
              Player Summary
            </h3>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Total Points:</span>
                <span className="font-black text-cyan-800 dark:text-cyan-300">{totalPoints} pts</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Global Rank:</span>
                <span className="font-black text-slate-900 dark:text-slate-100">
                  {globalRank ? `#${globalRank}` : "Unranked"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">100% Victories:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{fullCompletions.length}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Verified Demons:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{player.verifiedLevels.length}</span>
              </div>
            </div>

            <div className="mt-4">
              <Link
                href="/players"
                className="inline-flex min-h-9 w-full items-center justify-center rounded-md border border-slate-300 bg-white text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                &larr; View Global Leaderboard
              </Link>
            </div>
          </SectionPanel>

          {/* Submissions (Only visible to player or staff) */}
          {canViewPrivate ? (
            <SectionPanel className="p-5">
              <h3 className="flex items-center gap-2 border-b border-slate-200 pb-3 text-sm font-black text-slate-950 dark:border-slate-800 dark:text-slate-50">
                <Shield className="h-4 w-4 text-cyan-600" />
                Submissions ({player.submissions.length})
              </h3>
              <p className="mt-2 text-xs text-slate-500">
                Private submissions history (visible to you & staff only).
              </p>

              <div className="mt-3 space-y-2">
                {player.submissions.length > 0 ? (
                  player.submissions.slice(0, 5).map((sub) => (
                    <div
                      key={sub.id}
                      className="rounded border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-950/60"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900 dark:text-slate-100">
                          {sub.level.name}
                        </span>
                        <StatusBadge value={sub.status} />
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {formatDateTime(sub.submittedAt)} • {sub.progress ?? 100}%
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No submissions yet.</p>
                )}
              </div>
            </SectionPanel>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
