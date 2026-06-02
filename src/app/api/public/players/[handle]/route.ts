import { apiNotFound, apiOk } from "@/lib/api-response";
import { enforceApiRateLimit } from "@/lib/api-auth";
import {
  serializePublicLeaderboard,
  serializePublicPlayer,
} from "@/lib/api-serializers";
import { prisma } from "@/lib/db";
import { publicRecordWhere, publicUserWhere } from "@/lib/demo-visibility";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const rateLimit = await enforceApiRateLimit("public-api");

  if (rateLimit) {
    return rateLimit;
  }

  const { handle } = await params;
  const player = await prisma.user.findFirst({
    where: publicUserWhere({
      playerName: handle,
    }),
    include: {
      records: {
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
      },
    },
  });

  if (!player) {
    return apiNotFound("Player not found.");
  }

  const leaderboardRow = serializePublicLeaderboard(player.records)[0] ?? {
    rank: null,
    handle: player.playerName,
    displayName: player.displayName,
    points: 0,
    records: 0,
    lastRecordAt: null,
  };

  return apiOk({
    player: serializePublicPlayer(player),
    summary: leaderboardRow,
  });
}
