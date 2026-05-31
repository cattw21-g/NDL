import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import {
  EmptyState,
  FactPill,
  MetricTile,
  SectionPanel,
} from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicRecordWhere, publicUserWhere } from "@/lib/demo-visibility";
import { formatDate, formatDateTime } from "@/lib/format";
import { canSeeSubmission } from "@/lib/permissions";
import { calculateLeaderboard } from "@/lib/points";

export const dynamic = "force-dynamic";

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
        records: {
          where: publicRecordWhere(),
          include: {
            level: true,
          },
          orderBy: {
            acceptedAt: "desc",
          },
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

  const summary = calculateLeaderboard(
    player.records
      .filter(
        (record) =>
          record.level.status === "RANKED" || record.level.status === "LEGACY",
      )
      .map((record) => ({
        playerId: player.id,
        playerName: player.playerName,
        displayName: player.displayName,
        levelId: record.levelId,
        pointsAwarded: record.pointsAwarded,
        acceptedAt: record.acceptedAt,
      })),
  )[0];

  const canViewPrivate =
    viewer && canSeeSubmission(viewer.role, viewer.id, player.id);

  return (
    <div className="space-y-5">
      <section className="grid gap-4 rounded-md border border-slate-300 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_14px_30px_rgba(0,0,0,0.28)] md:grid-cols-[minmax(0,1fr)_20rem] md:items-end">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge value={player.role} />
            <FactPill label="Handle" value={`@${player.playerName}`} />
          </div>
          <h1 className="truncate text-4xl font-black leading-tight text-slate-950">
            {player.displayName}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Member since {formatDate(player.createdAt)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MetricTile label="Points" value={summary?.points ?? 0} tone="emerald" />
          <MetricTile label="Records" value={summary?.records ?? 0} />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-3">
          <h2 className="text-2xl font-black text-slate-950">
            Accepted records
          </h2>
          <SectionPanel className="overflow-hidden">
            {player.records.length > 0 ? (
              player.records.map((record, index) => (
                <a
                  key={record.id}
                  href={record.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="grid gap-3 border-b border-slate-300 p-3.5 transition last:border-b-0 hover:bg-cyan-50/60 dark:border-slate-700 dark:hover:bg-cyan-950/30 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-center"
                >
                  <span className="text-xl font-black text-slate-500 tabular-nums">
                    #{index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-black text-slate-950">
                      {record.level.name}
                    </span>
                    <span className="text-sm text-slate-500">
                      Accepted {formatDate(record.acceptedAt)} at {record.fps}{" "}
                      FPS
                    </span>
                  </span>
                  <span className="text-right text-2xl font-black text-emerald-700 tabular-nums">
                    {record.pointsAwarded}
                  </span>
                </a>
              ))
            ) : (
              <div className="p-4">
                <EmptyState
                  title="No accepted records yet"
                  description="Accepted records will appear here after moderator review."
                />
              </div>
            )}
          </SectionPanel>
        </div>

        {canViewPrivate ? (
          <aside className="space-y-3">
            <h2 className="text-2xl font-black text-slate-950">Submissions</h2>
            <SectionPanel className="p-4">
              <h3 className="border-b border-slate-300 pb-3 font-black text-slate-950 dark:border-slate-700 dark:text-slate-50">
                Private view
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Pending, rejected, and needs-changes submissions are visible to
                the player and staff only.
              </p>
            </SectionPanel>
            {player.submissions.length > 0 ? (
              player.submissions.map((submission) => (
                <SectionPanel key={submission.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-black text-slate-950">
                        {submission.level.name}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        Submitted {formatDateTime(submission.submittedAt)}
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
              <p className="mt-3 text-sm leading-6 text-slate-700">
                This page shows accepted public records only. Private
                submissions are hidden unless you are the player or staff.
              </p>
            </SectionPanel>
          </aside>
        )}
      </section>
    </div>
  );
}
