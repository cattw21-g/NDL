import { type NextRequest } from "next/server";

import { requireBotApiSecret } from "@/lib/api-auth";
import { apiOk } from "@/lib/api-response";
import { parseApiLimit } from "@/lib/api-query";
import { serializeStaffRecordSubmission } from "@/lib/api-serializers";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireBotApiSecret(request);

  if (auth) {
    return auth;
  }

  const limit = parseApiLimit(request.nextUrl.searchParams);
  const submissions = await prisma.recordSubmission.findMany({
    where: {
      status: {
        in: ["PENDING", "NEEDS_CHANGES"],
      },
    },
    include: {
      player: true,
      level: true,
      reviewer: true,
    },
    orderBy: {
      submittedAt: "asc",
    },
    take: limit,
  });

  return apiOk({
    submissions: submissions.map(serializeStaffRecordSubmission),
    limit,
  });
}
