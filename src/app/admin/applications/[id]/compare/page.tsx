import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canManageApplications } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { ArrowLeft, Scale, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Compare Candidates — Admin",
  description: "Side-by-side comparison of candidate application responses.",
};

export default async function AdminCompareApplicantsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ids?: string }>;
}) {
  const { id } = await params;
  const { ids } = await searchParams;

  const user = await getCurrentUser();
  if (!user || !canManageApplications(user.role, user.playerName)) {
    redirect(`/login?redirect=/admin/applications/${id}`);
  }

  const opening = await prisma.applicationOpening.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!opening) {
    notFound();
  }

  const candidateIds = (ids || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (candidateIds.length < 2) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Scale className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
        <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">
          Select at least 2 candidates to compare
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Go back to the submissions list and select 2 to 4 candidates using the checkboxes.
        </p>
        <div className="mt-4">
          <Link
            href={`/admin/applications/${id}`}
            className="inline-flex items-center gap-1.5 rounded bg-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs"
          >
            <span>Back to submissions</span>
          </Link>
        </div>
      </div>
    );
  }

  const submissions = await prisma.applicationSubmission.findMany({
    where: {
      id: { in: candidateIds },
      openingId: id,
    },
    include: {
      user: {
        include: {
          records: {
            where: { isDemo: false },
            select: { pointsAwarded: true, progress: true },
          },
        },
      },
    },
  });

  const parsedSubmissions = submissions.map((sub) => {
    let answers: Record<string, unknown> = {};
    try {
      answers = JSON.parse(sub.answers);
    } catch {
      answers = {};
    }

    const totalPoints = sub.user.records.reduce((acc, r) => acc + (r.pointsAwarded || 0), 0);
    const completions = sub.user.records.filter((r) => r.progress === 100).length;

    return {
      id: sub.id,
      userId: sub.user.id,
      displayName: sub.user.displayName,
      playerName: sub.user.playerName,
      role: sub.user.role,
      discord: sub.user.discordUsername || "—",
      status: sub.status,
      submittedAt: sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : "—",
      points: totalPoints,
      completions,
      answers,
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/admin/applications/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Submissions</span>
        </Link>

        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-purple-500" />
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
            Comparing {parsedSubmissions.length} Candidates
          </span>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
          Candidate Comparison: {opening.title}
        </h1>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Review candidate responses side-by-side for consistent and fair evaluation.
        </p>
      </div>

      <div className="overflow-x-auto pb-6">
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${parsedSubmissions.length}, minmax(280px, 1fr))`,
            minWidth: `${parsedSubmissions.length * 300}px`,
          }}
        >
          {/* Candidate Headers */}
          {parsedSubmissions.map((cand) => (
            <div
              key={cand.id}
              className="sticky top-0 z-10 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Candidate</span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {cand.status}
                </span>
              </div>

              <h3 className="mt-1 text-base font-black text-slate-900 dark:text-slate-100">
                {cand.displayName}
              </h3>
              <p className="text-xs text-slate-400">@{cand.playerName}</p>

              <div className="mt-3 grid grid-cols-2 gap-2 rounded bg-slate-50 p-2 text-[11px] dark:bg-slate-950">
                <div>
                  <div className="text-slate-400">Discord</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {cand.discord}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Completions</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {cand.completions} ({cand.points.toFixed(0)} pts)
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <Link
                  href={`/admin/applications/${id}/submissions/${cand.id}`}
                  className="inline-flex w-full items-center justify-center gap-1 rounded bg-cyan-600 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-cyan-700"
                >
                  <span>Full Review</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}

          {/* Question Rows */}
          {opening.questions.map((q, idx) => (
            <div
              key={q.id}
              className="col-span-full mt-4 rounded-xl border border-slate-200 bg-slate-100/70 p-3 text-xs font-black text-slate-900 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
            >
              <span className="text-cyan-600 dark:text-cyan-400">Q{idx + 1}: </span>
              {q.prompt}
              {q.description && (
                <span className="ml-2 font-normal text-slate-500">({q.description})</span>
              )}
            </div>
          ))}
        </div>

        {/* Question Answers Grid */}
        <div className="mt-2 space-y-6">
          {opening.questions.map((q) => (
            <div
              key={q.id}
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${parsedSubmissions.length}, minmax(280px, 1fr))`,
                minWidth: `${parsedSubmissions.length * 300}px`,
              }}
            >
              {parsedSubmissions.map((cand) => {
                const ans = cand.answers[q.id];
                const displayAns =
                  ans === undefined || ans === null
                    ? "(No answer provided)"
                    : typeof ans === "object"
                      ? JSON.stringify(ans)
                      : String(ans);

                return (
                  <div
                    key={`${cand.id}-${q.id}`}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 text-xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">
                      {displayAns}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
