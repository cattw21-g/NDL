import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { FALLBACK_RANKED_LEVELS, type FallbackLevel } from "./fallback-levels";
import { logger } from "./logger";

export const SNAPSHOT_SCHEMA_VERSION = 1;

export type DurableSnapshotMetadata = {
  schemaVersion: number;
  generatedAt: string;
  lastHealthyAt: string;
  levelCount: number;
  contentHash: string;
  source: "live-cache" | "ephemeral-tmp" | "local-dev-file" | "durable-blob" | "seed-fallback";
};

export type DurableDemonlistSnapshot = {
  metadata: DurableSnapshotMetadata;
  levels: FallbackLevel[];
};

// Tier 1: In-process memory cache (0ms, ephemeral to the process)
let memorySnapshot: FallbackLevel[] | null = null;
let memoryHealthyTimestamp: Date | null = null;
let memoryGeneratedAt: Date | null = null;
let memoryContentHash: string | null = null;

// Track latest saved hash to prevent redundant uploads when list content has not changed
let lastSyncedContentHash: string | null = null;

/**
 * Resolves the appropriate local scratch path.
 * In Vercel serverless functions, the root filesystem is read-only; only os.tmpdir() (/tmp) is writable.
 * NOTE: /tmp is ephemeral per-instance scratch, NOT durable cross-instance storage.
 */
function getLocalScratchLocation(): { dir: string; file: string; isEphemeralTmp: boolean } {
  if (process.env.VERCEL) {
    return {
      dir: os.tmpdir(),
      file: path.join(os.tmpdir(), "ndl-snapshot-cache.json"),
      isEphemeralTmp: true,
    };
  }
  const dir = path.join(process.cwd(), ".data");
  return {
    dir,
    file: path.join(dir, "demonlist-snapshot.json"),
    isEphemeralTmp: false,
  };
}

/**
 * Computes a stable content hash for a level list to detect genuine ranking/level changes.
 */
