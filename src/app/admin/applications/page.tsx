import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canManageApplications } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { SectionPanel } from "@/components/ui";
import {
  FolderKanban,
  Plus,
  Users,
  ChevronRight,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Staff Applications Management — Admin",
  description: "Manage staff application openings, submissions, and role grants.",
};

export default async function AdminApplicationsPage() {
  const user = await getCurrentUser();

  if (!user || !canManageApplications(user.role, user.playerName)) {
    redirect("/login?redirect=/admin/applications");
  }

  let openings: Array<{
    id: string;
    slug: string;
    title: string;
    role: string;
    status: string;
    maxPositions: number | null;
    deadline: Date | null;
    createdAt: Date;
    submissions: Array<{
      id: string;
      status: string;
    }>;
  }> = [];

  try {
    openings = await prisma.applicationOpening.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        submissions: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });
  } catch (err) {
    console.error("Failed to load application openings:", err);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Admin Dashboard</span>
        </Link>
      </div>

      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-600 dark:text-cyan-400">
            <Users className="h-3.5 w-3.5" />
            <span>Staff Recruitment</span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100 sm:text-3xl">
            Staff Applications
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Manage recruitment openings, review candidate responses, and grant staff roles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/beta-feedback"
            className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/40 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 shadow-xs transition hover:bg-purple-100 dark:border-purple-500/40 dark:bg-purple-950/40 dark:text-purple-300"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Beta Feedback</span>
          </Link>
          <Link
            href="/admin/applications/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-cyan-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600"
          >
            <Plus className="h-4 w-4" />
            <span>Create Opening</span>
          </Link>
        </div>
      </div>

      {openings.length === 0 ? (
        <SectionPanel className="p-8 text-center">
          <FolderKanban className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-200">
            No application openings yet
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
            Create your first staff opening using pre-configured templates for List Reviewer, List Moderator, or Beta Tester.
          </p>
          <div className="mt-5">
            <Link
              href="/admin/applications/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-cyan-700"
            >
              <Plus className="h-4 w-4" />
              <span>Create Opening</span>
            </Link>
          </div>
        </SectionPanel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {openings.map((op) => {
            const submittedCount = op.submissions.filter((s) => s.status === "SUBMITTED").length;
            const shortlistedCount = op.submissions.filter((s) => s.status === "SHORTLISTED").length;
            const acceptedCount = op.submissions.filter((s) => s.status === "ACCEPTED").length;
            const totalApplicants = op.submissions.filter((s) => s.status !== "DRAFT").length;

            const statusBadge = {
              OPEN: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
              DRAFT: "bg-amber-500/10 text-amber-600 border-amber-500/30",
              CLOSED: "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400",
              ARCHIVED: "bg-rose-500/10 text-rose-600 border-rose-500/30",
            }[op.status] || "bg-slate-100 text-slate-600";

            return (
              <SectionPanel key={op.id} className="flex flex-col justify-between p-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {op.role.replace(/_/g, " ")}
                    </span>
                    <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${statusBadge}`}>
                      {op.status}
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-black text-slate-900 dark:text-slate-100">
                    {op.title}
                  </h3>

                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2.5 text-center dark:bg-slate-950">
                    <div>
                      <div className="text-base font-black text-cyan-600 dark:text-cyan-400">
                        {submittedCount + shortlistedCount}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500">Pending</div>
                    </div>
                    <div>
                      <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {acceptedCount}
                        {op.maxPositions ? ` / ${op.maxPositions}` : ""}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500">Filled</div>
                    </div>
                    <div>
                      <div className="text-base font-black text-slate-700 dark:text-slate-300">
                        {totalApplicants}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500">Total</div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-200/80 pt-4 dark:border-slate-800/80">
                  <Link
                    href={`/admin/applications/${op.id}`}
                    className="inline-flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950 dark:hover:text-cyan-100"
                  >
                    <span>Manage & Review</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </SectionPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
