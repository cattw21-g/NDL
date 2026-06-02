import { type NextRequest } from "next/server";

import { apiOk } from "@/lib/api-response";
import { enforceApiRateLimit } from "@/lib/api-auth";
import { parseApiLimit } from "@/lib/api-query";
import { serializePublicRecord } from "@/lib/api-serializers";
import { prisma } from "@/lib/db";
import { publicRecordWhere } from "@/lib/demo-visibility";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rateLimit = await enforceApiRateLimit("public-api");

  if (rateLimit) {
    return rateLimit;
  }

  const limit = parseApiLimit(request.nextUrl.searchParams);
  const records = await prisma.record.findMany({
    where: publicRecordWhere(),
    include: {
      player: true,
      level: true,
    },
    orderBy: {
      acceptedAt: "desc",
    },
    take: limit,
  });

  return apiOk({
    records: records.map(serializePublicRecord),
    limit,
  });
}
