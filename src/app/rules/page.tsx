import { BookOpen, GitCompareArrows, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { EmptyState, Eyebrow, SectionPanel } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Rules - NDL",
  description:
    "Official Nerfed Demonlist record, proof, level eligibility, moderation, ranking, and points rules.",
};

export default async function RulesPage() {
  const rules = await prisma.rulesDocument.findFirst({
    where: {
      isActive: true,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });
  const headings =
    rules?.content
      .split("\n")
      .filter((line) => line.startsWith("## "))
      .map((line) => line.replace("## ", "")) ?? [];

  return (
    <div className="space-y-5">
      <section className="grid gap-4 rounded-md border border-slate-300 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_14px_30px_rgba(0,0,0,0.28)] lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
        <div>
          <div className="mb-3">
            <Eyebrow icon={BookOpen}>Public rules</Eyebrow>
          </div>
          <h1 className="text-4xl font-black leading-tight text-slate-950">
            Record rules
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            The proof standards moderators use before accepting and scoring a
            record.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/submit"
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
            >
              Submit a record
            </Link>
            <Link
              href="/suggest-level"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950/50"
            >
              Suggest a level
            </Link>
          </div>
        </div>
        <SectionPanel className="p-4 shadow-none">
          <div className="flex items-center gap-2 font-black text-slate-950">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            Enforcement
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Suspicious footage, missing proof, invalid versions, bad audio, or
            rule violations can be rejected.
          </p>
        </SectionPanel>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <SectionPanel className="p-5">
          {rules ? (
            <>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                Version v1.0 - Last updated {formatDate(rules.updatedAt)}
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                {rules.content.split("\n").map((line, index) => {
                  const key = `${index}-${line}`;
                  if (line.startsWith("## ")) {
                    const title = line.replace("## ", "");
                    return (
                      <h2
                        key={key}
                        id={sectionId(title)}
                        className="pt-4 text-2xl font-black text-slate-950 dark:text-slate-50"
                      >
                        {title}
                      </h2>
                    );
                  }
                  if (line.startsWith("- ")) {
                    return (
                      <p key={key} className="border-l border-cyan-300 pl-3">
                        {line.replace("- ", "")}
                      </p>
                    );
                  }
                  return line.trim() ? <p key={key}>{line}</p> : null;
                })}
              </div>
            </>
          ) : (
            <EmptyState title="No active rules document" />
          )}
        </SectionPanel>
        <aside className="space-y-3">
          {headings.length > 0 ? (
            <SectionPanel className="p-4 lg:sticky lg:top-24">
              <h2 className="border-b border-slate-300 pb-3 text-xl font-black text-slate-950 dark:border-slate-700 dark:text-slate-50">
                Table of contents
              </h2>
              <nav
                aria-label="Rules sections"
                className="mt-3 flex flex-wrap gap-2 lg:grid"
              >
                {headings.map((heading) => (
                  <a
                    key={heading}
                    href={`#${sectionId(heading)}`}
                    className="inline-flex min-h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950/50"
                  >
                    {heading}
                  </a>
                ))}
              </nav>
            </SectionPanel>
          ) : null}
          <SectionPanel className="p-4">
            <h2 className="border-b border-slate-300 pb-3 text-xl font-black text-slate-950">
              Hard bans
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li>Fake or added click sounds</li>
              <li>Speedhack, noclip, macros, replay bots, auto-clickers</li>
              <li>Hitbox-changing tools, input correction, level-modifying hacks</li>
              <li>Skipped endscreen or wrong NDL version</li>
            </ul>
          </SectionPanel>
          <SectionPanel className="p-4">
            <div className="flex items-center gap-2 border-b border-slate-300 pb-3 font-black text-slate-950">
              <GitCompareArrows className="h-5 w-5 text-cyan-800" />
              Nerf fidelity check
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Original replay/macro compatibility is a structural eligibility
              check only. Player records must still be completed legitimately
              without macros or replay bots.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Matching conditions include the same intended route, compatible
              game version and physics expectations, and compatible FPS/CBF
              assumptions. Any exception must be documented and approved by
              moderators.
            </p>
          </SectionPanel>
        </aside>
      </section>
    </div>
  );
}

function sectionId(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
