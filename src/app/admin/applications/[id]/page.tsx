import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canManageApplications } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { AdminSubmissionsTable, type SubmissionRow } from "@/components/admin-submissions-table";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Review Applications — Admin",
  description: "Review candidate submissions for this opening.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminOpeningSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || !canManageApplications(user.role, user.playerName)) {
    redirect(`/login?redirect=/admin/applications/${id}`);
  }

  const opening = await prisma.applicationOpening.findUnique({
    where: { id },
    include: {
      submissions: {
        where: {
          status: { not: "DRAFT" },
        },
        orderBy: { submittedAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              playerName: true,
              displayName: true,
              discordUsername: true,
            },
          },
          _count: {
            select: { notes: true },
          },
        },
      },
    },
  });

  if (!opening) {
    notFound();
  }

  const rows: SubmissionRow[] = opening.submissions.map((s) => ({
    id: s.id,
    userId: s.userId,
    playerName: s.user.playerName,
    displayName: s.user.displayName,
    discordUsername: s.user.discordUsername,
    status: s.status,
    submittedAt: s.submittedAt ? s.submittedAt.toISOString() : null,
    rating: s.rating,
    notesCount: s._count.notes,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Openings</span>
        </Link>
      </div>

      <AdminSubmissionsTable
        openingId={opening.id}
        openingTitle={opening.title}
        openingRole={opening.role}
        currentStatus={opening.status}
        maxPositions={opening.maxPositions}
        submissions={rows}
      />
    </div>
  );
}
