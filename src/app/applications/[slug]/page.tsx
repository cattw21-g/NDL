import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { APPLICATION_TEMPLATES } from "@/lib/application-templates";
import { ApplicationForm, type QuestionData, type ExistingSubmission } from "@/components/application-form";
import {
  Clock,
  ArrowLeft,
  LogIn,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tmpl = Object.values(APPLICATION_TEMPLATES).find((t) => t.slug === slug);
  const title = tmpl ? `${tmpl.title} Application — Nerfed Demonlist` : "Staff Application — Nerfed Demonlist";

  return {
    title,
    description: "Submit your application to join the Nerfed Demonlist staff team.",
  };
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();

  let opening = null;
  let questions: QuestionData[] = [];
  let existingSubmission: ExistingSubmission | null = null;

  try {
    const dbOpening = await prisma.applicationOpening.findUnique({
      where: { slug },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (dbOpening) {
      opening = dbOpening;
      questions = dbOpening.questions.map((q) => ({
        id: q.id,
        order: q.order,
        prompt: q.prompt,
        description: q.description,
        type: q.type,
        required: q.required,
        options: q.options ? JSON.parse(q.options) : null,
        placeholder: q.placeholder,
        minLength: q.minLength,
        maxLength: q.maxLength,
      }));
    }

    if (!opening) {
      const { ensureApplicationSchemaAndOpenings } = await import("@/lib/ensure-application-schema");
      await ensureApplicationSchemaAndOpenings();
      const retryOpening = await prisma.applicationOpening.findUnique({
        where: { slug },
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (retryOpening) {
        opening = retryOpening;
        questions = retryOpening.questions.map((q) => ({
          id: q.id,
          order: q.order,
          prompt: q.prompt,
          description: q.description,
          type: q.type,
          required: q.required,
          options: q.options ? JSON.parse(q.options) : null,
          placeholder: q.placeholder,
          minLength: q.minLength,
          maxLength: q.maxLength,
        }));
      }
    }
  } catch (err) {
    console.error("Database query for opening failed:", err);
  }

  // Fallback to built-in template if not found in DB
  const tmpl = Object.values(APPLICATION_TEMPLATES).find((t) => t.slug === slug);

  if (!opening && !tmpl) {
    notFound();
  }

  const title = opening ? opening.title : tmpl!.title;
  const role = opening ? opening.role : tmpl!.role;
  const description = opening ? opening.description : tmpl!.description;
  const deadline = opening?.deadline || null;
  const isOpen = opening ? opening.status === "OPEN" : true;
  const openingId = opening ? opening.id : tmpl!.slug;

  const now = new Date();
  const deadlinePassed = Boolean(deadline && now > deadline);

  let requirements: string[] = [];
  if (opening?.requirements) {
    try {
      requirements = JSON.parse(opening.requirements);
    } catch {
      requirements = [opening.requirements];
    }
  } else if (tmpl) {
    requirements = tmpl.requirements;
  }

  if (questions.length === 0 && tmpl) {
    questions = tmpl.questions.map((q, idx) => ({
      id: `tmpl-q-${idx + 1}`,
      order: q.order,
      prompt: q.prompt,
      description: q.description || null,
      type: q.type,
      required: q.required,
      options: q.options || null,
      placeholder: q.placeholder || null,
      minLength: q.minLength || null,
      maxLength: q.maxLength || null,
    }));
  }

  if (user && opening) {
    try {
      const sub = await prisma.applicationSubmission.findUnique({
        where: {
          openingId_userId: {
            openingId: opening.id,
            userId: user.id,
          },
        },
      });

      if (sub) {
        let parsedAnswers = {};
        try {
          parsedAnswers = JSON.parse(sub.answers);
        } catch {
          parsedAnswers = {};
        }

        existingSubmission = {
          id: sub.id,
          status: sub.status,
          answers: parsedAnswers,
          submittedAt: sub.submittedAt ? sub.submittedAt.toISOString() : null,
          updatedAt: sub.updatedAt.toISOString(),
        };
      }
    } catch (err) {
      console.error("Failed to load user submission:", err);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href="/applications"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Applications</span>
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            {role.replace(/_/g, " ")}
          </span>

          {isOpen && !deadlinePassed ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Open for Applications
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
              Closed
            </span>
          )}

          {deadline && (
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              Deadline: {new Date(deadline).toLocaleDateString()}
            </span>
          )}
        </div>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {description}
        </p>

        {requirements.length > 0 && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white/70 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Key Requirements
            </h4>
            <ul className="mt-2 grid gap-1.5 text-xs text-slate-700 dark:text-slate-300 sm:grid-cols-2">
              {requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-500" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {!user ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-600 dark:text-amber-400" />
          <h3 className="mt-2 text-base font-bold text-amber-900 dark:text-amber-200">
            Sign in required to apply
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-amber-800 dark:text-amber-300">
            Please log in or create an account to fill out and submit your application. Your draft will autosave while you type.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href={`/login?redirect=/applications/${slug}`}
              className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-amber-700"
            >
              <LogIn className="h-4 w-4" />
              <span>Log In</span>
            </Link>
            <Link
              href={`/register?redirect=/applications/${slug}`}
              className="inline-flex items-center gap-2 rounded-md border border-amber-600/40 bg-white px-4 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-50 dark:bg-slate-900 dark:text-amber-200 dark:hover:bg-slate-800"
            >
              <span>Register</span>
            </Link>
          </div>
        </div>
      ) : (!isOpen || deadlinePassed) && (!existingSubmission || existingSubmission.status === "DRAFT") ? (
        <div className="rounded-xl border border-slate-300 bg-slate-100/80 p-6 text-center dark:border-slate-800 dark:bg-slate-900/80">
          <Clock className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-2 text-base font-bold text-slate-800 dark:text-slate-200">
            Applications are currently closed
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-600 dark:text-slate-400">
            This opening has reached its deadline or has been closed by list administration. Thank you for your interest!
          </p>
          <div className="mt-4">
            <Link
              href="/applications"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <span>View other openings</span>
            </Link>
          </div>
        </div>
      ) : (
        <ApplicationForm
          openingId={openingId}
          openingSlug={slug}
          isOpen={isOpen}
          deadlinePassed={deadlinePassed}
          questions={questions}
          existingSubmission={existingSubmission}
          user={user}
        />
      )}
    </div>
  );
}
