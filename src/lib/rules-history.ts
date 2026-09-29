export type RuleVersion = {
  id: string;
  version: string;
  title: string;
  publishedAt: Date;
  isActive: boolean;
  summary: string;
  keyChanges: {
    section: string;
    type: "added" | "modified" | "clarified" | "removed";
    beforeText?: string;
    afterText?: string;
    description: string;
  }[];
  content: string;
};

export const RULE_VERSIONS_HISTORY: RuleVersion[] = [
  {
    id: "rules-v1.6",
    version: "v1.6.0",
    title: "v1.6.0 — Strict Audio & Progress Thresholds",
    publishedAt: new Date("2026-09-20T00:00:00.000Z"),
    isActive: true,
    summary:
      "Mandatory audible microphone click audio for all record submissions, and official Pointercrate-standard progress run tier requirements (Main List 50%+ eligibility, Extended/Legacy 100% completions).",
    keyChanges: [
      {
        section: "Click Audio and Microphone Proof",
        type: "modified",
        beforeText: "Click audio is required for serious records. Fake, added, replaced, or edited click sounds are banned.",
        afterText: "Audible microphone / click proof is strictly MANDATORY for ALL record submissions. Submissions without audible microphone click audio will be rejected. Music-only or silent runs are strictly forbidden.",
        description: "Physical microphone click audio is now strictly mandatory on every submission. Music-only or silent runs will be rejected automatically.",
      },
      {
        section: "Submissions and Review",
        type: "added",
        beforeText: "Staff may accept, reject, or mark a record or suggestion as needs changes.",
        afterText: "100% completions are eligible for ranking points on all ranked and legacy levels. Progress runs (< 100%) are only accepted for Main List demons (#1–#75) meeting 50%+ requirements. Extended List (#76–#150) and Legacy demons require 100% completions.",
        description: "Clarified point eligibility: Progress runs (< 100%) are only accepted for Main List demons (#1–#75) with 50%+ threshold. Extended and Legacy lists require 100% completions.",
      },
      {
        section: "Click Audio and Microphone Proof",
        type: "added",
        beforeText: "Separate microphone or click tracks are required for high-ranked records...",
        afterText: "Fake, added, synthesized, replaced, or edited click sounds are strictly banned and will result in an immediate submission ban.",
        description: "Synthesized or edited click audio now results in an immediate submission ban.",
      },
    ],
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
- Audible microphone / click proof is strictly MANDATORY for ALL record submissions. Submissions without audible microphone click audio will be rejected. Music-only or silent runs are strictly forbidden.
- Fake, added, synthesized, replaced, or edited click sounds are strictly banned and will result in an immediate submission ban.
- A dedicated microphone or audible physical input audio track is required so staff can verify legitimate human clicks against video frames.
- Game audio should also be present alongside microphone click audio.
- Physical click audio must synchronize with visible inputs, gameplay jumps, and death/victory frames.

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
- 100% completions are eligible for ranking points on all ranked and legacy levels.
- Progress runs (< 100%) are only accepted for Main List demons (#1–#75), provided they meet or exceed the demon's specific minimum requirement (typically 50%, with an absolute floor of 30%).
- Extended List demons (#76–#150) and Legacy demons require 100% completions; progress records are not accepted, matching Pointercrate list standards.
- Progress submissions below 30% are strictly invalid and rejected platform-wide.
- Staff may accept, reject, or mark a record or suggestion as needs changes.
- Broken links, missing proof, unclear versions, bad audio, suspicious footage, or rule violations can delay or prevent acceptance.
- Private submission details, staff notes, and private proof links stay off public pages.

## Ranking and points
- Ranked levels award computed points based on their current main-list rank. Rank #1 awards 320 points and lower ranks decrease from the same formula.
- Legacy levels award a fixed 25 points in the current implementation.
- Pending, rejected, and removed levels do not award points.
- A player's leaderboard score counts their best accepted record per ranked or legacy level.

## Moderation discretion
- Rules cannot cover every edge case. NDL staff may use judgment when evidence, level structure, or technical setup creates uncertainty.
- Staff decisions should leave clear notes so submitters understand what changed or what proof is missing.
- Rankings, records, and points may change after review if new information becomes available.`,
  },
  {
    id: "rules-v1.5",
    version: "v1.5.0",
    title: "v1.5.0 — Unverified Demon Eligibility",
    publishedAt: new Date("2026-08-20T00:00:00.000Z"),
    isActive: false,
    summary:
      "Explicitly authorized nerfed versions of unverified demons (e.g. unverified upcoming top demons and impossible projects) as long as the nerf is legitimately verified.",
    keyChanges: [
      {
        section: "Level Eligibility",
        type: "added",
        beforeText: "Eligible nerfs need a real Geometry Dash level ID, clear publisher or host credit, original level credit, nerf creator credit, verifier credit, and a stable showcase.",
        afterText: "**Nerfed versions of unverified levels ARE allowed**: You are explicitly permitted to create and suggest nerfed versions of unverified levels (such as unverified upcoming top demons, impossible levels, or work-in-progress projects), as long as the nerfed version has been legitimately verified and uploaded to Geometry Dash servers.",
        description: "Official permission added for players to nerf and verify unverified top demons (like upcoming impossible levels) for list ranking.",
      },
    ],
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
  },
  {
    id: "rules-v1.0",
    version: "v1.0.0",
    title: "v1.0.0 — Initial Platform Baseline",
    publishedAt: new Date("2026-06-01T00:00:00.000Z"),
    isActive: false,
    summary:
      "Original Nerfed Demonlist public beta rulebook establishing list placement, macro replay compatibility guidelines, and record review standards.",
    keyChanges: [],
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
  },
];

export type DiffRow = {
  type: "added" | "removed" | "modified" | "unchanged" | "empty";
  leftLineNumber?: number;
  leftText?: string;
  rightLineNumber?: number;
  rightText?: string;
};

export type SectionDiff = {
  title: string;
  hasChanges: boolean;
  additions: number;
  deletions: number;
  rows: DiffRow[];
};

export function splitIntoSections(markdown: string): { title: string; lines: string[] }[] {
  const lines = markdown.split("\n");
  const sections: { title: string; lines: string[] }[] = [];
  let currentTitle = "Preamble";
  let currentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentLines.length > 0 || sections.length > 0) {
        sections.push({ title: currentTitle, lines: currentLines });
      }
      currentTitle = line.replace("## ", "").trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0 || sections.length > 0) {
    sections.push({ title: currentTitle, lines: currentLines });
  }

  return sections;
}

export function computeSideBySideDiff(oldText: string, newText: string): SectionDiff[] {
  const oldSections = splitIntoSections(oldText);
  const newSections = splitIntoSections(newText);

  const allTitles = Array.from(
    new Set([...oldSections.map((s) => s.title), ...newSections.map((s) => s.title)]),
  );

  const sectionDiffs: SectionDiff[] = [];

  for (const title of allTitles) {
    const oldSec = oldSections.find((s) => s.title === title)?.lines ?? [];
    const newSec = newSections.find((s) => s.title === title)?.lines ?? [];

    const rows: DiffRow[] = [];
    let i = 0;
    let j = 0;
    let leftNum = 1;
    let rightNum = 1;
    let additions = 0;
    let deletions = 0;

    while (i < oldSec.length && j < newSec.length) {
      if (oldSec[i] === newSec[j]) {
        rows.push({
          type: "unchanged",
          leftLineNumber: leftNum++,
          leftText: oldSec[i],
          rightLineNumber: rightNum++,
          rightText: newSec[j],
        });
        i++;
        j++;
      } else {
        const nextInNew = newSec.indexOf(oldSec[i], j);
        const nextInOld = oldSec.indexOf(newSec[j], i);

        if (nextInNew !== -1 && (nextInOld === -1 || nextInNew - j <= nextInOld - i)) {
          while (j < nextInNew) {
            rows.push({
              type: "added",
              rightLineNumber: rightNum++,
              rightText: newSec[j],
            });
            additions++;
            j++;
          }
        } else if (nextInOld !== -1) {
          while (i < nextInOld) {
            rows.push({
              type: "removed",
              leftLineNumber: leftNum++,
              leftText: oldSec[i],
            });
            deletions++;
            i++;
          }
        } else {
          rows.push({
            type: "modified",
            leftLineNumber: leftNum++,
            leftText: oldSec[i],
            rightLineNumber: rightNum++,
            rightText: newSec[j],
          });
          additions++;
          deletions++;
          i++;
          j++;
        }
      }
    }

    while (i < oldSec.length) {
      rows.push({
        type: "removed",
        leftLineNumber: leftNum++,
        leftText: oldSec[i],
      });
      deletions++;
      i++;
    }

    while (j < newSec.length) {
      rows.push({
        type: "added",
        rightLineNumber: rightNum++,
        rightText: newSec[j],
      });
      additions++;
      j++;
    }

    sectionDiffs.push({
      title,
      hasChanges: additions > 0 || deletions > 0,
      additions,
      deletions,
      rows,
    });
  }

  return sectionDiffs;
}
