import { prisma } from "@/lib/db";
import { calculateLeaderboard, calculateLevelPoints, type ScoredLevelStatus } from "@/lib/points";
import { publicLevelWhere, publicRecordWhere } from "@/lib/demo-visibility";

export type HistoricalListState = {
  asOfDate: string;
  levels: Array<{
    id: string;
    slug: string;
    name: string;
    originalName: string;
    rank: number | null;
    status: ScoredLevelStatus;
    points: number;
    difficulty: string;
    publisher: string;
    nerfCreator: string;
    verifier: string;
    thumbnailUrl: string;
    showcaseUrl: string;
  }>;
  leaderboard: Array<{
    rank: number;
    playerId: string;
    playerName: string;
    displayName: string;
    points: number;
    recordsCount: number;
  }>;
  stats: {
    totalDemons: number;
    totalRecords: number;
    topDemonName: string | null;
    topPlayerName: string | null;
  };
};

export async function getListStateAtDate(targetDate: Date): Promise<HistoricalListState> {
  const asOf = new Date(targetDate);

  // 1. Fetch levels created on or before target date
  const levels = await prisma.level.findMany({
    where: {
      ...publicLevelWhere(),
      createdAt: { lte: asOf },
    },
    include: {
      positionSnapshots: {
        where: { recordedAt: { lte: asOf } },
        orderBy: { recordedAt: "desc" },
        take: 1,
      },
    },
  });

  // 2. Fetch records accepted on or before target date
  const records = await prisma.record.findMany({
    where: {
      ...publicRecordWhere(),
      acceptedAt: { lte: asOf },
      level: {
        createdAt: { lte: asOf },
      },
    },
    include: {
      player: {
        select: {
          id: true,
          playerName: true,
          displayName: true,
        },
      },
      level: {
        select: {
          id: true,
          rank: true,
          status: true,
        },
      },
    },
  });

  // 3. Reconstruct level ranks at target date
  const historicalLevels = levels
    .map((lvl) => {
      const latestSnapshot = lvl.positionSnapshots[0];
      const rank = latestSnapshot ? latestSnapshot.rank : lvl.rank;
      const status = (latestSnapshot ? latestSnapshot.status : lvl.status) as ScoredLevelStatus;
      const points = calculateLevelPoints(rank, status);

      return {
        id: lvl.id,
        slug: lvl.slug,
        name: lvl.name,
        originalName: lvl.originalName,
        rank,
        status,
        points,
        difficulty: lvl.difficulty,
        publisher: lvl.publisher,
        nerfCreator: lvl.nerfCreator,
        verifier: lvl.verifier,
        thumbnailUrl: lvl.thumbnailUrl,
        showcaseUrl: lvl.showcaseUrl,
      };
    })
    .filter((lvl) => lvl.status === "RANKED" || lvl.status === "LEGACY")
    .sort((a, b) => {
      if (a.rank && b.rank) return a.rank - b.rank;
      if (a.rank) return -1;
      if (b.rank) return 1;
      return a.name.localeCompare(b.name);
    });

  // 4. Reconstruct player leaderboard at target date
  const levelPointsMap = new Map(historicalLevels.map((l) => [l.id, l.points]));

  const leaderboardRecords = records.map((r) => {
    const levelPts = levelPointsMap.get(r.levelId) ?? 0;
    const pointsAwarded = r.progress >= 100 ? levelPts : r.pointsAwarded;
    return {
      playerId: r.player.id,
      playerName: r.player.playerName,
      displayName: r.player.displayName,
      levelId: r.levelId,
      pointsAwarded,
      acceptedAt: r.acceptedAt,
      progress: r.progress,
    };
  });

  const rawLeaderboard = calculateLeaderboard(leaderboardRecords);
  const leaderboard = rawLeaderboard.map((entry, index) => ({
    rank: index + 1,
    playerId: entry.playerId,
    playerName: entry.playerName,
    displayName: entry.displayName,
    points: entry.points,
    recordsCount: entry.records,
  }));

  const top1Demon = historicalLevels.find((l) => l.rank === 1)?.name || null;
  const top1Player = leaderboard[0]?.displayName || null;

  return {
    asOfDate: asOf.toISOString(),
    levels: historicalLevels,
    leaderboard,
    stats: {
      totalDemons: historicalLevels.length,
      totalRecords: records.length,
      topDemonName: top1Demon,
      topPlayerName: top1Player,
    },
  };
}
