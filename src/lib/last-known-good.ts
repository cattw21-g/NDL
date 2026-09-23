import fs from "node:fs";
import path from "node:path";
import { FALLBACK_RANKED_LEVELS, type FallbackLevel } from "./fallback-levels";

export const SNAPSHOT_SCHEMA_VERSION = 1;

export type DurableSnapshotMetadata = {
  schemaVersion: number;
  generatedAt: string;
  lastHealthyAt: string;
  levelCount: number;
  source: "live-cache" | "durable-disk" | "durable-blob" | "seed-fallback";
};

export type DurableDemonlistSnapshot = {
  metadata: DurableSnapshotMetadata;
  levels: FallbackLevel[];
};

// In-process Level 1 cache
let memorySnapshot: FallbackLevel[] | null = null;
let memoryHealthyTimestamp: Date | null = null;
let memoryGeneratedAt: Date | null = null;

const SNAPSHOT_DIR = path.join(process.cwd(), ".data");
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, "demonlist-snapshot.json");

/**
 * Validates a candidate level array to prevent corrupt or partial data
 * from contaminating the durable snapshot.
 */
function isValidLevelsData(levels: unknown): levels is FallbackLevel[] {
  if (!Array.isArray(levels) || levels.length === 0) {
    return false;
  }

  for (const item of levels) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.slug !== "string" ||
      !item.slug ||
      typeof item.name !== "string" ||
      !item.name
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Atomically writes the snapshot to the persistent local filesystem.
 */
function writeLocalDurableSnapshot(snapshot: DurableDemonlistSnapshot): boolean {
  try {
    if (!fs.existsSync(SNAPSHOT_DIR)) {
      fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    }
    const tempFile = `${SNAPSHOT_FILE}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(snapshot, null, 2), "utf8");
    fs.renameSync(tempFile, SNAPSHOT_FILE);
    return true;
  } catch (err) {
    console.warn("[LastKnownGood] Failed to write local durable snapshot:", err);
    return false;
  }
}

/**
 * Reads and validates the snapshot from the local filesystem.
 */
function readLocalDurableSnapshot(): DurableDemonlistSnapshot | null {
  try {
    if (!fs.existsSync(SNAPSHOT_FILE)) {
      return null;
    }
    const content = fs.readFileSync(SNAPSHOT_FILE, "utf8");
    const parsed = JSON.parse(content) as DurableDemonlistSnapshot;

    if (!parsed || typeof parsed !== "object" || !parsed.metadata) {
      return null;
    }

    if (parsed.metadata.schemaVersion !== SNAPSHOT_SCHEMA_VERSION) {
      console.warn(
        `[LastKnownGood] Ignoring snapshot with incompatible schema version: ${parsed.metadata.schemaVersion} (expected ${SNAPSHOT_SCHEMA_VERSION})`,
      );
      return null;
    }

    if (!isValidLevelsData(parsed.levels)) {
      console.warn("[LastKnownGood] Ignoring corrupt snapshot with invalid level entries.");
      return null;
    }

    return parsed;
  } catch (err) {
    console.warn("[LastKnownGood] Failed to read local durable snapshot:", err);
    return null;
  }
}

/**
 * Records a healthy live database query snapshot.
 * Writes to Tier 1 (Memory) and Tier 2 (Durable File / Blob).
 */
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
): boolean {
  if (!Array.isArray(levels) || levels.length === 0) {
    return false;
  }

  const mappedLevels: FallbackLevel[] = levels.map((lvl) => ({
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

  if (!isValidLevelsData(mappedLevels)) {
    return false;
  }

  const now = new Date();
  memorySnapshot = mappedLevels;
  memoryHealthyTimestamp = now;
  memoryGeneratedAt = now;

  const snapshot: DurableDemonlistSnapshot = {
    metadata: {
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      generatedAt: now.toISOString(),
      lastHealthyAt: now.toISOString(),
      levelCount: mappedLevels.length,
      source: "live-cache",
    },
    levels: mappedLevels,
  };

  writeLocalDurableSnapshot(snapshot);

  // Optional background Vercel Blob sync if configured
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    void import("@vercel/blob")
      .then(async ({ put }) => {
        await put("snapshots/demonlist-latest.json", JSON.stringify(snapshot), {
          access: "public",
          addRandomSuffix: false,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
      })
      .catch((err) => {
        console.warn("[LastKnownGood] Background Vercel Blob snapshot sync skipped:", err);
      });
  }

  return true;
}

/**
 * Retrieves the best available Demonlist levels across all 3 tiers:
 * Tier 1: In-process memory (0ms)
 * Tier 2: Persistent local file snapshot
 * Tier 3: Static seed fallback
 */
export function getLastKnownGoodLevels(): {
  levels: FallbackLevel[];
  source: "live-cache" | "durable-disk" | "seed-fallback";
  lastHealthyAt: Date | null;
  generatedAt: Date | null;
  schemaVersion: number;
} {
  // Tier 1: In-memory cache
  if (memorySnapshot && memorySnapshot.length > 0) {
    return {
      levels: memorySnapshot,
      source: "live-cache",
      lastHealthyAt: memoryHealthyTimestamp,
      generatedAt: memoryGeneratedAt,
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    };
  }

  // Tier 2: Persistent disk snapshot
  const diskSnapshot = readLocalDurableSnapshot();
  if (diskSnapshot && diskSnapshot.levels.length > 0) {
    memorySnapshot = diskSnapshot.levels;
    memoryHealthyTimestamp = new Date(diskSnapshot.metadata.lastHealthyAt);
    memoryGeneratedAt = new Date(diskSnapshot.metadata.generatedAt);

    return {
      levels: diskSnapshot.levels,
      source: "durable-disk",
      lastHealthyAt: memoryHealthyTimestamp,
      generatedAt: memoryGeneratedAt,
      schemaVersion: diskSnapshot.metadata.schemaVersion,
    };
  }

  // Tier 3: Static seed fallback
  return {
    levels: FALLBACK_RANKED_LEVELS,
    source: "seed-fallback",
    lastHealthyAt: null,
    generatedAt: null,
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
  };
}

/**
 * Test utility to reset in-process memory and delete disk snapshots during tests.
 */
export function clearSnapshotCachesForTest() {
  memorySnapshot = null;
  memoryHealthyTimestamp = null;
  memoryGeneratedAt = null;
  try {
    if (fs.existsSync(SNAPSHOT_FILE)) {
      fs.unlinkSync(SNAPSHOT_FILE);
    }
  } catch {
    // ignore
  }
}
