import { ExternalLink, History, ShieldCheck, Upload, Video } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SafeThumbnail } from "@/components/safe-thumbnail";
import { StatusBadge } from "@/components/status-badge";
import {
  EmptyState,
  FactPill,
  MetaTile,
  PointsPill,
  RankBadge,
  SectionPanel,
} from "@/components/ui";
import { prisma } from "@/lib/db";
import {
  demoModeEnabled,
  publicLevelWhere,
  publicRecordWhere,
} from "@/lib/demo-visibility";
import { formatDate, formatDateTime } from "@/lib/format";
import { calculateCurrentLevelPoints } from "@/lib/points";

export const dynamic = "force-dynamic";

export default async function LevelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const level = await prisma.level.findFirst({
    where: publicLevelWhere({
      slug,
    }),
    include: {
      records: {
        where: publicRecordWhere(),
        include: {
          player: true,
        },
        orderBy: {
          acceptedAt: "desc",
        },
      },
      history: {
        include: {
          actor: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!level) {
    notFound();
  }

  const isDemo = demoModeEnabled() && (level.isDemo || level.name.includes("[DEMO]"));
  const currentLevelPoints = calculateCurrentLevelPoints(level);

  return (
    <div className="space-y-5">
      <SectionPanel className="overflow-hidden">
        <div className="grid lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="relative aspect-video min-h-56 border-b border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950 lg:aspect-auto lg:border-b-0 lg:border-r">
            <SafeThumbnail
              src={level.thumbnailUrl}
              alt={`${level.name} thumbnail`}
              className="h-full w-full object-contain"
            />
            <div className="absolute inset-0 bg-[linear-gradient(150deg,rgba(255,255,255,0.08),rgba(8,145,178,0.2))]" />
            {isDemo ? (
              <span className="absolute left-3 top-3 rounded border border-amber-300 bg-white/92 px-2 py-1 text-xs font-black text-amber-800 dark:border-amber-400/60 dark:bg-slate-950/85 dark:text-amber-200">
                DEMO ENTRY
              </span>
            ) : null}
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <RankBadge rank={level.rank} />
              <PointsPill points={currentLevelPoints} />
              <StatusBadge value={level.status} />
              <StatusBadge value={level.difficulty} />
            </div>
            <h1 className="mt-4 text-balance text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              {level.name}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700 sm:text-base">
              {level.description}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetaTile label="Original level" value={level.originalName} />
              <MetaTile label="GD ID" value={level.gdLevelId} />
              <MetaTile label="Publisher/host" value={level.publisher} />
              <MetaTile label="Verifier" value={level.verifier} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <FactPill label="Nerf creator" value={level.nerfCreator} />
              <FactPill label="Placed" value={formatDate(level.placementDate)} />
              <FactPill label="Records" value={level.records.length} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={level.showcaseUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-cyan-800 bg-cyan-800 px-4 text-sm font-black text-white transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                <Video className="h-4 w-4" />
                Showcase
                <ExternalLink className="h-4 w-4" />
              </a>
              <Link
                href="/submit"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950/50"
              >
                <Upload className="h-4 w-4" />
                Submit record
              </Link>
            </div>
          </div>
        </div>
      </SectionPanel>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-slate-950">
              Accepted records
            </h2>
            <FactPill label="Public" value={level.records.length} />
          </div>
          <SectionPanel className="overflow-hidden">
            <div className="hidden grid-cols-[4rem_minmax(0,1fr)_7rem_7rem_7rem] border-b border-slate-300 bg-slate-100 px-4 py-3 text-xs font-black uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-400 md:grid">
              <span>#</span>
              <span>Player</span>
              <span className="text-right">FPS</span>
              <span className="text-right">CBF</span>
              <span className="text-right">Points</span>
            </div>
            {level.records.length > 0 ? (
              level.records.map((record, index) => (
                <a
                  key={record.id}
                  href={record.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="grid gap-3 border-b border-slate-300 p-3.5 transition last:border-b-0 hover:bg-cyan-50/60 dark:border-slate-700 dark:hover:bg-cyan-950/30 md:grid-cols-[4rem_minmax(0,1fr)_7rem_7rem_7rem] md:items-center"
                >
                  <span className="text-xl font-black text-slate-500 tabular-nums">
                    #{index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-black text-slate-950">
                      {record.player.displayName}
                    </span>
                    <span className="text-sm text-slate-500">
                      @{record.player.playerName} - accepted{" "}
                      {formatDate(record.acceptedAt)}
                    </span>
                  </span>
                  <span className="font-bold text-slate-700 tabular-nums md:text-right">
                    {record.fps}
                  </span>
                  <span className="font-bold text-slate-700 md:text-right">
                    {record.cbfUsed ? "yes" : "no"}
                  </span>
                  <span className="text-xl font-black text-emerald-700 tabular-nums md:text-right">
                    {currentLevelPoints}
                  </span>
                </a>
              ))
            ) : (
              <div className="p-4">
                <EmptyState
                  title="No accepted records yet"
                  description="Accepted completions for this level will appear here after review."
                />
              </div>
            )}
          </SectionPanel>
        </div>

        <aside className="space-y-3">
          <SectionPanel className="p-4">
            <div className="flex items-center gap-2 border-b border-slate-300 pb-3 font-black text-slate-950">
              <ShieldCheck className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
              Proof expectations
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li>Click sounds are required for serious records.</li>
              <li>High-ranked levels require raw footage.</li>
              <li>FPS overlay, CPS counter, and endscreen must be visible.</li>
              <li>Submitted versions must match the accepted NDL version.</li>
            </ul>
          </SectionPanel>

          {level.versionNotes ? (
            <SectionPanel className="p-4">
              <h2 className="border-b border-slate-300 pb-3 font-black text-slate-950">
                Version notes
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {level.versionNotes}
              </p>
            </SectionPanel>
          ) : null}

          <SectionPanel className="p-4">
            <div className="flex items-center gap-2 border-b border-slate-300 pb-3 font-black text-slate-950">
              <History className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
              Update history
            </div>
            <div className="mt-3 space-y-3">
              {level.history.length > 0 ? (
                level.history.map((entry) => (
                  <div key={entry.id} className="border-l border-cyan-300 pl-3">
                    <div className="font-black text-slate-950">
                      {entry.action}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDateTime(entry.createdAt)}
                      {entry.actor ? ` by ${entry.actor.displayName}` : ""}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {entry.notes}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-700">No history entries yet.</p>
              )}
            </div>
          </SectionPanel>
        </aside>
      </section>
    </div>
  );
}
