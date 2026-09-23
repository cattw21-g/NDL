"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateOpeningStatusAction } from "@/actions/applications";
import type { ApplicationOpeningStatus } from "@/generated/prisma/enums";
import {
  Search,
  Filter,
  ChevronRight,
  Scale,
  Loader2,
} from "lucide-react";

export type SubmissionRow = {
  id: string;
  userId: string;
  playerName: string;
  displayName: string;
  discordUsername: string | null;
  status: string;
  submittedAt: string | null;
  rating: number | null;
  notesCount: number;
};

export function AdminSubmissionsTable({
  openingId,
  openingTitle,
  openingRole,
  currentStatus,
  maxPositions,
  submissions,
}: {
  openingId: string;
  openingTitle: string;
  openingRole: string;
  currentStatus: ApplicationOpeningStatus;
  maxPositions: number | null;
  submissions: SubmissionRow[];
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isChangingStatus, setIsChangingStatus] = useState<boolean>(false);

  const handleStatusChange = async (newStatus: ApplicationOpeningStatus) => {
    setIsChangingStatus(true);
    try {
      await updateOpeningStatusAction({
        openingId,
        status: newStatus,
      });
      router.refresh();
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 4) {
        alert("You can compare up to 4 candidates at a time.");
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (statusFilter !== "ALL" && sub.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = sub.playerName.toLowerCase().includes(q) || sub.displayName.toLowerCase().includes(q);
      const matchDiscord = sub.discordUsername?.toLowerCase().includes(q);
      if (!matchName && !matchDiscord) return false;
    }
    return true;
  });

  const acceptedCount = submissions.filter((s) => s.status === "ACCEPTED").length;

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {openingRole.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {acceptedCount} / {maxPositions || "∞"} positions filled
            </span>
          </div>

          <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">
            {openingTitle}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
            Status:
          </label>
          <select
            value={currentStatus}
            disabled={isChangingStatus}
            onChange={(e) => handleStatusChange(e.target.value as ApplicationOpeningStatus)}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            <option value="OPEN">OPEN (Accepting)</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CLOSED">CLOSED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>

          {isChangingStatus && <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />}
        </div>
      </div>

      {/* Filter and Compare Action Bar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate..."
              className="rounded-md border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="ALL">All Statuses ({submissions.length})</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <div>
          {selectedIds.length >= 2 ? (
            <Link
              href={`/admin/applications/${openingId}/compare?ids=${selectedIds.join(",")}`}
              className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-purple-700"
            >
              <Scale className="h-3.5 w-3.5" />
              <span>Compare Selected ({selectedIds.length})</span>
            </Link>
          ) : (
            <span className="text-[11px] text-slate-400">
              Select 2 to 4 candidates to compare side-by-side
            </span>
          )}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="w-10 px-4 py-3 text-center">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Discord</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No submissions found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => {
                  const isSelected = selectedIds.includes(sub.id);
                  const statusBadge = {
                    ACCEPTED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
                    SHORTLISTED: "bg-blue-500/10 text-blue-600 border-blue-500/30",
                    SUBMITTED: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30",
                    REJECTED: "bg-rose-500/10 text-rose-600 border-rose-500/30",
                  }[sub.status] || "bg-slate-100 text-slate-600";

                  return (
                    <tr
                      key={sub.id}
                      className={`transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                        isSelected ? "bg-purple-50/50 dark:bg-purple-950/20" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(sub.id)}
                          className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                        <Link
                          href={`/admin/applications/${openingId}/submissions/${sub.id}`}
                          className="hover:text-cyan-600 hover:underline dark:hover:text-cyan-400"
                        >
                          {sub.displayName}
                        </Link>
                        <span className="ml-1 text-[11px] font-normal text-slate-400">
                          (@{sub.playerName})
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {sub.discordUsername || "—"}
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        {sub.submittedAt
                          ? new Date(sub.submittedAt).toLocaleDateString()
                          : "Draft"}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-bold ${statusBadge}`}>
                          {sub.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        {sub.notesCount > 0 ? `${sub.notesCount} notes` : "—"}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/applications/${openingId}/submissions/${sub.id}`}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-900 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-cyan-950"
                        >
                          <span>Review</span>
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
