import { type NextRequest } from "next/server";

import { apiNotFound, apiOk } from "@/lib/api-response";
import { enforceApiRateLimit } from "@/lib/api-auth";
import { parseApiLimit } from "@/lib/api-query";
import { serializePublicRecord } from "@/lib/api-serializers";
import { prisma } from "@/lib/db";
import { publicRecordWhere, publicUserWhere } from "@/lib/demo-visibility";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const rateLimit = await enforceApiRateLimit("public-api");

  if (rateLimit) {
    return rateLimit;
  }

  const { handle } = await params;
  const limit = parseApiLimit(request.nextUrl.searchParams);
  const player = await prisma.user.findFirst({
    where: publicUserWhere({
      playerName: handle,
    }),
    select: {
      id: true,
    },
  });

  if (!player) {
    return apiNotFound("Player not found.");
  }

  const records = await prisma.record.findMany({
    where: publicRecordWhere({
      playerId: player.id,
    }),
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
