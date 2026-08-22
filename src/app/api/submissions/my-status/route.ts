import { apiOk } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return apiOk({ submissions: {} });
  }

  const submissions = await prisma.recordSubmission.findMany({
    where: {
      playerId: user.id,
    },
    select: {
      id: true,
      status: true,
      progress: true,
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

  const submissionsBySlug: Record<
    string,
    {
      id: string;
      status: "PENDING" | "ACCEPTED" | "NEEDS_CHANGES" | "REJECTED";
      progress: number;
      submittedAt: string;
      moderatorNotes: string | null;
    }
  > = {};

  for (const s of submissions) {
    if (!submissionsBySlug[s.level.slug]) {
      submissionsBySlug[s.level.slug] = {
        id: s.id,
        status: s.status as "PENDING" | "ACCEPTED" | "NEEDS_CHANGES" | "REJECTED",
        progress: s.progress ?? 100,
        submittedAt: s.submittedAt.toISOString(),
        moderatorNotes: s.moderatorNotes,
      };
    }
  }

  return apiOk({ submissions: submissionsBySlug });
}
