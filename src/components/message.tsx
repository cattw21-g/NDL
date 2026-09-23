const messages: Record<string, string> = {
  invalid: "Some fields did not pass validation.",
  level: "That level is not available for submissions.",
  "last-admin": "At least one admin account must remain.",
  missing: "The requested item was not found.",
  "rank-conflict": "That rank could not be saved. Refresh and try again.",
  "rank-required": "Ranked levels need a positive main-list rank.",
  transition: "That submission can no longer be reviewed.",
  forbidden: "You do not have permission to perform that action.",
  "image-too-large": "Uploaded images are too large for this NDL instance.",
  "image-type": "Upload images as PNG, JPG, or WebP files.",
  "image-upload-disabled": "Image upload is unavailable. Use a proof link instead.",
  "video-too-large": "Uploaded MP4 files are too large for this NDL instance.",
  "video-type": "Upload video proof as MP4 files.",
  "video-upload-disabled": "MP4 upload is unavailable. Use a link instead.",
  "slug-conflict": "That slug is already used by another post.",
  self_review_forbidden:
    "Security Policy: You cannot review or accept your own record submissions. Another staff member must review it.",
  "self-review-forbidden":
    "Security Policy: You cannot review or accept your own record submissions. Another staff member must review it.",
  self_approval_forbidden:
    "Security Policy: You cannot approve your own level suggestions. Another staff member must review it.",
  "self-approval-forbidden":
    "Security Policy: You cannot approve your own level suggestions. Another staff member must review it.",
  rate_limited:
    "Security Policy: Moderation rate limit reached. Please wait a moment before reviewing further submissions.",
  "rate-limited":
    "Security Policy: Moderation rate limit reached. Please wait a moment before reviewing further submissions.",
  conflict_of_interest:
    "Security Policy: Network conflict detected. You cannot review submissions originating from your own network or device.",
  "conflict-of-interest":
    "Security Policy: Network conflict detected. You cannot review submissions originating from your own network or device.",
  top10_admin_only:
    "Security Policy: 100% completions on Top 10 demons require Admin confirmation before being added to the list.",
  "top10-admin-only":
    "Security Policy: 100% completions on Top 10 demons require Admin confirmation before being added to the list.",
  verification_admin_only:
    "Security Policy: Verification runs on upcoming levels must be officially confirmed and ranked by an Admin.",
  "verification-admin-only":
    "Security Policy: Verification runs on upcoming levels must be officially confirmed and ranked by an Admin.",
  rejection_note_required:
    "Security Policy: Moderators must provide an explanatory note (at least 10 characters) explaining why a submission was rejected or needs changes.",
  "rejection-note-required":
    "Security Policy: Moderators must provide an explanatory note (at least 10 characters) explaining why a submission was rejected or needs changes.",
  no_actions_to_rollback:
    "No accepted submissions found for this moderator in the specified timeframe.",
  "no-actions-to-rollback":
    "No accepted submissions found for this moderator in the specified timeframe.",
};

export function PageMessage({
  searchParams,
  successMessage = "Saved successfully.",
}: {
  searchParams?: Record<string, string | string[] | undefined>;
  successMessage?: string;
}) {
  const error =
    typeof searchParams?.error === "string"
      ? (messages[searchParams.error] ?? searchParams.error)
      : null;
  const success =
    searchParams?.created ||
    searchParams?.updated ||
    searchParams?.reviewed ||
    searchParams?.converted ||
    searchParams?.archived ||
    searchParams?.rollback_success
      ? (searchParams?.rollback_success ? "Emergency rollback completed successfully." : successMessage)
      : null;

  if (!error && !success) {
    return null;
  }

  return (
    <div
      className={`rounded-md border px-4 py-3 text-sm font-bold ${
        error
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-200"
          : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-200"
      }`}
    >
      {error ?? success}
    </div>
  );
}
