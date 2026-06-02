import { type NextRequest } from "next/server";

import { apiOk } from "@/lib/api-response";
import { enforceApiRateLimit } from "@/lib/api-auth";
import { parseApiLimit, parseApiSearch } from "@/lib/api-query";
import {
  serializePublicLevel,
  serializePublicPlayer,
} from "@/lib/api-serializers";
import { prisma } from "@/lib/db";
import {
  publicLevelWhere,
  publicRecordWhere,
  publicUserWhere,
} from "@/lib/demo-visibility";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rateLimit = await enforceApiRateLimit("public-api");

  if (rateLimit) {
    return rateLimit;
  }

  const q = parseApiSearch(request.nextUrl.searchParams);
  const limit = parseApiLimit(request.nextUrl.searchParams);

  if (!q) {
    return apiOk({
      query: q,
      levels: [],
      players: [],
      limit,
    });
  }

  const [levels, players] = await Promise.all([
    prisma.level.findMany({
      where: publicLevelWhere({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { originalName: { contains: q, mode: "insensitive" } },
          { gdLevelId: { contains: q, mode: "insensitive" } },
          { publisher: { contains: q, mode: "insensitive" } },
          { nerfCreator: { contains: q, mode: "insensitive" } },
          { verifier: { contains: q, mode: "insensitive" } },
        ],
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
    }),
    prisma.user.findMany({
      where: publicUserWhere({
        OR: [
          { playerName: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
        ],
      }),
      orderBy: {
        playerName: "asc",
      },
      take: limit,
    }),
  ]);

  return apiOk({
    query: q,
    levels: levels.map(serializePublicLevel),
    players: players.map(serializePublicPlayer),
    limit,
  });
}
