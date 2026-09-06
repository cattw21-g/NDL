import { describe, expect, it } from "vitest";
import { getEvidenceTimeoutRemaining, EVIDENCE_TIMEOUT_MS } from "@/lib/submission-workflow";

describe("getEvidenceTimeoutRemaining", () => {
  it("returns null for non-evidence requested statuses", () => {
    expect(getEvidenceTimeoutRemaining("ACCEPTED", new Date())).toBeNull();
    expect(getEvidenceTimeoutRemaining("PENDING", new Date())).toBeNull();
  });

  it("calculates remaining hours when within 72h window", () => {
    const now = new Date("2026-09-06T12:00:00Z");
    const reviewedAt = new Date("2026-09-05T12:00:00Z"); // 24 hours ago
    const res = getEvidenceTimeoutRemaining("UNDER_CONSIDERATION", reviewedAt, now);

    expect(res).not.toBeNull();
    expect(res?.isExpired).toBe(false);
    expect(res?.hoursRemaining).toBe(48);
    expect(res?.label).toBe("2d 0h left");
  });

  it("identifies expired deadline when past 72h window", () => {
    const now = new Date("2026-09-06T12:00:00Z");
    const reviewedAt = new Date("2026-09-01T12:00:00Z"); // 5 days ago (> 72h)
    const res = getEvidenceTimeoutRemaining("UNDER_CONSIDERATION", reviewedAt, now);

    expect(res).not.toBeNull();
    expect(res?.isExpired).toBe(true);
    expect(res?.hoursRemaining).toBe(0);
    expect(res?.label).toBe("Deadline Expired");
  });
});
