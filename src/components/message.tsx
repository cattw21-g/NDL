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
  "image-upload-disabled": "Local image uploads are disabled. Use a proof link instead.",
  "video-too-large": "Uploaded MP4 files are too large for this NDL instance.",
  "video-type": "Upload video proof as MP4 files.",
  "video-upload-disabled": "MP4 upload is available only when enabled by NDL. Use a link instead.",
};

export function PageMessage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const error =
    typeof searchParams?.error === "string"
      ? (messages[searchParams.error] ?? searchParams.error)
      : null;
  const success =
    searchParams?.created ||
    searchParams?.updated ||
    searchParams?.reviewed ||
    searchParams?.converted
      ? "Saved successfully."
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
