import { PlusCircle } from "lucide-react";
import Link from "next/link";

import { PageMessage } from "@/components/message";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, FactPill, PageHeader, SectionPanel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const [params, submissions] = await Promise.all([
    searchParams,
    prisma.recordSubmission.findMany({
      where: {
        playerId: user.id,
      },
      include: {
        level: true,
        reviewer: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
    }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="My submissions"
        description="Pending and rejected records are visible only to you and moderators."
      >
        <Link
          href="/submit"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-cyan-700 bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-600"
        >
          <PlusCircle className="h-4 w-4" />
          New submission
        </Link>
      </PageHeader>

      <PageMessage searchParams={params} />

      <section className="space-y-3">
        {submissions.length > 0 ? (
          submissions.map((submission) => (
            <SectionPanel key={submission.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-black text-slate-950">
                    {submission.level.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Submitted {formatDateTime(submission.submittedAt)}
                  </p>
                </div>
                <StatusBadge value={submission.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <FactPill label="FPS" value={submission.fps} />
                <FactPill label="CBF" value={submission.cbfUsed ? "yes" : "no"} />
                <FactPill
                  label="Click audio"
                  value={submission.clickAudioIncluded ? "yes" : "no"}
                />
                <FactPill
                  label="Raw footage"
                  value={submission.rawFootageIncluded ? "yes" : "no"}
                />
                <a
                  href={submission.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-9 items-center rounded-md border border-cyan-200 bg-cyan-50 px-3 text-sm font-black text-cyan-800"
                >
                  Completion video
                </a>
              </div>
              {submission.moderatorNotes ? (
                <p className="mt-4 rounded-md border border-slate-300 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                  {submission.moderatorNotes}
                </p>
              ) : null}
            </SectionPanel>
          ))
        ) : (
          <EmptyState
            title="No submissions yet"
            description="Submit a run once you have proof links ready for review."
          />
        )}
      </section>
    </div>
  );
}
