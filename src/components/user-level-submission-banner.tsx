"use client";

import { useUserSubmissions } from "@/lib/use-user-submissions";
import { UserSubmissionBannerClient } from "@/components/user-submission-banner-client";
import { formatDate, formatDateTime } from "@/lib/format";

export function UserLevelSubmissionBanner({
  levelId,
}: {
  levelId: string;
}) {
  const { submissionsBySlug, loaded } = useUserSubmissions();

  if (!loaded) {
    return null;
  }

  const latestSubmission = submissionsBySlug[levelId];
  if (!latestSubmission) {
    return null;
  }

  return (
    <UserSubmissionBannerClient
      submission={{
        id: latestSubmission.id,
        status: latestSubmission.status,
        progress: latestSubmission.progress ?? 100,
        videoUrl: latestSubmission.videoUrl ?? "",
        fps: latestSubmission.fps,
        cbfUsed: latestSubmission.cbfUsed,
        moderatorNotes: latestSubmission.moderatorNotes,
      }}
      submittedDateFormatted={formatDate(latestSubmission.submittedAt)}
      submittedDateTimeFormatted={formatDateTime(latestSubmission.submittedAt)}
    />
  );
}
