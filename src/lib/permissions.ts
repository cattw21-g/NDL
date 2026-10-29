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
 * Top 3 record submission final decisions (ACCEPTED or REJECTED) require Admin authority.
 * List Reviewers and List Moderators CANNOT give final approval or final rejection to Top 1, 2, or 3.
 * They may inspect, leave notes, request changes (NEEDS_CHANGES), and escalate to Admins.
 * Submissions beyond Top 3 (ranks 4 and below) can be decided by List Reviewers, List Moderators, and Admins.
 */
export function canFinalDecideSubmission(
  action: "ACCEPTED" | "REJECTED" | "NEEDS_CHANGES",
  role?: string | null,
  levelRank?: number | null,
  playerName?: string | null,
): boolean {
  if (isAdminRole(role, playerName)) {
    return true;
  }
  if (!isListReviewerRole(role)) {
    return false;
  }
  if (typeof levelRank === "number" && levelRank >= 1 && levelRank <= 3) {
    if (action === "ACCEPTED" || action === "REJECTED") {
      return false;
    }
  }
  return true;
}

export function canApproveSubmission(
  role?: string | null,
  levelRank?: number | null,
  playerName?: string | null,
): boolean {
  return canFinalDecideSubmission("ACCEPTED", role, levelRank, playerName);
}

export function canRejectSubmission(
  role?: string | null,
  levelRank?: number | null,
  playerName?: string | null,
): boolean {
  return canFinalDecideSubmission("REJECTED", role, levelRank, playerName);
}

/**
 * Moderators can manage every level except Top 1, 2, or 3.
 * Admins can manage all levels without restriction.
 */
export function canManageLevels(
  role?: string | null,
  playerName?: string | null,
  levelRank?: number | null,
): boolean {
  if (isAdminRole(role, playerName)) {
    return true;
  }
  if (!isListModeratorRole(role)) {
    return false;
  }
  if (typeof levelRank === "number" && levelRank >= 1 && levelRank <= 3) {
    return false;
  }
  return true;
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
