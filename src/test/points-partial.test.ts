import { describe, expect, it } from "vitest";
import {
  calculateRecordPoints,
  calculateCountryLeaderboard,
  calculateCreatorLeaderboard,
  getLevelTier,
  type LeaderboardRow,
} from "../lib/points";

describe("Pointercrate partial-record scoring & tiering", () => {
  it("determines correct list tiers based on rank", () => {
    expect(getLevelTier(1, "RANKED")).toBe("MAIN");
    expect(getLevelTier(75, "RANKED")).toBe("MAIN");
    expect(getLevelTier(76, "RANKED")).toBe("EXTENDED");
    expect(getLevelTier(150, "RANKED")).toBe("EXTENDED");
    expect(getLevelTier(151, "RANKED")).toBe("LEGACY");
    expect(getLevelTier(null, "RANKED")).toBe("LEGACY");
    expect(getLevelTier(5, "LEGACY")).toBe("LEGACY");
  });

  it("awards full 100% points for 100% completion", () => {
    const rank1Points = calculateRecordPoints({
      levelRank: 1,
      status: "RANKED",
      progress: 100,
    });
    expect(rank1Points).toBe(1000);

    const rank5Points = calculateRecordPoints({
      levelRank: 5,
      status: "RANKED",
      progress: 100,
    });
    expect(rank5Points).toBe(900);
  });

  it("awards scaled partial points for qualifying progress on Main List", () => {
    // Rank 1 gives 1000 full points. Requirement = 50%
    // At requirement (50%): 10% base = 100 pts
    const atRequirement = calculateRecordPoints({
      levelRank: 1,
      status: "RANKED",
      progress: 50,
      requirement: 50,
    });
    expect(atRequirement).toBe(100);

    // At 75% progress (halfway between 50% and 100%):
    // factor = 0.10 + 0.50 * 0.5 = 0.35 -> 350 pts
    const atMid = calculateRecordPoints({
      levelRank: 1,
      status: "RANKED",
      progress: 75,
      requirement: 50,
    });
    expect(atMid).toBe(350);

    // At 99% progress:
    // factor = 0.10 + 0.50 * (49/50) = 0.59 -> 590 pts
    const atHigh = calculateRecordPoints({
      levelRank: 1,
      status: "RANKED",
      progress: 99,
      requirement: 50,
    });
    expect(atHigh).toBe(590);
  });

  it("awards 0 points for progress below requirement", () => {
    const below = calculateRecordPoints({
      levelRank: 1,
      status: "RANKED",
      progress: 49,
      requirement: 50,
    });
    expect(below).toBe(0);
  });

  it("awards 0 points for progress on Extended List (Pointercrate rule: completions only)", () => {
    const extendedProgress = calculateRecordPoints({
      levelRank: 80,
      status: "RANKED",
      progress: 75,
      requirement: 50,
    });
    expect(extendedProgress).toBe(0);

    // But 100% on Extended list DOES give points!
    const extendedCompletion = calculateRecordPoints({
      levelRank: 80,
      status: "RANKED",
      progress: 100,
      requirement: 50,
    });
    expect(extendedCompletion).toBeGreaterThan(0);
  });
});

describe("Country Leaderboard Aggregation", () => {
  it("aggregates player points and rankings by country", () => {
    const playerRows: LeaderboardRow[] = [
      {
        playerId: "p1",
        playerName: "player_pl_1",
        displayName: "Polish Player 1",
        points: 1000,
        records: 1,
        lastRecordAt: new Date(),
      },
      {
        playerId: "p2",
        playerName: "player_pl_2",
        displayName: "Polish Player 2",
        points: 500,
        records: 2,
        lastRecordAt: new Date(),
      },
      {
        playerId: "p3",
        playerName: "player_us_1",
        displayName: "US Player 1",
        points: 800,
        records: 1,
        lastRecordAt: new Date(),
      },
    ];

    const playerCountries = new Map([
      ["p1", { countryCode: "PL", countryName: "Poland", flag: "🇵🇱", continent: "Europe" }],
      ["p2", { countryCode: "PL", countryName: "Poland", flag: "🇵🇱", continent: "Europe" }],
      ["p3", { countryCode: "US", countryName: "United States", flag: "🇺🇸", continent: "North America" }],
    ]);

    const countryLeaderboard = calculateCountryLeaderboard(playerRows, playerCountries);

    expect(countryLeaderboard).toHaveLength(2);
    // Poland should be #1 with 1500 pts
    expect(countryLeaderboard[0].countryCode).toBe("PL");
    expect(countryLeaderboard[0].points).toBe(1500);
    expect(countryLeaderboard[0].playersCount).toBe(2);
    expect(countryLeaderboard[0].topPlayerName).toBe("Polish Player 1");

    // US should be #2 with 800 pts
    expect(countryLeaderboard[1].countryCode).toBe("US");
    expect(countryLeaderboard[1].points).toBe(800);
    expect(countryLeaderboard[1].playersCount).toBe(1);
  });
});

describe("Creator Leaderboard Calculation", () => {
  it("ranks creators based on created levels and calculates statistics", () => {
    const levels = [
      {
        name: "Level 1",
        slug: "level-1",
        rank: 1,
        status: "RANKED" as const,
        nerfCreator: "CreatorA",
        publisher: "PublisherX",
        verifier: "VerifierY",
      },
      {
        name: "Level 2",
        slug: "level-2",
        rank: 2,
        status: "RANKED" as const,
        nerfCreator: "CreatorA",
        publisher: "CreatorA",
        verifier: "VerifierZ",
      },
      {
        name: "Level 3",
        slug: "level-3",
        rank: 3,
        status: "RANKED" as const,
        nerfCreator: "CreatorB",
        publisher: "PublisherX",
        verifier: "CreatorA",
      },
    ];

    const creatorLeaderboard = calculateCreatorLeaderboard(levels);

    expect(creatorLeaderboard).toHaveLength(5);
    // CreatorA should be #1
    expect(creatorLeaderboard[0].creatorName).toBe("CreatorA");
    expect(creatorLeaderboard[0].createdCount).toBe(2);
    expect(creatorLeaderboard[0].verifiedCount).toBe(1);
    expect(creatorLeaderboard[0].totalCreatorPoints).toBe(1975); // 1000 + 975
  });
});
