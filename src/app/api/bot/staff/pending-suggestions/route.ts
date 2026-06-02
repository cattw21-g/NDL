import { type NextRequest } from "next/server";

import { requireBotApiSecret } from "@/lib/api-auth";
import { apiOk } from "@/lib/api-response";
import { parseApiLimit } from "@/lib/api-query";
import { serializeStaffLevelSuggestion } from "@/lib/api-serializers";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireBotApiSecret(request);

  if (auth) {
    return auth;
  }

  const limit = parseApiLimit(request.nextUrl.searchParams);
  const suggestions = await prisma.levelSuggestion.findMany({
    where: {
      OR: [
        { status: "PENDING" },
        { status: "NEEDS_CHANGES" },
        { status: "APPROVED", createdLevelId: null },
      ],
    },
    include: {
      submitter: true,
      reviewer: true,
      createdLevel: true,
    },
    orderBy: {
      submittedAt: "asc",
    },
    take: limit,
  });

  return apiOk({
    suggestions: suggestions.map(serializeStaffLevelSuggestion),
    limit,
  });
}