export function computeDemonlistContentHash(levels: FallbackLevel[]): string {
  const data = levels
    .map((l) => `${l.id}:${l.rank}:${l.points}:${l.status}:${l.recordCount}`)
    .join("|");
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Validates a candidate level array to prevent corrupt or partial data
 * from contaminating snapshots.
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
 * Atomically writes the snapshot to the local scratch path.
 * Local /tmp or .data is an ephemeral cache optimization, not cross-instance durability.
 */
function writeLocalScratchSnapshot(snapshot: DurableDemonlistSnapshot): boolean {
  try {
    const { dir, file } = getLocalScratchLocation();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempFile = `${file}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(snapshot, null, 2), "utf8");
    fs.renameSync(tempFile, file);
    return true;
  } catch (err) {
    logger.warn("LastKnownGood", "Failed to write local scratch snapshot", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/**
 * Reads and validates the snapshot from the local scratch path.
 */
function readLocalScratchSnapshot(): DurableDemonlistSnapshot | null {
  try {
    const { file } = getLocalScratchLocation();
    if (!fs.existsSync(file)) {
      return null;
    }
    const content = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(content) as DurableDemonlistSnapshot;

    if (!parsed || typeof parsed !== "object" || !parsed.metadata) {
      return null;
    }

    if (parsed.metadata.schemaVersion !== SNAPSHOT_SCHEMA_VERSION) {
      logger.warn("LastKnownGood", "Ignoring snapshot with incompatible schema version", {
        found: parsed.metadata.schemaVersion,
        expected: SNAPSHOT_SCHEMA_VERSION,
      });
      return null;
    }

    if (!isValidLevelsData(parsed.levels)) {
      logger.warn("LastKnownGood", "Ignoring corrupt snapshot with invalid level entries");
      return null;
    }

    return parsed;
  } catch (err) {
    logger.warn("LastKnownGood", "Failed to read local scratch snapshot", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Persists snapshot to Vercel Blob (Durable Tier 3).
 * Enforces:
 * 1. Content-hash change detection (skips upload if identical)
 * 2. Stale instance overwrite protection (ensures monotonic timestamps)
 */
export async function syncSnapshotToDurableBlob(
  snapshot: DurableDemonlistSnapshot,
): Promise<{ success: boolean; skippedReason?: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token && !process.env.VERCEL) {
    return { success: false, skippedReason: "no_blob_configured" };
  }

  // Content-hash change detection: don't write identical data repeatedly
  if (lastSyncedContentHash === snapshot.metadata.contentHash) {
    return { success: true, skippedReason: "content_unchanged" };
  }

  try {
    const blobModule = await import("@vercel/blob");
    const blobKey = "snapshots/demonlist-latest.json";

    // Stale instance overwrite protection: inspect existing blob metadata if accessible
    try {
      const existingHead = await blobModule.head(blobKey, token ? { token } : undefined);
      if (existingHead) {
        // Read existing snapshot directly from origin (useCache: false) to prevent stale CDN reads
        const res = await fetch(existingHead.url, { cache: "no-store" });
        if (res.ok) {
          const existing = (await res.json()) as DurableDemonlistSnapshot;
          if (
            existing?.metadata?.generatedAt &&
            new Date(existing.metadata.generatedAt).getTime() >=
              new Date(snapshot.metadata.generatedAt).getTime()
          ) {
            logger.info("LastKnownGood", "Skipped Blob write: existing snapshot is newer or identical", {
              existingTime: existing.metadata.generatedAt,
              candidateTime: snapshot.metadata.generatedAt,
            });
            return { success: true, skippedReason: "stale_instance_prevented" };
          }
        }
      }
    } catch {
      // head check failed (e.g. object doesn't exist yet); proceed to put
    }

    // Atomic upload to latest pointer
    await blobModule.put(blobKey, JSON.stringify(snapshot, null, 2), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
      ...(token ? { token } : {}),
    });

    lastSyncedContentHash = snapshot.metadata.contentHash;
    logger.info("LastKnownGood", "Successfully published durable Demonlist snapshot to Vercel Blob", {
      levelCount: snapshot.levels.length,
      contentHash: snapshot.metadata.contentHash,
      generatedAt: snapshot.metadata.generatedAt,
    });

    return { success: true };
  } catch (err) {
    logger.warn("LastKnownGood", "Failed to sync snapshot to Vercel Blob", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, skippedReason: "upload_failed" };
  }
}

/**
 * Attempts to read durable snapshot from Vercel Blob during an outage or fresh cold start.
 */
async function fetchDurableBlobSnapshot(): Promise<DurableDemonlistSnapshot | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token && !process.env.VERCEL) {
    return null;
  }

  try {
    const blobModule = await import("@vercel/blob");
    const headResult = await blobModule.head("snapshots/demonlist-latest.json", token ? { token } : undefined);
    if (!headResult?.url) {
      return null;
    }

    // Fetch directly from origin without CDN caching for maximum consistency during an outage
    const res = await fetch(headResult.url, { cache: "no-store" });
    if (!res.ok) {
      return null;
    }

    const parsed = (await res.json()) as DurableDemonlistSnapshot;
    if (
      parsed?.metadata?.schemaVersion === SNAPSHOT_SCHEMA_VERSION &&
      isValidLevelsData(parsed.levels)
    ) {
      return parsed;
    }
    return null;
  } catch (err) {
    logger.warn("LastKnownGood", "Failed to fetch durable snapshot from Vercel Blob", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Records a healthy live database query snapshot.
 * 1. Updates Tier 1 (In-process memory)
 * 2. Writes Tier 2 (Local scratch /tmp or .data)
 * 3. Returns the snapshot task so callers can await it or pass it to Next.js `after()`.
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
): { snapshot: DurableDemonlistSnapshot | null; persistTask: Promise<void> } {
  if (!Array.isArray(levels) || levels.length === 0) {
    return { snapshot: null, persistTask: Promise.resolve() };
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
    return { snapshot: null, persistTask: Promise.resolve() };
  }

  const now = new Date();
  const contentHash = computeDemonlistContentHash(mappedLevels);

  // Update Tier 1 Memory Cache
  memorySnapshot = mappedLevels;
  memoryHealthyTimestamp = now;
  memoryGeneratedAt = now;
  memoryContentHash = contentHash;

  const { isEphemeralTmp } = getLocalScratchLocation();
  const snapshot: DurableDemonlistSnapshot = {
    metadata: {
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      generatedAt: now.toISOString(),
      lastHealthyAt: now.toISOString(),
      levelCount: mappedLevels.length,
      contentHash,
      source: isEphemeralTmp ? "ephemeral-tmp" : "local-dev-file",
    },
    levels: mappedLevels,
  };

  // Update Tier 2 Local Scratch
  writeLocalScratchSnapshot(snapshot);

  // Return background task for Tier 3 Blob sync (can be passed to Next.js `after()`)
  const persistTask = (async () => {
    await syncSnapshotToDurableBlob(snapshot).catch(() => {});
  })();

  return { snapshot, persistTask };
}

/**
 * Retrieves the best available Demonlist levels across all tiers:
 * Tier 1: In-process memory (0ms, ephemeral)
 * Tier 2: Local scratch cache (/tmp or .data, ephemeral)
 * Tier 3: Static seed fallback (emergency cold boot)
 */
export function getLastKnownGoodLevels(): {
  levels: FallbackLevel[];
  source: "live-cache" | "ephemeral-tmp" | "local-dev-file" | "seed-fallback";
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

  // Tier 2: Local scratch cache
  const scratchSnapshot = readLocalScratchSnapshot();
  if (scratchSnapshot && scratchSnapshot.levels.length > 0) {
    memorySnapshot = scratchSnapshot.levels;
    memoryHealthyTimestamp = new Date(scratchSnapshot.metadata.lastHealthyAt);
    memoryGeneratedAt = new Date(scratchSnapshot.metadata.generatedAt);
    memoryContentHash = scratchSnapshot.metadata.contentHash;

    const { isEphemeralTmp } = getLocalScratchLocation();
    return {
      levels: scratchSnapshot.levels,
      source: isEphemeralTmp ? "ephemeral-tmp" : "local-dev-file",
      lastHealthyAt: memoryHealthyTimestamp,
      generatedAt: memoryGeneratedAt,
      schemaVersion: scratchSnapshot.metadata.schemaVersion,
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
 * Async version that checks Tier 1 (Memory) -> Tier 2 (Scratch) -> Tier 3 (Durable Blob) -> Tier 4 (Seed).
 * Used during serverless cold starts when the database is offline.
 */
export async function getDurableLastKnownGoodLevelsAsync(): Promise<{
  levels: FallbackLevel[];
  source: "live-cache" | "ephemeral-tmp" | "local-dev-file" | "durable-blob" | "seed-fallback";
  lastHealthyAt: Date | null;
  generatedAt: Date | null;
  schemaVersion: number;
}> {
  const syncResult = getLastKnownGoodLevels();
  if (syncResult.source === "live-cache" || syncResult.source === "ephemeral-tmp" || syncResult.source === "local-dev-file") {
    return syncResult;
  }

  // Check Tier 3: Vercel Blob
  const blobSnapshot = await fetchDurableBlobSnapshot();
  if (blobSnapshot && blobSnapshot.levels.length > 0) {
    memorySnapshot = blobSnapshot.levels;
    memoryHealthyTimestamp = new Date(blobSnapshot.metadata.lastHealthyAt);
    memoryGeneratedAt = new Date(blobSnapshot.metadata.generatedAt);
    memoryContentHash = blobSnapshot.metadata.contentHash;

    // Cache locally to ephemeral scratch for future calls in this instance
    writeLocalScratchSnapshot(blobSnapshot);

    return {
      levels: blobSnapshot.levels,
      source: "durable-blob",
      lastHealthyAt: memoryHealthyTimestamp,
      generatedAt: memoryGeneratedAt,
      schemaVersion: blobSnapshot.metadata.schemaVersion,
    };
  }

  // Tier 4: Emergency seed fallback
  return {
    levels: FALLBACK_RANKED_LEVELS,
    source: "seed-fallback",
    lastHealthyAt: null,
    generatedAt: null,
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
  };
}

/**
 * Test utility to reset in-process memory and delete scratch snapshots during tests.
 */
export function clearSnapshotCachesForTest() {
  memorySnapshot = null;
  memoryHealthyTimestamp = null;
  memoryGeneratedAt = null;
  memoryContentHash = null;
  lastSyncedContentHash = null;

  try {
    const { file } = getLocalScratchLocation();
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  } catch {
    // ignore
  }
}

export function getLastKnownGoodContentHash(): string | null {
  return memoryContentHash;
}

export function getSnapshotOutageNotice(lastHealthyAt: Date | null | undefined): {
  ageText: string;
  isVeryStale: boolean;
} {
  if (!lastHealthyAt) return { ageText: "", isVeryStale: false };
  const diffMs = Date.now() - lastHealthyAt.getTime();
  const ageHours = diffMs > 0 ? diffMs / (1000 * 60 * 60) : 0;
  const isVeryStale = ageHours > 168; // > 7 days
  const ageText =
    ageHours < 24
      ? ` from ${lastHealthyAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : ` from ${lastHealthyAt.toLocaleDateString([], { month: "short", day: "numeric" })}`;
  return { ageText, isVeryStale };
}

