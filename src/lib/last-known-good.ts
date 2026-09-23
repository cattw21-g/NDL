import { FALLBACK_RANKED_LEVELS, type FallbackLevel } from "./fallback-levels";

// Module-level cache storing the last successfully fetched real database levels
let lastKnownGoodSnapshot: FallbackLevel[] | null = null;
let lastHealthyTimestamp: Date | null = null;

export function recordHealthyLevelSnapshot(
  levels: Array<{
    id?: string;
    slug: string;
    rank: number | null;
    name: string;
    originalName: string;
    gdLevelId?: string;
    publisher: string;
    nerfCreator: string;
    verifier: string;
    thumbnailUrl: string;
    showcaseUrl?: string;
    status: string;
    difficulty: string;
    points: number;
    description?: string;
    _count?: { records: number };
  }>,
) {
  if (Array.isArray(levels) && levels.length > 0) {
    lastKnownGoodSnapshot = levels.map((lvl) => ({
      id: lvl.id ?? lvl.slug,
      slug: lvl.slug,
      rank: lvl.rank ?? 999,
      name: lvl.name,
      originalName: lvl.originalName,
      gdLevelId: lvl.gdLevelId ?? "",
      publisher: lvl.publisher,
      nerfCreator: lvl.nerfCreator,
      verifier: lvl.verifier,
      thumbnailUrl: lvl.thumbnailUrl,
      showcaseUrl: lvl.showcaseUrl ?? "",
      status: (lvl.status === "LEGACY" ? "LEGACY" : "RANKED") as "RANKED" | "LEGACY",
      difficulty: lvl.difficulty,
      points: lvl.points,
      description: lvl.description ?? "",
      recordCount: lvl._count?.records ?? 0,
    }));
    lastHealthyTimestamp = new Date();
  }
}

export function getLastKnownGoodLevels(): {
  levels: FallbackLevel[];
  source: "live-cache" | "seed-fallback";
  lastHealthyAt: Date | null;
} {
  if (lastKnownGoodSnapshot && lastKnownGoodSnapshot.length > 0) {
    return {
      levels: lastKnownGoodSnapshot,
      source: "live-cache",
      lastHealthyAt: lastHealthyTimestamp,
    };
  }

  return {
    levels: FALLBACK_RANKED_LEVELS,
    source: "seed-fallback",
    lastHealthyAt: null,
  };
}
