export type ScoredLevelStatus =
  | "RANKED"
  | "LEGACY"
  | "PENDING"
  | "REJECTED"
  | "REMOVED";

export type LeaderboardRecord = {
  playerId: string;
  playerName: string;
  displayName: string;
  levelId: string;
  pointsAwarded: number;
  acceptedAt: Date;
};

export type LeaderboardRow = {
  playerId: string;
  playerName: string;
  displayName: string;
  points: number;
  records: number;
  lastRecordAt: Date;
};

export function calculateLevelPoints(
  rank: number | null | undefined,
  status: ScoredLevelStatus,
) {
  if (status === "REMOVED" || status === "REJECTED" || status === "PENDING") {
    return 0;
  }

  if (status === "LEGACY") {
    return 25;
  }

  if (!rank || rank < 1) {
    return 0;
  }

  return Math.max(50, Math.round(1000 * 0.97 ** (rank - 1)));
}

export function calculateLeaderboard(records: LeaderboardRecord[]) {
  const byPlayer = new Map<
    string,
    {
      playerName: string;
      displayName: string;
      levels: Map<string, { points: number; acceptedAt: Date }>;
    }
  >();

  for (const record of records) {
    const player = byPlayer.get(record.playerId) ?? {
      playerName: record.playerName,
      displayName: record.displayName,
      levels: new Map<string, { points: number; acceptedAt: Date }>(),
    };
    const current = player.levels.get(record.levelId);

    if (!current || record.pointsAwarded > current.points) {
      player.levels.set(record.levelId, {
        points: record.pointsAwarded,
        acceptedAt: record.acceptedAt,
      });
    }

    byPlayer.set(record.playerId, player);
  }

  const rows = Array.from(byPlayer.entries())
    .map(([playerId, player]) => {
      const levelRecords = Array.from(player.levels.values());
      return {
        playerId,
        playerName: player.playerName,
        displayName: player.displayName,
        points: levelRecords.reduce((sum, record) => sum + record.points, 0),
        records: levelRecords.length,
        lastRecordAt: levelRecords.reduce(
          (latest, record) =>
            record.acceptedAt > latest ? record.acceptedAt : latest,
          levelRecords[0]?.acceptedAt ?? new Date(0),
        ),
      };
    })
    .sort((a, b) => b.points - a.points || b.records - a.records);

  return rows satisfies LeaderboardRow[];
}
