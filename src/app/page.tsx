import {
  AlertTriangle,
  Newspaper,
  Trophy,
  Upload,
} from "lucide-react";
import Link from "next/link";

import { LevelList } from "@/components/level-list";
import { changelogCategoryLabel, DEFAULT_POSTS } from "@/lib/changelog";
import { prisma } from "@/lib/db";
import {
  demoModeEnabled,
  publicChangelogWhere,
  publicLevelWhere,
  publicRecordWhere,
  publicUserWhere,
} from "@/lib/demo-visibility";
import { formatDate } from "@/lib/format";
import { calculateCurrentLevelPoints, type ScoredLevelStatus } from "@/lib/points";
import {
  getLastKnownGoodLevels,
  recordHealthyLevelSnapshot,
} from "@/lib/last-known-good";
import { resolveLevelThumbnail } from "@/lib/media";

export const revalidate = 60;
export const metadata = {
  title: "NDL - Nerfed Demonlist",
  description:
    "Browse the Nerfed Demonlist ranked list, accepted records, player standings, rules, and staff updates.",
};

type LevelItem = {
  slug: string;
  rank: number | null;
  name: string;
  originalName: string;
  publisher: string;
  nerfCreator: string;
  verifier: string;
  thumbnailUrl: string;
  showcaseUrl?: string;
  status: ScoredLevelStatus;
  difficulty: string;
  points: number;
  gdLevelId?: string;
  _count?: { records: number };
};

type RecordItem = {
  id: string;
  videoUrl: string;
  progress: number;
  player: { displayName: string };
  level: { name: string; rank: number | null; status: ScoredLevelStatus; points: number };
};

type ChangelogItem = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: Date | string | null;
};

export default async function Home() {
  const isDemoMode = demoModeEnabled();
  let levels: LevelItem[] = [];
  let pendingCount = 0;
  let acceptedCount = 0;
  let latestRecords: RecordItem[] = [];
  let latestPost: ChangelogItem | null = null;
  let isDegraded = false;

  let fallbackMeta: ReturnType<typeof getLastKnownGoodLevels> | null = null;

  try {
    const results = await Promise.all([
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
        select: {
          id: true,
          videoUrl: true,
          progress: true,
          player: {
            select: {
              displayName: true,
            },
          },
          level: {
            select: {
              name: true,
              rank: true,
              status: true,
              points: true,
            },
          },
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

    levels = results[0];
    pendingCount = results[1];
    acceptedCount = results[2];
    latestRecords = results[3];
    latestPost = results[4];
    recordHealthyLevelSnapshot(levels);
  } catch (err) {
    isDegraded = true;
    console.warn("Database unavailable, falling back to cached/fallback level data:", err);
    fallbackMeta = getLastKnownGoodLevels();
    levels = fallbackMeta.levels.map((lvl) => ({
      ...lvl,
      _count: { records: lvl.recordCount },
    }));
    acceptedCount = 24;
    pendingCount = 1;
  }

  if (levels.length === 0) {
    isDegraded = true;
    if (!fallbackMeta) {
      fallbackMeta = getLastKnownGoodLevels();
    }
    levels = fallbackMeta.levels.map((lvl) => ({
      ...lvl,
      _count: { records: lvl.recordCount },
    }));
  }

  if (!latestPost) {
    latestPost = DEFAULT_POSTS[0];
  }

  const rankedCount = levels.filter((level) => level.status === "RANKED").length;

  return (
    <div className="space-y-6">
      {/* Degraded / Maintenance Mode Banner */}
      {isDegraded ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-xs">
            <p className="text-sm font-bold">Notice: Database in Maintenance Mode</p>
            <p className="mt-0.5 leading-relaxed text-amber-800 dark:text-amber-300">
              {fallbackMeta?.source === "live-cache" || fallbackMeta?.source === "durable-disk"
                ? `Live database is temporarily offline for maintenance. Showing the latest saved list${fallbackMeta.lastHealthyAt ? ` from ${fallbackMeta.lastHealthyAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}. Submissions and account actions will resume automatically once connection is restored.`
                : "The live database is temporarily offline for maintenance. Currently displaying static fallback list data. Submissions, account actions, and live leaderboard updates will resume automatically once the database connection is restored."}
            </p>
          </div>
        </div>
      ) : null}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10">
          {isDemoMode ? (
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
              Demo mode
            </div>
          ) : null}

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Nerfed Demonlist
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-zinc-400">
            Community list for reviewed nerfed demon records and rankings.
          </p>

          {/* Quick Metrics */}
          <div className="mt-6 grid grid-cols-3 gap-3 max-w-lg">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Ranked Demons</span>
              <p className="mt-1 text-xl font-bold text-white">{rankedCount}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Accepted Records</span>
              <p className="mt-1 text-xl font-bold text-cyan-400">{acceptedCount}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Pending Reviews</span>
              <p className="mt-1 text-xl font-bold text-amber-400">{pendingCount}</p>
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
              thumbnailUrl: resolveLevelThumbnail(
                level.slug,
                level.name,
                level.showcaseUrl,
                level.thumbnailUrl,
              ),
              status: level.status,
              difficulty: level.difficulty,
              points: calculateCurrentLevelPoints(level),
              gdLevelId: level.gdLevelId,
              _count: level._count,
            }))}
          />
        </main>

        <aside className="space-y-4">
          {/* Latest News & Announcements Hub */}
          <SidebarCard
            icon={<Newspaper className="h-4 w-4 text-cyan-500" />}
            title="Latest update"
          >
            {latestPost ? (
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                    {changelogCategoryLabel(latestPost.category)}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {formatDate(latestPost.publishedAt)}
                  </span>
                </div>
                <Link
                  href={`/changelog/${latestPost.slug}`}
                  className="mt-2 block font-extrabold text-zinc-950 transition hover:text-cyan-600 dark:text-white dark:hover:text-cyan-400"
                >
                  {latestPost.title}
                </Link>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {latestPost.summary}
                </p>
              </div>
            ) : (
              <p className="text-xs text-zinc-500">
                Staff updates and list news will appear here.
              </p>
            )}

            <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <Link
                href="/changelog"
                className="inline-flex min-h-8 flex-1 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-xs font-bold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                All News
              </Link>
              <Link
                href="/rules"
                className="inline-flex min-h-8 flex-1 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-xs font-bold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                List Rules
              </Link>
            </div>
          </SidebarCard>

          {/* Recent Records Hub */}
          <SidebarCard
            icon={<Trophy className="h-4 w-4 text-amber-500" />}
            title="Latest Accepted Runs"
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
                      className="group flex items-center justify-between rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-2.5 transition hover:border-cyan-400 hover:bg-cyan-50/50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-cyan-500/50 dark:hover:bg-cyan-950/30"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="block truncate text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                          {record.player.displayName}
                        </span>
                        <span className="block truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                          {record.level.rank ? `#${record.level.rank} ` : ""}
                          {record.level.name}
                        </span>
                      </div>
                      <span className="shrink-0 rounded-md border border-zinc-200/80 bg-zinc-100/70 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300">
                        +{recordPoints} pts
                      </span>
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 leading-relaxed">
                No accepted records yet. Submit a record to appear here after review.
              </p>
            )}

            <Link
              href="/submit"
              className="mt-3.5 inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-cyan-600 px-3 text-xs font-bold text-white shadow-md shadow-cyan-500/20 transition hover:bg-cyan-500"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Submit a Record</span>
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
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="mb-3 flex items-center gap-2 border-b border-zinc-100 pb-2.5 dark:border-zinc-800">
        {icon}
        <h2 className="text-sm font-bold text-zinc-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}
