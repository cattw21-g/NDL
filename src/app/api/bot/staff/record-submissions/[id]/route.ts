import { requireBotApiSecret } from "@/lib/api-auth";
import { apiNotFound, apiOk } from "@/lib/api-response";
import { serializeStaffRecordSubmission } from "@/lib/api-serializers";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireBotApiSecret(request);

  if (auth) {
    return auth;
  }

  const { id } = await params;
  const submission = await prisma.recordSubmission.findUnique({
    where: {
      id,
    },
    include: {
      player: true,
      level: true,
      reviewer: true,
    },
  });

  if (!submission) {
    return apiNotFound("Record submission not found.");
  }

  return apiOk({
    submission: serializeStaffRecordSubmission(submission),
  });
}
