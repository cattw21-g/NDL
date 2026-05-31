import {
  ClipboardCheck,
  ExternalLink,
  Layers3,
  LinkIcon,
} from "lucide-react";
import Link from "next/link";

import { reviewLevelSuggestionAction } from "@/actions/level-suggestions";
import { reviewSubmissionAction } from "@/actions/submissions";
import { PageMessage } from "@/components/message";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import {
  EmptyState,
  Eyebrow,
  FactPill,
  FieldLabel,
  inputClass,
  SectionPanel,
} from "@/components/ui";
import { requireModerator } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getModerationQueue } from "@/lib/moderation-queue";
import { isAdminRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const moderator = await requireModerator();
  const [
    params,
    recordSubmissions,
    levelSuggestions,
    recentAcceptedRecords,
    recentRejectedRecords,
    recentSuggestionDecisions,
    actions,
  ] = await Promise.all([
    searchParams,
    getModerationQueue(),
    prisma.levelSuggestion.findMany({
      where: {
        status: {
          in: ["PENDING", "NEEDS_CHANGES", "APPROVED"],
        },
        createdLevelId: null,
      },
      include: {
        submitter: true,
        reviewer: true,
        createdLevel: true,
      },
      orderBy: {
        submittedAt: "asc",
      },
    }),
    prisma.record.findMany({
      take: 5,
      include: {
        player: true,
        level: true,
      },
      orderBy: {
        acceptedAt: "desc",
      },
    }),
    prisma.recordSubmission.findMany({
      take: 5,
      where: {
        status: "REJECTED",
      },
      include: {
        player: true,
        level: true,
      },
      orderBy: {
        reviewedAt: "desc",
      },
    }),
    prisma.levelSuggestion.findMany({
      take: 5,
      where: {
        status: {
          in: ["APPROVED", "REJECTED", "CONVERTED"],
        },
      },
      include: {
        submitter: true,
        createdLevel: true,
      },
      orderBy: {
        reviewedAt: "desc",
      },
    }),
    prisma.moderationAction.findMany({
      include: {
        actor: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
    }),
  ]);
  const canConvertSuggestions = isAdminRole(moderator.role);

  return (
    <div className="space-y-5">
      <section className="grid gap-4 rounded-md border border-slate-300 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_14px_30px_rgba(0,0,0,0.28)] lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-end">
        <div>
          <div className="mb-3">
            <Eyebrow icon={ClipboardCheck}>Moderator queue</Eyebrow>
          </div>
          <h1 className="text-4xl font-black leading-tight text-slate-950 dark:text-slate-50">
            Review intake
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            Records and level suggestions are reviewed separately. Accepted
            records become public; approved suggestions wait for admin
            conversion before they become levels.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MetricQueue label="Record queue" pending={recordSubmissions.length} />
          <MetricQueue label="Level suggestions" pending={levelSuggestions.length} />
        </div>
      </section>

      <PageMessage searchParams={params} />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <QueueBlock
            title="Record submissions"
            description="Pending and needs-changes records awaiting a staff decision."
          >
            {recordSubmissions.length > 0 ? (
              <div className="space-y-4">
                {recordSubmissions.map((submission) => (
                  <RecordReviewCard key={submission.id} submission={submission} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No open record submissions"
                description="Pending or needs-changes records will appear here."
              />
            )}
          </QueueBlock>

          <QueueBlock
            title="Level suggestions"
            description="Suggested nerfed levels awaiting approval, rejection, or changes."
          >
            {levelSuggestions.length > 0 ? (
              <div className="space-y-4">
                {levelSuggestions.map((suggestion) => (
                  <SuggestionReviewCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    canConvert={canConvertSuggestions}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No open level suggestions"
                description="New level candidates will appear here after user submission."
              />
            )}
          </QueueBlock>

          <QueueBlock
            title="Recent accepted"
            description="Recently accepted public records and approved level suggestions."
          >
            <div className="grid gap-3 lg:grid-cols-2">
              <RecentPanel title="Accepted records">
                {recentAcceptedRecords.length > 0 ? (
                  recentAcceptedRecords.map((record) => (
                    <RecentLine
                      key={record.id}
                      title={record.level.name}
                      body={`${record.player.displayName} - ${record.pointsAwarded} pts`}
                      date={formatDateTime(record.acceptedAt)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    No accepted records yet.
                  </p>
                )}
              </RecentPanel>
              <RecentPanel title="Level suggestion decisions">
                {recentSuggestionDecisions.length > 0 ? (
                  recentSuggestionDecisions.map((suggestion) => (
                    <RecentLine
                      key={suggestion.id}
                      title={suggestion.name}
                      body={`${suggestion.status.toLowerCase().replace("_", " ")} by staff`}
                      date={formatDateTime(suggestion.reviewedAt)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    No suggestion decisions yet.
                  </p>
                )}
              </RecentPanel>
            </div>
          </QueueBlock>

          <QueueBlock
            title="Recent rejected"
            description="Recently rejected records remain private to submitter and staff."
          >
            {recentRejectedRecords.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {recentRejectedRecords.map((submission) => (
                  <RecentLine
                    key={submission.id}
                    title={submission.level.name}
                    body={`${submission.player.displayName} - ${submission.moderatorNotes ?? "Rejected"}`}
                    date={formatDateTime(submission.reviewedAt)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No recent rejections"
                description="Rejected records will appear here for staff context."
              />
            )}
          </QueueBlock>
        </div>

        <aside className="space-y-3">
          <SectionPanel className="border-cyan-700/40 p-4">
            <h2 className="border-b border-slate-300 pb-3 font-black text-slate-950 dark:border-slate-700 dark:text-slate-50">
              Review checklist
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <li>Separate record proof from level eligibility review.</li>
              <li>Confirm versions, links, FPS/CBF, overlays, and click audio.</li>
              <li>Leave decision notes that explain what happened.</li>
              <li>Approved suggestions still need admin conversion.</li>
            </ul>
          </SectionPanel>
          <h2 className="text-2xl font-black text-slate-950 dark:text-slate-50">
            Recent actions
          </h2>
          {actions.length > 0 ? (
            actions.map((action) => (
              <SectionPanel key={action.id} className="p-4">
                <StatusBadge value={action.type} />
                <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {action.summary}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {formatDateTime(action.createdAt)} by {action.actor.displayName}
                </p>
              </SectionPanel>
            ))
          ) : (
            <EmptyState
              title="No actions yet"
              description="Moderation history will appear after staff decisions."
            />
          )}
        </aside>
      </section>
    </div>
  );
}

function MetricQueue({ label, pending }: { label: string; pending: number }) {
  return (
    <SectionPanel className="p-4 shadow-none">
      <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-4xl font-black text-cyan-800 tabular-nums dark:text-cyan-200">
        {pending}
      </div>
    </SectionPanel>
  );
}

function QueueBlock({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-2xl font-black text-slate-950 dark:text-slate-50">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function RecordReviewCard({
  submission,
}: {
  submission: Awaited<ReturnType<typeof getModerationQueue>>[number];
}) {
  return (
    <SectionPanel className="overflow-hidden">
      <div className="border-b border-slate-300 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-950/60">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-2xl font-black text-slate-950 dark:text-slate-50">
              {submission.level.name}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {submission.player.displayName} (@{submission.player.playerName})
              {" - "}submitted {formatDateTime(submission.submittedAt)}
            </p>
          </div>
          <StatusBadge value={submission.status} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ProofLink href={submission.videoUrl} label="Video" />
          {submission.rawFootageUrl ? (
            <ProofLink href={submission.rawFootageUrl} label="Raw footage" />
          ) : (
            <FactPill label="Raw" value="missing" />
          )}
          {submission.proofImageUrl ? (
            <ProofLink href={submission.proofImageUrl} label="Proof image" />
          ) : null}
          <FactPill label="FPS" value={submission.fps} />
          <FactPill label="CBF" value={submission.cbfUsed ? "yes" : "no"} />
          <FactPill
            label="Click audio"
            value={submission.clickAudioIncluded ? "yes" : "no"}
          />
          <FactPill
            label="Mic track"
            value={submission.separateMicClickTrack ? "yes" : "no"}
          />
        </div>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-2">
        <ProofBox
          label="Microphone model"
          value={submission.microphoneModel ?? "Not provided"}
        />
        <ProofBox
          label="Input device / key"
          value={submission.inputDevice || submission.deviceNotes}
        />
        <ProofBox
          label="Extra proof notes"
          value={submission.proofNotes ?? submission.clickAudioNotes}
        />
        {submission.comments ? (
          <ProofBox label="Player comments" value={submission.comments} />
        ) : null}
      </div>

      <form
        action={reviewSubmissionAction}
        className="grid gap-3 border-t border-slate-300 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-950/60"
      >
        <input type="hidden" name="submissionId" value={submission.id} />
        <div className="grid gap-3 md:grid-cols-[14rem_1fr]">
          <FieldLabel label="Decision">
            <select name="status" required className={inputClass}>
              <option value="ACCEPTED">Accept</option>
              <option value="REJECTED">Reject</option>
              <option value="NEEDS_CHANGES">Needs changes</option>
            </select>
          </FieldLabel>
          <FieldLabel label="Moderator notes">
            <input
              name="moderatorNotes"
              required
              className={inputClass}
              placeholder="Required decision note"
            />
          </FieldLabel>
        </div>
        <SubmitButton>Save record review</SubmitButton>
      </form>
    </SectionPanel>
  );
}

function SuggestionReviewCard({
  suggestion,
  canConvert,
}: {
  suggestion: {
    id: string;
    name: string;
    originalName: string;
    gdLevelId: string;
    publisher: string;
    nerfCreator: string;
    verifier: string;
    showcaseUrl: string;
    thumbnailUrl: string | null;
    versionNotes: string | null;
    compatibilityNotes: string;
    status: string;
    submittedAt: Date;
    createdLevelId: string | null;
    submitter: { displayName: string; playerName: string };
    createdLevel: { slug: string } | null;
  };
  canConvert: boolean;
}) {
  return (
    <SectionPanel className="overflow-hidden">
      <div className="border-b border-slate-300 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-950/60">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-2xl font-black text-slate-950 dark:text-slate-50">
              {suggestion.name}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {suggestion.submitter.displayName} (@
              {suggestion.submitter.playerName}) - submitted{" "}
              {formatDateTime(suggestion.submittedAt)}
            </p>
          </div>
          <StatusBadge value={suggestion.status} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ProofLink href={suggestion.showcaseUrl} label="Showcase" />
          <FactPill label="Original" value={suggestion.originalName} />
          <FactPill label="GD ID" value={suggestion.gdLevelId} />
          <FactPill label="Host" value={suggestion.publisher} />
          <FactPill label="Nerf" value={suggestion.nerfCreator} />
          <FactPill label="Verifier" value={suggestion.verifier} />
        </div>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-2">
        <ProofBox
          label="Compatibility notes"
          value={suggestion.compatibilityNotes}
        />
        <ProofBox
          label="Version notes"
          value={suggestion.versionNotes ?? "No version notes provided."}
        />
        {suggestion.thumbnailUrl ? (
          <ProofLink href={suggestion.thumbnailUrl} label="Thumbnail" />
        ) : null}
      </div>

      {suggestion.status !== "APPROVED" ? (
        <form
          action={reviewLevelSuggestionAction}
          className="grid gap-3 border-t border-slate-300 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-950/60"
        >
          <input type="hidden" name="suggestionId" value={suggestion.id} />
          <div className="grid gap-3 md:grid-cols-[14rem_1fr]">
            <FieldLabel label="Decision">
              <select name="status" required className={inputClass}>
                <option value="APPROVED">Approve</option>
                <option value="REJECTED">Reject</option>
                <option value="NEEDS_CHANGES">Needs changes</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Moderator notes">
              <input
                name="moderatorNotes"
                required
                className={inputClass}
                placeholder="Required suggestion note"
              />
            </FieldLabel>
          </div>
          <SubmitButton>Save suggestion review</SubmitButton>
        </form>
      ) : (
        <div className="grid gap-3 border-t border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-500/50 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2 font-black text-emerald-900 dark:text-emerald-100">
            <Layers3 className="h-5 w-5" />
            Approved suggestion
          </div>
          {canConvert ? (
            <Link
              href={`/admin/levels?suggestionId=${suggestion.id}#add-level`}
              className="inline-flex min-h-10 w-fit items-center justify-center rounded-md border border-emerald-700 bg-emerald-700 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:border-emerald-300 dark:bg-emerald-300 dark:text-slate-950 dark:hover:bg-emerald-200"
            >
              Convert to ranked level
            </Link>
          ) : (
            <p className="text-sm font-bold leading-6 text-emerald-900 dark:text-emerald-100">
              An admin must convert this approved suggestion into a level.
            </p>
          )}
        </div>
      )}
    </SectionPanel>
  );
}

function ProofLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-9 items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 text-sm font-black text-cyan-800 dark:border-cyan-500/50 dark:bg-cyan-950/40 dark:text-cyan-100"
    >
      <LinkIcon className="h-4 w-4" />
      {label}
      <ExternalLink className="h-4 w-4" />
    </a>
  );
}

function ProofBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-950/60">
      <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">
        {value}
      </p>
    </div>
  );
}

function RecentPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <SectionPanel className="p-4">
      <h3 className="border-b border-slate-300 pb-3 font-black text-slate-950 dark:border-slate-700 dark:text-slate-50">
        {title}
      </h3>
      <div className="mt-3 space-y-3">{children}</div>
    </SectionPanel>
  );
}

function RecentLine({
  title,
  body,
  date,
}: {
  title: string;
  body: string;
  date: string;
}) {
  return (
    <div className="rounded-md border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-950/60">
      <div className="font-black text-slate-950 dark:text-slate-50">{title}</div>
      <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{body}</div>
      <div className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
        {date}
      </div>
    </div>
  );
}
