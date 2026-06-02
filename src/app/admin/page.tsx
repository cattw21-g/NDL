import {
  AlertTriangle,
  BookOpen,
  ClipboardCheck,
  FileText,
  ListPlus,
  ScrollText,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";

import { Eyebrow, MetricTile, SectionPanel } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { demoModeEnabled } from "@/lib/demo-visibility";
import { formatDateTime } from "@/lib/format";
import { countModerationQueue } from "@/lib/moderation-queue";
import { calculateCurrentLevelPoints } from "@/lib/points";

export const dynamic = "force-dynamic";

const adminLinks = [
  {
    href: "/admin/levels",
    label: "Levels",
    description: "Add, rank, edit, retire, reject, or remove levels.",
    icon: ListPlus,
    tone: "cyan",
  },
  {
    href: "/admin/users",
    label: "Users",
    description: "Assign player, moderator, and admin roles.",
    icon: Users,
    tone: "blue",
  },
  {
    href: "/admin/rules",
    label: "Rules",
    description: "Publish active proof and submission rules.",
    icon: BookOpen,
    tone: "emerald",
  },
  {
    href: "/admin/changelog",
    label: "Changelog",
    description: "Publish public project updates.",
    icon: FileText,
    tone: "amber",
  },
  {
    href: "/admin/audit",
    label: "Audit Log",
    description: "Review staff actions, changed entities, and sanitized snapshots.",
    icon: ScrollText,
    tone: "blue",
  },
];

export default async function AdminPage() {
  await requireAdmin();
  const isDemoMode = demoModeEnabled();
  const [
    rankedLevels,
    users,
    pendingRecords,
    pendingSuggestions,
    hiddenDemoLevels,
    hiddenDemoUsers,
    recentAcceptedRecords,
  ] = await Promise.all([
    prisma.level.count({
      where: {
        status: "RANKED",
        ...(isDemoMode ? {} : { isDemo: false }),
      },
    }),
    prisma.user.count(),
    countModerationQueue(),
    prisma.levelSuggestion.count({
      where: {
        status: "PENDING",
      },
    }),
    prisma.level.count({
      where: {
        OR: [
          { isDemo: true },
          { name: { startsWith: "[DEMO]" } },
          { thumbnailUrl: { startsWith: "/demo-thumbnails" } },
        ],
      },
    }),
    prisma.user.count({
      where: {
        OR: [
          { isDemo: true },
          { email: { endsWith: "@ndl.local" } },
        ],
      },
    }),
    prisma.record.findMany({
      take: 5,
      include: {
        player: true,
        level: true,
      },
      orderBy: {
        acceptedAt: "desc",
      },
    }),
  ]);

  return (
    <div className="space-y-5">
      <section className="grid gap-4 rounded-md border border-slate-300 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_14px_30px_rgba(0,0,0,0.28)] lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-end">
        <div>
          <div className="mb-3">
            <Eyebrow icon={ShieldCheck} tone="amber">
              Admin console
            </Eyebrow>
          </div>
          <h1 className="text-4xl font-black leading-tight text-slate-950">
            NDL operations
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Manage the list, roles, public rules, and project communications
            without changing public-facing moderation behavior.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MetricTile icon={Trophy} label="Ranked" value={rankedLevels} />
          <MetricTile label="Users" value={users} tone="zinc" />
          <MetricTile
            icon={ClipboardCheck}
            label="Records"
            value={pendingRecords}
            tone="amber"
          />
          <MetricTile
            icon={ListPlus}
            label="Suggestions"
            value={pendingSuggestions}
            tone="cyan"
          />
        </div>
      </section>

      {!isDemoMode && hiddenDemoLevels + hiddenDemoUsers > 0 ? (
        <SectionPanel className="border-amber-300 bg-amber-50 p-4 dark:border-amber-500/50 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 text-amber-700 dark:text-amber-200" />
            <div>
              <h2 className="font-black text-amber-950 dark:text-amber-100">
                Demo rows are hidden from public production views
              </h2>
              <p className="mt-1 text-sm leading-6 text-amber-900 dark:text-amber-100">
                Found {hiddenDemoLevels} demo level(s) and {hiddenDemoUsers} demo
                user(s). They remain hidden unless `ENABLE_DEMO_SEED=true`.
              </p>
            </div>
          </div>
        </SectionPanel>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-4 md:grid-cols-2">
          {adminLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <SectionPanel className="h-full p-5 transition hover:border-cyan-400 hover:bg-cyan-50/60 dark:hover:border-cyan-400 dark:hover:bg-cyan-950/30">
                  <Icon
                    className={`h-7 w-7 ${
                      item.tone === "cyan"
                        ? "text-cyan-800"
                        : item.tone === "blue"
                          ? "text-blue-800"
                          : item.tone === "emerald"
                            ? "text-emerald-800"
                            : "text-amber-800"
                    }`}
                  />
                  <h2 className="mt-4 text-2xl font-black text-slate-950">
                    {item.label}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {item.description}
                  </p>
                </SectionPanel>
              </Link>
            );
          })}
        </div>
        <aside className="space-y-3">
          <SectionPanel className="p-4">
            <h2 className="border-b border-slate-300 pb-3 font-black text-slate-950 dark:border-slate-700 dark:text-slate-50">
              Recent accepted records
            </h2>
            <div className="mt-3 space-y-3">
              {recentAcceptedRecords.length > 0 ? (
                recentAcceptedRecords.map((record) => {
                  const recordPoints = calculateCurrentLevelPoints(record.level);

                  return (
                    <div
                      key={record.id}
                      className="rounded-md border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-950/60"
                    >
                      <div className="truncate font-black text-slate-950 dark:text-slate-50">
                        {record.level.name}
                      </div>
                      <div className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {record.player.displayName} - {recordPoints} pts
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                        {formatDateTime(record.acceptedAt)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                  Accepted records will appear here after review.
                </p>
              )}
            </div>
          </SectionPanel>
          <SectionPanel className="p-4">
            <h2 className="border-b border-slate-300 pb-3 font-black text-slate-950">
              Operations posture
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li>Level edits create history entries.</li>
              <li>Role changes take effect immediately.</li>
              <li>Rules and changelog posts are public-facing.</li>
            </ul>
          </SectionPanel>
        </aside>
      </section>
    </div>
  );
}
