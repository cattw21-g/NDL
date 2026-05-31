import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { SafeThumbnail } from "@/components/safe-thumbnail";
import { StatusBadge } from "@/components/status-badge";
import { cx, PointsPill, RankBadge } from "@/components/ui";

export type LevelCardLevel = {
  slug: string;
  rank: number | null;
  name: string;
  originalName: string;
  publisher: string;
  nerfCreator: string;
  verifier: string;
  thumbnailUrl: string;
  status: string;
  difficulty: string;
  points: number;
  _count?: { records: number };
};

export function LevelCard({ level }: { level: LevelCardLevel }) {
  const isTopThree = level.rank !== null && level.rank <= 3;
  const isDemo = level.name.includes("[DEMO]");

  return (
    <article
      className={cx(
        "group relative overflow-hidden rounded-md border bg-white shadow-[0_7px_18px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:border-cyan-500 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)] dark:bg-slate-900 dark:shadow-[0_12px_24px_rgba(0,0,0,0.28)] dark:hover:border-cyan-400",
        isTopThree
          ? "border-cyan-400 dark:border-cyan-500/70"
          : "border-slate-300 dark:border-slate-700",
      )}
    >
      <div
        className={cx(
          "absolute inset-y-0 left-0 w-1",
          level.rank === 1
            ? "bg-amber-500"
            : level.rank === 2
              ? "bg-cyan-700"
              : level.rank === 3
                ? "bg-teal-700"
                : "bg-slate-300",
        )}
      />
      <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-0 md:grid-cols-[4.75rem_12.5rem_minmax(0,1fr)_9.75rem] md:items-stretch">
        <div className="flex items-center justify-center bg-slate-50 p-2 dark:bg-slate-950/60">
          <RankBadge rank={level.rank} />
        </div>

        <div className="min-w-0 p-2">
          <Link
            href={`/levels/${level.slug}`}
            className="relative block aspect-video h-24 w-full overflow-hidden rounded-md border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950 md:h-28"
          >
            <SafeThumbnail
              src={level.thumbnailUrl}
              alt={`${level.name} thumbnail`}
              className="block h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.05),rgba(15,23,42,0.08))]" />
            {isDemo ? (
              <span className="absolute left-1.5 top-1.5 rounded border border-amber-300 bg-white/92 px-1.5 py-0.5 text-[10px] font-black text-amber-800 dark:border-amber-400/60 dark:bg-slate-950/85 dark:text-amber-200">
                DEMO
              </span>
            ) : null}
          </Link>
        </div>

        <div className="col-span-2 min-w-0 border-t border-slate-300 p-3 dark:border-slate-700 md:col-span-1 md:border-t-0 md:px-3 md:py-2.5">
          <div className="min-w-0">
            {level.status !== "RANKED" ? (
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={level.status} />
              </div>
            ) : null}
            <Link
              href={`/levels/${level.slug}`}
              className={cx(
                "block truncate text-lg font-black leading-tight text-slate-950 transition hover:text-cyan-800 dark:text-slate-50 dark:hover:text-cyan-200",
                level.status !== "RANKED" && "mt-1.5",
              )}
            >
              {level.name}
            </Link>
            <dl className="mt-1.5 grid gap-x-4 gap-y-1 text-sm leading-5 text-slate-700 dark:text-slate-300 sm:grid-cols-2">
              <Meta label="Original" value={level.originalName} />
              <Meta label="Verified by" value={level.verifier} />
              <Meta label="Hosted by" value={level.publisher} />
              <Meta label="Nerf by" value={level.nerfCreator} />
            </dl>
          </div>
        </div>

        <div className="col-span-2 grid grid-cols-3 gap-2 border-t border-slate-300 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950/60 md:col-span-1 md:grid-cols-1 md:border-l md:border-t-0">
          <PointsPill points={level.points} />
          <span className="inline-flex min-h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-black text-slate-800 tabular-nums dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            {level._count?.records ?? 0} records
          </span>
          <Link
            href={`/levels/${level.slug}`}
            className="inline-flex min-h-8 items-center justify-center gap-2 rounded-md border border-cyan-800 bg-cyan-800 px-3 text-sm font-black text-white transition hover:bg-cyan-700"
          >
            Details
            <ArrowRight className="h-4 w-4" />
          </Link>
          <span className="hidden items-center gap-2 truncate text-xs font-bold text-slate-500 dark:text-slate-400 md:flex">
            <ShieldCheck className="h-4 w-4 text-cyan-700" />
            Reviewed list entry
          </span>
        </div>
      </div>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="inline text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
        {label}:{" "}
      </dt>
      <dd className="inline font-semibold text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  );
}
