import { type NextRequest } from "next/server";

import { apiOk } from "@/lib/api-response";
import { enforceApiRateLimit } from "@/lib/api-auth";
import { parseApiLimit } from "@/lib/api-query";
import { serializePublicLeaderboard } from "@/lib/api-serializers";
import { prisma } from "@/lib/db";
import { publicRecordWhere } from "@/lib/demo-visibility";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rateLimit = await enforceApiRateLimit("public-api");

  if (rateLimit) {
    return rateLimit;
  }

  const limit = parseApiLimit(request.nextUrl.searchParams);
  let records = await prisma.record.findMany({
    where: publicRecordWhere({
      level: {
        status: {
          in: ["RANKED", "LEGACY"],
        },
      },
    }),
    include: {
      player: true,
      level: true,
    },
  });

  if (records.length === 0) {
    const { getFallbackRecords } = await import("@/lib/fallback-records");
    records = getFallbackRecords() as any;
  }

  return apiOk({
    players: serializePublicLeaderboard(records as any).slice(0, limit),
    limit,
  });
}
