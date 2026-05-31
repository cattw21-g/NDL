import { Lightbulb, PlusCircle } from "lucide-react";
import Link from "next/link";

import { PageMessage } from "@/components/message";
import { StatusBadge } from "@/components/status-badge";
import {
  EmptyState,
  Eyebrow,
  FactPill,
  PageHeader,
  SectionPanel,
} from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { isModeratorRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function LevelSuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const canSeeAll = isModeratorRole(user.role);
  const [params, suggestions] = await Promise.all([
    searchParams,
    prisma.levelSuggestion.findMany({
      where: canSeeAll
        ? {}
        : {
            submitterId: user.id,
          },
      include: {
        submitter: true,
        reviewer: true,
        createdLevel: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
    }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<Eyebrow icon={Lightbulb}>Level suggestions</Eyebrow>}
        title={canSeeAll ? "Level suggestion intake" : "My level suggestions"}
        description={
          canSeeAll
            ? "Staff can see all level suggestions. Rejected and needs-changes items remain private."
            : "Track suggested nerfed levels while staff reviews, approves, rejects, or requests changes."
        }
      >
        <Link
          href="/suggest-level"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-cyan-700 bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-600"
        >
          <PlusCircle className="h-4 w-4" />
          Suggest level
        </Link>
      </PageHeader>

      <PageMessage searchParams={params} />

      <section className="space-y-3">
        {suggestions.length > 0 ? (
          suggestions.map((suggestion) => (
            <SectionPanel key={suggestion.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-black text-slate-950 dark:text-slate-50">
                    {suggestion.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Suggested by {suggestion.submitter.displayName} (@
                    {suggestion.submitter.playerName}) -{" "}
                    {formatDateTime(suggestion.submittedAt)}
                  </p>
                </div>
                <StatusBadge value={suggestion.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <FactPill label="Original" value={suggestion.originalName} />
                <FactPill label="GD ID" value={suggestion.gdLevelId} />
                <FactPill label="Host" value={suggestion.publisher} />
                <FactPill label="Nerf" value={suggestion.nerfCreator} />
                <a
                  href={suggestion.showcaseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-8 items-center rounded-md border border-cyan-200 bg-cyan-50 px-3 text-sm font-black text-cyan-800 dark:border-cyan-500/50 dark:bg-cyan-950/40 dark:text-cyan-100"
                >
                  Showcase
                </a>
                {suggestion.createdLevel ? (
                  <Link
                    href={`/levels/${suggestion.createdLevel.slug}`}
                    className="inline-flex min-h-8 items-center rounded-md border border-emerald-300 bg-emerald-50 px-3 text-sm font-black text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-100"
                  >
                    Created level
                  </Link>
                ) : null}
              </div>
              <p className="mt-4 rounded-md border border-slate-300 bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                {suggestion.compatibilityNotes}
              </p>
              {suggestion.moderatorNotes ? (
                <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:border-amber-500/50 dark:bg-amber-950/40 dark:text-amber-100">
                  {suggestion.moderatorNotes}
                </p>
              ) : null}
            </SectionPanel>
          ))
        ) : (
          <EmptyState
            title="No level suggestions yet"
            description="Suggested nerfed levels will appear here after submission."
          />
        )}
      </section>
    </div>
  );
}
