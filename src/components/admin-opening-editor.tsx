"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createApplicationOpeningAction } from "@/actions/applications";
import { APPLICATION_TEMPLATES } from "@/lib/application-templates";
import type { ApplicationRole, ApplicationQuestionType } from "@/generated/prisma/enums";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

type QuestionItem = {
  id: string;
  order: number;
  prompt: string;
  description: string;
  type: ApplicationQuestionType;
  required: boolean;
  options: string;
  placeholder: string;
  minLength: number | "";
  maxLength: number | "";
};

export function AdminOpeningEditor() {
  const router = useRouter();

  const [selectedTemplate, setSelectedTemplate] = useState<string>("LIST_REVIEWER");
  const [title, setTitle] = useState(APPLICATION_TEMPLATES.LIST_REVIEWER.title);
  const [slug, setSlug] = useState(APPLICATION_TEMPLATES.LIST_REVIEWER.slug);
  const [role, setRole] = useState<ApplicationRole>("LIST_REVIEWER");
  const [description, setDescription] = useState(APPLICATION_TEMPLATES.LIST_REVIEWER.description);
  const [requirementsText, setRequirementsText] = useState(
    APPLICATION_TEMPLATES.LIST_REVIEWER.requirements.join("\n"),
  );
  const [status, setStatus] = useState<"DRAFT" | "OPEN">("DRAFT");
  const [deadline, setDeadline] = useState<string>("");
  const [maxPositions, setMaxPositions] = useState<number | "">(
    APPLICATION_TEMPLATES.LIST_REVIEWER.defaultMaxPositions || 5,
  );

  const [questions, setQuestions] = useState<QuestionItem[]>(
    APPLICATION_TEMPLATES.LIST_REVIEWER.questions.map((q, idx) => ({
      id: `q-${idx + 1}`,
      order: q.order,
      prompt: q.prompt,
      description: q.description || "",
      type: q.type,
      required: q.required,
      options: q.options ? q.options.join(", ") : "",
      placeholder: q.placeholder || "",
      minLength: q.minLength ?? "",
      maxLength: q.maxLength ?? "",
    })),
  );

  const [previewMode, setPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleApplyTemplate = (tmplKey: string) => {
    setSelectedTemplate(tmplKey);
    if (tmplKey === "CUSTOM") {
      setTitle("");
      setSlug("");
      setDescription("");
      setRequirementsText("");
      setQuestions([
        {
          id: `q-1`,
          order: 1,
          prompt: "What is your Discord username?",
          description: "Include your tag or handle.",
          type: "SHORT_TEXT",
          required: true,
          options: "",
          placeholder: "username",
          minLength: 3,
          maxLength: 100,
        },
      ]);
      return;
    }

    const tmpl = APPLICATION_TEMPLATES[tmplKey as ApplicationRole];
    if (!tmpl) return;

    setTitle(tmpl.title);
    setSlug(tmpl.slug);
    setRole(tmpl.role);
    setDescription(tmpl.description);
    setRequirementsText(tmpl.requirements.join("\n"));
    setMaxPositions(tmpl.defaultMaxPositions || "");
    setQuestions(
      tmpl.questions.map((q, idx) => ({
        id: `q-${idx + 1}`,
        order: q.order,
        prompt: q.prompt,
        description: q.description || "",
        type: q.type,
        required: q.required,
        options: q.options ? q.options.join(", ") : "",
        placeholder: q.placeholder || "",
        minLength: q.minLength ?? "",
        maxLength: q.maxLength ?? "",
      })),
    );
  };

  const addQuestion = () => {
    const nextOrder = questions.length + 1;
    setQuestions([
      ...questions,
      {
        id: `q-${Date.now()}`,
        order: nextOrder,
        prompt: "",
        description: "",
        type: "LONG_TEXT",
        required: true,
        options: "",
        placeholder: "",
        minLength: "",
        maxLength: "",
      },
    ]);
  };

  const removeQuestion = (idx: number) => {
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated.map((q, i) => ({ ...q, order: i + 1 })));
  };

  const moveQuestion = (idx: number, direction: "up" | "down") => {
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === questions.length - 1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const copy = [...questions];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;

    setQuestions(copy.map((q, i) => ({ ...q, order: i + 1 })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const parsedRequirements = requirementsText
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    try {
      const res = await createApplicationOpeningAction({
        title,
        slug,
        role,
        description,
        requirements: parsedRequirements,
        status,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        maxPositions: typeof maxPositions === "number" ? maxPositions : null,
        questions: questions.map((q, i) => ({
          order: i + 1,
          prompt: q.prompt,
          description: q.description || undefined,
          type: q.type,
          required: q.required,
          options: q.options
            ? q.options
                .split(",")
                .map((o) => o.trim())
                .filter(Boolean)
            : undefined,
          placeholder: q.placeholder || undefined,
          minLength: typeof q.minLength === "number" ? q.minLength : undefined,
          maxLength: typeof q.maxLength === "number" ? q.maxLength : undefined,
        })),
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to create opening.");
        setIsSubmitting(false);
        return;
      }

      router.push(`/admin/applications/${res.data?.openingId}`);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error creating opening.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Chooser Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          Load from Official Template
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["LIST_REVIEWER", "LIST_MODERATOR", "BETA_TESTER", "CUSTOM"] as const).map((key) => {
            const isSelected = selectedTemplate === key;
            const label =
              key === "CUSTOM"
                ? "Blank / Custom"
                : key === "LIST_REVIEWER"
                  ? "List Reviewer"
                  : key === "LIST_MODERATOR"
                    ? "List Moderator"
                    : "Beta Tester";

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleApplyTemplate(key)}
                className={`rounded-md border px-3 py-1.5 text-xs font-bold transition ${
                  isSelected
                    ? "border-cyan-500 bg-cyan-50 text-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-200"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setPreviewMode(!previewMode)}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>{previewMode ? "Edit Mode" : "Preview Mode"}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 text-xs font-semibold text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {previewMode ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 border-b border-slate-200 pb-4 dark:border-slate-800">
            <span className="rounded bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-600 dark:text-cyan-400">
              {role.replace(/_/g, " ")}
            </span>
            <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{title}</h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{description}</p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Questions ({questions.length})
            </h4>
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-black text-cyan-600">Q{idx + 1}.</span>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {q.prompt || "(Untitled Question)"}
                  </div>
                  {q.required && <span className="text-xs text-rose-500">*</span>}
                </div>
                {q.description && (
                  <p className="mt-1 text-[11px] text-slate-500">{q.description}</p>
                )}
                <div className="mt-2 text-[11px] text-slate-400">
                  Type: {q.type} {q.options ? `(Options: ${q.options})` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Details */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Opening Details
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Opening Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  URL Slug *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  placeholder="e.g. list-reviewer"
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Staff Role Target *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as ApplicationRole)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="LIST_REVIEWER">List Reviewer</option>
                  <option value="LIST_MODERATOR">List Moderator</option>
                  <option value="BETA_TESTER">Beta Tester</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Initial Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "DRAFT" | "OPEN")}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="DRAFT">Draft (Not public)</option>
                  <option value="OPEN">Open (Accepting applications)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Max Positions (Optional)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxPositions}
                  onChange={(e) => setMaxPositions(e.target.value ? Number(e.target.value) : "")}
                  placeholder="e.g. 5"
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Deadline (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Description *
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs leading-relaxed text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Requirements (One bullet point per line)
              </label>
              <textarea
                rows={4}
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
                placeholder="Active player on NDL&#10;Familiarity with click analysis"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs leading-relaxed text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Question Builder */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Application Questions ({questions.length})
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Customize the exact questions applicants must answer.
                </p>
              </div>

              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center gap-1.5 rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-cyan-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-cyan-600 dark:text-cyan-400">
                      Question #{idx + 1}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveQuestion(idx, "up")}
                        disabled={idx === 0}
                        className="rounded p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(idx, "down")}
                        disabled={idx === questions.length - 1}
                        className="rounded p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        disabled={questions.length <= 1}
                        className="rounded p-1 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950 disabled:opacity-30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Prompt *
                      </label>
                      <input
                        type="text"
                        value={q.prompt}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuestions((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, prompt: val } : item)),
                          );
                        }}
                        required
                        placeholder="Enter the question prompt..."
                        className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Help Description
                      </label>
                      <input
                        type="text"
                        value={q.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuestions((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, description: val } : item,
                            ),
                          );
                        }}
                        placeholder="Additional context or guidance"
                        className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Response Type
                      </label>
                      <select
                        value={q.type}
                        onChange={(e) => {
                          const val = e.target.value as ApplicationQuestionType;
                          setQuestions((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, type: val } : item)),
                          );
                        }}
                        className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <option value="SHORT_TEXT">Short Text</option>
                        <option value="LONG_TEXT">Long Text / Essay</option>
                        <option value="YES_NO">Yes / No</option>
                        <option value="SINGLE_CHOICE">Single Choice (Radio)</option>
                        <option value="MULTIPLE_CHOICE">Multiple Choice (Checkboxes)</option>
                      </select>
                    </div>

                    {(q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE") && (
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Options (comma separated)
                        </label>
                        <input
                          type="text"
                          value={q.options}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuestions((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, options: val } : item)),
                            );
                          }}
                          placeholder="Option 1, Option 2, Option 3"
                          className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id={`req-${q.id}`}
                        checked={q.required}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setQuestions((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, required: val } : item)),
                          );
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      />
                      <label
                        htmlFor={`req-${q.id}`}
                        className="text-xs font-bold text-slate-700 dark:text-slate-300"
                      >
                        Required Question
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Opening...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Create Application Opening</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
