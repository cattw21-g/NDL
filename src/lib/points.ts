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
  progress?: number;
  isVerifier?: boolean;
};

export type LeaderboardRow = {
  playerId: string;
  playerName: string;
  displayName: string;
  points: number;
  records: number;
  lastRecordAt: Date;
};

export type LevelPointSource = {
  rank: number | null | undefined;
  status: ScoredLevelStatus;
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

  if (rank === 1) return 1000;
  if (rank <= 5) return 1000 - (rank - 1) * 25;
  if (rank <= 10) return 900 - (rank - 5) * 20;
  if (rank <= 25) return 800 - (rank - 10) * 15;
  if (rank <= 50) return 575 - (rank - 25) * 10;
  if (rank <= 100) return 325 - (rank - 50) * 4;
  return Math.max(10, 125 - (rank - 100) * 2);
}

export type ListTier = "MAIN" | "EXTENDED" | "LEGACY";

export const MAIN_LIST_CUTOFF = 75;
export const EXTENDED_LIST_CUTOFF = 150;

export function getLevelTier(
  rank: number | null | undefined,
  status: ScoredLevelStatus,
): ListTier {
  if (status === "LEGACY" || status === "REMOVED") return "LEGACY";
  if (!rank || rank < 1) return "LEGACY";
  if (rank <= MAIN_LIST_CUTOFF) return "MAIN";
  if (rank <= EXTENDED_LIST_CUTOFF) return "EXTENDED";
  return "LEGACY";
}

export function calculateCurrentLevelPoints(level: LevelPointSource) {
  return calculateLevelPoints(level.rank, level.status);
}

/**
 * Calculates points for a record (completion or qualifying progress)
 */
export function calculateRecordPoints(params: {
  levelRank: number | null | undefined;
  status: ScoredLevelStatus;
  progress: number;
  requirement?: number;
}): number {
  const { levelRank, status, progress, requirement = 50 } = params;
  const fullPoints = calculateLevelPoints(levelRank, status);
  if (fullPoints <= 0) return 0;

  // 100% completion gets full points
  if (progress >= 100) return fullPoints;

  const tier = getLevelTier(levelRank, status);
  // Pointercrate rule: Only Main List gives points for progress!
  if (tier !== "MAIN") return 0;

  // Must meet minimum requirement (e.g. 50% or 60%)
  if (progress < requirement) return 0;

  // Scaled progress formula: 10% base + 50% max scaled by progress above requirement
  const ratio = Math.max(0, Math.min(1, (progress - requirement) / (100 - requirement)));
  const factor = 0.10 + 0.50 * ratio;
  return Math.round(fullPoints * factor);
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
    if (record.pointsAwarded <= 0) {
      continue;
    }

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

export type CountryLeaderboardRow = {
  countryCode: string;
  countryName: string;
  flag: string;
  continent: string;
  points: number;
  playersCount: number;
  victorsCount: number;
  topPlayerName: string;
  topPlayerHandle: string;
  topPlayerPoints: number;
};

export function calculateCountryLeaderboard(
  playerRows: LeaderboardRow[],
  playerCountries: Map<string, { countryCode: string; countryName: string; flag: string; continent: string }>,
): CountryLeaderboardRow[] {
  const countryMap = new Map<
    string,
    {
      countryCode: string;
      countryName: string;
      flag: string;
      continent: string;
      points: number;
      players: LeaderboardRow[];
    }
  >();

  for (const player of playerRows) {
    const meta = playerCountries.get(player.playerId);
    if (!meta || !meta.countryCode) continue;

    const existing = countryMap.get(meta.countryCode) ?? {
      countryCode: meta.countryCode,
      countryName: meta.countryName,
      flag: meta.flag,
      continent: meta.continent,
      points: 0,
      players: [],
    };

    existing.points += player.points;
    existing.players.push(player);
    countryMap.set(meta.countryCode, existing);
  }

  return Array.from(countryMap.values())
    .map((c) => {
      const sortedPlayers = [...c.players].sort((a, b) => b.points - a.points);
      const topPlayer = sortedPlayers[0];
      return {
        countryCode: c.countryCode,
        countryName: c.countryName,
        flag: c.flag,
        continent: c.continent,
        points: c.points,
        playersCount: c.players.length,
        victorsCount: c.players.filter((p) => p.points > 0).length,
        topPlayerName: topPlayer?.displayName || "N/A",
        topPlayerHandle: topPlayer?.playerName || "N/A",
        topPlayerPoints: topPlayer?.points || 0,
      };
    })
    .sort((a, b) => b.points - a.points || b.playersCount - a.playersCount);
}

export type CreatorLeaderboardRow = {
  creatorName: string;
  creatorHandle?: string;
  createdCount: number;
  publishedCount: number;
  verifiedCount: number;
  totalCreatorPoints: number;
  highestLevel?: {
    name: string;
    rank: number | null;
    slug: string;
  };
};

export function calculateCreatorLeaderboard(
  levels: Array<{
    name: string;
    slug: string;
    rank: number | null;
    status: ScoredLevelStatus;
    nerfCreator: string;
    publisher?: string | null;
    verifier?: string | null;
  }>,
): CreatorLeaderboardRow[] {
  const creatorMap = new Map<
    string,
    {
      name: string;
      createdCount: number;
      publishedCount: number;
      verifiedCount: number;
      points: number;
      bestRank: number;
      bestLevel?: { name: string; rank: number | null; slug: string };
    }
  >();

  const getOrCreate = (name: string) => {
    const clean = name.trim();
    if (!creatorMap.has(clean)) {
      creatorMap.set(clean, {
        name: clean,
        createdCount: 0,
        publishedCount: 0,
        verifiedCount: 0,
        points: 0,
        bestRank: 9999,
      });
    }
    return creatorMap.get(clean)!;
  };

  for (const lvl of levels) {
    if (lvl.status !== "RANKED" && lvl.status !== "LEGACY") continue;
    const pts = calculateLevelPoints(lvl.rank, lvl.status);

    if (lvl.nerfCreator && lvl.nerfCreator !== "N/A") {
      const c = getOrCreate(lvl.nerfCreator);
      c.createdCount++;
      c.points += pts;
      if (lvl.rank && lvl.rank < c.bestRank) {
        c.bestRank = lvl.rank;
        c.bestLevel = { name: lvl.name, rank: lvl.rank, slug: lvl.slug };
      }
    }

    if (lvl.publisher && lvl.publisher !== "N/A" && lvl.publisher !== lvl.nerfCreator) {
      const p = getOrCreate(lvl.publisher);
      p.publishedCount++;
    }

    if (lvl.verifier && lvl.verifier !== "N/A") {
      const v = getOrCreate(lvl.verifier);
      v.verifiedCount++;
    }
  }

  return Array.from(creatorMap.values())
    .map((c) => ({
      creatorName: c.name,
      createdCount: c.createdCount,
      publishedCount: c.publishedCount,
      verifiedCount: c.verifiedCount,
      totalCreatorPoints: c.points,
      highestLevel: c.bestLevel,
    }))
    .sort((a, b) => b.totalCreatorPoints - a.totalCreatorPoints || b.createdCount - a.createdCount);
}
