import { notFound } from "next/navigation";
import Link from "next/link";

import { CopyButton } from "@/components/copy-button";
import { StatusBadge } from "@/components/status-badge";
import {
  cx,
  EmptyState,
  FactPill,
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
  title: "Player Profile - NDL",
  description:
    "View a Nerfed Demonlist player's accepted records and public scoring profile.",
};

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ playerName: string }>;
}) {
  const { playerName } = await params;
  const [viewer, player] = await Promise.all([
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
            rank: true,
            status: true,
            points: true,
          },
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
  ]);

  if (!player) {
    notFound();
  }

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

  const summary = calculateLeaderboard(
    fullCompletions
      .filter(
        (record) =>
          record.level.status === "RANKED" || record.level.status === "LEGACY",
      )
      .map((record) => ({
        playerId: player.id,
        playerName: player.playerName,
        displayName: player.displayName,
        levelId: record.levelId,
        pointsAwarded: record.currentPoints,
        acceptedAt: record.acceptedAt,
        progress: 100,
        isVerifier: record.isVerifier,
      })),
  )[0];

  const hardestCompletion = fullCompletions
    .filter((r) => r.level.rank !== null)
    .sort((a, b) => (a.level.rank ?? 999) - (b.level.rank ?? 999))[0];

  const canViewPrivate =
    viewer && canSeeSubmission(viewer.role, viewer.id, player.id);
  const isOwnProfile = Boolean(viewer && viewer.id === player.id);
  const profileUrl = absoluteSiteUrl(`/players/${player.playerName}`);

  return (
    <div className="space-y-5">
      <section className="grid gap-4 rounded-md border border-slate-300 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_14px_30px_rgba(0,0,0,0.28)] md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0">
          {isOwnProfile ? (
            <p className="mb-2 text-xs font-black uppercase tracking-[0.08em] text-cyan-800 dark:text-cyan-300">
              Your public profile
            </p>
          ) : null}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge value={player.role} />
            <FactPill label="Handle" value={`@${player.playerName}`} />
            {player.verifiedLevels.length > 0 ? (
              <span className="rounded border border-amber-400 bg-amber-50 px-2 py-0.5 text-xs font-black text-amber-900 dark:border-amber-500/50 dark:bg-amber-950/40 dark:text-amber-200">
                {player.verifiedLevels.length} Verified {player.verifiedLevels.length === 1 ? "Level" : "Levels"}
              </span>
            ) : null}
            {hardestCompletion ? (
              <span className="rounded border border-purple-300 bg-purple-50 px-2 py-0.5 text-xs font-black text-purple-900 dark:border-purple-500/50 dark:bg-purple-950/40 dark:text-purple-200">
                Hardest: {hardestCompletion.level.name} (#{hardestCompletion.level.rank})
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-4xl font-black leading-tight text-slate-950 dark:text-slate-50">
              {player.displayName}
            </h1>
            <CopyButton
              text={profileUrl}
              label="Share Profile"
              copiedLabel="Link Copied!"
            />
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Member since {formatDate(player.createdAt)}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MetricTile label="Total Points" value={summary?.points ?? 0} tone="emerald" />
          <MetricTile label="100% Victories" value={fullCompletions.length} />
          <MetricTile label="Progress Runs" value={progressRecords.length} />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          {/* SECTION 1: 100% COMPLETIONS & VERIFICATIONS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-950 dark:text-slate-50">
                  100% Completions & Verifications
                </h2>
                <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-black text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {fullCompletions.length}
                </span>
              </div>
            </div>

            <SectionPanel className="overflow-hidden">
              {fullCompletions.length > 0 ? (
                fullCompletions.map((record, index) => (
                  <div
                    key={record.id}
                    className={cx(
                      "grid gap-3 border-b border-slate-300 p-3.5 transition last:border-b-0 sm:grid-cols-[3rem_minmax(0,1fr)_6rem_6rem_auto] sm:items-center",
                      record.isVerifier
                        ? "bg-amber-50/40 hover:bg-amber-50/70 dark:bg-amber-950/15 dark:hover:bg-amber-950/30"
                        : "hover:bg-cyan-50/60 dark:border-slate-700 dark:hover:bg-cyan-950/30",
                    )}
                  >
                    <span className="text-xl font-black text-slate-500 tabular-nums dark:text-slate-400">
                      #{index + 1}
                    </span>
                    <span className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/levels/${record.level.slug}`}
                          className="truncate font-black text-slate-950 hover:underline dark:text-slate-50"
                        >
                          {record.level.name}
                        </Link>
                        {record.isVerifier ? (
                          <span className="rounded border border-amber-400 bg-amber-100 px-1.5 py-0.5 text-[10px] font-black uppercase text-amber-900 dark:border-amber-500/60 dark:bg-amber-900/50 dark:text-amber-200">
                            Verifier
                          </span>
                        ) : null}
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {record.isVerifier ? "Official Verification" : `Accepted ${formatDate(record.acceptedAt)}`} at {record.fps} FPS
                      </span>
                    </span>
                    <span className="font-black text-emerald-700 tabular-nums dark:text-emerald-300 sm:text-right">
                      100%
                    </span>
                    <span className="text-right text-xl font-black text-emerald-700 tabular-nums dark:text-emerald-300">
                      {record.currentPoints} pts
                    </span>
                    <a
                      href={record.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 text-xs font-black text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 sm:justify-self-end"
                    >
                      Video
                    </a>
                  </div>
                ))
              ) : (
                <div className="p-4">
                  <EmptyState
                    title="No 100% completions recorded yet"
                    description="100% completions will appear here and award leaderboard points once accepted by staff."
                  />
                  <div className="mt-4">
                    <Link
                      href="/submit"
                      className="inline-flex min-h-10 items-center justify-center rounded-md bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
                    >
                      Submit a record
                    </Link>
                  </div>
                </div>
              )}
            </SectionPanel>
          </div>

          {/* SECTION 2: PROGRESS RECORDS */}
          {progressRecords.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-slate-50">
                    Progress Records
                  </h2>
                  <span className="rounded-md border border-cyan-300 bg-cyan-50 px-2 py-0.5 text-xs font-black text-cyan-800 dark:border-cyan-500/40 dark:bg-cyan-950/40 dark:text-cyan-300">
                    {progressRecords.length}
                  </span>
                </div>
              </div>

              <SectionPanel className="overflow-hidden">
                {progressRecords.map((record, index) => (
                  <div
                    key={record.id}
                    className="grid gap-3 border-b border-slate-300 p-3.5 transition last:border-b-0 hover:bg-cyan-50/60 dark:border-slate-700 dark:hover:bg-cyan-950/30 sm:grid-cols-[3rem_minmax(0,1fr)_6rem_6rem_auto] sm:items-center"
                  >
                    <span className="text-xl font-black text-slate-500 tabular-nums dark:text-slate-400">
                      #{index + 1}
                    </span>
                    <span className="min-w-0">
                      <Link
                        href={`/levels/${record.level.slug}`}
                        className="truncate font-black text-slate-950 hover:underline dark:text-slate-50"
                      >
                        {record.level.name}
                      </Link>
                      <span className="block text-sm text-slate-500 dark:text-slate-400">
                        Accepted {formatDate(record.acceptedAt)} at {record.fps} FPS
                      </span>
                    </span>
                    <span className="font-black text-cyan-700 tabular-nums dark:text-cyan-300 sm:text-right">
                      {record.progress}%
                    </span>
                    <span className="text-right text-sm font-semibold text-slate-400 dark:text-slate-500">
                      0 pts
                    </span>
                    <a
                      href={record.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 text-xs font-black text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 sm:justify-self-end"
                    >
                      Video
                    </a>
                  </div>
                ))}
              </SectionPanel>
            </div>
          ) : null}
        </div>

        {canViewPrivate ? (
          <aside className="space-y-3">
            <h2 className="text-2xl font-black text-slate-950 dark:text-slate-50">Submissions</h2>
            <SectionPanel className="p-4">
              <h3 className="border-b border-slate-300 pb-3 font-black text-slate-950 dark:border-slate-700 dark:text-slate-50">
                Private view
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                Pending, rejected, and needs-changes submissions are visible to
                the player and staff only.
              </p>
              {isOwnProfile ? (
                <div className="mt-4 grid gap-2">
                  <Link
                    href="/submit"
                    className="inline-flex min-h-9 items-center justify-center rounded-md bg-cyan-700 px-3 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
                  >
                    Submit a record
                  </Link>
                  <FieldCopy value={profileUrl} />
                </div>
              ) : null}
            </SectionPanel>
            {player.submissions.length > 0 ? (
              player.submissions.map((submission) => (
                <SectionPanel key={submission.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-black text-slate-950 dark:text-slate-50">
                        {submission.level.name}
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Submitted {formatDateTime(submission.submittedAt)} - {submission.progress ?? 100}%
                      </p>
                    </div>
                    <StatusBadge value={submission.status} />
                  </div>
                  {submission.moderatorNotes ? (
                    <p className="mt-3 rounded-md border border-slate-300 bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                      {submission.moderatorNotes}
                    </p>
                  ) : null}
                </SectionPanel>
              ))
            ) : (
              <EmptyState
                title="No submissions yet"
                description="New submissions from this player will show up here."
              />
            )}
          </aside>
        ) : (
          <aside className="space-y-3">
            <SectionPanel className="p-4">
              <h2 className="border-b border-slate-300 pb-3 font-black text-slate-950 dark:border-slate-700 dark:text-slate-50">
                Public profile
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                This page shows accepted public records only. Private
                submissions are hidden unless you are the player or staff.
              </p>
              <Link
                href="/submit"
                className="mt-4 inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950/50"
              >
                Submit a record
              </Link>
            </SectionPanel>
          </aside>
        )}
      </section>
    </div>
  );
}

function FieldCopy({ value }: { value: string }) {
  return (
    <label className="grid gap-1 text-xs font-bold text-slate-600 dark:text-slate-400">
      Share profile
      <input
        readOnly
        value={value}
        className="min-w-0 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300"
      />
    </label>
  );
}
