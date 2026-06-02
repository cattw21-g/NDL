import {
  ClipboardCheck,
  ExternalLink,
  Layers3,
  LinkIcon,
  Search,
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
import {
  countFilteredLevelSuggestions,
  countFilteredRecordSubmissions,
  getFilteredLevelSuggestions,
  getFilteredRecordSubmissions,
  moderationPageSize,
  parseModerationFilters,
  type LevelSuggestionListItem,
  type ModerationFilters,
  type ModerationSearchParams,
  type RecordSubmissionListItem,
} from "@/lib/moderation-queue";
import { isAdminRole } from "@/lib/permissions";
import { calculateCurrentLevelPoints } from "@/lib/points";

export const dynamic = "force-dynamic";

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const moderator = await requireModerator();
  const params = await searchParams;
  const filters = parseModerationFilters(params);
  const [
    recordSubmissions,
    recordSubmissionCount,
    levelSuggestions,
    levelSuggestionCount,
    recentAcceptedRecords,
    recentRejectedRecords,
    recentSuggestionDecisions,
    actions,
  ] = await Promise.all([
    getFilteredRecordSubmissions(filters.record),
    countFilteredRecordSubmissions(filters.record),
    getFilteredLevelSuggestions(filters.suggestion),
    countFilteredLevelSuggestions(filters.suggestion),
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
  const recordPageCount = Math.max(
    1,
    Math.ceil(recordSubmissionCount / moderationPageSize),
  );
  const suggestionPageCount = Math.max(
    1,
    Math.ceil(levelSuggestionCount / moderationPageSize),
  );

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
          <MetricQueue label="Record matches" pending={recordSubmissionCount} />
          <MetricQueue label="Suggestion matches" pending={levelSuggestionCount} />
        </div>
      </section>

      <PageMessage searchParams={params} />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <QueueBlock
            title="Record submissions"
            description={`${recordSubmissionCount} record submission${recordSubmissionCount === 1 ? "" : "s"} match the current filters.`}
          >
            <RecordFilterForm filters={filters} />
            {recordSubmissions.length > 0 ? (
              <div className="space-y-4">
                {recordSubmissions.map((submission) => (
                  <RecordReviewCard key={submission.id} submission={submission} />
                ))}
                <PaginationControls
                  params={params}
                  pageParam="recordPage"
                  page={filters.record.page}
                  pageCount={recordPageCount}
                  total={recordSubmissionCount}
                />
              </div>
            ) : (
              <EmptyState
                title="No record submissions match these filters."
                description="Adjust search, status, date, level, or player filters."
              />
            )}
          </QueueBlock>

          <QueueBlock
            title="Level suggestions"
            description={`${levelSuggestionCount} level suggestion${levelSuggestionCount === 1 ? "" : "s"} match the current filters.`}
          >
            <SuggestionFilterForm filters={filters} />
            {levelSuggestions.length > 0 ? (
              <div className="space-y-4">
                {levelSuggestions.map((suggestion) => (
                  <SuggestionReviewCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    canConvert={canConvertSuggestions}
                  />
                ))}
                <PaginationControls
                  params={params}
                  pageParam="suggestionPage"
                  page={filters.suggestion.page}
                  pageCount={suggestionPageCount}
                  total={levelSuggestionCount}
                />
              </div>
            ) : (
              <EmptyState
                title="No level suggestions match these filters."
                description="Adjust search, status, date, name, original, or submitter filters."
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
                      body={`${record.player.displayName} - ${calculateCurrentLevelPoints(record.level)} pts`}
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

function RecordFilterForm({ filters }: { filters: ModerationFilters }) {
  return (
    <SectionPanel className="p-3 shadow-none">
      <form action="/moderation" className="grid gap-3" method="get">
        <HiddenSuggestionFields filters={filters} />
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_11rem_1fr_1fr]">
          <FieldLabel label="Search">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={filters.q}
                className={`${inputClass} w-full pl-9`}
                placeholder="Player, level, URL, proof, notes"
              />
            </div>
          </FieldLabel>
          <FieldLabel label="Status">
            <select
              name="recordStatus"
              defaultValue={filters.record.statusParam}
              className={inputClass}
            >
              <option value="">Open queue</option>
              <option value="PENDING">Pending</option>
              <option value="NEEDS_CHANGES">Needs changes</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </FieldLabel>
          <FieldLabel label="Level">
            <input
              name="recordLevel"
              defaultValue={filters.record.level}
              className={inputClass}
              placeholder="Level name"
            />
          </FieldLabel>
          <FieldLabel label="Player">
            <input
              name="recordPlayer"
              defaultValue={filters.record.player}
              className={inputClass}
              placeholder="Player name"
            />
          </FieldLabel>
        </div>
        <div className="grid gap-3 md:grid-cols-[10rem_10rem_minmax(0,1fr)_auto] md:items-end">
          <FieldLabel label="From">
            <input
              type="date"
              name="recordFrom"
              defaultValue={filters.record.fromParam}
              className={inputClass}
            />
          </FieldLabel>
          <FieldLabel label="To">
            <input
              type="date"
              name="recordTo"
              defaultValue={filters.record.toParam}
              className={inputClass}
            />
          </FieldLabel>
          <FieldLabel label="Sort">
            <select
              name="recordSort"
              defaultValue={filters.record.sort}
              className={inputClass}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="rank-high">Highest ranked level first</option>
              <option value="rank-low">Lowest ranked level first</option>
            </select>
          </FieldLabel>
          <button
            type="submit"
            className="min-h-10 rounded-md border border-cyan-800 bg-cyan-800 px-4 text-sm font-black text-white transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            Filter records
          </button>
        </div>
      </form>
    </SectionPanel>
  );
}

function SuggestionFilterForm({ filters }: { filters: ModerationFilters }) {
  return (
    <SectionPanel className="p-3 shadow-none">
      <form action="/moderation" className="grid gap-3" method="get">
        <HiddenRecordFields filters={filters} />
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_11rem_1fr_1fr]">
          <FieldLabel label="Search">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={filters.q}
                className={`${inputClass} w-full pl-9`}
                placeholder="Level, GD ID, submitter, notes"
              />
            </div>
          </FieldLabel>
          <FieldLabel label="Status">
            <select
              name="suggestionStatus"
              defaultValue={filters.suggestion.statusParam}
              className={inputClass}
            >
              <option value="">Open suggestions</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="NEEDS_CHANGES">Needs changes</option>
              <option value="REJECTED">Rejected</option>
              <option value="CONVERTED">Converted</option>
            </select>
          </FieldLabel>
          <FieldLabel label="Suggested level">
            <input
              name="suggestionName"
              defaultValue={filters.suggestion.name}
              className={inputClass}
              placeholder="Suggested name"
            />
          </FieldLabel>
          <FieldLabel label="Original level">
            <input
              name="suggestionOriginal"
              defaultValue={filters.suggestion.original}
              className={inputClass}
              placeholder="Original name"
            />
          </FieldLabel>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem_10rem_minmax(0,1fr)_auto] md:items-end">
          <FieldLabel label="Submitter">
            <input
              name="suggestionSubmitter"
              defaultValue={filters.suggestion.submitter}
              className={inputClass}
              placeholder="Submitter"
            />
          </FieldLabel>
          <FieldLabel label="From">
            <input
              type="date"
              name="suggestionFrom"
              defaultValue={filters.suggestion.fromParam}
              className={inputClass}
            />
          </FieldLabel>
          <FieldLabel label="To">
            <input
              type="date"
              name="suggestionTo"
              defaultValue={filters.suggestion.toParam}
              className={inputClass}
            />
          </FieldLabel>
          <FieldLabel label="Sort">
            <select
              name="suggestionSort"
              defaultValue={filters.suggestion.sort}
              className={inputClass}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="approved">Approved first</option>
              <option value="pending">Pending first</option>
            </select>
          </FieldLabel>
          <button
            type="submit"
            className="min-h-10 rounded-md border border-cyan-800 bg-cyan-800 px-4 text-sm font-black text-white transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            Filter suggestions
          </button>
        </div>
      </form>
    </SectionPanel>
  );
}

function HiddenRecordFields({ filters }: { filters: ModerationFilters }) {
  return (
    <>
      <HiddenField name="recordStatus" value={filters.record.statusParam} />
      <HiddenField name="recordLevel" value={filters.record.level} />
      <HiddenField name="recordPlayer" value={filters.record.player} />
      <HiddenField name="recordFrom" value={filters.record.fromParam} />
      <HiddenField name="recordTo" value={filters.record.toParam} />
      <HiddenField name="recordSort" value={filters.record.sort} />
      <HiddenField name="recordPage" value={String(filters.record.page)} />
    </>
  );
}

function HiddenSuggestionFields({ filters }: { filters: ModerationFilters }) {
  return (
    <>
      <HiddenField
        name="suggestionStatus"
        value={filters.suggestion.statusParam}
      />
      <HiddenField name="suggestionName" value={filters.suggestion.name} />
      <HiddenField
        name="suggestionOriginal"
        value={filters.suggestion.original}
      />
      <HiddenField
        name="suggestionSubmitter"
        value={filters.suggestion.submitter}
      />
      <HiddenField name="suggestionFrom" value={filters.suggestion.fromParam} />
      <HiddenField name="suggestionTo" value={filters.suggestion.toParam} />
      <HiddenField name="suggestionSort" value={filters.suggestion.sort} />
      <HiddenField
        name="suggestionPage"
        value={String(filters.suggestion.page)}
      />
    </>
  );
}

function HiddenField({ name, value }: { name: string; value: string }) {
  if (!value || value === "1" || value === "newest") {
    return null;
  }

  return <input type="hidden" name={name} value={value} />;
}

function PaginationControls({
  params,
  pageParam,
  page,
  pageCount,
  total,
}: {
  params: ModerationSearchParams;
  pageParam: "recordPage" | "suggestionPage";
  page: number;
  pageCount: number;
  total: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-300 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="font-bold text-slate-600 dark:text-slate-300">
        Page {page} of {pageCount} - {total} total
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={moderationPageHref(params, pageParam, page - 1)}
            className="inline-flex min-h-9 items-center rounded-md border border-slate-300 bg-white px-3 font-black text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950"
          >
            Previous
          </Link>
        ) : null}
        {page < pageCount ? (
          <Link
            href={moderationPageHref(params, pageParam, page + 1)}
            className="inline-flex min-h-9 items-center rounded-md border border-cyan-800 bg-cyan-800 px-3 font-black text-white transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function moderationPageHref(
  params: ModerationSearchParams,
  pageParam: "recordPage" | "suggestionPage",
  page: number,
) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) {
          search.append(key, item);
        }
      }
      continue;
    }

    if (value) {
      search.set(key, value);
    }
  }

  if (page <= 1) {
    search.delete(pageParam);
  } else {
    search.set(pageParam, String(page));
  }

  const query = search.toString();
  return query ? `/moderation?${query}` : "/moderation";
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
  submission: RecordSubmissionListItem;
}) {
  const canReview =
    submission.status === "PENDING" || submission.status === "NEEDS_CHANGES";

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

      {canReview ? (
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
      ) : (
        <ReviewSummary
          title="Record decision"
          status={submission.status}
          note={submission.moderatorNotes}
          reviewedAt={submission.reviewedAt}
          reviewer={submission.reviewer?.displayName}
        />
      )}
    </SectionPanel>
  );
}

