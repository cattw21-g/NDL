import { GitCompareArrows } from "lucide-react";
import Link from "next/link";

import { EmptyState, SectionPanel } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const revalidate = 300;
export const metadata = {
  title: "Rules - NDL",
  description:
    "Official Nerfed Demonlist record, proof, level eligibility, moderation, ranking, and points rules.",
};

const FALLBACK_RULES = {
  id: "default-rules",
  version: "1.5.0",
  isActive: true,
  publishedAt: new Date("2026-09-01"),
  updatedAt: new Date("2026-09-01"),
  content: `## General policy
- NDL ranks approved nerfed Geometry Dash demon versions and accepted records on those versions.
- Every record and level suggestion is reviewed by staff before it affects public rankings or points.
- High-ranked means main-list rank #1-#50 unless staff states otherwise.
- Staff may request extra proof when a run, level version, link, or technical detail is unclear.

## Record requirements
- Records must be completed on the accepted NDL level version and show a full completion, endscreen, FPS, and enough context for moderators to identify the run.
- The submitted completion video must be watchable by staff and must match the player, level, and version being claimed.
- Players must report FPS, CBF usage, input method, click/audio proof, and any relevant recording notes.
- A record is not public and does not award points until staff accepts it.

## Video and raw footage
- Completion video links are the primary proof method and should use stable public or reviewer-accessible URLs.
- Raw footage is required for high-ranked records and may be requested for any suspicious, borderline, or technically unusual run.
- Raw footage links are visible only to staff unless the submitter chooses to make them public.
- Do not cut away from the run before the completion and endscreen are clear enough to review.

## Click audio and microphone proof
- Click audio is required for serious records. Fake, added, replaced, or edited click sounds are banned.
- Separate microphone or click tracks are required for high-ranked records and strongly recommended for all records.
- Game audio should be present unless a moderator explicitly accepts a documented reason.
- Audio should line up with visible inputs and gameplay timing.

## Overlays and visibility
- FPS, CPS, cheat indicators, and other proof overlays should remain visible when they are relevant to the run.
- Overlay-only tools may be used for display and proof, but they must not alter gameplay, inputs, hitboxes, physics, or level data.
- Staff may reject proof that hides important UI, crops essential context, or makes the run difficult to verify.

## Allowed tools and settings
- CBF is allowed for records unless a future rules update changes this policy.
- Standard recording, streaming, input display, FPS display, and non-gameplay overlay tools are allowed.
- Practice, start position, or macro tools may be used for routing and verification work outside submitted record attempts.

## Banned tools and methods
- Physics bypass is not allowed unless NDL publishes a specific exception for a level or category.
- Speedhack, noclip, macros, replay bots, auto-clickers, hitbox-changing tools, input correction, and level-modifying hacks are banned for records.
- Original replay or macro compatibility is only a structural level-eligibility check. It is never an allowed record method.
- Submitted records must be human completions, not replayed or automated completions.

## Level eligibility
- Eligible nerfs need a real Geometry Dash level ID, clear publisher or host credit, original level credit, nerf creator credit, verifier credit, and a stable showcase.
- **Nerfed versions of unverified levels ARE allowed**: You are explicitly permitted to create and suggest nerfed versions of unverified levels (such as unverified upcoming top demons, impossible levels, or work-in-progress projects), as long as the nerfed version has been legitimately verified and uploaded to Geometry Dash servers.
- A nerfed level should preserve the original route, click timing, speed, portals, gamemode order, and progression closely enough that original replay or macro compatibility is plausible under matching conditions.
- Matching conditions include game version, physics expectations, FPS/CBF assumptions, intended route, and documented exceptions for bugfixes, impossible original transitions, or necessary compatibility changes.
- Staff may reject a suggestion if the level is not identifiable, is too far from the original, or cannot be reviewed safely.

## Submissions and review
- Submitters should provide working links, accurate credits, and enough detail for staff to reproduce the review decision.
- Staff may accept, reject, or mark a record or suggestion as needs changes.
- Broken links, missing proof, unclear versions, bad audio, suspicious footage, or rule violations can delay or prevent acceptance.
- Private submission details, staff notes, and private proof links stay off public pages.

## Ranking and points
- Ranked levels award computed points based on their current main-list rank. Rank #1 awards 320 points and lower ranks decrease from the same formula.
- Legacy levels award a fixed 25 points in the current implementation.`,
};

export default async function RulesPage() {
  let rules: typeof FALLBACK_RULES | null = null;

  try {
    rules = await prisma.rulesDocument.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
    });
  } catch (err) {
    console.warn("Database unavailable on /rules, using fallback:", err);
  }

  const activeRules = rules ?? FALLBACK_RULES;
  const headings =
    activeRules.content
      .split("\n")
      .filter((line: string) => line.startsWith("## "))
      .map((line: string) => line.replace("## ", "")) ?? [];

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
          {activeRules ? (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Version v1.0 - Last updated {formatDate(activeRules.updatedAt)}
              </p>
              <div className="mt-6 space-y-4 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                {activeRules.content.split("\n").map((line: string, index: number) => {
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
