import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SectionPanel } from "@/components/ui";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Applications — Nerfed Demonlist",
  description: "View and manage your staff applications for Nerfed Demonlist.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function MyApplicationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/applications/mine");
  }

  let submissions: Array<{
    id: string;
    status: string;
    submittedAt: Date | null;
    createdAt: Date;
    opening: {
      id: string;
      slug: string;
      title: string;
      role: string;
      status: string;
    };
  }> = [];

  try {
    submissions = await prisma.applicationSubmission.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        opening: {
          select: {
            id: true,
            slug: true,
            title: true,
            role: true,
            status: true,
          },
        },
      },
    });
  } catch (err) {
    console.error("Failed to load user applications:", err);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 sm:text-3xl">
            My Applications
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Track the status of your staff applications and submitted responses.
          </p>
        </div>

        <Link
          href="/applications"
          className="inline-flex items-center gap-1.5 self-start rounded-md bg-cyan-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600"
        >
          <span>Browse Openings</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {submissions.length === 0 ? (
        <SectionPanel className="p-8 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-200">
            No applications yet
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
            You haven&apos;t submitted any staff applications yet. Check out open positions to apply as a List Reviewer, List Moderator, or Beta Tester.
          </p>
          <div className="mt-5">
            <Link
              href="/applications"
              className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500 bg-cyan-50 px-4 py-2 text-xs font-bold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-500/40 dark:bg-cyan-950/40 dark:text-cyan-300"
            >
              <span>View Openings</span>
            </Link>
          </div>
        </SectionPanel>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const statusConfig = {
              ACCEPTED: {
                label: "Accepted",
                classes: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                icon: CheckCircle2,
              },
              SHORTLISTED: {
                label: "Under Review / Shortlisted",
                classes: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
                icon: Clock,
              },
              SUBMITTED: {
                label: "Submitted",
                classes: "border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
                icon: Clock,
              },
              DRAFT: {
                label: "Draft",
                classes: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                icon: FileText,
              },
              REJECTED: {
                label: "Closed",
                classes: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
                icon: AlertCircle,
              },
              WITHDRAWN: {
                label: "Withdrawn",
                classes: "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400",
                icon: RotateCcw,
              },
            }[sub.status] || {
              label: sub.status,
              classes: "border-slate-300 bg-slate-100 text-slate-700",
              icon: Clock,
            };

            const StatusIcon = statusConfig.icon;

            return (
              <SectionPanel key={sub.id} className="p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {sub.opening.role.replace(/_/g, " ")}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${statusConfig.classes}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        <span>{statusConfig.label}</span>
                      </span>
                    </div>

                    <h3 className="mt-1 text-base font-black text-slate-900 dark:text-slate-100">
                      {sub.opening.title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {sub.submittedAt
                        ? `Submitted on ${new Date(sub.submittedAt).toLocaleDateString()}`
                        : `Started draft on ${new Date(sub.createdAt).toLocaleDateString()}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/applications/${sub.opening.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950 dark:hover:text-cyan-100"
                    >
                      <span>{sub.status === "DRAFT" ? "Continue Draft" : "View Application"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </SectionPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
