import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canManageApplications } from "@/lib/permissions";
import { AdminOpeningEditor } from "@/components/admin-opening-editor";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "New Application Opening — Admin",
  description: "Create a new staff recruitment opening.",
};

export default async function NewAdminOpeningPage() {
  const user = await getCurrentUser();

  if (!user || !canManageApplications(user.role, user.playerName)) {
    redirect("/login?redirect=/admin/applications/new");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Openings</span>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 sm:text-3xl">
          Create Application Opening
        </h1>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Pick an official template or build custom questions for List Reviewers, List Moderators, or Beta Testers.
        </p>
      </div>

      <AdminOpeningEditor />
    </div>
  );
}
