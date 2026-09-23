import { ShieldAlert } from "lucide-react";
import Link from "next/link";

import { PageMessage } from "@/components/message";
import { SubmitRecordForm } from "@/components/submit-record-form";
import { SectionPanel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicLevelWhere } from "@/lib/demo-visibility";
import {
  localUploadsEnabled,
  maxImageUploadBytes,
  maxVideoUploadBytes,
  videoUploadsEnabled,
} from "@/lib/upload-storage";
import { calculateCurrentLevelPoints } from "@/lib/points";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Submit a Record - NDL",
  description:
    "Submit a Nerfed Demonlist record with proof links, run settings, and notes for staff review.",
};

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  const [params, rankedLevels, userUpcomingLevels] = await Promise.all([
    searchParams,
    prisma.level.findMany({
      where: publicLevelWhere({
        status: {
          in: ["RANKED", "LEGACY"],
        },
      }),
      orderBy: [{ rank: { sort: "asc", nulls: "last" } }, { name: "asc" }],
    }),
    user
      ? prisma.level.findMany({
          where: {
            status: "PENDING",
            OR: [
              { verifierUserId: user.id },
              { verifier: { equals: user.playerName, mode: "insensitive" } },
              { verifier: { equals: user.displayName, mode: "insensitive" } },
            ],
          },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const levels = [
    ...userUpcomingLevels.map((lvl) => ({
      ...lvl,
      name: `🔥 [Upcoming Verification] ${lvl.name}`,
    })),
    ...rankedLevels,
  ];
  const imageUploadsEnabled = localUploadsEnabled();
  const mp4UploadsEnabled = videoUploadsEnabled();
  const maxImageMb = bytesToMb(maxImageUploadBytes());
  const maxVideoMb = bytesToMb(maxVideoUploadBytes());

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-b from-sky-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Submit a Demon Record
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-zinc-400">
            Send proof links, run settings, and notes for moderator review. 100% completions and qualifying Main List progress runs earn leaderboard points upon acceptance.
          </p>
        </div>
      </div>

      <PageMessage
        searchParams={params}
        successMessage="Record submitted for review. Staff may request more proof."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-purple-500/20 bg-purple-50/80 p-3.5 text-sm dark:border-purple-500/30 dark:bg-purple-500/10">
        <div className="text-zinc-700 dark:text-zinc-200 text-xs sm:text-sm">
          <span className="font-bold text-purple-700 dark:text-purple-300">Want to submit a new or unverified demon?</span>{" "}
          To submit a new level candidate or open-verification demon, use the level suggestion form.
        </div>
        <Link
          href="/suggest-level"
          className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-purple-500 transition-colors"
        >
          Suggest a Level →
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <SubmitRecordForm
          user={user ? { id: user.id, playerName: user.playerName, displayName: user.displayName } : null}
          levels={levels.map((level) => ({
            id: level.id,
            rank: level.rank,
            name: level.name,
            verifier: level.verifier,
            status: level.status,
            minimumProgress: level.minimumProgress ?? 50,
            points: calculateCurrentLevelPoints(level),
          }))}
          imageUploadsEnabled={imageUploadsEnabled}
          mp4UploadsEnabled={mp4UploadsEnabled}
          maxImageMb={maxImageMb}
          maxVideoMb={maxVideoMb}
        />

        <aside className="space-y-3">
          <SectionPanel className="p-5">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 font-bold text-zinc-900 dark:border-zinc-800 dark:text-white">
              <ShieldAlert className="h-5 w-5 text-sky-500" />
              Proof & Guidelines
            </div>
            <ul className="mt-3 space-y-1.5 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
              <li>• Click audio is required for serious records.</li>
              <li>• Fake or added clicks will result in an immediate ban.</li>
              <li>• Separate mic/click track proof required for top levels.</li>
              <li>• Raw unedited footage required for high-ranked records.</li>
              <li>• FPS overlay, CPS counter, and endscreen must be visible.</li>
              <li>• Progress runs must be &ge; 30% on Main List (Extended/Legacy: 100%).</li>
              <li>• Accepted runs award points directly to profile and country.</li>
            </ul>
            <div className="mt-3 rounded-lg border border-sky-500/20 bg-sky-50/80 p-2.5 text-xs font-medium text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
              Public links (YouTube, Twitch, Medal) are preferred for fast review.
            </div>
            <Link
              href="/rules"
              className="mt-3.5 inline-flex min-h-8.5 w-full items-center justify-center rounded-lg bg-sky-600 px-3 text-xs font-bold text-white shadow-xs transition hover:bg-sky-500"
            >
              Read Full Rules →
            </Link>
          </SectionPanel>
        </aside>
      </div>
    </div>
  );
}

function bytesToMb(bytes: number) {
  return Math.round(bytes / 1024 / 1024);
}
