import type { Prisma } from "../generated/prisma/client";

import { calculateLevelPoints } from "./points";

export type PointsRecalculationClient = Pick<
  Prisma.TransactionClient,
  "level" | "record"
>;

export type PointsRecalculationResult = {
  levelsChecked: number;
  levelsUpdated: number;
  recordsUpdated: number;
};

export async function recalculateStoredPoints(
  db: PointsRecalculationClient,
): Promise<PointsRecalculationResult> {
  const levels = await db.level.findMany({
    select: {
      id: true,
      rank: true,
      status: true,
      points: true,
    },
    orderBy: [{ rank: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
  });

  const result: PointsRecalculationResult = {
    levelsChecked: levels.length,
    levelsUpdated: 0,
    recordsUpdated: 0,
  };

  for (const level of levels) {
    const points = calculateLevelPoints(level.rank, level.status);

    if (level.points !== points) {
      await db.level.update({
        where: {
          id: level.id,
        },
        data: {
          points,
        },
      });
      result.levelsUpdated += 1;
    }

    const records = await db.record.updateMany({
      where: {
        levelId: level.id,
        pointsAwarded: {
          not: points,
        },
      },
      data: {
        pointsAwarded: points,
      },
    });
    result.recordsUpdated += records.count;
  }

  return result;
}
