import {
  Activity,
  BookOpen,
  ClipboardCheck,
  Newspaper,
  ShieldCheck,
  Trophy,
  Upload,
} from "lucide-react";
import Link from "next/link";

import { LevelList } from "@/components/level-list";
import { Eyebrow, MetricTile, SectionPanel } from "@/components/ui";
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
    <div className="space-y-5">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
        <div className="grid gap-4 border-b border-slate-300 bg-[linear-gradient(120deg,#ffffff_0%,#f1f7fa_100%)] p-4 dark:border-slate-700 dark:bg-[linear-gradient(120deg,#101722_0%,#0f2634_100%)] lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Eyebrow icon={Trophy}>Public NDL list</Eyebrow>
              {isDemoMode ? (
                <Eyebrow icon={ShieldCheck} tone="amber">
                  Demo mode enabled
                </Eyebrow>
              ) : (
                <Eyebrow icon={ShieldCheck} tone="emerald">
                  Production-safe view
                </Eyebrow>
              )}
            </div>
            <h1 className="text-balance text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              Nerfed Demonlist
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              A community-ranked list for approved nerfed demon versions, with
              reviewed proof links and points awarded only after moderation.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MetricTile icon={Trophy} label="Ranked" value={rankedCount} />
            <MetricTile
              icon={Activity}
              label="Legacy"
              value={legacyCount}
              tone="zinc"
            />
            <MetricTile
              icon={ClipboardCheck}
              label="Records"
              value={acceptedCount}
              tone="emerald"
            />
          </div>
        </div>
        <div className="grid gap-2 bg-slate-100 p-3 text-sm leading-6 text-slate-700 dark:bg-slate-950/60 dark:text-slate-300 md:grid-cols-[1fr_auto] md:items-center">
          <p>
            {isDemoMode
              ? "Demo mode is enabled, so clearly marked demo levels and records may appear."
              : "Demo entries are hidden from the public list unless demo mode is explicitly enabled."}
          </p>
          <span className="font-bold text-cyan-800">
            {pendingCount} submission{pendingCount === 1 ? "" : "s"} awaiting
            review
          </span>
        </div>
      </section>

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
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                Accepted records will appear here after moderation.
              </p>
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
                  {changelogCategoryLabel(latestPost.category)} ·{" "}
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
                No changelog posts yet.
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
    <SectionPanel className="p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-slate-300 pb-3 dark:border-slate-700">
        {icon}
        <h2 className="font-black text-slate-950">{title}</h2>
      </div>
      {children}
    </SectionPanel>
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
    <div className="rounded-md border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950/60">
      <dt className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-xl font-black text-slate-950 dark:text-slate-50">
        {value}
      </dd>
    </div>
  );
}
