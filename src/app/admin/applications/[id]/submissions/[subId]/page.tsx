import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canManageApplications } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import {
  AdminApplicantReview,
  type QuestionDisplay,
  type NoteDisplay,
} from "@/components/admin-applicant-review";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Candidate Review — Admin",
  description: "Evaluate candidate responses and grant staff roles.",
};

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string; subId: string }>;
}) {
  const { id, subId } = await params;
  const user = await getCurrentUser();

  if (!user || !canManageApplications(user.role, user.playerName)) {
    redirect(`/login?redirect=/admin/applications/${id}/submissions/${subId}`);
  }

  const submission = await prisma.applicationSubmission.findUnique({
    where: { id: subId },
    include: {
      opening: {
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
        },
      },
      user: {
        include: {
          records: {
            where: { isDemo: false },
            select: {
              progress: true,
              pointsAwarded: true,
            },
          },
        },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: { displayName: true, playerName: true },
          },
        },
      },
    },
  });

  if (!submission || submission.openingId !== id) {
    notFound();
  }

  // Count currently accepted
  const currentlyAcceptedCount = await prisma.applicationSubmission.count({
    where: {
      openingId: id,
      status: "ACCEPTED",
    },
  });

  // Calculate points & completions
  const totalPoints = submission.user.records.reduce(
    (acc, r) => acc + (r.pointsAwarded || 0),
    0,
  );
  const completionsCount = submission.user.records.filter((r) => r.progress === 100).length;

  // Resolve questions (snapshot or opening questions)
  let resolvedQuestions: QuestionDisplay[] = [];
  if (submission.questionSnapshot) {
    try {
      resolvedQuestions = JSON.parse(submission.questionSnapshot);
    } catch {
      resolvedQuestions = [];
    }
  }

  if (resolvedQuestions.length === 0) {
    resolvedQuestions = submission.opening.questions.map((q) => ({
      id: q.id,
      order: q.order,
      prompt: q.prompt,
      description: q.description,
      type: q.type,
    }));
  }

  let parsedAnswers: Record<string, unknown> = {};
  try {
    parsedAnswers = JSON.parse(submission.answers);
  } catch {
    parsedAnswers = {};
  }

  const notesList: NoteDisplay[] = submission.notes.map((n) => ({
    id: n.id,
    content: n.content,
    createdAt: n.createdAt.toISOString(),
    authorName: n.author.displayName || n.author.playerName,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href={`/admin/applications/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Submissions</span>
        </Link>
      </div>

      <AdminApplicantReview
        submissionId={submission.id}
        openingId={submission.openingId}
        targetRole={submission.opening.role}
        maxPositions={submission.opening.maxPositions}
        currentlyAcceptedCount={currentlyAcceptedCount}
        currentStatus={submission.status}
        applicant={{
          id: submission.user.id,
          playerName: submission.user.playerName,
          displayName: submission.user.displayName,
          role: submission.user.role,
          discordUsername: submission.user.discordUsername,
          createdAt: submission.user.createdAt.toISOString(),
          rank: null,
          points: totalPoints,
          completionsCount,
        }}
        questions={resolvedQuestions}
        answers={parsedAnswers}
        notes={notesList}
      />
    </div>
  );
}
