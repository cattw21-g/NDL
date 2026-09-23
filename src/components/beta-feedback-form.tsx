"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitBetaFeedbackAction } from "@/actions/applications";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { BetaFeedbackType } from "@/generated/prisma/enums";

export function BetaFeedbackForm() {
  const router = useRouter();
  const [type, setType] = useState<BetaFeedbackType>("BUG");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [browserInfo, setBrowserInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-detect browser on mount
  useState(() => {
    if (typeof window !== "undefined") {
      setBrowserInfo(`${navigator.userAgent} (${window.innerWidth}x${window.innerHeight})`);
      setPageUrl(window.location.pathname);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await submitBetaFeedbackAction({
        type,
        title,
        description,
        pageUrl,
        browserInfo,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to submit feedback.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage("Thank you! Your feedback has been submitted to the development team.");
      setTitle("");
      setDescription("");
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error submitting feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Feedback Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as BetaFeedbackType)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="BUG">Bug Report</option>
            <option value="UI_UX">UI / UX Issue</option>
            <option value="PERFORMANCE">Performance / Lag</option>
            <option value="SUGGESTION">Feature Suggestion</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Relevant Page / URL
          </label>
          <input
            type="text"
            value={pageUrl}
            onChange={(e) => setPageUrl(e.target.value)}
            placeholder="e.g. /levels/kocmoc-unleashed or /submit"
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          Short Summary / Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Filter dropdown clipped on iPhone 14 Safari"
          required
          minLength={5}
          maxLength={150}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          Details / Steps to Reproduce *
        </label>
        <textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Explain what happened, steps to reproduce, expected result, and any error message or screenshot links."
          required
          minLength={15}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs leading-relaxed text-slate-900 placeholder-slate-400 shadow-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          Environment / Device Info (Auto-detected)
        </label>
        <input
          type="text"
          value={browserInfo}
          onChange={(e) => setBrowserInfo(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              <span>Submit Beta Feedback</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
