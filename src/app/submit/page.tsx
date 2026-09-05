import { ShieldAlert } from "lucide-react";
import Link from "next/link";

import { PageMessage } from "@/components/message";
import { SubmitRecordForm } from "@/components/submit-record-form";
import { SectionPanel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
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
  const user = await requireUser();
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
    prisma.level.findMany({
      where: {
        status: "PENDING",
        OR: [
          { verifierUserId: user.id },
          { verifier: { equals: user.playerName, mode: "insensitive" } },
          { verifier: { equals: user.displayName, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
    }),
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

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <SubmitRecordForm
          levels={levels.map((level) => ({
            id: level.id,
            rank: level.rank,
            name: level.name,
            verifier: level.verifier,
            status: level.status,
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
              Proof Requirements
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              <li>Click audio is required for serious records.</li>
              <li>Fake or added click sounds are banned.</li>
              <li>Separate mic/click track proof is required for high-ranked levels.</li>
              <li>Raw footage is required for high-ranked records.</li>
              <li>FPS overlay, CPS counter, and endscreen must be visible.</li>
              <li>Macros and replay bots are strictly banned.</li>
            </ul>
            <div className="mt-4 rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-xs font-semibold text-sky-400">
              Public video links (YouTube, Twitch, Medal, TikTok) are preferred.
            </div>
            <Link
              href="/rules"
              className="mt-4 inline-flex min-h-9 w-full items-center justify-center rounded-lg bg-sky-600 px-3 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition hover:bg-sky-500"
            >
              Read full rules
            </Link>
          </SectionPanel>

          <SectionPanel className="p-5">
            <h2 className="border-b border-zinc-200 pb-3 font-bold text-zinc-900 dark:border-zinc-800 dark:text-white">
              Submission Guidelines
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Accepted records instantly award points to your profile and country ranking. Pending, rejected, and needs-changes runs remain private to you and staff.
            </p>
          </SectionPanel>
        </aside>
      </div>
    </div>
  );
}

function bytesToMb(bytes: number) {
  return Math.round(bytes / 1024 / 1024);
}
