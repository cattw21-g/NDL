export type SubmissionStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "NEEDS_CHANGES"
  | "UNDER_CONSIDERATION";

export const reviewableStatuses = [
  "PENDING",
  "NEEDS_CHANGES",
  "UNDER_CONSIDERATION",
] as const;

export function isReviewDecision(status: string): status is SubmissionStatus {
  return (
    status === "ACCEPTED" ||
    status === "REJECTED" ||
    status === "NEEDS_CHANGES" ||
    status === "UNDER_CONSIDERATION"
  );
}

export function canTransitionSubmission(
  from: SubmissionStatus,
  to: SubmissionStatus,
) {
  if (from === "ACCEPTED" || from === "REJECTED") {
    return false;
  }

  return (
    to === "ACCEPTED" ||
    to === "REJECTED" ||
    to === "NEEDS_CHANGES" ||
    to === "UNDER_CONSIDERATION"
  );
}
