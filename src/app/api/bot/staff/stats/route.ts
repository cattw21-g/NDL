import { requireBotApiSecret } from "@/lib/api-auth";
import { apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireBotApiSecret(request);

  if (auth) {
    return auth;
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [
    pendingRecords,
    pendingSuggestions,
    rankedLevels,
    users,
    acceptedRecords,
    moderationActions24h,
    auditEvents24h,
  ] = await Promise.all([
    prisma.recordSubmission.count({
      where: {
        status: {
          in: ["PENDING", "NEEDS_CHANGES"],
        },
      },
    }),
    prisma.levelSuggestion.count({
      where: {
        OR: [
          { status: "PENDING" },
          { status: "NEEDS_CHANGES" },
          { status: "APPROVED", createdLevelId: null },
        ],
      },
    }),
    prisma.level.count({
      where: {
        status: "RANKED",
      },
    }),
    prisma.user.count(),
    prisma.record.count(),
    prisma.moderationAction.count({
      where: {
        createdAt: {
          gte: since,
        },
      },
    }),
    prisma.adminAuditLog.count({
      where: {
        createdAt: {
          gte: since,
        },
      },
    }),
  ]);

  return apiOk({
    stats: {
      pendingRecords,
      pendingSuggestions,
      rankedLevels,
      users,
      acceptedRecords,
      moderationActions24h,
      auditEvents24h,
      generatedAt: new Date().toISOString(),
    },
  });
}
