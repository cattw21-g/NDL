import { DifficultyCategory, LevelStatus } from "../generated/prisma/enums";
import type { Prisma } from "../generated/prisma/client";
import { calculateLevelPoints } from "./points";

const TEMP_RANK_BASE = -1_000_000;
const NEW_LEVEL_ID = "__new_level__";

export type RankableLevel = {
  id: string;
  rank: number | null;
  status: LevelStatus;
  slug?: string;
};

export type RankedPlanItem = {
  id: string;
  rank: number;
};

export type LevelRankingErrorCode = "missing" | "rank-required";

export class LevelRankingError extends Error {
  code: LevelRankingErrorCode;

  constructor(code: LevelRankingErrorCode, message: string) {
    super(message);
    this.name = "LevelRankingError";
    this.code = code;
  }
}

export type LevelWriteInput = {
  rank?: number;
  name: string;
  originalName: string;
  gdLevelId: string;
  publisher: string;
  nerfCreator: string;
  verifier: string;
  thumbnailUrl: string;
  showcaseUrl: string;
  placementDate?: Date;
  status: LevelStatus;
  difficulty: DifficultyCategory;
  description: string;
  versionNotes?: string;
};

export type LevelCreateInput = LevelWriteInput & {
  slug: string;
};

type LevelRankingClient = Pick<Prisma.TransactionClient, "level" | "record">;

type StoredRankLevel = {
  id: string;
  rank: number | null;
  status: LevelStatus;
  slug: string;
};

export function planRankedRanks(
  levels: RankableLevel[],
  target: {
    id: string;
    status: LevelStatus;
    requestedRank?: number | null;
  },
) {
  const rankedLevels = levels
    .filter(
      (level) => level.status === LevelStatus.RANKED && level.id !== target.id,
    )
    .toSorted((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER));

  if (target.status !== LevelStatus.RANKED) {
    return {
      targetRank: null,
      ranked: rankedLevels.map((level, index) => ({
        id: level.id,
        rank: index + 1,
      })),
    };
  }

  if (!target.requestedRank || target.requestedRank < 1) {
    throw new LevelRankingError(
      "rank-required",
      "Ranked levels require a positive rank.",
    );
  }

  const targetRank = Math.min(target.requestedRank, rankedLevels.length + 1);
  const before = rankedLevels.slice(0, targetRank - 1);
  const after = rankedLevels.slice(targetRank - 1);
  const ranked = [...before, { id: target.id, rank: targetRank, status: target.status }, ...after].map(
    (level, index) => ({
      id: level.id,
      rank: index + 1,
    }),
  );

  return {
    targetRank,
    ranked,
  };
}

export async function createLevelWithRank(
  tx: LevelRankingClient,
  input: LevelCreateInput,
) {
  await clearNonRankedRanks(tx);

  const levels = await findLevelsForRanking(tx);
  const plan = planRankedRanks(levels, {
    id: NEW_LEVEL_ID,
    status: input.status,
    requestedRank: input.rank,
  });
  const currentRanked = levels.filter(
    (level) => level.status === LevelStatus.RANKED,
  );

  await moveToTemporaryRanks(tx, currentRanked);

  const finalRank =
    plan.ranked.find((item) => item.id === NEW_LEVEL_ID)?.rank ?? null;
  const points = calculateLevelPoints(finalRank, input.status);

  const level = await tx.level.create({
    data: {
      rank: finalRank,
      slug: input.slug,
      name: input.name,
      originalName: input.originalName,
      gdLevelId: input.gdLevelId,
      publisher: input.publisher,
      nerfCreator: input.nerfCreator,
      verifier: input.verifier,
      thumbnailUrl: input.thumbnailUrl,
      showcaseUrl: input.showcaseUrl,
      placementDate: input.placementDate,
      status: input.status,
      difficulty: input.difficulty,
      points,
      description: input.description,
      versionNotes: input.versionNotes,
    },
  });

  await applyRankPlan(tx, plan.ranked, currentRanked, NEW_LEVEL_ID);

  return {
    level,
    affectedSlugs: uniqueStrings([
      level.slug,
      ...currentRanked.map((ranked) => ranked.slug),
    ]),
  };
}

