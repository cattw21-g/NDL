import { apiOk, apiUnauthorized } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isModeratorRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user || !isModeratorRole(user.role)) {
    return apiUnauthorized("Staff privileges required to access notifications.");
  }

  const [
    pendingRecordsCount,
    pendingSuggestionsCount,
    recentPendingRecords,
    recentPendingSuggestions,
  ] = await Promise.all([
    prisma.recordSubmission.count({
      where: {
        status: "PENDING",
      },
    }),
    prisma.levelSuggestion.count({
      where: {
        status: "PENDING",
      },
    }),
    prisma.recordSubmission.findMany({
      where: {
        status: "PENDING",
      },
      take: 4,
      orderBy: {
        submittedAt: "desc",
      },
      include: {
        player: {
          select: {
            playerName: true,
            displayName: true,
          },
        },
        level: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    }),
    prisma.levelSuggestion.findMany({
      where: {
        status: "PENDING",
      },
      take: 4,
      orderBy: {
        submittedAt: "desc",
      },
      include: {
        submitter: {
          select: {
            playerName: true,
            displayName: true,
          },
        },
      },
    }),
  ]);

  return apiOk({
    pendingRecordsCount,
    pendingSuggestionsCount,
    totalPendingCount: pendingRecordsCount + pendingSuggestionsCount,
    recentPendingRecords: recentPendingRecords.map((rec) => ({
      id: rec.id,
      playerName: rec.player.displayName || rec.player.playerName,
      levelName: rec.level.name,
      levelSlug: rec.level.slug,
      progress: rec.progress,
      submittedAt: rec.submittedAt.toISOString(),
    })),
    recentPendingSuggestions: recentPendingSuggestions.map((sug) => ({
      id: sug.id,
      name: sug.name,
      originalName: sug.originalName,
      submitterName: sug.submitter.displayName || sug.submitter.playerName,
      submittedAt: sug.submittedAt.toISOString(),
    })),
    timestamp: new Date().toISOString(),
  });
}
