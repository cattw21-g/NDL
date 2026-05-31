import { describe, expect, it } from "vitest";

import {
  canTransitionSubmission,
  isReviewDecision,
} from "../lib/submission-status";

describe("submission review transitions", () => {
  it("accepts concrete review decisions only", () => {
    expect(isReviewDecision("ACCEPTED")).toBe(true);
    expect(isReviewDecision("PENDING")).toBe(false);
  });

  it("does not allow final submissions to be reviewed again", () => {
    expect(canTransitionSubmission("PENDING", "ACCEPTED")).toBe(true);
    expect(canTransitionSubmission("NEEDS_CHANGES", "REJECTED")).toBe(true);
    expect(canTransitionSubmission("ACCEPTED", "REJECTED")).toBe(false);
    expect(canTransitionSubmission("REJECTED", "ACCEPTED")).toBe(false);
  });
});
