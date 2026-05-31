import { describe, expect, it } from "vitest";

import { calculateLeaderboard, calculateLevelPoints } from "../lib/points";

describe("calculateLevelPoints", () => {
  it("uses the rank-based nonlinear MVP formula for ranked levels", () => {
    expect(calculateLevelPoints(1, "RANKED")).toBe(1000);
    expect(calculateLevelPoints(2, "RANKED")).toBe(970);
    expect(calculateLevelPoints(25, "RANKED")).toBe(
      Math.round(1000 * 0.97 ** 24),
    );
    expect(calculateLevelPoints(500, "RANKED")).toBe(50);
  });

  it("gives higher-ranked ranked levels more points", () => {
    expect(calculateLevelPoints(1, "RANKED")).toBeGreaterThan(
      calculateLevelPoints(25, "RANKED"),
    );
  });

  it("uses fixed low value for legacy and zero for unapproved statuses", () => {
    expect(calculateLevelPoints(4, "LEGACY")).toBe(25);
    expect(calculateLevelPoints(1, "PENDING")).toBe(0);
    expect(calculateLevelPoints(1, "REMOVED")).toBe(0);
  });
});

describe("calculateLeaderboard", () => {
  it("counts only the best accepted record per player and level", () => {
    const now = new Date("2026-05-01T00:00:00.000Z");
    const rows = calculateLeaderboard([
      {
        playerId: "p1",
        playerName: "demo",
        displayName: "Demo",
        levelId: "l1",
        pointsAwarded: 900,
        acceptedAt: now,
      },
      {
        playerId: "p1",
        playerName: "demo",
        displayName: "Demo",
        levelId: "l1",
        pointsAwarded: 950,
        acceptedAt: now,
      },
      {
        playerId: "p1",
        playerName: "demo",
        displayName: "Demo",
        levelId: "l2",
        pointsAwarded: 100,
        acceptedAt: now,
      },
    ]);

    expect(rows).toEqual([
      {
        playerId: "p1",
        playerName: "demo",
        displayName: "Demo",
        points: 1050,
        records: 2,
        lastRecordAt: now,
      },
    ]);
  });
});
