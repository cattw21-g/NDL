import { describe, expect, it } from "vitest";

import {
  canManageLevels,
  canReviewSubmissions,
  canSeeSubmission,
} from "../lib/permissions";

describe("permissions", () => {
  it("restricts level management to admins", () => {
    expect(canManageLevels("ADMIN")).toBe(true);
    expect(canManageLevels("MODERATOR")).toBe(false);
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
