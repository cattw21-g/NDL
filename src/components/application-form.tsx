"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  saveApplicationDraftAction,
  submitApplicationAction,
  withdrawApplicationAction,
} from "@/actions/applications";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Save,
  Send,
  Loader2,
  RotateCcw,
} from "lucide-react";

export type QuestionData = {
  id: string;
  order: number;
  prompt: string;
  description: string | null;
  type: "SHORT_TEXT" | "LONG_TEXT" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "YES_NO";
  required: boolean;
  options: string[] | null;
  placeholder: string | null;
  minLength: number | null;
  maxLength: number | null;
};

export type ExistingSubmission = {
  id: string;
  status: "DRAFT" | "SUBMITTED" | "WITHDRAWN" | "SHORTLISTED" | "ACCEPTED" | "REJECTED";
  answers: Record<string, unknown>;
  submittedAt: string | null;
  updatedAt: string;
};

export function ApplicationForm({
  openingId,
  isOpen,
  deadlinePassed,
  questions,
  existingSubmission,
  user,
}: {
  openingId: string;
  openingSlug?: string;
  isOpen: boolean;
  deadlinePassed: boolean;
  questions: QuestionData[];
  existingSubmission: ExistingSubmission | null;
  user: { id: string; playerName: string; displayName: string } | null;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, unknown>>(
    existingSubmission?.answers || {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(
    existingSubmission ? `Last saved at ${new Date(existingSubmission.updatedAt).toLocaleTimeString()}` : null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const isReadOnly =
    existingSubmission &&
    existingSubmission.status !== "DRAFT" &&
    existingSubmission.status !== "WITHDRAWN";

  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedJsonRef = useRef<string>(JSON.stringify(existingSubmission?.answers || {}));

  const handleFieldChange = (questionId: string, value: unknown) => {
    if (isReadOnly || !isOpen || deadlinePassed) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    setSaveStatus("Unsaved changes");
    setErrorMessage(null);
  };

  // Debounced Autosave
  useEffect(() => {
    if (!user || isReadOnly || !isOpen || deadlinePassed) return;

    const currentJson = JSON.stringify(answers);
    if (currentJson === lastSavedJsonRef.current) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      try {
        setIsSavingDraft(true);
        const res = await saveApplicationDraftAction({
          openingId,
          answers,
        });
        if (res.success) {
          lastSavedJsonRef.current = currentJson;
          setSaveStatus(`Draft saved at ${new Date().toLocaleTimeString()}`);
        } else {
          setSaveStatus("Autosave failed");
        }
      } catch {
        setSaveStatus("Autosave failed");
      } finally {
        setIsSavingDraft(false);
      }
    }, 2000);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [answers, user, isReadOnly, isOpen, deadlinePassed, openingId]);

  const handleManualSaveDraft = async () => {
    if (!user || isReadOnly || !isOpen || deadlinePassed) return;
    try {
      setIsSavingDraft(true);
      setErrorMessage(null);
      const res = await saveApplicationDraftAction({
        openingId,
        answers,
      });
      if (res.success) {
        lastSavedJsonRef.current = JSON.stringify(answers);
        setSaveStatus(`Draft saved at ${new Date().toLocaleTimeString()}`);
      } else {
        setErrorMessage(res.error || "Failed to save draft.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error saving draft.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage("Please sign in before submitting an application.");
      return;
    }
    if (!isOpen || deadlinePassed) {
      setErrorMessage("This application opening is closed.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await submitApplicationAction({
        openingId,
        answers,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Submission failed. Please check your answers.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage("Your application has been successfully submitted! Redirecting...");
      setTimeout(() => {
        router.push("/applications/mine");
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!existingSubmission) return;
    setIsWithdrawing(true);
    try {
      const res = await withdrawApplicationAction({
        submissionId: existingSubmission.id,
      });
      if (res.success) {
        router.refresh();
        setShowWithdrawConfirm(false);
      } else {
        setErrorMessage(res.error || "Failed to withdraw application.");
      }
    } catch {
      setErrorMessage("Error withdrawing application.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  // If already submitted (Read-Only)
  if (isReadOnly) {
    const statusColor =
      existingSubmission.status === "ACCEPTED"
        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        : existingSubmission.status === "SHORTLISTED"
          ? "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300"
          : existingSubmission.status === "REJECTED"
            ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
            : "border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300";

    return (
      <div className="space-y-6">
        <div className={`rounded-xl border p-5 ${statusColor}`}>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2 font-black">
                <CheckCircle2 className="h-5 w-5" />
                <span>Application {existingSubmission.status}</span>
              </div>
              <p className="mt-1 text-xs opacity-90">
                Submitted on{" "}
                {existingSubmission.submittedAt
                  ? new Date(existingSubmission.submittedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Recently"}
                . Responses are locked for evaluation.
              </p>
            </div>

            {existingSubmission.status === "SUBMITTED" && (
              <div>
                {showWithdrawConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleWithdraw}
                      disabled={isWithdrawing}
                      className="rounded bg-rose-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
                    >
                      {isWithdrawing ? "Withdrawing..." : "Confirm Withdraw"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWithdrawConfirm(false)}
                      className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowWithdrawConfirm(true)}
                    className="inline-flex items-center gap-1.5 rounded border border-rose-300 bg-white/80 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-950"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Withdraw Application</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
            Your Submitted Responses
          </h3>
          {questions.map((q, idx) => {
            const rawVal = answers[q.id];
            const displayVal =
              rawVal === undefined || rawVal === null
                ? "(No answer provided)"
                : typeof rawVal === "object"
                  ? JSON.stringify(rawVal)
                  : String(rawVal);

            return (
              <div
                key={q.id}
                className="rounded-lg border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/80"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-black text-cyan-600 dark:text-cyan-400">
                    Q{idx + 1}.
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {q.prompt}
                  </h4>
                </div>
                {q.description && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {q.description}
                  </p>
                )}
                <div className="mt-3 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs leading-relaxed text-slate-800 dark:bg-slate-950 dark:text-slate-200">
                  {displayVal}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Application Form (Editable)
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 text-xs font-semibold text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Autosave Status Bar */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          {isSavingDraft ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-500" />
              <span>Saving draft...</span>
            </>
          ) : (
            <>
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{saveStatus || "Drafts autosave as you type"}</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleManualSaveDraft}
          disabled={isSavingDraft || isSubmitting || !user}
          className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          <span>Save Draft</span>
        </button>
      </div>

      {/* Questions list */}
      <div className="space-y-6">
        {questions.map((q, idx) => {
          const val = answers[q.id];
          const strVal = typeof val === "string" ? val : "";

          return (
            <div
              key={q.id}
              className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/90"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-black text-cyan-600 dark:text-cyan-400">
                      Q{idx + 1}.
                    </span>
                    <label
                      htmlFor={`q-${q.id}`}
                      className="text-sm font-bold text-slate-900 dark:text-slate-100"
                    >
                      {q.prompt}
                    </label>
                    {q.required ? (
                      <span className="text-xs font-bold text-rose-500">*</span>
                    ) : (
                      <span className="text-[11px] text-slate-400">(Optional)</span>
                    )}
                  </div>
                  {q.description && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {q.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3">
                {q.type === "SHORT_TEXT" && (
                  <input
                    id={`q-${q.id}`}
                    type="text"
                    value={strVal}
                    placeholder={q.placeholder || "Your answer..."}
                    maxLength={q.maxLength || undefined}
                    onChange={(e) => handleFieldChange(q.id, e.target.value)}
                    required={q.required}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                )}

                {q.type === "LONG_TEXT" && (
                  <div>
                    <textarea
                      id={`q-${q.id}`}
                      rows={5}
                      value={strVal}
                      placeholder={q.placeholder || "Provide a detailed explanation..."}
                      maxLength={q.maxLength || undefined}
                      onChange={(e) => handleFieldChange(q.id, e.target.value)}
                      required={q.required}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs leading-relaxed text-slate-900 placeholder-slate-400 shadow-xs focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500"
                    />
                    <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
                      <span>
                        {q.minLength ? `Min: ${q.minLength} chars` : ""}
                      </span>
                      <span>
                        {strVal.length}
                        {q.maxLength ? ` / ${q.maxLength}` : " chars"}
                      </span>
                    </div>
                  </div>
                )}

                {q.type === "YES_NO" && (
                  <div className="flex items-center gap-6">
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value="Yes"
                        checked={val === "Yes"}
                        onChange={() => handleFieldChange(q.id, "Yes")}
                        required={q.required}
                        className="h-4 w-4 border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      />
                      <span>Yes</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value="No"
                        checked={val === "No"}
                        onChange={() => handleFieldChange(q.id, "No")}
                        required={q.required}
                        className="h-4 w-4 border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      />
                      <span>No</span>
                    </label>
                  </div>
                )}

                {(q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE") && (
                  <div className="space-y-2">
                    {q.options && q.options.length > 0 ? (
                      q.options.map((opt) => (
                        <label
                          key={opt}
                          className="flex cursor-pointer items-center gap-2.5 rounded-md border border-slate-200 p-2.5 text-xs text-slate-800 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800/60"
                        >
                          <input
                            type={q.type === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                            name={`q-${q.id}`}
                            value={opt}
                            checked={
                              q.type === "SINGLE_CHOICE"
                                ? val === opt
                                : Array.isArray(val) && val.includes(opt)
                            }
                            onChange={(e) => {
                              if (q.type === "SINGLE_CHOICE") {
                                handleFieldChange(q.id, opt);
                              } else {
                                const currentArr = Array.isArray(val) ? [...val] : [];
                                if (e.target.checked) {
                                  currentArr.push(opt);
                                } else {
                                  const idx = currentArr.indexOf(opt);
                                  if (idx > -1) currentArr.splice(idx, 1);
                                }
                                handleFieldChange(q.id, currentArr);
                              }
                            }}
                            className="h-4 w-4 border-slate-300 text-cyan-600 focus:ring-cyan-500"
                          />
                          <span>{opt}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">No options defined.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submission Footer */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
        <div className="text-xs text-slate-600 dark:text-slate-400">
          <p className="font-bold text-slate-900 dark:text-slate-200">
            Ready to submit?
          </p>
          <p className="mt-0.5">
            Once submitted, your answers cannot be edited unless withdrawn.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleManualSaveDraft}
            disabled={isSavingDraft || isSubmitting || !user}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            Save Draft
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !user || !isOpen || deadlinePassed}
            className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:bg-cyan-500 dark:hover:bg-cyan-600 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit Application</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
