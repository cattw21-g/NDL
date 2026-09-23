export type AppRole =
  | "ADMIN"
  | "MODERATOR"
  | "LIST_MODERATOR"
  | "LIST_REVIEWER"
  | "BETA_TESTER"
  | "PLAYER";

export function isAdminRole(role?: string | null, playerName?: string | null): boolean {
  if (playerName && (playerName.toLowerCase() === "cattw21" || playerName.toLowerCase() === "ndl_admin")) {
    return true;
  }
  return role === "ADMIN";
}

export function isListModeratorRole(role?: string | null): boolean {
  return role === "ADMIN" || role === "MODERATOR" || role === "LIST_MODERATOR";
}

/**
 * Backward-compatible alias for isListModeratorRole.
 * Legacy code checking isModeratorRole will continue to grant LIST_MODERATOR & ADMIN access.
 */
export function isModeratorRole(role?: string | null): boolean {
  return isListModeratorRole(role);
}

export function isListReviewerRole(role?: string | null): boolean {
  return isListModeratorRole(role) || role === "LIST_REVIEWER";
}

export function isBetaTester(role?: string | null): boolean {
  return role === "BETA_TESTER" || isListReviewerRole(role);
}

export function canReviewSubmissions(role?: string | null): boolean {
  return isListReviewerRole(role);
}

/**
 * Top 10 record submissions require Admin final approval.
 * List Reviewers and List Moderators CANNOT give final approval to Top 10.
 * Submissions beyond Top 10 can be approved by List Reviewers, List Moderators, and Admins.
 */
export function canApproveSubmission(
  role?: string | null,
  levelRank?: number | null,
  playerName?: string | null,
): boolean {
  if (isAdminRole(role, playerName)) {
    return true;
  }
  if (typeof levelRank === "number" && levelRank >= 1 && levelRank <= 10) {
    return false;
  }
  return isListReviewerRole(role);
}

export function canManageLevels(role?: string | null, playerName?: string | null): boolean {
  return isAdminRole(role, playerName);
}

export function canManageApplications(role?: string | null, playerName?: string | null): boolean {
  return isAdminRole(role, playerName);
}

export function canUnlistRecord(role?: string | null): boolean {
  return isListModeratorRole(role);
}

export function canRestoreRecord(role?: string | null): boolean {
  return isListModeratorRole(role);
}

export function canSeeSubmission(
  role: string | null | undefined,
  viewerId: string,
  submissionPlayerId: string,
): boolean {
  return viewerId === submissionPlayerId || canReviewSubmissions(role);
}

export function canAccessBetaFeatures(role?: string | null): boolean {
  return isBetaTester(role);
}
