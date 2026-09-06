import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publicRecordWhere } from "@/lib/demo-visibility";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const levelId = searchParams.get("levelId");
  const playerId = searchParams.get("playerId");
  const isVerifier = searchParams.get("isVerifier");
  const minProgress = Number(searchParams.get("minProgress") ?? "0");
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "50"), 1), 100);
  const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
  const skip = (page - 1) * limit;

  const where: any = publicRecordWhere({
    ...(levelId ? { levelId } : {}),
    ...(playerId ? { playerId } : {}),
    ...(isVerifier !== null && isVerifier !== undefined
      ? { isVerifier: isVerifier === "true" }
      : {}),
    ...(minProgress > 0 ? { progress: { gte: minProgress } } : {}),
  });

  const [records, totalCount] = await Promise.all([
    prisma.record.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ acceptedAt: "desc" }],
      select: {
        id: true,
        progress: true,
        pointsAwarded: true,
        videoUrl: true,
        fps: true,
        cbfUsed: true,
        isVerifier: true,
        acceptedAt: true,
        level: {
          select: {
            id: true,
            name: true,
            slug: true,
            rank: true,
            status: true,
          },
        },
        player: {
          select: {
            id: true,
            playerName: true,
            displayName: true,
            countryCode: true,
            subdivision: true,
          },
        },
      },
    }),
    prisma.record.count({ where }),
  ]);

  return NextResponse.json({
    data: records,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}
