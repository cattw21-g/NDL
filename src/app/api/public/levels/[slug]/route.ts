import { apiNotFound, apiOk } from "@/lib/api-response";
import { enforceApiRateLimit } from "@/lib/api-auth";
import {
  serializePublicLevel,
  serializePublicRecord,
} from "@/lib/api-serializers";
import { prisma } from "@/lib/db";
import { publicLevelWhere, publicRecordWhere } from "@/lib/demo-visibility";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rateLimit = await enforceApiRateLimit("public-api");

  if (rateLimit) {
    return rateLimit;
  }

  const { slug } = await params;
  const level = await prisma.level.findFirst({
    where: publicLevelWhere({
      slug,
    }),
    include: {
      records: {
        where: publicRecordWhere(),
        include: {
          player: true,
          level: true,
        },
        orderBy: {
          acceptedAt: "desc",
        },
      },
      _count: {
        select: {
          records: {
            where: publicRecordWhere(),
          },
        },
      },
    },
  });

  if (!level) {
    return apiNotFound("Level not found.");
  }

  return apiOk({
    level: serializePublicLevel(level),
    records: level.records.map(serializePublicRecord),
  });
}
