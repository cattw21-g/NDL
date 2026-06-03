import { Lightbulb, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { LevelSuggestionForm } from "@/components/level-suggestion-form";
import { PageMessage } from "@/components/message";
import {
  Eyebrow,
  PageHeader,
  SectionPanel,
} from "@/components/ui";
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
    <div className="space-y-5">
      <PageHeader
        eyebrow={<Eyebrow icon={Lightbulb}>Level suggestion</Eyebrow>}
        title="Suggest a nerfed level"
        description="Send staff a level candidate with credits, showcase proof, optional thumbnail media, and compatibility notes."
      >
        <Link
          href="/level-suggestions"
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950/50"
        >
          My suggestions
        </Link>
      </PageHeader>

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
          <SectionPanel className="p-4">
            <div className="flex items-center gap-2 border-b border-slate-300 pb-3 font-black text-slate-950 dark:border-slate-700 dark:text-slate-50">
              <ShieldCheck className="h-5 w-5 text-cyan-800 dark:text-cyan-300" />
              Suggestion checklist
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <li>Use a real GD level ID and stable showcase link.</li>
              <li>Credit the original level, host, nerf creator, and verifier.</li>
              <li>Explain route/timing fidelity and any compatibility exception.</li>
              <li>Staff may replace the thumbnail during review.</li>
              <li>Staff can approve, reject, or request changes.</li>
            </ul>
            <Link
              href="/rules"
              className="mt-4 inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950/50"
            >
              Read the rules
            </Link>
          </SectionPanel>
        </aside>
      </div>
    </div>
  );
}
