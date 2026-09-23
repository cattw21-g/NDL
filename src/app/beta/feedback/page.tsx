import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isBetaTester } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { SectionPanel } from "@/components/ui";
import { BetaFeedbackForm } from "@/components/beta-feedback-form";
import {
  Sparkles,
  Bug,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Beta Feedback — Nerfed Demonlist",
  description: "Submit bug reports and feedback as an NDL Beta Tester.",
};

export default async function BetaFeedbackPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/beta/feedback");
  }

  if (!isBetaTester(user.role)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Sparkles className="mx-auto h-12 w-12 text-purple-500 opacity-60" />
        <h1 className="mt-4 text-2xl font-black text-slate-900 dark:text-slate-100">
          Beta Access Required
        </h1>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          The Beta Feedback hub is currently reserved for verified NDL Beta Testers and Staff members.
          If you want to help test new features, apply for the Beta Tester position!
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/applications/beta-tester"
            className="inline-flex items-center gap-1.5 rounded-md bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-purple-700"
          >
            <span>Apply as Beta Tester</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    );
  }

  let userFeedbacks: Array<{
    id: string;
    type: string;
    status: string;
    title: string;
    description: string;
    adminNotes: string | null;
    createdAt: Date;
  }> = [];

  try {
    userFeedbacks = await prisma.betaFeedback.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } catch (err) {
    console.error("Failed to load user beta feedback:", err);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-600 dark:text-purple-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Beta Testing Program</span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100 sm:text-3xl">
            Beta Feedback Hub
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Report bugs, UI glitches, or performance issues directly to the development team.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <SectionPanel className="p-6">
          <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
            Submit New Report
          </h2>
          <p className="mt-1 mb-5 text-xs text-slate-500 dark:text-slate-400">
            Provide reproduction steps and device details so we can investigate and fix quickly.
          </p>
          <BetaFeedbackForm />
        </SectionPanel>

        <div className="space-y-4">
          <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
            Your Previous Reports ({userFeedbacks.length})
          </h2>

          {userFeedbacks.length === 0 ? (
            <SectionPanel className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              <Bug className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
              <p className="mt-2 font-semibold">No feedback submitted yet</p>
              <p className="mt-0.5 text-[11px]">Any issues you submit will appear here with live resolution status.</p>
            </SectionPanel>
          ) : (
            <div className="space-y-3">
              {userFeedbacks.map((fb) => {
                const statusStyle = {
                  NEW: "bg-cyan-500/10 text-cyan-700 border-cyan-500/30 dark:text-cyan-300",
                  REVIEWING: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300",
                  FIXED: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
                  WONT_FIX: "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400",
                }[fb.status] || "bg-slate-100 text-slate-600";

                return (
                  <SectionPanel key={fb.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        {fb.type}
                      </span>
                      <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold ${statusStyle}`}>
                        {fb.status}
                      </span>
                    </div>

                    <h4 className="mt-1 text-xs font-bold text-slate-900 dark:text-slate-100">
                      {fb.title}
                    </h4>

                    <p className="mt-1 text-xs text-slate-600 line-clamp-2 dark:text-slate-400">
                      {fb.description}
                    </p>

                    {fb.adminNotes && (
                      <div className="mt-2.5 rounded border border-emerald-500/30 bg-emerald-500/10 p-2 text-[11px] text-emerald-800 dark:text-emerald-200">
                        <span className="font-bold">Dev Note: </span>
                        {fb.adminNotes}
                      </div>
                    )}

                    <div className="mt-2 text-[10px] text-slate-400">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </div>
                  </SectionPanel>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
