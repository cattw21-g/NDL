import { apiOk } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { UserLevelSubmissionInfo } from "@/lib/use-user-submissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return apiOk({ submissions: {}, authenticated: false });
  }

  const submissions = await prisma.recordSubmission.findMany({
    where: {
      playerId: user.id,
    },
    select: {
      id: true,
      status: true,
      progress: true,
      videoUrl: true,
      fps: true,
      cbfUsed: true,
      submittedAt: true,
      moderatorNotes: true,
      level: {
        select: {
          slug: true,
          id: true,
        },
      },
    },
    orderBy: {
      submittedAt: "desc",
    },
  });

  const submissionsBySlug: Record<string, UserLevelSubmissionInfo> = {};

  for (const s of submissions) {
    const item: UserLevelSubmissionInfo = {
      id: s.id,
      levelId: s.level.id,
      status: s.status as "PENDING" | "ACCEPTED" | "NEEDS_CHANGES" | "REJECTED",
      progress: s.progress ?? 100,
      videoUrl: s.videoUrl,
      fps: s.fps,
      cbfUsed: s.cbfUsed,
      submittedAt: s.submittedAt.toISOString(),
      moderatorNotes: s.moderatorNotes,
    };
    if (!submissionsBySlug[s.level.slug]) {
      submissionsBySlug[s.level.slug] = item;
    }
    if (!submissionsBySlug[s.level.id]) {
      submissionsBySlug[s.level.id] = item;
    }
  }

  return apiOk({ submissions: submissionsBySlug, authenticated: true });
}
