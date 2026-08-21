import {
  ArrowLeft,
  Check,
  Flame,
  Hourglass,
  Plus,
  Trash2,
  Trophy,
} from "lucide-react";
import Link from "next/link";

import {
  assignVerifierAction,
  deleteUpcomingLevelAction,
  deleteUpcomingSuggestionAction,
  moveSuggestionToVerifyingAction,
  moveSuggestionToWaitingAction,
  promoteUpcomingLevelAction,
} from "@/actions/upcoming";
import {
  AdminUpcomingLevelForm,
  UpcomingThumbnailInlineEditor,
} from "@/components/admin-upcoming-form";
import { SafeThumbnail } from "@/components/safe-thumbnail";
import { Eyebrow, MetricTile, SectionPanel, inputClass } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import {
  imageUploadProvider,
  maxImageUploadBytes,
} from "@/lib/upload-storage";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Upcoming Levels Queue - Admin - NDL",
};

export default async function AdminUpcomingPage() {
  await requireAdmin();

  const [pendingLevels, approvedSuggestions] = await Promise.all([
    prisma.level.findMany({
      where: { status: "PENDING" },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.levelSuggestion.findMany({
      where: { status: "APPROVED", createdLevelId: null },
      include: { submitter: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const currentlyVerifying = pendingLevels.filter(
    (lvl) =>
      lvl.verifier &&
      lvl.verifier.trim() !== "" &&
      lvl.verifier.toLowerCase() !== "open" &&
      lvl.verifier.toLowerCase() !== "unassigned",
  );

  const waitingLevels = pendingLevels.filter(
    (lvl) =>
      !lvl.verifier ||
      lvl.verifier.trim() === "" ||
      lvl.verifier.toLowerCase() === "open" ||
      lvl.verifier.toLowerCase() === "unassigned",
  );

  const uploads = imageUploadProvider();
  const maxImageMb = Math.round(maxImageUploadBytes() / 1024 / 1024);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-md border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Admin
              </Link>
              <Eyebrow tone="amber" icon={Hourglass}>
                Queue Administration
              </Eyebrow>
            </div>
            <h1 className="text-3xl font-black text-slate-950 dark:text-slate-50">
              Upcoming Levels Queue
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Manage levels in verification, assign verifiers to waiting levels, update thumbnails, or promote verified levels to the ranked list.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MetricTile label="Verifying" value={currentlyVerifying.length} tone="amber" />
            <MetricTile label="Waiting" value={waitingLevels.length} tone="cyan" />
            <MetricTile label="Suggestions" value={approvedSuggestions.length} tone="emerald" />
          </div>
        </div>
      </section>

      {/* Add New Level to Queue Form */}
      <SectionPanel className="p-5">
        <h2 className="flex items-center gap-2 border-b border-slate-200 pb-3 text-lg font-black text-slate-950 dark:border-slate-800 dark:text-slate-50">
          <Plus className="h-5 w-5 text-cyan-600" />
          Add Level to Upcoming Queue
        </h2>

        <AdminUpcomingLevelForm
          imageUploadProvider={uploads}
          maxImageMb={maxImageMb}
        />
      </SectionPanel>

      {/* 1. Currently Verifying Management */}
      <SectionPanel className="p-5">
        <h2 className="flex items-center gap-2 border-b border-slate-200 pb-3 text-lg font-black text-slate-950 dark:border-slate-800 dark:text-slate-50">
          <Flame className="h-5 w-5 text-amber-500" />
          Currently Verifying ({currentlyVerifying.length})
        </h2>

        <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
          {currentlyVerifying.length > 0 ? (
            currentlyVerifying.map((lvl) => (
              <div
                key={lvl.id}
                className="grid gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  {/* Level Thumbnail */}
                  <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-md border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950 sm:w-36">
                    <SafeThumbnail
                      src={lvl.thumbnailUrl}
                      alt={lvl.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-black text-slate-950 dark:text-slate-100">
                        {lvl.name}
                      </span>
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                        VERIFIER: {lvl.verifier}
                      </span>
                      <span className="text-xs text-slate-500">
                        (Original: {lvl.originalName})
                      </span>
                      {lvl.gdLevelId ? (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono dark:bg-slate-800">
                          GD: {lvl.gdLevelId}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Creator: {lvl.nerfCreator} • Difficulty: {lvl.difficulty} • Added {formatDate(lvl.createdAt)}
                    </p>

                    <div className="pt-1">
                      <UpcomingThumbnailInlineEditor
                        levelId={lvl.id}
                        levelName={lvl.name}
                        currentThumbnailUrl={lvl.thumbnailUrl}
                        imageUploadProvider={uploads}
                        maxImageMb={maxImageMb}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions: Promote or Reassign */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Promote Form */}
                  <form action={promoteUpcomingLevelAction} className="flex items-center gap-1.5">
                    <input type="hidden" name="levelId" value={lvl.id} />
                    <input type="hidden" name="verifier" value={lvl.verifier} />
                    <input
                      name="rank"
                      type="number"
                      min={1}
                      placeholder="Rank #"
                      required
                      title="Placement rank on main list"
                      className={`${inputClass} w-20 text-center font-black`}
                    />
                    <input
                      name="verificationVideoUrl"
                      defaultValue={lvl.verificationVideoUrl || lvl.showcaseUrl || ""}
                      placeholder="Completion Video URL"
                      required
                      className={`${inputClass} w-44 text-xs`}
                    />
                    <button
                      type="submit"
                      className="inline-flex min-h-9 items-center gap-1 rounded-md bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950"
                    >
                      <Trophy className="h-3.5 w-3.5" />
                      Rank & Place on List
                    </button>
                  </form>

                  {/* Delete / Remove */}
                  <form action={deleteUpcomingLevelAction}>
                    <input type="hidden" name="levelId" value={lvl.id} />
                    <button
                      type="submit"
                      title="Remove from queue"
                      className="inline-flex min-h-9 items-center justify-center rounded-md border border-red-300 bg-red-50 px-2.5 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-xs font-semibold text-slate-500">
              No levels actively being verified right now.
            </p>
          )}
        </div>
      </SectionPanel>

      {/* 2. Waiting Levels Management */}
      <SectionPanel className="p-5">
        <h2 className="flex items-center gap-2 border-b border-slate-200 pb-3 text-lg font-black text-slate-950 dark:border-slate-800 dark:text-slate-50">
          <Hourglass className="h-5 w-5 text-cyan-600" />
          Waiting Levels ({waitingLevels.length})
        </h2>

        <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
          {waitingLevels.length > 0 ? (
            waitingLevels.map((lvl) => (
              <div
                key={lvl.id}
                className="grid gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  {/* Level Thumbnail */}
                  <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-md border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950 sm:w-36">
                    <SafeThumbnail
                      src={lvl.thumbnailUrl}
                      alt={lvl.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-black text-slate-950 dark:text-slate-100">
                        {lvl.name}
                      </span>
                      <span className="rounded bg-cyan-100 px-2 py-0.5 text-xs font-black text-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300">
                        OPEN FOR VERIFIER
                      </span>
                      <span className="text-xs text-slate-500">
                        (Original: {lvl.originalName})
                      </span>
                      {lvl.gdLevelId ? (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono dark:bg-slate-800">
                          GD: {lvl.gdLevelId}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Creator: {lvl.nerfCreator} • Difficulty: {lvl.difficulty} • Added {formatDate(lvl.createdAt)}
                    </p>

                    <div className="pt-1">
                      <UpcomingThumbnailInlineEditor
                        levelId={lvl.id}
                        levelName={lvl.name}
                        currentThumbnailUrl={lvl.thumbnailUrl}
                        imageUploadProvider={uploads}
                        maxImageMb={maxImageMb}
                      />
                    </div>
                  </div>
                </div>

                {/* Assign Verifier Form */}
                <div className="flex flex-wrap items-center gap-2">
                  <form action={assignVerifierAction} className="flex items-center gap-1.5">
                    <input type="hidden" name="levelId" value={lvl.id} />
                    <input
                      name="verifier"
                      placeholder="Assign Verifier Name..."
                      required
                      className={`${inputClass} w-44 text-xs`}
                    />
                    <button
                      type="submit"
                      className="inline-flex min-h-9 items-center gap-1 rounded-md bg-cyan-700 px-3 text-xs font-black text-white hover:bg-cyan-800 dark:bg-cyan-500 dark:text-slate-950"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Assign Verifier
                    </button>
                  </form>

                  <form action={deleteUpcomingLevelAction}>
                    <input type="hidden" name="levelId" value={lvl.id} />
                    <button
                      type="submit"
                      title="Remove from queue"
                      className="inline-flex min-h-9 items-center justify-center rounded-md border border-red-300 bg-red-50 px-2.5 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-xs font-semibold text-slate-500">
              No levels currently waiting for a verifier.
            </p>
          )}
        </div>
      </SectionPanel>

      {/* 3. Approved Suggestions in Queue */}
      {approvedSuggestions.length > 0 ? (
        <SectionPanel className="p-5">
          <h2 className="flex items-center gap-2 border-b border-slate-200 pb-3 text-lg font-black text-slate-950 dark:border-slate-800 dark:text-slate-50">
            <Check className="h-5 w-5 text-emerald-600" />
            Approved Suggestions in Queue ({approvedSuggestions.length})
          </h2>

          <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
            {approvedSuggestions.map((sug) => (
              <div
                key={sug.id}
                className="grid gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  {/* Suggestion Thumbnail */}
                  <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-md border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950 sm:w-36">
                    <SafeThumbnail
                      src={sug.thumbnailUrl || "/thumbnails/fallback.png"}
                      alt={sug.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-black text-slate-950 dark:text-slate-100">
                        {sug.name}
                      </span>
                      <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-black text-teal-900 dark:bg-teal-950/60 dark:text-teal-300">
                        SUGGESTION
                      </span>
                      <span className="text-xs text-slate-500">
                        (Original: {sug.originalName})
                      </span>
                      {sug.gdLevelId ? (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono dark:bg-slate-800">
                          GD: {sug.gdLevelId}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Suggested by: {sug.submitter.displayName} • Added {formatDate(sug.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* 1. Move to Waiting Levels */}
                  <form action={moveSuggestionToWaitingAction}>
                    <input type="hidden" name="suggestionId" value={sug.id} />
                    <button
                      type="submit"
                      className="inline-flex min-h-9 items-center gap-1 rounded-md border border-cyan-600 bg-cyan-50 px-3 text-xs font-black text-cyan-900 transition hover:bg-cyan-100 dark:border-cyan-500 dark:bg-cyan-950 dark:text-cyan-200"
                    >
                      <Hourglass className="h-3.5 w-3.5" />
                      Move to Waiting Levels
                    </button>
                  </form>

                  {/* 2. Assign Verifier (Move to Currently Verifying) */}
                  <form action={moveSuggestionToVerifyingAction} className="flex items-center gap-1">
                    <input type="hidden" name="suggestionId" value={sug.id} />
                    <input
                      name="verifier"
                      defaultValue={sug.verifier || ""}
                      placeholder="Verifier name..."
                      required
                      className={`${inputClass} w-36 text-xs`}
                    />
                    <button
                      type="submit"
                      className="inline-flex min-h-9 items-center gap-1 rounded-md bg-amber-600 px-3 text-xs font-black text-white transition hover:bg-amber-700 dark:bg-amber-500 dark:text-slate-950"
                    >
                      <Flame className="h-3.5 w-3.5" />
                      Start Verifying
                    </button>
                  </form>

                  {/* 3. Direct Rank / Convert Link */}
                  <Link
                    href="/admin/levels"
                    className="inline-flex min-h-9 items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    Rank Directly
                  </Link>

                  {/* 4. Delete */}
                  <form action={deleteUpcomingSuggestionAction}>
                    <input type="hidden" name="suggestionId" value={sug.id} />
                    <button
                      type="submit"
                      title="Delete from queue"
                      className="inline-flex min-h-9 items-center justify-center rounded-md border border-red-300 bg-red-50 px-2.5 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>
      ) : null}
    </div>
  );
}
