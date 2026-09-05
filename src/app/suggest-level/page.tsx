import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { LevelSuggestionForm } from "@/components/level-suggestion-form";
import { PageMessage } from "@/components/message";
import { SectionPanel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import {
  imageUploadProvider,
  maxImageUploadBytes,
} from "@/lib/upload-storage";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Suggest a Level - NDL",
  description:
    "Suggest a nerfed Geometry Dash demon version for Nerfed Demonlist staff review.",
};

export default async function SuggestLevelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const params = await searchParams;
  const uploads = imageUploadProvider();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-purple-400">
                Level Candidates
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Suggest a Nerfed Level
              </h1>
              <p className="mt-2 max-w-2xl text-sm sm:text-base text-zinc-400">
                Submit new or unverified nerfed demon candidates with credits, showcase proof, GD level IDs, and compatibility notes for staff review.
              </p>
            </div>
            <Link
              href="/level-suggestions"
              className="inline-flex items-center gap-2 rounded-lg border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-300 hover:bg-purple-500/20 transition-colors"
            >
              My suggestions →
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-2xl">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Review Status</span>
              <p className="mt-1 text-base font-bold text-emerald-400">Staff Active</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Allowed Nerfs</span>
              <p className="mt-1 text-base font-bold text-purple-400">All Legitimate</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Target GD Version</span>
              <p className="mt-1 text-base font-bold text-white">2.2 & 2.1</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <span className="text-xs text-zinc-400">Video Proof</span>
              <p className="mt-1 text-base font-bold text-amber-400">Showcase/Run</p>
            </div>
          </div>
        </div>
      </div>

      <PageMessage
        searchParams={params}
        successMessage="Level suggestion submitted. Staff will review it before it becomes an NDL level."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <LevelSuggestionForm
          imageUploadProvider={uploads}
          maxImageMb={Math.round(maxImageUploadBytes() / 1024 / 1024)}
        />

        <aside className="space-y-3">
          <SectionPanel className="p-5">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 font-bold text-zinc-900 dark:border-zinc-800 dark:text-white">
              <ShieldCheck className="h-5 w-5 text-purple-500" />
              Suggestion Checklist
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              <li>Use a real GD level ID and stable showcase link.</li>
              <li>Credit the original level, host, nerf creator, and verifier.</li>
              <li><strong className="text-purple-400">Unverified levels allowed:</strong> Nerfed versions of unverified or impossible levels are fully allowed as long as the nerf is legitimately verified.</li>
              <li>Explain route/timing fidelity and any compatibility exception.</li>
              <li>Staff may replace the thumbnail during review.</li>
              <li>Staff can approve, reject, or request changes.</li>
            </ul>
            <Link
              href="/rules"
              className="mt-4 inline-flex min-h-9 w-full items-center justify-center rounded-lg bg-purple-600 px-3 text-sm font-bold text-white shadow-md shadow-purple-500/20 transition hover:bg-purple-500"
            >
              Read full rules
            </Link>
          </SectionPanel>
        </aside>
      </div>
    </div>
  );
}
