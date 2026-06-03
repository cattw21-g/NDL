import { ShieldAlert, Upload } from "lucide-react";
import Link from "next/link";

import { PageMessage } from "@/components/message";
import { SubmitRecordForm } from "@/components/submit-record-form";
import {
  Eyebrow,
  SectionPanel,
} from "@/components/ui";
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
  await requireUser();
  const [params, levels] = await Promise.all([
    searchParams,
    prisma.level.findMany({
      where: publicLevelWhere({
        status: {
          in: ["RANKED", "LEGACY"],
        },
      }),
      orderBy: [{ rank: { sort: "asc", nulls: "last" } }, { name: "asc" }],
    }),
  ]);
  const imageUploadsEnabled = localUploadsEnabled();
  const mp4UploadsEnabled = videoUploadsEnabled();
  const maxImageMb = bytesToMb(maxImageUploadBytes());
  const maxVideoMb = bytesToMb(maxVideoUploadBytes());

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
        <div className="mb-3">
          <Eyebrow icon={Upload}>Record intake</Eyebrow>
        </div>
        <h1 className="text-4xl font-black leading-tight text-slate-950">
          Submit a record
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Send proof links, run settings, and notes for moderator review. Use
          proof links first; staff may request additional proof if needed.
        </p>
      </section>

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
          <SectionPanel className="border-cyan-700/40 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.1)]">
            <div className="flex items-center gap-2 border-b border-slate-300 pb-3 font-black text-slate-950 dark:border-slate-700 dark:text-slate-50">
              <ShieldAlert className="h-5 w-5 text-cyan-700" />
              Proof requirements
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li>Click audio is required for serious records.</li>
              <li>Fake or added click sounds are banned.</li>
              <li>
                Separate mic/click track proof is required for high-ranked
                levels.
              </li>
              <li>Raw footage is required for high-ranked records.</li>
              <li>FPS overlay, CPS counter, and endscreen must be visible.</li>
              <li>Macros and replay bots are banned for records.</li>
              <li>Use http/https links for proof resources.</li>
            </ul>
            <p className="mt-3 rounded-md border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-bold leading-6 text-cyan-900 dark:border-cyan-500/50 dark:bg-cyan-950/40 dark:text-cyan-100">
              Use proof links. Staff may request additional proof if needed.
            </p>
            <Link
              href="/rules"
              className="mt-4 inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950/50"
            >
              Read the rules
            </Link>
          </SectionPanel>
          <SectionPanel className="p-4">
            <h2 className="border-b border-slate-300 pb-3 font-black text-slate-950 dark:border-slate-700 dark:text-slate-50">
              Eligibility reminder
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              The selected nerfed level should preserve the original route,
              timing, speed, portals, gamemode order, and progression closely
              enough for original replay/macro compatibility under matching
              conditions. Original replay or macro compatibility is only a
              structural level eligibility check; it is not an allowed record
              method. Player records must still be completed legitimately
              without macros or replay bots.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Accepted records become public and update player points. Pending,
              rejected, and needs-changes submissions remain private to the
              submitter and staff.
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
