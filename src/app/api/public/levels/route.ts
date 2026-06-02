import { type NextRequest } from "next/server";

import { apiOk } from "@/lib/api-response";
import { enforceApiRateLimit } from "@/lib/api-auth";
import { parseApiLimit } from "@/lib/api-query";
import { serializePublicLevel } from "@/lib/api-serializers";
import { prisma } from "@/lib/db";
import { publicLevelWhere, publicRecordWhere } from "@/lib/demo-visibility";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rateLimit = await enforceApiRateLimit("public-api");

  if (rateLimit) {
    return rateLimit;
  }

  const limit = parseApiLimit(request.nextUrl.searchParams);
  const levels = await prisma.level.findMany({
    where: publicLevelWhere({
      status: {
        in: ["RANKED", "LEGACY"],
      },
    }),
    include: {
      _count: {
        select: {
          records: {
            where: publicRecordWhere(),
          },
        },
      },
    },
    orderBy: [{ rank: "asc" }, { name: "asc" }],
    take: limit,
  });

  return apiOk({
    levels: levels.map(serializePublicLevel),
    limit,
  });
}
