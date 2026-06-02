import { Search } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import {
  EmptyState,
  FieldLabel,
  inputClass,
  PageHeader,
  SectionPanel,
} from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const filters = auditFiltersFromParams(params);
  const events = await prisma.adminAuditLog.findMany({
    where: filters.where,
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit log"
        description="Review admin and staff actions with actor snapshots, entity labels, and sanitized before/after details."
      />

      <SectionPanel className="p-4">
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] xl:items-end">
          <FieldLabel label="Action">
            <input
              name="action"
              defaultValue={filters.values.action}
              className={inputClass}
              placeholder="LEVEL_UPDATED"
            />
          </FieldLabel>
          <FieldLabel label="Entity type">
            <input
              name="entityType"
              defaultValue={filters.values.entityType}
              className={inputClass}
              placeholder="Level"
            />
          </FieldLabel>
          <FieldLabel label="Actor">
            <input
              name="actor"
              defaultValue={filters.values.actor}
              className={inputClass}
              placeholder="Staff username"
            />
          </FieldLabel>
          <FieldLabel label="From">
            <input
              type="date"
              name="from"
              defaultValue={filters.values.from}
              className={inputClass}
            />
          </FieldLabel>
          <FieldLabel label="To">
            <input
              type="date"
              name="to"
              defaultValue={filters.values.to}
              className={inputClass}
            />
          </FieldLabel>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-cyan-800 bg-cyan-800 px-4 text-sm font-black text-white transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            <Search className="h-4 w-4" />
            Filter
          </button>
          <FieldLabel label="Entity search">
            <input
              name="q"
              defaultValue={filters.values.q}
              className={inputClass}
              placeholder="Level or player name"
            />
          </FieldLabel>
        </form>
      </SectionPanel>

      <SectionPanel className="overflow-hidden">
        {events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[62rem] border-collapse text-left text-sm">
              <thead className="border-b border-slate-300 bg-slate-100 text-xs uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-3 font-black">Time</th>
                  <th className="px-3 py-3 font-black">Actor</th>
                  <th className="px-3 py-3 font-black">Action</th>
                  <th className="px-3 py-3 font-black">Entity type</th>
                  <th className="px-3 py-3 font-black">Entity label</th>
                  <th className="px-3 py-3 font-black">Note</th>
                  <th className="px-3 py-3 font-black">Details</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-slate-200 align-top dark:border-slate-800"
                  >
                    <td className="whitespace-nowrap px-3 py-3 font-bold text-slate-600 dark:text-slate-300">
                      {formatDateTime(event.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-black text-slate-950 dark:text-slate-50">
                        {event.actorName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        @{event.actorHandle} - {event.actorRole}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge value={event.action} />
                    </td>
                    <td className="px-3 py-3 font-bold text-slate-700 dark:text-slate-200">
                      {event.entityType}
                    </td>
                    <td className="max-w-64 px-3 py-3">
                      <div className="truncate font-black text-slate-950 dark:text-slate-50">
                        {event.entityLabel}
                      </div>
                      <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {event.entityId}
                      </div>
                    </td>
                    <td className="max-w-72 px-3 py-3 text-slate-600 dark:text-slate-300">
                      {event.note ?? "No note recorded."}
                    </td>
                    <td className="px-3 py-3">
                      <details className="group">
                        <summary className="cursor-pointer rounded-md text-sm font-black text-cyan-800 outline-none focus:ring-2 focus:ring-cyan-300 dark:text-cyan-200">
                          Details
                        </summary>
                        <div className="mt-3 grid gap-3 lg:grid-cols-2">
                          <JsonBlock label="Before" value={event.beforeJson} />
                          <JsonBlock label="After" value={event.afterJson} />
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4">
            <EmptyState
              title="No audit events found"
              description="Staff and admin actions will appear here after changes are made."
            />
          </div>
        )}
      </SectionPanel>
    </div>
  );
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-950/60">
      <div className="mb-2 text-xs font-black uppercase text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-700 dark:text-slate-200">
        {value === null || value === undefined
          ? "Not captured"
          : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function auditFiltersFromParams(
  params: Record<string, string | string[] | undefined>,
) {
  const values = {
    action: paramString(params.action),
    entityType: paramString(params.entityType),
    actor: paramString(params.actor),
    from: paramString(params.from),
    to: paramString(params.to),
    q: paramString(params.q),
  };
  const createdAt: Prisma.DateTimeFilter = {};
  const fromDate = dateFromInput(values.from, "start");
  const toDate = dateFromInput(values.to, "end");

  if (fromDate) {
    createdAt.gte = fromDate;
  }

  if (toDate) {
    createdAt.lte = toDate;
  }

  const where: Prisma.AdminAuditLogWhereInput = {
    ...(values.action ? { action: { contains: values.action } } : {}),
    ...(values.entityType
      ? { entityType: { contains: values.entityType } }
      : {}),
    ...(values.q ? { entityLabel: { contains: values.q } } : {}),
    ...(values.actor
      ? {
          OR: [
            { actorName: { contains: values.actor } },
            { actorHandle: { contains: values.actor } },
          ],
        }
      : {}),
    ...(fromDate || toDate ? { createdAt } : {}),
  };

  return {
    values,
    where,
  };
}

function paramString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function dateFromInput(value: string, edge: "start" | "end") {
  if (!value) {
    return null;
  }

  const date = new Date(
    edge === "start" ? `${value}T00:00:00.000Z` : `${value}T23:59:59.999Z`,
  );

  return Number.isNaN(date.getTime()) ? null : date;
}