export async function updateLevelWithRank(
  tx: LevelRankingClient,
  id: string,
  input: LevelWriteInput,
) {
  await clearNonRankedRanks(tx);

  const levels = await findLevelsForRanking(tx);
  const existing = levels.find((level) => level.id === id);

  if (!existing) {
    throw new LevelRankingError("missing", "Level not found.");
  }

  const plan = planRankedRanks(levels, {
    id,
    status: input.status,
    requestedRank: input.rank,
  });
  const currentRanked = levels.filter(
    (level) => level.status === LevelStatus.RANKED,
  );
  const finalRank = plan.ranked.find((item) => item.id === id)?.rank ?? null;
  const points = calculateLevelPoints(finalRank, input.status);

  await moveToTemporaryRanks(tx, currentRanked);

  const level = await tx.level.update({
    where: {
      id,
    },
    data: {
      rank: finalRank,
      name: input.name,
      originalName: input.originalName,
      gdLevelId: input.gdLevelId,
      publisher: input.publisher,
      nerfCreator: input.nerfCreator,
      verifier: input.verifier,
      thumbnailUrl: input.thumbnailUrl,
      showcaseUrl: input.showcaseUrl,
      placementDate: input.placementDate,
      status: input.status,
      difficulty: input.difficulty,
      points,
      description: input.description,
      versionNotes: input.versionNotes,
    },
  });

  await updateRecordsForLevel(tx, id, points);
  await applyRankPlan(tx, plan.ranked, currentRanked, id);

  return {
    level,
    affectedSlugs: uniqueStrings([
      level.slug,
      existing.slug,
      ...currentRanked.map((ranked) => ranked.slug),
      ...plan.ranked
        .map((item) => levels.find((ranked) => ranked.id === item.id)?.slug)
        .filter((slug): slug is string => Boolean(slug)),
    ]),
  };
}

async function findLevelsForRanking(tx: LevelRankingClient) {
  return tx.level.findMany({
    select: {
      id: true,
      rank: true,
      status: true,
      slug: true,
    },
    orderBy: [{ rank: "asc" }, { createdAt: "asc" }],
  });
}

async function clearNonRankedRanks(tx: LevelRankingClient) {
  await tx.level.updateMany({
    where: {
      status: {
        not: LevelStatus.RANKED,
      },
      rank: {
        not: null,
      },
    },
    data: {
      rank: null,
    },
  });
}

async function moveToTemporaryRanks(
  tx: LevelRankingClient,
  levels: StoredRankLevel[],
) {
  for (const [index, level] of levels.entries()) {
    await tx.level.update({
      where: {
        id: level.id,
      },
      data: {
        rank: TEMP_RANK_BASE - index,
      },
    });
  }
}

async function applyRankPlan(
  tx: LevelRankingClient,
  plan: RankedPlanItem[],
  levels: StoredRankLevel[],
  skippedId: string,
) {
  for (const item of plan) {
    if (item.id === skippedId) {
      continue;
    }

    const points = calculateLevelPoints(item.rank, LevelStatus.RANKED);

    await tx.level.update({
      where: {
        id: item.id,
      },
      data: {
        rank: item.rank,
        points,
      },
    });

    await updateRecordsForLevel(tx, item.id, points);
  }

  const rankedIds = new Set(plan.map((item) => item.id));

  for (const level of levels) {
    if (!rankedIds.has(level.id) && level.id !== skippedId) {
      const points = calculateLevelPoints(null, level.status);

      await tx.level.update({
        where: {
          id: level.id,
        },
        data: {
          rank: null,
          points,
        },
      });

      await updateRecordsForLevel(tx, level.id, points);
    }
  }
}

async function updateRecordsForLevel(
  tx: LevelRankingClient,
  levelId: string,
  points: number,
) {
  await tx.record.updateMany({
    where: {
      levelId,
    },
    data: {
      pointsAwarded: points,
    },
  });
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}
