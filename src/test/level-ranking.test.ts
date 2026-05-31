import { describe, expect, it } from "vitest";

import { LevelStatus } from "../generated/prisma/enums";
import {
  LevelRankingError,
  planRankedRanks,
  type RankableLevel,
} from "../lib/level-ranking";

const ranked = (id: string, rank: number): RankableLevel => ({
  id,
  rank,
  status: LevelStatus.RANKED,
});

const legacy = (id: string, rank: number | null): RankableLevel => ({
  id,
  rank,
  status: LevelStatus.LEGACY,
});

describe("planRankedRanks", () => {
  it("creating at an occupied rank shifts existing ranked levels down", () => {
    const plan = planRankedRanks(
      [ranked("a", 1), ranked("b", 2), ranked("c", 3)],
      {
        id: "new",
        status: LevelStatus.RANKED,
        requestedRank: 1,
      },
    );

    expect(plan.ranked).toEqual([
      { id: "new", rank: 1 },
      { id: "a", rank: 2 },
      { id: "b", rank: 3 },
      { id: "c", rank: 4 },
    ]);
  });

  it("creating at a free end rank works", () => {
    const plan = planRankedRanks([ranked("a", 1), ranked("b", 2)], {
      id: "new",
      status: LevelStatus.RANKED,
      requestedRank: 3,
    });

    expect(plan.ranked).toEqual([
      { id: "a", rank: 1 },
      { id: "b", rank: 2 },
      { id: "new", rank: 3 },
    ]);
  });

  it("moving a level upward inserts it and shifts affected levels down", () => {
    const plan = planRankedRanks(
      [ranked("a", 1), ranked("b", 2), ranked("c", 3)],
      {
        id: "c",
        status: LevelStatus.RANKED,
        requestedRank: 1,
      },
    );

    expect(plan.ranked).toEqual([
      { id: "c", rank: 1 },
      { id: "a", rank: 2 },
      { id: "b", rank: 3 },
    ]);
  });

  it("moving a level downward shifts affected levels up", () => {
    const plan = planRankedRanks(
      [ranked("a", 1), ranked("b", 2), ranked("c", 3)],
      {
        id: "a",
        status: LevelStatus.RANKED,
        requestedRank: 3,
      },
    );

    expect(plan.ranked).toEqual([
      { id: "b", rank: 1 },
      { id: "c", rank: 2 },
      { id: "a", rank: 3 },
    ]);
  });

  it("legacy and non-ranked levels are excluded from main rank shifting", () => {
    const plan = planRankedRanks(
      [ranked("a", 1), legacy("legacy", 2), ranked("b", 3)],
      {
        id: "new",
        status: LevelStatus.RANKED,
        requestedRank: 2,
      },
    );

    expect(plan.ranked).toEqual([
      { id: "a", rank: 1 },
      { id: "new", rank: 2 },
      { id: "b", rank: 3 },
    ]);
    expect(plan.ranked.some((item) => item.id === "legacy")).toBe(false);
  });

  it("keeps ranked ranks contiguous and duplicate-free", () => {
    const plan = planRankedRanks(
      [ranked("a", 1), ranked("b", 1), ranked("c", 8)],
      {
        id: "new",
        status: LevelStatus.RANKED,
        requestedRank: 2,
      },
    );
    const ranks = plan.ranked.map((item) => item.rank);

    expect(ranks).toEqual([1, 2, 3, 4]);
    expect(new Set(ranks).size).toBe(ranks.length);
  });

  it("clears target rank when target is not ranked", () => {
    const plan = planRankedRanks([ranked("a", 1), ranked("b", 2)], {
      id: "a",
      status: LevelStatus.REMOVED,
      requestedRank: 1,
    });

    expect(plan.targetRank).toBeNull();
    expect(plan.ranked).toEqual([{ id: "b", rank: 1 }]);
  });

  it("returns a clean error for missing ranked rank", () => {
    expect(() =>
      planRankedRanks([ranked("a", 1)], {
        id: "new",
        status: LevelStatus.RANKED,
        requestedRank: null,
      }),
    ).toThrow(LevelRankingError);
  });

  it("plans occupied-rank creation without duplicate final ranks", () => {
    const plan = planRankedRanks([ranked("a", 1)], {
      id: "new",
      status: LevelStatus.RANKED,
      requestedRank: 1,
    });

    expect(plan.ranked).toEqual([
      { id: "new", rank: 1 },
      { id: "a", rank: 2 },
    ]);
  });

  it("clamps ranks beyond the end to the next available rank", () => {
    const plan = planRankedRanks([ranked("a", 1), ranked("b", 2)], {
      id: "new",
      status: LevelStatus.RANKED,
      requestedRank: 50,
    });

    expect(plan.targetRank).toBe(3);
    expect(plan.ranked.at(-1)).toEqual({ id: "new", rank: 3 });
  });
});
