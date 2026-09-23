import { describe, expect, it } from "vitest";

import {
  calculateCountryLeaderboard,
  calculateCreatorLeaderboard,
  calculateLeaderboard,
  type LeaderboardRecord,
  type LeaderboardRow,
} from "../lib/points";

describe("Scale & Performance Benchmark (150 Demons, 5,000 Players, 50,000 Records)", () => {
  it("processes 50,000 records across 5,000 players well within production latency budget (<250ms)", () => {
    const records: LeaderboardRecord[] = [];
    const baseDate = new Date("2026-01-01T00:00:00Z");

    // Generate 50,000 records across 5,000 players and 150 levels
    for (let i = 0; i < 50000; i++) {
      const playerId = `player-${i % 5000}`;
      const levelId = `level-${(i * 7) % 150}`;
      const progress = 50 + (i % 51); // 50 to 100%
      const pointsAwarded = Math.round((1000 - ((i % 150) * 5)) * (progress / 100));

      records.push({
        playerId,
        playerName: `player_${i % 5000}`,
        displayName: `Player ${i % 5000}`,
        levelId,
        progress,
        pointsAwarded: Math.max(10, pointsAwarded),
        acceptedAt: new Date(baseDate.getTime() + i * 60000),
      });
    }

    const t0 = performance.now();
    const leaderboard = calculateLeaderboard(records);
    const durationMs = performance.now() - t0;

    expect(leaderboard.length).toBe(5000);
    expect(leaderboard[0].points).toBeGreaterThan(0);
    // Assert strictly descending order
    for (let j = 1; j < leaderboard.length; j++) {
      expect(leaderboard[j - 1].points).toBeGreaterThanOrEqual(leaderboard[j].points);
    }

    // Must execute efficiently (budget: 250ms)
    expect(durationMs).toBeLessThan(250);
  });

  it("calculates country leaderboard across 5,000 ranked players in <50ms", () => {
    const playerRows: LeaderboardRow[] = Array.from({ length: 5000 }, (_, i) => ({
      playerId: `player-${i}`,
      playerName: `player_${i}`,
      displayName: `Player ${i}`,
      points: 10000 - i * 2,
      records: 25,
      lastRecordAt: new Date(),
    }));

    const countries = ["US", "GB", "DE", "FR", "JP", "KR", "CA", "AU", "BR", "PL", "SE", "NO", "FI", "ES", "IT"];
    const countryMap = new Map<string, { countryCode: string; countryName: string; flag: string; continent: string }>();

    for (let i = 0; i < 5000; i++) {
      const code = countries[i % countries.length];
      countryMap.set(`player-${i}`, {
        countryCode: code,
        countryName: `Country ${code}`,
        flag: "🏳️",
        continent: "World",
      });
    }

    const t0 = performance.now();
    const countryLeaderboard = calculateCountryLeaderboard(playerRows, countryMap);
    const durationMs = performance.now() - t0;

    expect(countryLeaderboard.length).toBe(countries.length);
    expect(durationMs).toBeLessThan(50);
  });

  it("calculates creator leaderboard across 150 ranked demons in <10ms", () => {
    const levels = Array.from({ length: 150 }, (_, i) => ({
      name: `Demonic Level ${i + 1}`,
      slug: `demonic-level-${i + 1}`,
      rank: i + 1,
      status: "RANKED" as const,
      nerfCreator: `Creator ${(i % 20) + 1}`,
      publisher: `Publisher ${(i % 10) + 1}`,
      verifier: `Verifier ${(i % 15) + 1}`,
    }));

    const t0 = performance.now();
    const creatorLeaderboard = calculateCreatorLeaderboard(levels);
    const durationMs = performance.now() - t0;

    expect(creatorLeaderboard.length).toBeGreaterThan(0);
    expect(durationMs).toBeLessThan(10);
  });
});