function SuggestionReviewCard({
  suggestion,
  canConvert,
}: {
  suggestion: LevelSuggestionListItem;
  canConvert: boolean;
}) {
  const canReview =
    suggestion.status === "PENDING" || suggestion.status === "NEEDS_CHANGES";
  const canConvertApproved =
    suggestion.status === "APPROVED" && !suggestion.createdLevelId;

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

      {canReview ? (
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
      ) : canConvertApproved ? (
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
      ) : suggestion.status === "CONVERTED" && suggestion.createdLevel ? (
        <div className="grid gap-3 border-t border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-500/50 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2 font-black text-emerald-900 dark:text-emerald-100">
            <Layers3 className="h-5 w-5" />
            Converted suggestion
          </div>
          <Link
            href={`/levels/${suggestion.createdLevel.slug}`}
            className="inline-flex min-h-10 w-fit items-center justify-center rounded-md border border-emerald-700 bg-emerald-700 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:border-emerald-300 dark:bg-emerald-300 dark:text-slate-950 dark:hover:bg-emerald-200"
          >
            View created level
          </Link>
        </div>
      ) : (
        <ReviewSummary
          title="Suggestion decision"
          status={suggestion.status}
          note={suggestion.moderatorNotes}
          reviewedAt={suggestion.reviewedAt}
          reviewer={suggestion.reviewer?.displayName}
        />
      )}
    </SectionPanel>
  );
}

function ReviewSummary({
  title,
  status,
  note,
  reviewedAt,
  reviewer,
}: {
  title: string;
  status: string;
  note: string | null;
  reviewedAt: Date | null;
  reviewer: string | undefined;
}) {
  return (
    <div className="grid gap-2 border-t border-slate-300 bg-slate-100 p-4 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-black text-slate-950 dark:text-slate-50">
          {title}
        </span>
        <StatusBadge value={status} />
      </div>
      <p>{note ?? "No moderator note recorded."}</p>
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
        {formatDateTime(reviewedAt)}
        {reviewer ? ` by ${reviewer}` : ""}
      </p>
    </div>
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
