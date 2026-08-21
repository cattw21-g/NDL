import {
  Hourglass,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { CopyButton } from "@/components/copy-button";
import { LevelVideoEmbed } from "@/components/level-video-embed";
import { SafeThumbnail } from "@/components/safe-thumbnail";
import { Eyebrow, MetricTile, SectionPanel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { demoModeEnabled } from "@/lib/demo-visibility";
import { isAdminRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "In Verification - Nerfed Demonlist",
  description:
    "Approved nerfed demons currently undergoing verification before placement on the official list.",
};

export default async function VerifyingPage() {
  const user = await getCurrentUser();
  const isAdmin = user ? isAdminRole(user.role) : false;
  const isDemoMode = demoModeEnabled();

  const [pendingLevels, approvedSuggestions] = await Promise.all([
    prisma.level.findMany({
      where: {
        status: "PENDING",
        ...(isDemoMode ? {} : { isDemo: false }),
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.levelSuggestion.findMany({
      where: {
        status: "APPROVED",
        createdLevelId: null,
      },
      include: {
        submitter: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalVerifying = pendingLevels.length + approvedSuggestions.length;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
        <div className="grid gap-4 border-b border-slate-300 bg-[linear-gradient(120deg,#ffffff_0%,#f0fdfa_100%)] p-5 dark:border-slate-700 dark:bg-[linear-gradient(120deg,#101722_0%,#09232c_100%)] lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Eyebrow icon={Hourglass} tone="cyan">
                Upcoming Demons
              </Eyebrow>
              <span className="rounded-full border border-teal-500/30 bg-teal-50 px-2.5 py-0.5 text-xs font-black text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                Pending Verification
              </span>
            </div>
            <h1 className="text-balance text-4xl font-black leading-tight text-slate-950 sm:text-5xl dark:text-slate-50">
              In Verification
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-300">
              Nerfed demons currently undergoing verification. Once legitimately beaten
              with recorded proof, they will be ranked on the official list.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <MetricTile
              icon={Hourglass}
              label="Verifying"
              value={totalVerifying}
              tone="cyan"
            />
            <MetricTile
              icon={Sparkles}
              label="Approved"
              value={approvedSuggestions.length}
              tone="emerald"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-3 text-xs text-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
          <span>
            Are you verifying one of these levels? Submit your completion run on the Submit page.
          </span>
          <Link
            href="/suggest-level"
            className="font-bold text-cyan-700 underline hover:text-cyan-800 dark:text-cyan-400"
          >
            Suggest a new nerfed demon &rarr;
          </Link>
        </div>
      </section>

      {/* Grid of Levels In Verification */}
      {totalVerifying > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {/* 1. Pending Levels added by staff */}
          {pendingLevels.map((lvl) => (
            <SectionPanel key={lvl.id} className="flex flex-col justify-between p-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                        IN VERIFICATION
                      </span>
                      <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {lvl.difficulty}
                      </span>
                    </div>
                    <h2 className="mt-1.5 text-2xl font-black text-slate-950 dark:text-slate-50">
                      {lvl.name}
                    </h2>
                    <p className="text-xs font-bold text-slate-500">
                      Nerfed version of{" "}
                      <span className="text-slate-800 dark:text-slate-200">
                        {lvl.originalName}
                      </span>
                    </p>
                  </div>

                  {lvl.gdLevelId ? (
                    <CopyButton
                      text={lvl.gdLevelId}
                      label={`GD: ${lvl.gdLevelId}`}
                      className="text-xs"
                    />
                  ) : null}
                </div>

                {/* Creator & Verifier Info */}
                <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/40 sm:grid-cols-2">
                  <div>
                    <span className="font-bold text-slate-500">Verifier:</span>
                    <p className="font-black text-slate-900 dark:text-slate-100">
                      {lvl.verifier || "Unassigned / Open"}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Nerf Creator:</span>
                    <p className="font-black text-slate-900 dark:text-slate-100">
                      {lvl.nerfCreator}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Publisher:</span>
                    <p className="font-bold text-slate-700 dark:text-slate-300">
                      {lvl.publisher}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">GD Level ID:</span>
                    <p className="font-bold text-slate-700 dark:text-slate-300">
                      {lvl.gdLevelId || "Unreleased"}
                    </p>
                  </div>
                </div>

                {/* Video Player or Showcase */}
                {lvl.showcaseUrl || lvl.verificationVideoUrl ? (
                  <div className="mt-3">
                    <span className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-400">
                      Showcase / Preview:
                    </span>
                    <LevelVideoEmbed
                      showcaseUrl={lvl.showcaseUrl}
                      verificationUrl={lvl.verificationVideoUrl}
                      levelName={lvl.name}
                    />
                  </div>
                ) : (
                  <div className="relative aspect-video overflow-hidden rounded-md border border-slate-200 dark:border-slate-800">
                    <SafeThumbnail
                      src={lvl.thumbnailUrl}
                      alt={lvl.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                {lvl.description ? (
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {lvl.description}
                  </p>
                ) : null}
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                <Link
                  href={`/levels/${lvl.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-black text-cyan-700 hover:text-cyan-800 dark:text-cyan-400"
                >
                  View Level Details &rarr;
                </Link>

                {isAdmin ? (
                  <Link
                    href={`/admin/levels`}
                    className="inline-flex items-center gap-1 rounded bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200"
                  >
                    Rank / Edit in Admin
                  </Link>
                ) : null}
              </div>
            </SectionPanel>
          ))}

          {/* 2. Approved Community Suggestions Awaiting Verification */}
          {approvedSuggestions.map((sug) => (
            <SectionPanel key={sug.id} className="flex flex-col justify-between p-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-black text-teal-900 dark:bg-teal-950/60 dark:text-teal-300">
                        APPROVED SUGGESTION
                      </span>
                      <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        Awaiting Victor
                      </span>
                    </div>
                    <h2 className="mt-1.5 text-2xl font-black text-slate-950 dark:text-slate-50">
                      {sug.name}
                    </h2>
                    <p className="text-xs font-bold text-slate-500">
                      Nerfed version of{" "}
                      <span className="text-slate-800 dark:text-slate-200">
                        {sug.originalName}
                      </span>
                    </p>
                  </div>

                  {sug.gdLevelId ? (
                    <CopyButton
                      text={sug.gdLevelId}
                      label={`GD: ${sug.gdLevelId}`}
                      className="text-xs"
                    />
                  ) : null}
                </div>

                {/* Creator & Verifier Info */}
                <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/40 sm:grid-cols-2">
                  <div>
                    <span className="font-bold text-slate-500">Verifier:</span>
                    <p className="font-black text-slate-900 dark:text-slate-100">
                      {sug.verifier || "Open for Verification"}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Nerf Creator:</span>
                    <p className="font-black text-slate-900 dark:text-slate-100">
                      {sug.nerfCreator}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Publisher:</span>
                    <p className="font-bold text-slate-700 dark:text-slate-300">
                      {sug.publisher}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Suggested by:</span>
                    <p className="font-bold text-slate-700 dark:text-slate-300">
                      {sug.submitter.displayName}
                    </p>
                  </div>
                </div>

                {/* Video Player */}
                {sug.showcaseUrl || sug.verificationVideoUrl ? (
                  <div className="mt-3">
                    <span className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-400">
                      Showcase / Preview:
                    </span>
                    <LevelVideoEmbed
                      showcaseUrl={sug.showcaseUrl}
                      verificationUrl={sug.verificationVideoUrl}
                      levelName={sug.name}
                    />
                  </div>
                ) : null}

                {sug.versionNotes ? (
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    <span className="font-bold">Notes:</span> {sug.versionNotes}
                  </p>
                ) : null}
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                <Link
                  href={`/level-suggestions`}
                  className="inline-flex items-center gap-1 text-xs font-black text-cyan-700 hover:text-cyan-800 dark:text-cyan-400"
                >
                  View Suggestions &rarr;
                </Link>

                {isAdmin ? (
                  <Link
                    href={`/admin/levels`}
                    className="inline-flex items-center gap-1 rounded bg-teal-100 px-2.5 py-1 text-xs font-black text-teal-900 hover:bg-teal-200 dark:bg-teal-950 dark:text-teal-200"
                  >
                    Convert & Add to List
                  </Link>
                ) : null}
              </div>
            </SectionPanel>
          ))}
        </div>
      ) : (
        <SectionPanel className="p-12 text-center">
          <Hourglass className="mx-auto h-12 w-12 text-cyan-600 dark:text-cyan-400" />
          <h2 className="mt-4 text-xl font-black text-slate-950 dark:text-slate-50">
            No Levels Currently in Verification
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            All approved nerfed demons have been verified and ranked on the main list!
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/suggest-level"
              className="inline-flex min-h-9 items-center justify-center rounded-md bg-cyan-700 px-4 text-xs font-black text-white hover:bg-cyan-800 dark:bg-cyan-500 dark:text-slate-950"
            >
              Suggest a Nerfed Demon
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              View Main List
            </Link>
          </div>
        </SectionPanel>
      )}
    </div>
  );
}
