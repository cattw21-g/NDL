import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, GitCompareArrows, CheckCircle2, History, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { SectionPanel } from "@/components/ui";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Rules Version Comparison — Nerfed Demonlist",
  description: "Compare revision history, amendments, and rule changes across Nerfed Demonlist guidelines.",
};

const BASELINE_RULES_V1_0 = `## General policy
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
- Legacy levels award a fixed 25 points in the current implementation.`;

const REVISED_RULES_V1_5 = `## General policy
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
- Legacy levels award a fixed 25 points in the current implementation.`;

type RuleDoc = {
  id: string;
  version: string;
  content: string;
  isActive: boolean;
  publishedAt: Date;
};

type DiffLine = {
  type: "added" | "removed" | "unchanged";
  text: string;
};

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const diff: DiffLine[] = [];

  // Simple and robust LCS-based diff for lines
  let i = 0;
  let j = 0;

  while (i < oldLines.length && j < newLines.length) {
    if (oldLines[i] === newLines[j]) {
      diff.push({ type: "unchanged", text: oldLines[i] });
      i++;
      j++;
    } else {
      // Lookahead to see if next lines match
      const nextMatchInNew = newLines.indexOf(oldLines[i], j);
      const nextMatchInOld = oldLines.indexOf(newLines[j], i);

      if (nextMatchInNew !== -1 && (nextMatchInOld === -1 || nextMatchInNew - j <= nextMatchInOld - i)) {
        // Lines were added in new
        while (j < nextMatchInNew) {
          diff.push({ type: "added", text: newLines[j] });
          j++;
        }
      } else if (nextMatchInOld !== -1) {
        // Lines were removed from old
        while (i < nextMatchInOld) {
          diff.push({ type: "removed", text: oldLines[i] });
          i++;
        }
      } else {
        // Replace: mark old as removed and new as added
        diff.push({ type: "removed", text: oldLines[i] });
        diff.push({ type: "added", text: newLines[j] });
        i++;
        j++;
      }
    }
  }

  while (i < oldLines.length) {
    diff.push({ type: "removed", text: oldLines[i] });
    i++;
  }
  while (j < newLines.length) {
    diff.push({ type: "added", text: newLines[j] });
    j++;
  }

  return diff;
}

