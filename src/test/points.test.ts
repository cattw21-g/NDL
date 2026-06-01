import { describe, expect, it } from "vitest";

import {
  calculateCurrentLevelPoints,
  calculateLeaderboard,
  calculateLevelPoints,
} from "../lib/points";
import {
  recalculateStoredPoints,
  type PointsRecalculationClient,
} from "../lib/points-recalculation";

describe("calculateLevelPoints", () => {
  it("uses the 320-point nonlinear formula for ranked levels", () => {
    expect(calculateLevelPoints(1, "RANKED")).toBe(320);
    expect(calculateLevelPoints(2, "RANKED")).toBe(310);
    expect(calculateLevelPoints(3, "RANKED")).toBe(300);
    expect(calculateLevelPoints(10, "RANKED")).toBe(240);
    expect(calculateLevelPoints(50, "RANKED")).toBe(68);
    expect(calculateLevelPoints(100, "RANKED")).toBe(14);
    expect(calculateLevelPoints(150, "RANKED")).toBe(3);
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

  it("computes current level points from rank and status instead of stored values", () => {
    expect(
      calculateCurrentLevelPoints({
        rank: 1,
        status: "RANKED",
      }),
    ).toBe(320);
    expect(
      calculateCurrentLevelPoints({
        rank: 1,
        status: "PENDING",
      }),
    ).toBe(0);
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

describe("recalculateStoredPoints", () => {
  it("updates stale level and accepted record point rows from current ranks", async () => {
    const levelUpdates: unknown[] = [];
    const recordUpdates: unknown[] = [];
    const db = {
      level: {
        findMany: async () => [
          { id: "rank-1", rank: 1, status: "RANKED", points: 1000 },
          { id: "rank-2", rank: 2, status: "RANKED", points: 1000 },
          { id: "legacy", rank: null, status: "LEGACY", points: 1000 },
          { id: "pending", rank: null, status: "PENDING", points: 1000 },
        ],
        update: async (args: unknown) => {
          levelUpdates.push(args);
          return args;
        },
      },
      record: {
        updateMany: async (args: unknown) => {
          recordUpdates.push(args);
          return { count: 1 };
        },
      },
    } as unknown as PointsRecalculationClient;

    const result = await recalculateStoredPoints(db);

    expect(result).toEqual({
      levelsChecked: 4,
      levelsUpdated: 4,
      recordsUpdated: 4,
    });
    expect(levelUpdates).toEqual([
      {
        where: { id: "rank-1" },
        data: { points: 320 },
      },
      {
        where: { id: "rank-2" },
        data: { points: 310 },
      },
      {
        where: { id: "legacy" },
        data: { points: 25 },
      },
      {
        where: { id: "pending" },
        data: { points: 0 },
      },
    ]);
    expect(recordUpdates).toContainEqual({
      where: {
        levelId: "rank-1",
        pointsAwarded: {
          not: 320,
        },
      },
      data: {
        pointsAwarded: 320,
      },
    });
  });
});
