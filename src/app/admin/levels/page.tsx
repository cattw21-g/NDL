import { AdminLevelForm } from "@/components/admin-level-form";
import { PageMessage } from "@/components/message";
import { StatusBadge } from "@/components/status-badge";
import {
  EmptyState,
  PageHeader,
  PointsPill,
  RankBadge,
  SectionPanel,
} from "@/components/ui";
import type { LevelFormValues } from "@/lib/level-form-state";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FALLBACK_THUMBNAIL_SRC } from "@/lib/media";
import { formatDateInputValue } from "@/lib/format";
import { calculateCurrentLevelPoints } from "@/lib/points";
import {
  imageUploadProvider,
  maxImageUploadBytes,
} from "@/lib/upload-storage";

export const dynamic = "force-dynamic";

export default async function AdminLevelsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const sourceSuggestionId =
    typeof params.suggestionId === "string" ? params.suggestionId : null;
  const [levels, sourceSuggestion] = await Promise.all([
    prisma.level.findMany({
      orderBy: [{ rank: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    }),
    sourceSuggestionId
      ? prisma.levelSuggestion.findUnique({
          where: {
            id: sourceSuggestionId,
          },
        })
      : null,
  ]);
  const uploads = imageUploadProvider();
  const maxImageMb = Math.round(maxImageUploadBytes() / 1024 / 1024);
  const suggestionValues =
    sourceSuggestion?.status === "APPROVED" && !sourceSuggestion.createdLevelId
      ? levelFormValuesFromSuggestion(sourceSuggestion)
      : undefined;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manage levels"
        description="Rank, approve, reject, retire, or remove NDL entries. Public visibility and scoring come from these fields."
      />

      <PageMessage searchParams={params} />

      <SectionPanel className="p-4">
        <div id="add-level" className="scroll-mt-24">
          <h2 className="text-2xl font-black text-slate-950 dark:text-slate-50">
            {suggestionValues ? "Convert approved suggestion" : "Add level"}
          </h2>
          {sourceSuggestionId && !suggestionValues ? (
            <p className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900 dark:border-amber-500/50 dark:bg-amber-950/40 dark:text-amber-100">
              That suggestion is missing, already converted, or not approved.
            </p>
          ) : null}
          {suggestionValues ? (
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Review the prefilled suggestion data, choose the final status and
              rank, then create the level. The existing rank-shifting system
              will apply.
            </p>
          ) : null}
          <AdminLevelForm
            mode="create"
            initialValues={suggestionValues}
            imageUploadProvider={uploads}
            maxImageMb={maxImageMb}
          />
        </div>
      </SectionPanel>

      <section className="space-y-4">
        {levels.length > 0 ? (
          levels.map((level) => (
            <SectionPanel key={level.id} className="p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 pb-4 dark:border-slate-700">
                <div className="flex min-w-0 items-center gap-3">
                  <RankBadge rank={level.rank} />
                  <div className="min-w-0">
                    <h2 className="truncate text-2xl font-black text-slate-950">
                      {level.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {level.originalName}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <PointsPill points={calculateCurrentLevelPoints(level)} />
                  <StatusBadge value={level.status} />
                </div>
              </div>
              <AdminLevelForm
                mode="edit"
                initialValues={levelFormValues(level)}
                imageUploadProvider={uploads}
                maxImageMb={maxImageMb}
              />
            </SectionPanel>
          ))
        ) : (
          <EmptyState title="No levels created yet" />
        )}
      </section>
    </div>
  );
}

function levelFormValues(level: {
  id: string;
  name: string;
  originalName: string;
  gdLevelId: string;
  publisher: string;
  nerfCreator: string;
  verifier: string;
  thumbnailUrl: string;
  showcaseUrl: string;
  placementDate: Date | null;
  rank: number | null;
  status: string;
  difficulty: string;
  description: string;
  versionNotes: string | null;
}): LevelFormValues {
  return {
    id: level.id,
    sourceSuggestionId: "",
    name: level.name,
    originalName: level.originalName,
    gdLevelId: level.gdLevelId,
    publisher: level.publisher,
    nerfCreator: level.nerfCreator,
    verifier: level.verifier,
    thumbnailFile: "",
    thumbnailUrl: level.thumbnailUrl,
    showcaseUrl: level.showcaseUrl,
    placementDate: formatDateInputValue(level.placementDate),
    rank: level.rank?.toString() ?? "",
    status: level.status,
    difficulty: level.difficulty,
    description: level.description,
    versionNotes: level.versionNotes ?? "",
  };
}

function levelFormValuesFromSuggestion(suggestion: {
  id: string;
  name: string;
  originalName: string;
  gdLevelId: string;
  publisher: string;
  nerfCreator: string;
  verifier: string;
  thumbnailUrl: string | null;
  showcaseUrl: string;
  versionNotes: string | null;
  compatibilityNotes: string;
}): Partial<LevelFormValues> {
  const versionDetails = [
    suggestion.versionNotes
      ? `Version notes: ${suggestion.versionNotes}`
      : null,
    `Macro/replay compatibility notes: ${suggestion.compatibilityNotes}`,
  ].filter((value): value is string => Boolean(value));

  return {
    sourceSuggestionId: suggestion.id,
    name: suggestion.name,
    originalName: suggestion.originalName,
    gdLevelId: suggestion.gdLevelId,
    publisher: suggestion.publisher,
    nerfCreator: suggestion.nerfCreator,
    verifier: suggestion.verifier,
    thumbnailUrl: suggestion.thumbnailUrl ?? FALLBACK_THUMBNAIL_SRC,
    showcaseUrl: suggestion.showcaseUrl,
    placementDate: "",
    rank: "",
    status: "RANKED",
    difficulty: "EXTREME",
    description:
      suggestion.versionNotes ??
      `Community-suggested nerfed version of ${suggestion.originalName}.`,
    versionNotes: versionDetails.join("\n\n"),
  };
}
