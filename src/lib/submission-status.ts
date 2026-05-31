export type SubmissionStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "NEEDS_CHANGES";

export const reviewableStatuses = ["PENDING", "NEEDS_CHANGES"] as const;

export function isReviewDecision(status: string): status is SubmissionStatus {
  return (
    status === "ACCEPTED" ||
    status === "REJECTED" ||
    status === "NEEDS_CHANGES"
  );
}

export function canTransitionSubmission(
  from: SubmissionStatus,
  to: SubmissionStatus,
) {
  if (from === "ACCEPTED" || from === "REJECTED") {
    return false;
  }

  return to === "ACCEPTED" || to === "REJECTED" || to === "NEEDS_CHANGES";
}
