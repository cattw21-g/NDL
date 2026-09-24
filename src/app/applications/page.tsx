import { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SectionPanel } from "@/components/ui";
import { APPLICATION_TEMPLATES } from "@/lib/application-templates";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  UserCheck,
  FileEdit,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Staff Applications — Nerfed Demonlist",
  description: "Apply to join the Nerfed Demonlist team as a List Reviewer, List Moderator, or Beta Tester.",
};

export const revalidate = 60;

export default async function ApplicationsPage() {
  const user = await getCurrentUser();

  // Load openings from DB
  let openings: Array<{
    id: string;
    slug: string;
    title: string;
    role: "LIST_REVIEWER" | "LIST_MODERATOR" | "BETA_TESTER";
    description: string;
    requirements: string | null;
    status: string;
    deadline: Date | null;
    maxPositions: number | null;
    _count: { submissions: number };
  }> = [];

  const userSubmissions: Record<string, { status: string; id: string }> = {};

  try {
    const dbOpenings = await prisma.applicationOpening.findMany({
      where: {
        status: { in: ["OPEN", "CLOSED"] },
        isPublished: true,
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        role: true,
        description: true,
        requirements: true,
        status: true,
        deadline: true,
        maxPositions: true,
        _count: {
          select: { submissions: true },
        },
      },
    });

    if (dbOpenings.length > 0) {
      openings = dbOpenings;
    } else {
      const { ensureApplicationSchemaAndOpenings } = await import("@/lib/ensure-application-schema");
      await ensureApplicationSchemaAndOpenings();
      openings = await prisma.applicationOpening.findMany({
        where: {
          status: { in: ["OPEN", "CLOSED"] },
          isPublished: true,
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          role: true,
          description: true,
          requirements: true,
          status: true,
          deadline: true,
          maxPositions: true,
          _count: {
            select: { submissions: true },
          },
        },
      });
    }

    if (user && openings.length > 0) {
      const subs = await prisma.applicationSubmission.findMany({
        where: { userId: user.id },
        select: { openingId: true, status: true, id: true },
      });
      for (const s of subs) {
        userSubmissions[s.openingId] = { status: s.status, id: s.id };
      }
    }
  } catch (err) {
    console.error("Failed to load applications from database:", err);
  }

  // Fallback to built-in templates if no DB openings published yet
  const displayItems =
    openings.length > 0
      ? openings.map((o) => {
          let reqList: string[] = [];
          if (o.requirements) {
            try {
              reqList = JSON.parse(o.requirements);
            } catch {
              reqList = [o.requirements];
            }
          }
          return {
            id: o.id,
            slug: o.slug,
            title: o.title,
            role: o.role,
            description: o.description,
            requirements: reqList,
            isOpen: o.status === "OPEN" && (!o.deadline || new Date() <= o.deadline),
            deadline: o.deadline,
            maxPositions: o.maxPositions,
            userStatus: userSubmissions[o.id]?.status,
            userSubmissionId: userSubmissions[o.id]?.id,
          };
        })
      : Object.values(APPLICATION_TEMPLATES).map((t) => ({
          id: t.slug,
          slug: t.slug,
          title: t.title,
          role: t.role,
          description: t.description,
          requirements: t.requirements,
          isOpen: true,
          deadline: null,
          maxPositions: t.defaultMaxPositions || null,
          userStatus: undefined,
          userSubmissionId: undefined,
        }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-600 dark:text-cyan-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Join Nerfed Demonlist Staff</span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Staff Applications
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Help verify records, maintain list accuracy, uphold community standards, or test upcoming releases.
          </p>
        </div>

        {user && (
          <Link
            href="/applications/mine"
            className="inline-flex items-center gap-2 self-start rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950 dark:hover:text-cyan-100"
          >
            <UserCheck className="h-4 w-4 text-cyan-500" />
            <span>My Applications</span>
          </Link>
        )}
      </div>

      <div className="mb-8 grid gap-4 rounded-xl border border-slate-200 bg-white/70 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 sm:grid-cols-3">
        <div className="flex items-start gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Integrity First</h4>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              Decisions are based strictly on evidence, video verification, and list guidelines.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Realistic Commitment</h4>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              We value steady, reliable contribution over sporadic bursts. State your honest availability.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Private Review</h4>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              Your application answers are completely private and only accessible to list administrators.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {displayItems.map((item) => {
          const roleBadgeColor =
            item.role === "LIST_MODERATOR"
              ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : item.role === "LIST_REVIEWER"
                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                : "border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400";

          return (
            <SectionPanel key={item.slug} className="overflow-hidden p-0">
              <div className="border-b border-slate-200/80 bg-slate-50/50 p-5 dark:border-slate-800/80 dark:bg-slate-900/50 sm:flex sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${roleBadgeColor}`}
                  >
                    {item.role.replace(/_/g, " ")}
                  </span>

                  {item.isOpen ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Accepting Applications
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Closed
                    </span>
                  )}

                  {item.maxPositions && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      ({item.maxPositions} {item.maxPositions === 1 ? "position" : "positions"})
                    </span>
                  )}
                </div>

                {item.userStatus && (
                  <div className="mt-2 sm:mt-0">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ${
                        item.userStatus === "ACCEPTED"
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                          : item.userStatus === "SHORTLISTED"
                            ? "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                            : item.userStatus === "SUBMITTED"
                              ? "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300"
                              : item.userStatus === "DRAFT"
                                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      <FileEdit className="h-3.5 w-3.5" />
                      Status: {item.userStatus}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {item.description}
                </p>

                {item.requirements && item.requirements.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Requirements & Expectations
                    </h5>
                    <ul className="mt-2 grid gap-1.5 text-xs text-slate-700 dark:text-slate-300 sm:grid-cols-2">
                      {item.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-500" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-6 flex flex-col justify-between gap-3 border-t border-slate-200/80 pt-4 dark:border-slate-800/80 sm:flex-row sm:items-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {item.deadline ? (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        Deadline: {new Date(item.deadline).toLocaleDateString()}
                      </span>
                    ) : (
                      <span>Rolling reviews until filled</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {item.userStatus === "DRAFT" ? (
                      <Link
                        href={`/applications/${item.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        <span>Continue Draft</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : item.userStatus === "SUBMITTED" || item.userStatus === "SHORTLISTED" ? (
                      <Link
                        href={`/applications/mine`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <span>View My Application</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : item.isOpen ? (
                      <Link
                        href={`/applications/${item.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-md bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:bg-cyan-500 dark:hover:bg-cyan-600"
                      >
                        <span>Apply Now</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">Currently Closed</span>
                    )}
                  </div>
                </div>
              </div>
            </SectionPanel>
          );
        })}
      </div>
    </div>
  );
}
