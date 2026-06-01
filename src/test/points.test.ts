import { describe, expect, it } from "vitest";

import { calculateLeaderboard, calculateLevelPoints } from "../lib/points";

describe("calculateLevelPoints", () => {
  it("uses the 320-point nonlinear formula for ranked levels", () => {
    expect(calculateLevelPoints(1, "RANKED")).toBe(320);
    expect(calculateLevelPoints(2, "RANKED")).toBeLessThan(
      calculateLevelPoints(1, "RANKED"),
    );
    expect(calculateLevelPoints(3, "RANKED")).toBeLessThan(
      calculateLevelPoints(2, "RANKED"),
    );
    expect(calculateLevelPoints(25, "RANKED")).toBe(
      Math.round(320 * 0.985 ** 24),
    );
    expect(calculateLevelPoints(500, "RANKED")).toBe(1);
  });

  it("keeps lower ranks decreasing smoothly", () => {
    expect(calculateLevelPoints(1, "RANKED")).toBeGreaterThan(
      calculateLevelPoints(25, "RANKED"),
    );
    expect(calculateLevelPoints(25, "RANKED")).toBeGreaterThan(
      calculateLevelPoints(100, "RANKED"),
    );
    expect(calculateLevelPoints(100, "RANKED")).toBeGreaterThan(
      calculateLevelPoints(250, "RANKED"),
    );
  });

  it("does not award ranked formula points to legacy or inactive statuses", () => {
    expect(calculateLevelPoints(4, "LEGACY")).toBe(25);
    expect(calculateLevelPoints(null, "RANKED")).toBe(0);
    expect(calculateLevelPoints(0, "RANKED")).toBe(0);
    expect(calculateLevelPoints(1, "PENDING")).toBe(0);
    expect(calculateLevelPoints(1, "REJECTED")).toBe(0);
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
