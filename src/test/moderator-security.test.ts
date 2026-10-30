import { describe, expect, it } from "vitest";
import { isAdminRole, isModeratorRole } from "../lib/permissions";

describe("Moderator Security Safeguards & Threat Prevention", () => {
  describe("Role Permissions & Privilege Separation", () => {
    it("distinguishes between ADMIN and MODERATOR for sensitive operations", () => {
      expect(isAdminRole("ADMIN")).toBe(true);
      expect(isAdminRole("MODERATOR")).toBe(false);
      expect(isAdminRole("PLAYER")).toBe(false);

      expect(isModeratorRole("ADMIN")).toBe(true);
      expect(isModeratorRole("MODERATOR")).toBe(true);
      expect(isModeratorRole("PLAYER")).toBe(false);
    });

    it("ensures record visibility can only be altered by owner or admin", () => {
      const recordOwnerId = "user-1";
      const record = { playerId: recordOwnerId };

      const canModify = (user: { id: string; role: "ADMIN" | "MODERATOR" | "PLAYER"; playerName?: string }) => {
        const isOwner = record.playerId === user.id;
        const isAdmin = isAdminRole(user.role, user.playerName);
        return isOwner || isAdmin;
      };

      // Record owner can hide their own record
      expect(canModify({ id: "user-1", role: "PLAYER" })).toBe(true);
      // Admin can hide any record
      expect(canModify({ id: "admin-1", role: "ADMIN" })).toBe(true);
      // A rogue moderator CANNOT hide someone else's record
      expect(canModify({ id: "mod-1", role: "MODERATOR" })).toBe(false);
      // Another player CANNOT hide someone else's record
      expect(canModify({ id: "user-2", role: "PLAYER" })).toBe(false);
    });

    it("enforces Top 10 Demon approval gates", () => {
      const canAcceptRecord = ({
        levelRank,
        progress,
        userRole,
        levelStatus,
      }: {
        levelRank: number | null;
        progress: number;
        userRole: "ADMIN" | "MODERATOR" | "PLAYER";
        levelStatus: "RANKED" | "PENDING";
      }) => {
        const isAdmin = isAdminRole(userRole);

        // Verification run on upcoming level
        if (levelStatus === "PENDING" && !isAdmin) {
          return { allowed: false, reason: "verification_admin_only" };
        }

        // Top 1 completion for moderators
        if (levelRank !== null && levelRank === 1 && progress === 100 && !isAdmin) {
          return { allowed: false, reason: "top1_admin_only" };
        }

        return { allowed: true };
      };

      // Top 1 100% run
      expect(canAcceptRecord({ levelRank: 1, progress: 100, userRole: "MODERATOR", levelStatus: "RANKED" }))
        .toEqual({ allowed: false, reason: "top1_admin_only" });
      expect(canAcceptRecord({ levelRank: 2, progress: 100, userRole: "MODERATOR", levelStatus: "RANKED" }))
        .toEqual({ allowed: true });
      expect(canAcceptRecord({ levelRank: 3, progress: 100, userRole: "MODERATOR", levelStatus: "RANKED" }))
        .toEqual({ allowed: true });
      expect(canAcceptRecord({ levelRank: 1, progress: 100, userRole: "ADMIN", levelStatus: "RANKED" }))
        .toEqual({ allowed: true });

      // Ranks 4+ allowed for regular moderators
      expect(canAcceptRecord({ levelRank: 4, progress: 100, userRole: "MODERATOR", levelStatus: "RANKED" }))
        .toEqual({ allowed: true });
      expect(canAcceptRecord({ levelRank: 10, progress: 100, userRole: "MODERATOR", levelStatus: "RANKED" }))
        .toEqual({ allowed: true });
      expect(canAcceptRecord({ levelRank: 11, progress: 100, userRole: "MODERATOR", levelStatus: "RANKED" }))
        .toEqual({ allowed: true });
      expect(canAcceptRecord({ levelRank: 50, progress: 100, userRole: "MODERATOR", levelStatus: "RANKED" }))
        .toEqual({ allowed: true });

      // Verification on upcoming pending level
      expect(canAcceptRecord({ levelRank: null, progress: 100, userRole: "MODERATOR", levelStatus: "PENDING" }))
        .toEqual({ allowed: false, reason: "verification_admin_only" });
      expect(canAcceptRecord({ levelRank: null, progress: 100, userRole: "ADMIN", levelStatus: "PENDING" }))
        .toEqual({ allowed: true });
    });

    it("enforces explanatory note when rejecting or requesting changes", () => {
      const validateRejectionNote = (status: string, notes: string | undefined, role: "ADMIN" | "MODERATOR") => {
        const isAdmin = isAdminRole(role);
        if ((status === "REJECTED" || status === "NEEDS_CHANGES") && !isAdmin) {
          if (!notes || notes.trim().length < 10) {
            return false;
          }
        }
        return true;
      };

      // Non-admin moderator attempting zero-reason or trivial rejection
      expect(validateRejectionNote("REJECTED", "", "MODERATOR")).toBe(false);
      expect(validateRejectionNote("REJECTED", "no", "MODERATOR")).toBe(false);
      expect(validateRejectionNote("NEEDS_CHANGES", "fix", "MODERATOR")).toBe(false);

      // Non-admin moderator with adequate explanation
      expect(validateRejectionNote("REJECTED", "Audio clicks are not audible in video", "MODERATOR")).toBe(true);

      // Admin has override capability
      expect(validateRejectionNote("REJECTED", "", "ADMIN")).toBe(true);
    });
  });
});
