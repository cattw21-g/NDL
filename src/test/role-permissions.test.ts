import { describe, it, expect } from "vitest";
import {
  isAdminRole,
  isListModeratorRole,
  isModeratorRole,
  isListReviewerRole,
  isBetaTester,
  canReviewSubmissions,
  canApproveSubmission,
  canRejectSubmission,
  canFinalDecideSubmission,
  canManageApplications,
  canUnlistRecord,
  canRestoreRecord,
  canAccessBetaFeatures,
} from "@/lib/permissions";

describe("NDL Role-Based Access Control (RBAC) Matrix", () => {
  describe("Administrator Permissions", () => {
    it("recognizes ADMIN role and superadmin usernames", () => {
      expect(isAdminRole("ADMIN")).toBe(true);
      expect(isAdminRole("PLAYER", "cattw21")).toBe(true);
      expect(isAdminRole("PLAYER", "NDL_ADMIN")).toBe(true);
      expect(isAdminRole("PLAYER", "regular_player")).toBe(false);
      expect(isAdminRole("MODERATOR")).toBe(false);
      expect(isAdminRole("LIST_MODERATOR")).toBe(false);
      expect(isAdminRole("LIST_REVIEWER")).toBe(false);
      expect(isAdminRole("BETA_TESTER")).toBe(false);
    });

    it("allows ADMIN full administrative power", () => {
      expect(canManageApplications("ADMIN")).toBe(true);
      expect(canUnlistRecord("ADMIN")).toBe(true);
      expect(canRestoreRecord("ADMIN")).toBe(true);
      expect(canReviewSubmissions("ADMIN")).toBe(true);
      expect(canApproveSubmission("ADMIN", 1)).toBe(true);
      expect(canApproveSubmission("ADMIN", 25)).toBe(true);
      expect(canAccessBetaFeatures("ADMIN")).toBe(true);
    });
  });

  describe("List Moderator Permissions & Backward Compatibility", () => {
    it("grants LIST_MODERATOR and legacy MODERATOR identical moderator privileges", () => {
      expect(isListModeratorRole("LIST_MODERATOR")).toBe(true);
      expect(isListModeratorRole("MODERATOR")).toBe(true);
      expect(isModeratorRole("LIST_MODERATOR")).toBe(true);
      expect(isModeratorRole("MODERATOR")).toBe(true);
    });

    it("allows List Moderators to review normal completions and manage records, but DENIES Top 10 final approval", () => {
      expect(canReviewSubmissions("LIST_MODERATOR")).toBe(true);
      expect(canApproveSubmission("LIST_MODERATOR", 1)).toBe(false);
      expect(canApproveSubmission("LIST_MODERATOR", 5)).toBe(false);
      expect(canApproveSubmission("LIST_MODERATOR", 10)).toBe(false);
      expect(canApproveSubmission("LIST_MODERATOR", 11)).toBe(true);
      expect(canApproveSubmission("LIST_MODERATOR", 50)).toBe(true);
      expect(canUnlistRecord("LIST_MODERATOR")).toBe(true);
      expect(canRestoreRecord("LIST_MODERATOR")).toBe(true);
    });

    it("prevents List Moderators from managing staff applications", () => {
      expect(canManageApplications("LIST_MODERATOR")).toBe(false);
      expect(canManageApplications("MODERATOR")).toBe(false);
    });
  });

  describe("List Reviewer Permissions", () => {
    it("allows List Reviewers to review normal submissions", () => {
      expect(isListReviewerRole("LIST_REVIEWER")).toBe(true);
      expect(canReviewSubmissions("LIST_REVIEWER")).toBe(true);
      expect(canApproveSubmission("LIST_REVIEWER", 11)).toBe(true);
      expect(canApproveSubmission("LIST_REVIEWER", 75)).toBe(true);
    });

    it("strictly blocks List Reviewers from approving Top 10 record submissions", () => {
      expect(canApproveSubmission("LIST_REVIEWER", 1)).toBe(false);
      expect(canApproveSubmission("LIST_REVIEWER", 5)).toBe(false);
      expect(canApproveSubmission("LIST_REVIEWER", 10)).toBe(false);
    });

    it("strictly blocks List Reviewers from unlisting/restoring records or managing staff applications", () => {
      expect(canUnlistRecord("LIST_REVIEWER")).toBe(false);
      expect(canRestoreRecord("LIST_REVIEWER")).toBe(false);
      expect(canManageApplications("LIST_REVIEWER")).toBe(false);
    });
  });

  describe("Beta Tester Permissions", () => {
    it("allows Beta Testers to access beta features", () => {
      expect(isBetaTester("BETA_TESTER")).toBe(true);
      expect(canAccessBetaFeatures("BETA_TESTER")).toBe(true);
    });

    it("strictly blocks Beta Testers from review or moderation panels", () => {
      expect(canReviewSubmissions("BETA_TESTER")).toBe(false);
      expect(canApproveSubmission("BETA_TESTER", 50)).toBe(false);
      expect(canUnlistRecord("BETA_TESTER")).toBe(false);
      expect(canManageApplications("BETA_TESTER")).toBe(false);
    });
  });

  describe("Top 10 Submission Final Decision Gates (Admin-Only Outcomes)", () => {
    it("Reviewer -> Top 10 ACCEPT denied, REJECT denied, NEEDS_CHANGES allowed", () => {
      // Top 10 (ranks 1, 5, 10):
      expect(canFinalDecideSubmission("ACCEPTED", "LIST_REVIEWER", 1)).toBe(false);
      expect(canFinalDecideSubmission("ACCEPTED", "LIST_REVIEWER", 5)).toBe(false);
      expect(canFinalDecideSubmission("ACCEPTED", "LIST_REVIEWER", 10)).toBe(false);

      expect(canFinalDecideSubmission("REJECTED", "LIST_REVIEWER", 1)).toBe(false);
      expect(canFinalDecideSubmission("REJECTED", "LIST_REVIEWER", 5)).toBe(false);
      expect(canFinalDecideSubmission("REJECTED", "LIST_REVIEWER", 10)).toBe(false);

      expect(canApproveSubmission("LIST_REVIEWER", 1)).toBe(false);
      expect(canRejectSubmission("LIST_REVIEWER", 1)).toBe(false);

      // Reviewer CAN request changes or leave review notes on Top 10
      expect(canFinalDecideSubmission("NEEDS_CHANGES", "LIST_REVIEWER", 1)).toBe(true);
      expect(canFinalDecideSubmission("NEEDS_CHANGES", "LIST_REVIEWER", 10)).toBe(true);

      // Allowed for normal list levels > 10
      expect(canFinalDecideSubmission("ACCEPTED", "LIST_REVIEWER", 11)).toBe(true);
      expect(canFinalDecideSubmission("REJECTED", "LIST_REVIEWER", 11)).toBe(true);
      expect(canFinalDecideSubmission("NEEDS_CHANGES", "LIST_REVIEWER", 11)).toBe(true);
    });

    it("Moderator -> Top 10 ACCEPT denied, REJECT denied, NEEDS_CHANGES allowed", () => {
      expect(canFinalDecideSubmission("ACCEPTED", "LIST_MODERATOR", 1)).toBe(false);
      expect(canFinalDecideSubmission("ACCEPTED", "LIST_MODERATOR", 5)).toBe(false);
      expect(canFinalDecideSubmission("ACCEPTED", "LIST_MODERATOR", 10)).toBe(false);

      expect(canFinalDecideSubmission("REJECTED", "LIST_MODERATOR", 1)).toBe(false);
      expect(canFinalDecideSubmission("REJECTED", "LIST_MODERATOR", 5)).toBe(false);
      expect(canFinalDecideSubmission("REJECTED", "LIST_MODERATOR", 10)).toBe(false);

      expect(canApproveSubmission("LIST_MODERATOR", 1)).toBe(false);
      expect(canRejectSubmission("LIST_MODERATOR", 1)).toBe(false);

      // Moderator CAN request changes or leave review notes on Top 10
      expect(canFinalDecideSubmission("NEEDS_CHANGES", "LIST_MODERATOR", 1)).toBe(true);
      expect(canFinalDecideSubmission("NEEDS_CHANGES", "LIST_MODERATOR", 10)).toBe(true);

      // Allowed for normal list levels > 10
      expect(canFinalDecideSubmission("ACCEPTED", "LIST_MODERATOR", 11)).toBe(true);
      expect(canFinalDecideSubmission("REJECTED", "LIST_MODERATOR", 11)).toBe(true);
      expect(canFinalDecideSubmission("NEEDS_CHANGES", "LIST_MODERATOR", 11)).toBe(true);
    });

    it("Admin -> both ACCEPT and REJECT allowed on Top 10", () => {
      expect(canFinalDecideSubmission("ACCEPTED", "ADMIN", 1)).toBe(true);
      expect(canFinalDecideSubmission("ACCEPTED", "ADMIN", 5)).toBe(true);
      expect(canFinalDecideSubmission("ACCEPTED", "ADMIN", 10)).toBe(true);

      expect(canFinalDecideSubmission("REJECTED", "ADMIN", 1)).toBe(true);
      expect(canFinalDecideSubmission("REJECTED", "ADMIN", 5)).toBe(true);
      expect(canFinalDecideSubmission("REJECTED", "ADMIN", 10)).toBe(true);

      expect(canFinalDecideSubmission("NEEDS_CHANGES", "ADMIN", 1)).toBe(true);

      expect(canApproveSubmission("ADMIN", 1)).toBe(true);
      expect(canRejectSubmission("ADMIN", 1)).toBe(true);
      expect(canApproveSubmission("PLAYER", 1, "cattw21")).toBe(true);
      expect(canRejectSubmission("PLAYER", 1, "cattw21")).toBe(true);
    });

    it("PLAYER and BETA_TESTER -> denied all moderation decisions", () => {
      expect(canFinalDecideSubmission("ACCEPTED", "PLAYER", 1)).toBe(false);
      expect(canFinalDecideSubmission("REJECTED", "PLAYER", 1)).toBe(false);
      expect(canFinalDecideSubmission("NEEDS_CHANGES", "PLAYER", 1)).toBe(false);

      expect(canFinalDecideSubmission("ACCEPTED", "BETA_TESTER", 1)).toBe(false);
      expect(canFinalDecideSubmission("REJECTED", "BETA_TESTER", 1)).toBe(false);
      expect(canFinalDecideSubmission("NEEDS_CHANGES", "BETA_TESTER", 1)).toBe(false);

      expect(canFinalDecideSubmission("ACCEPTED", "PLAYER", 25)).toBe(false);
      expect(canFinalDecideSubmission("ACCEPTED", "BETA_TESTER", 25)).toBe(false);
    });
  });
});

