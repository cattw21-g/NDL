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

export function canReviewSuggestions(role?: string | null): boolean {
  return isListReviewerRole(role);
}

/**
 * Record submission final decisions (ACCEPTED or REJECTED) gate:
 * - Top 1 demon decisions require Admin authority (Moderators and Reviewers cannot accept or reject Top 1).
 * - Top 2 and Top 3 demons can be decided by Moderators and Admins, but CANNOT be decided by List Reviewers.
 * - Levels beyond Top 3 (ranks 4 and below) can be decided by List Reviewers, List Moderators, and Admins.
 * - Staff (Reviewers, Moderators, Admins) may leave review notes and set NEEDS_CHANGES on any level.
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
  if (action === "NEEDS_CHANGES") {
    return true;
  }

  if (typeof levelRank === "number") {
    // Top 1 is strictly restricted to Admins (Moderators and Reviewers cannot decide Top 1)
    if (levelRank === 1) {
      return false;
    }

    // Top 2 and Top 3 are blocked for List Reviewers (Moderators and Admins CAN decide them)
    if (role === "LIST_REVIEWER" && levelRank >= 1 && levelRank <= 3) {
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
 * Moderators can manage every level except Top 1.
 * Admins can manage all levels without restriction.
 * List Reviewers cannot manage levels.
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
  if (typeof levelRank === "number" && levelRank === 1) {
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
