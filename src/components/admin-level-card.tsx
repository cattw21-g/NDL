"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminLevelForm } from "@/components/admin-level-form";
import { PointsPill, RankBadge, SectionPanel } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import type { LevelFormValues } from "@/lib/level-form-state";
import type { ImageUploadProvider } from "@/lib/upload-storage";

export function AdminLevelCard({
  level,
  initialValues,
  isTop1Protected,
  points,
  uploads,
  maxImageMb,
  defaultOpen = false,
}: {
  level: {
    id: string;
    rank: number | null;
    name: string;
    originalName: string;
    status: string;
  };
  initialValues: LevelFormValues;
  isTop1Protected: boolean;
  points: number;
  uploads: ImageUploadProvider;
  maxImageMb: number;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div id={`level-${level.id}`}>
      <SectionPanel className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 pb-4 dark:border-slate-700">
        <div className="flex min-w-0 items-center gap-3">
          <RankBadge rank={level.rank} />
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-black text-slate-950 dark:text-slate-50">
              {level.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {level.originalName}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/records?levelId=${level.id}`}
            className="inline-flex min-h-8 items-center gap-1 rounded border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-700 hover:border-cyan-400 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Manage Records
          </Link>
          <PointsPill points={points} />
          <StatusBadge value={level.status} />
          {!isTop1Protected && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex min-h-8 items-center gap-1.5 rounded border border-cyan-500/30 bg-cyan-500/10 px-3 text-xs font-bold text-cyan-600 transition-colors hover:bg-cyan-500/20 dark:text-cyan-400"
            >
              {isOpen ? "Close Form" : "Edit Level"}
            </button>
          )}
        </div>
      </div>

      {isTop1Protected ? (
        <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
          🔒 Top 1 demon (Rank #{level.rank}) is protected. Only Administrators can manage or re-rank this level.
        </div>
      ) : isOpen ? (
        <div className="mt-4">
          <AdminLevelForm
            mode="edit"
            initialValues={initialValues}
            imageUploadProvider={uploads}
            maxImageMb={maxImageMb}
          />
        </div>
      ) : null}
    </SectionPanel>
    </div>
  );
}
