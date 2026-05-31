import type { Prisma, PrismaClient } from "../generated/prisma/client";

export const moderationQueueStatuses = ["PENDING", "NEEDS_CHANGES"] as const;

export function moderationQueueWhere() {
  return {
    status: {
      in: [...moderationQueueStatuses],
    },
  } satisfies Prisma.RecordSubmissionWhereInput;
}

type ModerationQueueClient = Pick<PrismaClient, "recordSubmission">;

export function moderationQueueQuery() {
  return {
    where: moderationQueueWhere(),
    include: {
      player: true,
      level: true,
    },
    orderBy: {
      submittedAt: "asc" as const,
    },
  } satisfies Prisma.RecordSubmissionFindManyArgs;
}

async function getClient(client?: ModerationQueueClient) {
  if (client) {
    return client;
  }

  const db = await import("./db");
  return db.prisma;
}

export async function getModerationQueue(client?: ModerationQueueClient) {
  const db = await getClient(client);
  return db.recordSubmission.findMany(moderationQueueQuery());
}

export async function countModerationQueue(client?: ModerationQueueClient) {
  const db = await getClient(client);
  return db.recordSubmission.count({
    where: moderationQueueWhere(),
  });
}
