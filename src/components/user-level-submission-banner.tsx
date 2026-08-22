import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { UserSubmissionBannerClient } from "@/components/user-submission-banner-client";

export async function UserLevelSubmissionBanner({
  levelId,
}: {
  levelId: string;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const submissions = await prisma.recordSubmission.findMany({
    where: {
      playerId: currentUser.id,
      levelId,
    },
    orderBy: {
      submittedAt: "desc",
    },
    take: 1,
    select: {
      id: true,
      status: true,
      progress: true,
      videoUrl: true,
      fps: true,
      cbfUsed: true,
      submittedAt: true,
      moderatorNotes: true,
    },
  });

  if (!submissions || submissions.length === 0) {
    return null;
  }

  const latestSubmission = submissions[0];

  return (
    <UserSubmissionBannerClient
      submission={{
        id: latestSubmission.id,
        status: latestSubmission.status as "PENDING" | "ACCEPTED" | "NEEDS_CHANGES" | "REJECTED",
        progress: latestSubmission.progress ?? 100,
        videoUrl: latestSubmission.videoUrl,
        fps: latestSubmission.fps,
        cbfUsed: latestSubmission.cbfUsed,
        moderatorNotes: latestSubmission.moderatorNotes,
      }}
      submittedDateFormatted={formatDate(latestSubmission.submittedAt)}
      submittedDateTimeFormatted={formatDateTime(latestSubmission.submittedAt)}
    />
  );
}
