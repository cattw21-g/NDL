import {
  BookOpen,
  ClipboardCheck,
  Newspaper,
  Trophy,
  Upload,
} from "lucide-react";
import Link from "next/link";

import { LevelList } from "@/components/level-list";
import { changelogCategoryLabel } from "@/lib/changelog";
import { prisma } from "@/lib/db";
import {
  demoModeEnabled,
  publicChangelogWhere,
  publicLevelWhere,
  publicRecordWhere,
  publicUserWhere,
} from "@/lib/demo-visibility";
import { formatDate } from "@/lib/format";
import { calculateCurrentLevelPoints } from "@/lib/points";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "NDL - Nerfed Demonlist",
  description:
    "Browse the Nerfed Demonlist ranked list, accepted records, player standings, rules, and staff updates.",
};

export default async function Home() {
  const isDemoMode = demoModeEnabled();
  const [levels, pendingCount, acceptedCount, latestRecords, latestPost] =
    await Promise.all([
      prisma.level.findMany({
        where: publicLevelWhere({
          status: {
            in: ["RANKED", "LEGACY"],
          },
        }),
        include: {
          _count: {
            select: {
              records: true,
            },
          },
        },
        orderBy: [{ rank: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
      }),
      prisma.recordSubmission.count({
        where: isDemoMode
          ? {
              status: "PENDING",
            }
          : {
              status: "PENDING",
              isDemo: false,
              level: publicLevelWhere(),
              player: publicUserWhere(),
            },
      }),
      prisma.record.count({
        where: publicRecordWhere(),
      }),
      prisma.record.findMany({
        where: publicRecordWhere(),
        take: 3,
        include: {
          player: true,
          level: true,
        },
        orderBy: {
          acceptedAt: "desc",
        },
      }),
      prisma.changelogPost.findFirst({
        where: publicChangelogWhere(),
        orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      }),
    ]);

  const rankedCount = levels.filter((level) => level.status === "RANKED").length;
  const legacyCount = levels.filter((level) => level.status === "LEGACY").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Official v1.0.0 Stable Rankings
            </div>
            {isDemoMode ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
                Demo mode
              </div>
            ) : null}
          </div>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Nerfed Demonlist
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-zinc-400">
            The definitive competitive ranking for verified nerfed Geometry Dash extreme demons. Main List (#1–75), Extended List (#76–150), partial progress scoring, and national leaderboards.
          </p>

          {/* Quick Metrics */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-2xl">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Ranked Demons</span>
              <p className="mt-1 text-xl font-bold text-white">{rankedCount}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Accepted Records</span>
              <p className="mt-1 text-xl font-bold text-cyan-400">{acceptedCount}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Review Queue</span>
              <p className="mt-1 text-xl font-bold text-amber-400">{pendingCount}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Platform Status</span>
              <p className="mt-1 text-base font-bold text-emerald-400">v1.0.0 Stable</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <main className="min-w-0">
          <LevelList
            levels={levels.map((level) => ({
              slug: level.slug,
              rank: level.rank,
              name: level.name,
              originalName: level.originalName,
              publisher: level.publisher,
              nerfCreator: level.nerfCreator,
              verifier: level.verifier,
              thumbnailUrl: level.thumbnailUrl,
              status: level.status,
              difficulty: level.difficulty,
              points: calculateCurrentLevelPoints(level),
              gdLevelId: level.gdLevelId,
              _count: level._count,
            }))}
          />
        </main>

        <aside className="space-y-3">
          <SidebarCard
            icon={<ClipboardCheck className="h-5 w-5 text-cyan-700" />}
            title="NDL status"
          >
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <SidebarStat label="Ranked" value={rankedCount} />
              <SidebarStat label="Records" value={acceptedCount} />
              <SidebarStat label="Legacy" value={legacyCount} />
              <SidebarStat label="Pending" value={pendingCount} />
            </dl>
          </SidebarCard>

          <SidebarCard
            icon={<BookOpen className="h-5 w-5 text-cyan-700" />}
            title="Submission rules"
          >
            <ul className="space-y-2 text-sm leading-6 text-slate-600">
              <li>Submit the accepted NDL version only.</li>
              <li>Use public video and raw footage links.</li>
              <li>Keep FPS, CBF, click audio, and input details clear.</li>
              <li>Macros and replay bots are banned for records.</li>
            </ul>
            <Link
              href="/rules"
              className="mt-3 inline-flex min-h-9 w-full items-center justify-center rounded-md border border-cyan-300 bg-white px-3 text-sm font-black text-cyan-800 transition hover:bg-cyan-50 dark:border-cyan-500/50 dark:bg-slate-950/60 dark:text-cyan-100 dark:hover:bg-cyan-950/50"
            >
              Read rules
            </Link>
          </SidebarCard>

          <SidebarCard
            icon={<Trophy className="h-5 w-5 text-cyan-700" />}
            title="Latest accepted"
          >
            {latestRecords.length > 0 ? (
              <div className="space-y-2">
                {latestRecords.map((record) => {
                  const recordPoints = calculateCurrentLevelPoints(record.level);

                  return (
                    <a
                      key={record.id}
                      href={record.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition hover:border-cyan-400 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-950/60 dark:hover:border-cyan-400 dark:hover:bg-cyan-950/50"
                    >
                      <span className="block truncate font-black text-slate-900 dark:text-slate-100">
                        {record.player.displayName}
                      </span>
                      <span className="block truncate text-xs font-bold text-slate-500 dark:text-slate-400">
                        {record.level.rank ? `#${record.level.rank} ` : ""}
                        {record.level.name} - {recordPoints} pts
                      </span>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  No accepted records yet. Submit a record to appear here after
                  review.
                </p>
                <Link
                  href="/submit"
                  className="inline-flex min-h-9 w-full items-center justify-center rounded-md border border-cyan-800 bg-cyan-800 px-3 text-sm font-black text-white transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                >
                  Submit a record
                </Link>
              </div>
            )}
          </SidebarCard>

          <SidebarCard
            icon={<Upload className="h-5 w-5 text-cyan-700" />}
            title="How ranking works"
          >
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              Ranked entries use computed points from their current position.
              Accepted records inherit that value, and rank changes update the
              leaderboard.
            </p>
            <Link
              href="/submit"
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-cyan-800 bg-cyan-800 px-3 text-sm font-black text-white transition hover:bg-cyan-700"
            >
              Submit a record
            </Link>
          </SidebarCard>

          <SidebarCard
            icon={<Newspaper className="h-5 w-5 text-cyan-700" />}
            title="Latest update"
          >
            {latestPost ? (
              <div>
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  {changelogCategoryLabel(latestPost.category)} -{" "}
                  {formatDate(latestPost.publishedAt)}
                </p>
                <Link
                  href={`/changelog/${latestPost.slug}`}
                  className="mt-1 block rounded-sm font-black text-slate-950 transition hover:text-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:text-slate-50 dark:hover:text-cyan-200"
                >
                  {latestPost.title}
                </Link>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {latestPost.summary}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Launch notes and staff updates will appear here.
              </p>
            )}
            <Link
              href="/changelog"
              className="mt-3 inline-flex min-h-9 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950/50"
            >
              View changelog
            </Link>
          </SidebarCard>
        </aside>
      </div>
    </div>
  );
}

function SidebarCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white/90 p-5 shadow-xl backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="mb-4 flex items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        {icon}
        <h2 className="font-bold text-zinc-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SidebarStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/60">
      <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-black text-zinc-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}
