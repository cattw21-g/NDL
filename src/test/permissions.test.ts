import { describe, expect, it } from "vitest";

import {
  canManageLevels,
  canReviewSubmissions,
  canSeeSubmission,
} from "../lib/permissions";

describe("permissions", () => {
  it("allows moderators to manage levels except Top 1", () => {
    expect(canManageLevels("ADMIN", null, 1)).toBe(true);
    expect(canManageLevels("ADMIN", null, 2)).toBe(true);
    expect(canManageLevels("ADMIN", null, 3)).toBe(true);
    expect(canManageLevels("ADMIN", null, 4)).toBe(true);
    expect(canManageLevels("MODERATOR", null, 1)).toBe(false);
    expect(canManageLevels("MODERATOR", null, 2)).toBe(true);
    expect(canManageLevels("MODERATOR", null, 3)).toBe(true);
    expect(canManageLevels("MODERATOR", null, 4)).toBe(true);
    expect(canManageLevels("MODERATOR", null, 50)).toBe(true);
    expect(canManageLevels("LIST_REVIEWER", null, 4)).toBe(false);
    expect(canManageLevels("PLAYER")).toBe(false);
  });

  it("allows moderators and admins to view pending queues", () => {
    expect(canReviewSubmissions("ADMIN")).toBe(true);
    expect(canReviewSubmissions("MODERATOR")).toBe(true);
    expect(canReviewSubmissions("PLAYER")).toBe(false);
  });

  it("keeps private submissions visible to submitter or staff only", () => {
    expect(canSeeSubmission("PLAYER", "u1", "u1")).toBe(true);
    expect(canSeeSubmission("PLAYER", "u2", "u1")).toBe(false);
    expect(canSeeSubmission("MODERATOR", "u2", "u1")).toBe(true);
  });
});
