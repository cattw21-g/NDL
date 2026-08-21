import {
  ArrowLeft,
  Check,
  ExternalLink,
  Plus,
  Trash2,
  Trophy,
} from "lucide-react";
import Link from "next/link";

import {
  createAdminRecordAction,
  deleteAdminRecordAction,
  updateAdminRecordAction,
} from "@/actions/admin";
import { Eyebrow, MetricTile, SectionPanel, inputClass } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Record Management - Admin - NDL",
};

export default async function AdminRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ levelId?: string; q?: string }>;
}) {
  await requireAdmin();
  const { levelId, q } = await searchParams;

  const [levels, records] = await Promise.all([
    prisma.level.findMany({
      orderBy: [
        { rank: { sort: "asc", nulls: "last" } },
        { name: "asc" },
      ],
      select: {
        id: true,
        name: true,
        rank: true,
        slug: true,
      },
    }),
    prisma.record.findMany({
      where: {
        ...(levelId ? { levelId } : {}),
        ...(q
          ? {
              OR: [
                { player: { displayName: { contains: q, mode: "insensitive" } } },
                { player: { playerName: { contains: q, mode: "insensitive" } } },
                { level: { name: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: {
        player: true,
        level: true,
      },
      orderBy: [
        { level: { rank: { sort: "asc", nulls: "last" } } },
        { isVerifier: "desc" },
        { progress: "desc" },
        { acceptedAt: "desc" },
      ],
      take: 100,
    }),
  ]);

  const fullCompletions = records.filter((r) => r.progress === 100).length;
  const progressRuns = records.filter((r) => r.progress < 100).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-md border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Admin
              </Link>
              <Eyebrow tone="amber" icon={Trophy}>
                Admin Record Manager
              </Eyebrow>
            </div>
            <h1 className="text-3xl font-black text-slate-950 dark:text-slate-50">
              Player Record Management
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Add new completions, adjust progress percentages (1%–100%), change
              verifiers, or delete records.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MetricTile label="Total" value={records.length} tone="cyan" />
            <MetricTile label="100% Victors" value={fullCompletions} tone="emerald" />
            <MetricTile label="Progress Runs" value={progressRuns} tone="amber" />
          </div>
        </div>
      </section>

      {/* Add Record Form */}
      <SectionPanel className="p-5">
        <h2 className="flex items-center gap-2 border-b border-slate-200 pb-3 text-lg font-black text-slate-950 dark:border-slate-800 dark:text-slate-50">
          <Plus className="h-5 w-5 text-cyan-600" />
          Add Record Manually
        </h2>

        <form action={createAdminRecordAction} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
              Level
            </span>
            <select name="levelId" required className={`${inputClass} mt-1 w-full`}>
              <option value="">Select a Level...</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.rank ? `#${l.rank} - ` : ""}{l.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
              Player Name / Handle
            </span>
            <input
              name="playerName"
              placeholder="e.g. SpaceUK or @space"
              required
              className={`${inputClass} mt-1 w-full`}
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
              Progress Percentage (%)
            </span>
            <input
              name="progress"
              type="number"
              min={1}
              max={100}
              defaultValue={100}
              required
              className={`${inputClass} mt-1 w-full font-black`}
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
              FPS
            </span>
            <input
              name="fps"
              type="number"
              defaultValue={360}
              className={`${inputClass} mt-1 w-full`}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
              Video Proof URL
            </span>
            <input
              name="videoUrl"
              placeholder="https://youtu.be/... or medal.tv/..."
              required
              className={`${inputClass} mt-1 w-full`}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
              Raw Footage URL (Optional)
            </span>
            <input
              name="rawFootageUrl"
              placeholder="Google Drive, Mega, etc."
              className={`${inputClass} mt-1 w-full`}
            />
          </label>

          <div className="flex items-center gap-2 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                name="isVerifier"
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              Crown as Level Verifier (assigns gold verifier badge)
            </label>
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-cyan-700 px-5 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
            >
              <Plus className="h-4 w-4" />
              Add Record to Level
            </button>
          </div>
        </form>
      </SectionPanel>

      {/* Filter / Search Bar */}
      <SectionPanel className="overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-100 p-3 dark:border-slate-800 dark:bg-slate-950/60">
          <form method="GET" className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by player or level..."
              className={`${inputClass} w-full`}
            />
            <select name="levelId" defaultValue={levelId} className={`${inputClass} w-full`}>
              <option value="">All Levels</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.rank ? `#${l.rank} - ` : ""}{l.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Existing Records List */}
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {records.length > 0 ? (
            records.map((rec) => (
              <div
                key={rec.id}
                className="grid gap-3 p-4 transition hover:bg-slate-50/70 dark:hover:bg-slate-850/50 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
              >
                {/* Info */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-slate-950 dark:text-slate-100">
                      {rec.level.name}
                    </span>
                    {rec.level.rank ? (
                      <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        #{rec.level.rank}
                      </span>
                    ) : null}
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-black ${
                        rec.progress === 100
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {rec.progress}%
                    </span>
                    {rec.isVerifier ? (
                      <span className="rounded border border-amber-400 bg-amber-50 px-1.5 py-0.5 text-xs font-black text-amber-900 dark:border-amber-500/50 dark:bg-amber-950/40 dark:text-amber-200">
                        VERIFIER
                      </span>
                    ) : null}
                  </div>

                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Player:{" "}
                    <Link
                      href={`/players/${rec.player.playerName}`}
                      className="underline hover:text-cyan-600"
                    >
                      {rec.player.displayName} (@{rec.player.playerName})
                    </Link>{" "}
                    • Added {formatDate(rec.acceptedAt)}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <a
                      href={rec.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-700 underline dark:text-cyan-400"
                    >
                      Proof Link <ExternalLink className="h-3 w-3" />
                    </a>
                    {rec.rawFootageUrl ? (
                      <a
                        href={rec.rawFootageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-slate-500 underline"
                      >
                        Raw Footage <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                    <span>FPS: {rec.fps ?? 360}</span>
                  </div>
                </div>

                {/* Edit Form */}
                <div className="flex flex-wrap items-center gap-2">
                  <form action={updateAdminRecordAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="recordId" value={rec.id} />
                    <input
                      name="progress"
                      type="number"
                      min={1}
                      max={100}
                      defaultValue={rec.progress}
                      title="Edit Progress Percentage"
                      className={`${inputClass} w-20 text-center font-black`}
                    />
                    <input
                      name="videoUrl"
                      defaultValue={rec.videoUrl}
                      placeholder="Video URL"
                      className={`${inputClass} w-48 text-xs`}
                    />
                    <label className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        name="isVerifier"
                        defaultChecked={rec.isVerifier}
                        className="h-3.5 w-3.5 rounded"
                      />
                      Verifier
                    </label>
                    <button
                      type="submit"
                      className="inline-flex min-h-9 items-center gap-1 rounded-md border border-cyan-600 bg-cyan-50 px-3 text-xs font-black text-cyan-900 transition hover:bg-cyan-100 dark:border-cyan-500 dark:bg-cyan-950 dark:text-cyan-200"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Save
                    </button>
                  </form>

                  <form action={deleteAdminRecordAction}>
                    <input type="hidden" name="recordId" value={rec.id} />
                    <button
                      type="submit"
                      title="Delete Record"
                      className="inline-flex min-h-9 items-center justify-center rounded-md border border-red-300 bg-red-50 px-2.5 text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">
              No records found. Use the form above to add a record.
            </div>
          )}
        </div>
      </SectionPanel>
    </div>
  );
}
