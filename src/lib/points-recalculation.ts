import type { Prisma } from "../generated/prisma/client";

import { calculateLevelPoints, calculateRecordPoints } from "./points";

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
      minimumProgress: true,
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

    const fullRecords = await db.record.updateMany({
      where: {
        levelId: level.id,
        progress: 100,
        pointsAwarded: {
          not: points,
        },
      },
      data: {
        pointsAwarded: points,
      },
    });
    result.recordsUpdated += fullRecords.count;

    const progressRecords = await db.record.findMany({
      where: {
        levelId: level.id,
        progress: {
          lt: 100,
        },
      },
      select: {
        id: true,
        progress: true,
        pointsAwarded: true,
      },
    });

    for (const rec of progressRecords) {
      const expectedPoints = calculateRecordPoints({
        levelRank: level.rank,
        status: level.status,
        progress: rec.progress,
        requirement: level.minimumProgress ?? 50,
      });

      if (rec.pointsAwarded !== expectedPoints) {
        await db.record.update({
          where: { id: rec.id },
          data: { pointsAwarded: expectedPoints },
        });
        result.recordsUpdated += 1;
      }
    }
  }

  return result;
}
