import { requireBotApiSecret } from "@/lib/api-auth";
import { apiNotFound, apiOk } from "@/lib/api-response";
import { serializeStaffLevelSuggestion } from "@/lib/api-serializers";
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
  const suggestion = await prisma.levelSuggestion.findUnique({
    where: {
      id,
    },
    include: {
      submitter: true,
      reviewer: true,
      createdLevel: true,
    },
  });

  if (!suggestion) {
    return apiNotFound("Level suggestion not found.");
  }

  return apiOk({
    suggestion: serializeStaffLevelSuggestion(suggestion),
  });
}
