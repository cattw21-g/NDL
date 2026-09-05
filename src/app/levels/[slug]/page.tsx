import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  History,
  ShieldCheck,
  Upload,
  Video,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyButton } from "@/components/copy-button";
import { LevelVideoEmbed } from "@/components/level-video-embed";
import { SafeThumbnail } from "@/components/safe-thumbnail";
import { StatusBadge } from "@/components/status-badge";
import { UserLevelSubmissionBanner } from "@/components/user-level-submission-banner";
import { LevelPositionHistory } from "@/components/level-position-history";
import { LevelGdMetadata } from "@/components/level-gd-metadata";
import {
  cx,
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
import { formatDate, formatDateTime, statusLabel } from "@/lib/format";
import { calculateCurrentLevelPoints } from "@/lib/points";
import { absoluteSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Level Detail - NDL",
  description:
    "View a Nerfed Demonlist level's rank, computed points, metadata, and accepted public records.",
};

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
      verifierUser: {
        select: {
          id: true,
          displayName: true,
          playerName: true,
        },
      },
      records: {
        where: publicRecordWhere(),
        select: {
          id: true,
          progress: true,
          isVerifier: true,
          videoUrl: true,
          rawFootageUrl: true,
          fps: true,
          cbfUsed: true,
          acceptedAt: true,
          pointsAwarded: true,
          player: {
            select: {
              id: true,
              displayName: true,
              playerName: true,
            },
          },
          submission: {
            select: {
              submittedAt: true,
            },
          },
        },
        orderBy: [
          { isVerifier: "desc" },
          { progress: "desc" },
          { acceptedAt: "asc" },
        ],
      },
      history: {
        select: {
          id: true,
          action: true,
          notes: true,
          createdAt: true,
          actor: {
            select: {
              displayName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      positionSnapshots: {
        orderBy: {
          recordedAt: "desc",
        },
      },
    },
  });

  if (!level) {
    notFound();
  }

  const isDemo = demoModeEnabled() && (level.isDemo || level.name.includes("[DEMO]"));
  const currentLevelPoints = calculateCurrentLevelPoints(level);
  const description = level.description.trim() || "No description provided.";
  const versionNotes =
    level.versionNotes?.trim() || "No version notes provided.";
  const rankLabel = level.rank ? `#${level.rank}` : "Unranked";

  const victors = level.records.filter((r) => (r.progress ?? 100) === 100);
  const progressRecords = level.records
    .filter((r) => (r.progress ?? 100) < 100)
    .sort(
      (a, b) =>
        (b.progress ?? 0) - (a.progress ?? 0) ||
        a.acceptedAt.getTime() - b.acceptedAt.getTime(),
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <NavAction href="/" icon={<ArrowLeft className="h-4 w-4" />}>
          Back to ranked list
        </NavAction>
        <NavAction href="/submit" icon={<Upload className="h-4 w-4" />}>
          Submit a record
        </NavAction>
        <NavAction href="/rules" icon={<BookOpen className="h-4 w-4" />}>
          Rules
        </NavAction>
        <NavAction href="/suggest-level">Suggest correction</NavAction>
      </div>

      <SectionPanel className="overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
          <div className="relative aspect-video overflow-hidden border-b border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950 lg:min-h-[24rem] lg:border-b-0 lg:border-r">
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

          <div className="flex min-w-0 flex-col justify-between p-4 sm:p-5 lg:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <RankBadge rank={level.rank} />
              <PointsPill points={currentLevelPoints} />
              <StatusBadge value={level.status} />
              <FactPill label="Victors" value={victors.length} />
              {progressRecords.length > 0 ? (
                <FactPill label="Progress" value={progressRecords.length} />
              ) : null}
            </div>
            <h1 className="mt-4 text-balance text-4xl font-black leading-tight text-slate-950 sm:text-5xl dark:text-white">
              {level.name}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-300 sm:text-base">
              Nerfed version of{" "}
              <span className="font-bold">{level.originalName}</span>.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <Metric label="Current rank" value={rankLabel} />
              <Metric label="100% Points" value={`${currentLevelPoints} pts`} />
              <Metric label="Status" value={statusLabel(level.status)} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/submit"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-cyan-800 bg-cyan-800 px-4 text-sm font-black text-white transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                <Upload className="h-4 w-4" />
                Submit record
              </Link>
              <CopyButton
                text={absoluteSiteUrl(`/levels/${level.slug}`)}
                label="Share Level"
                copiedLabel="Link Copied!"
              />
              {level.verificationVideoUrl ? (
                <a
                  href={level.verificationVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-amber-400 bg-amber-50 px-4 text-sm font-black text-amber-900 transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300 dark:border-amber-500/50 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/50"
                >
                  <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Verification video
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
              {level.showcaseUrl ? (
                <a
                  href={level.showcaseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950/50"
                >
                  <Video className="h-4 w-4" />
                  Showcase
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </SectionPanel>

      <UserLevelSubmissionBanner levelId={level.id} />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="space-y-6">
          <LevelVideoEmbed
            verificationUrl={level.verificationVideoUrl}
            showcaseUrl={level.showcaseUrl}
            levelName={level.name}
          />

          <SectionPanel className="p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 pb-4 dark:border-slate-700">
              <h2 className="text-2xl font-black text-slate-950 dark:text-slate-50">
                Level metadata
              </h2>
              <div className="flex flex-wrap gap-2">
                {level.verificationVideoUrl ? (
                  <a
                    href={level.verificationVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-amber-400 bg-amber-50 px-3 text-sm font-black text-amber-900 transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300 dark:border-amber-500/50 dark:bg-amber-950/40 dark:text-amber-200"
                  >
                    Verification proof
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
                {level.showcaseUrl ? (
                  <a
                    href={level.showcaseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-cyan-800 bg-cyan-800 px-3 text-sm font-black text-white transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  >
                    Showcase URL
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <MetaTile label="Original level" value={level.originalName} />
              <MetaTile label="Publisher/host" value={level.publisher} />
              <MetaTile label="Nerf creator" value={level.nerfCreator} />
              <MetaTile
                label="Verifier"
                value={
                  level.verifierUser ? (
                    <Link
                      href={`/players/${level.verifierUser.playerName}`}
                      className="font-black text-cyan-800 underline decoration-cyan-400 hover:text-cyan-600 dark:text-cyan-300"
                    >
                      {level.verifierUser.displayName} (@{level.verifierUser.playerName})
                    </Link>
                  ) : (
                    level.verifier
                  )
                }
              />
              <MetaTile
                label="GD level ID"
                value={
                  <div className="flex items-center gap-2">
                    <span>{level.gdLevelId}</span>
                    <CopyButton
                      text={level.gdLevelId}
                      label="Copy ID"
                      iconOnly
                    />
                  </div>
                }
              />
              <MetaTile
                label="Placement date"
                value={
                  level.placementDate ? formatDate(level.placementDate) : "Not placed"
                }
              />
              <MetaTile
                label="Current status"
                value={<StatusBadge value={level.status} />}
              />
              <MetaTile label="Current rank" value={rankLabel} />
            </div>
          </SectionPanel>

          <div className="grid gap-3 md:grid-cols-2">
            <SectionPanel className="p-4 sm:p-5">
              <h2 className="border-b border-slate-300 pb-3 text-2xl font-black text-slate-950 dark:border-slate-700 dark:text-slate-50">
                Description
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                {description}
              </p>
            </SectionPanel>

            <SectionPanel className="p-4 sm:p-5">
              <h2 className="border-b border-slate-300 pb-3 text-2xl font-black text-slate-950 dark:border-slate-700 dark:text-slate-50">
                Version notes
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">
                {versionNotes}
              </p>
            </SectionPanel>
          </div>

          <LevelGdMetadata
            gdLevelId={level.gdLevelId}
            songName={level.songName}
            songArtist={level.songArtist}
            songId={level.songId}
            songLink={level.songLink}
            levelLength={level.levelLength}
            objectCount={level.objectCount}
            gameVersion={level.gameVersion}
            inGameDifficulty={level.inGameDifficulty}
            copyPassword={level.copyPassword}
            minimumProgress={level.minimumProgress}
          />

          {/* SECTION 1: 100% VICTORS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-950 dark:text-slate-50">
                  100% Victors
                </h2>
                <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-black text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {victors.length} {victors.length === 1 ? "Victor" : "Victors"}
                </span>
              </div>
              <Link
                href="/submit"
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-cyan-800 bg-cyan-800 px-3 text-sm font-black text-white transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                <Upload className="h-4 w-4" />
                Submit 100% record
              </Link>
            </div>

            <SectionPanel className="overflow-hidden">
              <div className="hidden grid-cols-[4rem_minmax(0,1fr)_6rem_7rem_8rem_10rem] border-b border-slate-300 bg-slate-100 px-4 py-3 text-xs font-black uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-400 md:grid">
                <span>#</span>
                <span>Player</span>
                <span className="text-right">Progress</span>
                <span className="text-right">Points</span>
                <span className="text-right">Proof</span>
                <span className="text-right">Video</span>
              </div>
              {victors.length > 0 ? (
                victors.map((record, index) => {
                  const rawFootageOnFile = Boolean(record.rawFootageUrl);
                  const isVerifier = Boolean(record.isVerifier);

                  return (
                    <div
                      key={record.id}
                      className={cx(
                        "grid min-w-0 gap-3 border-b border-slate-300 p-3.5 transition last:border-b-0 md:grid-cols-[4rem_minmax(0,1fr)_6rem_7rem_8rem_10rem] md:items-center",
                        isVerifier
                          ? "bg-amber-50/40 hover:bg-amber-50/70 dark:bg-amber-950/15 dark:hover:bg-amber-950/30"
                          : "hover:bg-cyan-50/60 dark:border-slate-700 dark:hover:bg-cyan-950/30",
                      )}
                    >
                      <span className="flex items-center gap-1.5 text-xl font-black text-slate-500 tabular-nums dark:text-slate-400">
                        #{index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/players/${record.player.playerName}`}
                            className="block truncate font-black text-slate-950 hover:underline dark:text-slate-50"
                          >
                            {record.player.displayName}
                          </Link>
                          {isVerifier ? (
                            <span className="rounded border border-amber-400 bg-amber-100 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-900 dark:border-amber-500/60 dark:bg-amber-900/50 dark:text-amber-200">
                              Verifier
                            </span>
                          ) : null}
                        </span>
                        <span className="block text-sm text-slate-500 dark:text-slate-400">
                          @{record.player.playerName}
                        </span>
                        <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {isVerifier
                            ? `Official Verification - Accepted ${formatDate(record.acceptedAt)}`
                            : `Submitted ${
                                record.submission?.submittedAt
                                  ? formatDate(record.submission.submittedAt)
                                  : "date unavailable"
                              } - Accepted ${formatDate(record.acceptedAt)}`}
                        </span>
                      </span>
                      <span className="font-black text-emerald-700 tabular-nums dark:text-emerald-300 md:text-right">
                        100%
                      </span>
                      <span className="text-xl font-black text-emerald-700 tabular-nums dark:text-emerald-300 md:text-right">
                        {currentLevelPoints}
                      </span>
                      <span className="flex flex-wrap gap-1.5 md:justify-end">
                        <MiniProofPill>Video linked</MiniProofPill>
                        <MiniProofPill>
                          {rawFootageOnFile
                            ? "Raw footage on file"
                            : "Raw footage not listed"}
                        </MiniProofPill>
                        <MiniProofPill>{record.fps} FPS</MiniProofPill>
                        <MiniProofPill>CBF {record.cbfUsed ? "yes" : "no"}</MiniProofPill>
                      </span>
                      <a
                        href={record.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950/50 md:justify-self-end"
                      >
                        Completion video
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  );
                })
              ) : (
                <div className="p-4">
                  <EmptyState
                    title="No 100% victors recorded yet"
                    description="Submit a 100% completion record to claim points and secure your spot on the victor list."
                  />
                </div>
              )}
            </SectionPanel>
          </div>

          {/* SECTION 2: PROGRESS RECORDS (<100%) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-950 dark:text-slate-50">
                  Progress Records
                </h2>
                <span className="rounded-md border border-cyan-300 bg-cyan-50 px-2 py-0.5 text-xs font-black text-cyan-800 dark:border-cyan-500/40 dark:bg-cyan-950/40 dark:text-cyan-300">
                  {progressRecords.length} {progressRecords.length === 1 ? "Record" : "Records"}
                </span>
              </div>
            </div>

            <SectionPanel className="overflow-hidden">
              <div className="hidden grid-cols-[4rem_minmax(0,1fr)_6rem_7rem_8rem_10rem] border-b border-slate-300 bg-slate-100 px-4 py-3 text-xs font-black uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-400 md:grid">
                <span>#</span>
                <span>Player</span>
                <span className="text-right">Progress</span>
                <span className="text-right">Points</span>
                <span className="text-right">Proof</span>
                <span className="text-right">Video</span>
              </div>
              {progressRecords.length > 0 ? (
                progressRecords.map((record, index) => {
                  const rawFootageOnFile = Boolean(record.rawFootageUrl);

                  return (
                    <div
                      key={record.id}
                      className="grid min-w-0 gap-3 border-b border-slate-300 p-3.5 transition last:border-b-0 hover:bg-cyan-50/60 dark:border-slate-700 dark:hover:bg-cyan-950/30 md:grid-cols-[4rem_minmax(0,1fr)_6rem_7rem_8rem_10rem] md:items-center"
                    >
                      <span className="text-xl font-black text-slate-500 tabular-nums dark:text-slate-400">
                        #{index + 1}
                      </span>
                      <span className="min-w-0">
                        <Link
                          href={`/players/${record.player.playerName}`}
                          className="block truncate font-black text-slate-950 hover:underline dark:text-slate-50"
                        >
                          {record.player.displayName}
                        </Link>
                        <span className="block text-sm text-slate-500 dark:text-slate-400">
                          @{record.player.playerName}
                        </span>
                        <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Accepted {formatDate(record.acceptedAt)}
                        </span>
                      </span>
                      <span className="font-black text-cyan-700 tabular-nums dark:text-cyan-300 md:text-right">
                        {record.progress}%
                      </span>
                      <span className="text-sm font-semibold text-slate-400 tabular-nums dark:text-slate-500 md:text-right">
                        0 pts (progress)
                      </span>
                      <span className="flex flex-wrap gap-1.5 md:justify-end">
                        <MiniProofPill>{record.fps} FPS</MiniProofPill>
                        <MiniProofPill>CBF {record.cbfUsed ? "yes" : "no"}</MiniProofPill>
                        {rawFootageOnFile ? (
                          <MiniProofPill>Raw footage</MiniProofPill>
                        ) : null}
                      </span>
                      <a
                        href={record.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950/50 md:justify-self-end"
                      >
                        Progress video
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  );
                })
              ) : (
                <div className="p-4">
                  <EmptyState
                    title="No progress runs submitted yet"
                    description="If you haven't beaten the level 100% yet, you can submit your progress percentage (e.g. 70%) to be recorded here."
                  />
                </div>
              )}
            </SectionPanel>
          </div>
        </div>

        <aside className="space-y-3">
          <SectionPanel className="p-4">
            <div className="flex items-center gap-2 border-b border-slate-300 pb-3 font-black text-slate-950 dark:border-slate-700 dark:text-slate-50">
              <ShieldCheck className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
              Proof expectations
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <li>100% completions award full ranking points.</li>
              <li>Progress runs are tracked for community milestones.</li>
              <li>Click sounds are required for serious records.</li>
              <li>High-ranked levels require raw footage on file.</li>
              <li>FPS overlay, CPS counter, and endscreen must be visible.</li>
            </ul>
          </SectionPanel>

          <SectionPanel className="p-4">
            <h2 className="border-b border-slate-300 pb-3 font-black text-slate-950 dark:border-slate-700 dark:text-slate-50">
              Quick links
            </h2>
            <div className="mt-3 grid gap-2">
              <NavAction href="/">Back to ranked list</NavAction>
              <NavAction href="/submit">Submit a record</NavAction>
              <NavAction href="/rules">Rules</NavAction>
              <NavAction href="/suggest-level">Suggest level/correction</NavAction>
            </div>
          </SectionPanel>

          <LevelPositionHistory
            currentRank={level.rank}
            snapshots={level.positionSnapshots}
            placementDate={level.placementDate}
            levelName={level.name}
          />

          <SectionPanel className="p-4">
            <div className="flex items-center gap-2 border-b border-slate-300 pb-3 font-black text-slate-950 dark:border-slate-700 dark:text-slate-50">
              <History className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
              Update history
            </div>
            <div className="mt-3 space-y-3">
              {level.history.length > 0 ? (
                level.history.map((entry) => (
                  <div key={entry.id} className="border-l border-cyan-300 pl-3 dark:border-cyan-500">
                    <div className="font-black text-slate-950 dark:text-slate-100">
                      {entry.action}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDateTime(entry.createdAt)}
                      {entry.actor ? ` by ${entry.actor.displayName}` : ""}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">
                      {entry.notes}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-400">No history entries yet.</p>
              )}
            </div>
          </SectionPanel>
        </aside>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-950/60">
      <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-2xl font-black text-slate-950 dark:text-slate-50">
        {value}
      </div>
    </div>
  );
}

function MiniProofPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex min-h-7 items-center rounded-md border border-slate-300 bg-white px-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
      {children}
    </span>
  );
}

function NavAction({
  href,
  icon,
  children,
}: {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950/50 dark:hover:text-cyan-100"
    >
      {icon}
      {children}
    </Link>
  );
}
