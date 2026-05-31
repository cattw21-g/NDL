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

export const dynamic = "force-dynamic";

export default async function AdminLevelsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const [params, levels] = await Promise.all([
    searchParams,
    prisma.level.findMany({
      orderBy: [{ rank: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manage levels"
        description="Rank, approve, reject, retire, or remove NDL entries. Public visibility and scoring come from these fields."
      />

      <PageMessage searchParams={params} />

      <SectionPanel className="p-4">
        <h2 className="text-2xl font-black text-slate-950">Add level</h2>
        <AdminLevelForm mode="create" />
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
                  <PointsPill points={level.points} />
                  <StatusBadge value={level.status} />
                </div>
              </div>
              <AdminLevelForm mode="edit" initialValues={levelFormValues(level)} />
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
    name: level.name,
    originalName: level.originalName,
    gdLevelId: level.gdLevelId,
    publisher: level.publisher,
    nerfCreator: level.nerfCreator,
    verifier: level.verifier,
    thumbnailFile: "",
    thumbnailUrl: level.thumbnailUrl,
    showcaseUrl: level.showcaseUrl,
    placementDate: level.placementDate?.toISOString().slice(0, 10) ?? "",
    rank: level.rank?.toString() ?? "",
    status: level.status,
    difficulty: level.difficulty,
    description: level.description,
    versionNotes: level.versionNotes ?? "",
  };
}