export default async function RulesComparePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;

  let dbDocuments: RuleDoc[] = [];
  try {
    dbDocuments = await prisma.rulesDocument.findMany({
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        version: true,
        content: true,
        isActive: true,
        publishedAt: true,
      },
    });
  } catch (err) {
    console.warn("Database unavailable on /rules/compare:", err);
  }

  // If database has fewer than 2 versions, build a synthetic history using baseline fallback versions
  const documents: RuleDoc[] =
    dbDocuments.length >= 2
      ? dbDocuments
      : dbDocuments.length === 1
      ? [
          dbDocuments[0],
          {
            id: "fallback-v1.0",
            version: "v1.0.0",
            content: BASELINE_RULES_V1_0,
            isActive: false,
            publishedAt: new Date("2026-06-01"),
          },
        ]
      : [
          {
            id: "fallback-v1.5",
            version: "v1.5.0",
            content: REVISED_RULES_V1_5,
            isActive: true,
            publishedAt: new Date("2026-09-01"),
          },
          {
            id: "fallback-v1.0",
            version: "v1.0.0",
            content: BASELINE_RULES_V1_0,
            isActive: false,
            publishedAt: new Date("2026-06-01"),
          },
        ];

  // Selected versions
  const toDoc =
    documents.find((d) => d.id === params.to || d.version === params.to) ||
    documents[0];
  const fromDoc =
    documents.find((d) => d.id === params.from || d.version === params.from) ||
    documents[1] ||
    documents[0];

  const diffLines = computeDiff(fromDoc.content, toDoc.content);
  const additions = diffLines.filter((l) => l.type === "added").length;
  const deletions = diffLines.filter((l) => l.type === "removed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-b from-rose-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-400">
              <GitCompareArrows className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-wider">
                Revision Diff & Policy History
              </span>
            </div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Compare Rule Versions
            </h1>
            <p className="mt-2 max-w-2xl text-sm sm:text-base text-zinc-400">
              Audit line-by-line changes, unverified level eligibility updates, and official guideline revisions over time.
            </p>
          </div>
          <Link
            href="/rules"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-200 transition hover:bg-zinc-700 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Active Rules
          </Link>
        </div>
      </div>

      {/* Version Selector & Summary */}
      <SectionPanel className="p-5 border-zinc-800 bg-zinc-900/60">
        <form method="get" className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                Base Version (From):
              </label>
              <select
                name="from"
                defaultValue={fromDoc.id}
                className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs font-bold text-white focus:border-rose-500 focus:outline-none"
              >
                {documents.map((doc) => (
                  <option key={`from-${doc.id}`} value={doc.id}>
                    {doc.version} {doc.isActive ? "(Active)" : `(${formatDate(doc.publishedAt)})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-5 text-zinc-500 font-black">
              &rarr;
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                Target Version (To):
              </label>
              <select
                name="to"
                defaultValue={toDoc.id}
                className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs font-bold text-white focus:border-rose-500 focus:outline-none"
              >
                {documents.map((doc) => (
                  <option key={`to-${doc.id}`} value={doc.id}>
                    {doc.version} {doc.isActive ? "(Active)" : `(${formatDate(doc.publishedAt)})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-5">
              <button
                type="submit"
                className="h-9 rounded-md bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-500 transition shadow-sm"
              >
                Compare Revisions
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 font-bold text-emerald-400">
              +{additions} additions
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 font-bold text-rose-400">
              -{deletions} deletions
            </span>
          </div>
        </form>
      </SectionPanel>

      {/* Diff Viewer */}
      <SectionPanel className="overflow-hidden border-zinc-800 bg-zinc-950/80 p-0 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-rose-400" />
            <span className="text-xs font-mono font-bold text-zinc-300">
              {fromDoc.version} ({formatDate(fromDoc.publishedAt)}) &rarr; {toDoc.version} ({formatDate(toDoc.publishedAt)})
            </span>
          </div>
          {toDoc.isActive ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3" /> Target is Currently Active
            </span>
          ) : null}
        </div>

        <div className="divide-y divide-zinc-900/60 font-mono text-xs overflow-x-auto p-2">
          {diffLines.map((line, idx) => {
            const isAdded = line.type === "added";
            const isRemoved = line.type === "removed";
            const isHeading = line.text.startsWith("## ");

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 px-3 py-1.5 transition-colors ${
                  isAdded
                    ? "bg-emerald-950/40 text-emerald-200 border-l-2 border-emerald-500 font-semibold"
                    : isRemoved
                    ? "bg-rose-950/40 text-rose-200 border-l-2 border-rose-500 opacity-80"
                    : "text-zinc-300 hover:bg-zinc-900/40"
                }`}
              >
                <span
                  className={`w-4 shrink-0 select-none font-bold text-center ${
                    isAdded
                      ? "text-emerald-400"
                      : isRemoved
                      ? "text-rose-400"
                      : "text-zinc-600"
                  }`}
                >
                  {isAdded ? "+" : isRemoved ? "-" : " "}
                </span>
                <span
                  className={`flex-1 break-words ${
                    isHeading ? "font-sans font-black text-sm text-white pt-2 pb-1" : ""
                  }`}
                >
                  {line.text || "\u00A0"}
                </span>
              </div>
            );
          })}
        </div>
      </SectionPanel>

      {/* Explanatory Footer */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-400 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          The Nerfed Demonlist document history tracks every formal update made to list requirements, CBF guidelines, verification criteria, and eligibility. Rule amendments take effect immediately upon active publication by administration.
        </p>
      </div>
    </div>
  );
}
