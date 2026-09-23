import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canManageApplications } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { AdminBetaFeedbackList, type AdminFeedbackItem } from "@/components/admin-beta-feedback-list";
import { ArrowLeft, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Beta Feedback Triage — Admin",
  description: "Review and respond to tester bug reports and feedback.",
};

export default async function AdminBetaFeedbackPage() {
  const user = await getCurrentUser();

  if (!user || !canManageApplications(user.role, user.playerName)) {
    redirect("/login?redirect=/admin/beta-feedback");
  }

  let feedbacks: AdminFeedbackItem[] = [];

  try {
    const rawFeedbacks = await prisma.betaFeedback.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            displayName: true,
            playerName: true,
            role: true,
          },
        },
      },
    });

    feedbacks = rawFeedbacks.map((fb) => ({
      id: fb.id,
      type: fb.type,
      status: fb.status,
      title: fb.title,
      description: fb.description,
      pageUrl: fb.pageUrl,
      browserInfo: fb.browserInfo,
      adminNotes: fb.adminNotes,
      createdAt: fb.createdAt.toISOString(),
      user: {
        displayName: fb.user.displayName,
        playerName: fb.user.playerName,
        role: fb.user.role,
      },
    }));
  } catch (err) {
    console.error("Failed to load admin beta feedback:", err);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Applications Dashboard</span>
        </Link>
      </div>

      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-600 dark:text-purple-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>QA & Testing</span>
        </div>
        <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100 sm:text-3xl">
          Beta Feedback Triage
        </h1>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Track bug reports and feature feedback submitted by Beta Testers and staff.
        </p>
      </div>

      <AdminBetaFeedbackList feedbacks={feedbacks} />
    </div>
  );
}
