import { GitCompareArrows } from "lucide-react";
import Link from "next/link";

import { EmptyState, SectionPanel } from "@/components/ui";
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-b from-rose-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Demonlist Rules & Guidelines
              </h1>
              <p className="mt-2 max-w-2xl text-sm sm:text-base text-zinc-400">
                The official verification criteria, video proof standards, mod policies, and scoring mechanics enforced by NDL staff.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-rose-500/20 hover:bg-rose-500 transition-colors"
              >
                Submit a record
              </Link>
              <Link
                href="/suggest-level"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                Suggest a level
              </Link>
            </div>
          </div>
        </div>
      </div>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <SectionPanel className="p-6 sm:p-8">
          {rules ? (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Version v1.0 - Last updated {formatDate(rules.updatedAt)}
              </p>
              <div className="mt-6 space-y-4 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                {rules.content.split("\n").map((line, index) => {
                  const key = `${index}-${line}`;
                  if (line.startsWith("## ")) {
                    const title = line.replace("## ", "");
                    return (
                      <h2
                        key={key}
                        id={sectionId(title)}
                        className="pt-6 text-xl font-extrabold text-zinc-900 dark:text-white border-t border-zinc-200 dark:border-zinc-800 first:border-t-0 first:pt-0"
                      >
                        {title}
                      </h2>
                    );
                  }
                  if (line.startsWith("- ")) {
                    return (
                      <p key={key} className="border-l-2 border-rose-500/60 pl-3.5 text-zinc-600 dark:text-zinc-300">
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

        <aside className="space-y-4">
          {headings.length > 0 ? (
            <SectionPanel className="p-5 lg:sticky lg:top-24">
              <h2 className="border-b border-zinc-200 pb-3 font-bold text-zinc-900 dark:border-zinc-800 dark:text-white">
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
                    className="inline-flex min-h-9 items-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 transition hover:border-rose-400 hover:text-rose-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-rose-500 dark:hover:text-white"
                  >
                    {heading}
                  </a>
                ))}
              </nav>
            </SectionPanel>
          ) : null}

          <SectionPanel className="p-5">
            <h2 className="border-b border-zinc-200 pb-3 font-bold text-zinc-900 dark:border-zinc-800 dark:text-white">
              Strict Ban Criteria
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              <li>Fake or added click sounds</li>
              <li>Speedhack, noclip, macros, replay bots, auto-clickers</li>
              <li>Hitbox-changing tools, input correction, level-modifying hacks</li>
              <li>Skipped endscreen or wrong NDL level ID</li>
            </ul>
          </SectionPanel>

          <SectionPanel className="p-5">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 font-bold text-zinc-900 dark:border-zinc-800 dark:text-white">
              <GitCompareArrows className="h-5 w-5 text-rose-500" />
              Nerf Fidelity Requirement
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Original replay/macro compatibility is a structural eligibility check only. Player records must still be completed legitimately without macros or replay bots.
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
