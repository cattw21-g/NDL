export type AppRole = "ADMIN" | "MODERATOR" | "PLAYER";

export function isModeratorRole(role: AppRole) {
  return role === "ADMIN" || role === "MODERATOR";
}

export function isAdminRole(role: AppRole) {
  return role === "ADMIN";
}

export function canReviewSubmissions(role: AppRole) {
  return isModeratorRole(role);
}

export function canManageLevels(role: AppRole) {
  return isAdminRole(role);
}

export function canSeeSubmission(
  role: AppRole,
  viewerId: string,
  submissionPlayerId: string,
) {
  return viewerId === submissionPlayerId || isModeratorRole(role);
}
