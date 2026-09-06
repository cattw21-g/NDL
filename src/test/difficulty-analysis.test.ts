import { describe, expect, it } from "vitest";
import { analyzeDifficultyOpinions } from "@/lib/difficulty-analysis";

describe("analyzeDifficultyOpinions", () => {
  it("handles empty opinions safely", () => {
    const res = analyzeDifficultyOpinions([]);
    expect(res.count).toBe(0);
    expect(res.mean).toBeNull();
    expect(res.reliabilityLabel).toBe("Preliminary");
  });

  it("calculates median and mean accurately", () => {
    const ranks = [5, 10, 15];
    const res = analyzeDifficultyOpinions(ranks);
    expect(res.count).toBe(3);
    expect(res.mean).toBe(10);
    expect(res.median).toBe(10);
  });

  it("calculates trimmed mean to eliminate extreme outliers", () => {
    // 10 ratings: 9 clustered around #5, one troll at #150
    const ranks = [4, 5, 5, 5, 6, 6, 6, 7, 8, 150];
    const res = analyzeDifficultyOpinions(ranks);
    expect(res.mean).toBe(20.2); // skewed by troll 150
    expect(res.trimmedMean).toBeLessThan(10); // outlier safely trimmed!
    expect(res.median).toBe(6);
  });

  it("computes consensus bracket and high reliability on clustered votes", () => {
    const ranks = [10, 11, 10, 12, 10, 11];
    const res = analyzeDifficultyOpinions(ranks);
    expect(res.reliabilityScore).toBeGreaterThanOrEqual(75);
    expect(res.reliabilityLabel).toBe("High Consensus");
    expect(res.bracketLow).toBeLessThanOrEqual(10);
    expect(res.bracketHigh).toBeGreaterThanOrEqual(11);
  });
});
