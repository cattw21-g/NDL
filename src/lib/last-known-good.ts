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
 * Deterministically canonicalizes any JSON-serializable value by sorting object keys recursively.
 * Ensures consistent serialization regardless of key insertion order.
 */
export function canonicalizeJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalizeJson(item)).join(",")}]`;
  }

  const obj = value as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();
  const entries = sortedKeys.map((key) => `${JSON.stringify(key)}:${canonicalizeJson(obj[key])}`);
  return `{${entries.join(",")}}`;
}

/**
 * Computes a stable, canonical content hash for the complete public Demonlist snapshot.
 * Normalizes all 16 restored public level fields and excludes volatile timestamps (generatedAt, lastHealthyAt).
 */
export function computeDemonlistContentHash(
  input: FallbackLevel[] | { levels: FallbackLevel[]; metadata?: Record<string, unknown> },
): string {
  const levels = Array.isArray(input) ? input : input.levels;

  const normalizedLevels = levels.map((lvl) => ({
    description: String(lvl.description ?? ""),
    difficulty: String(lvl.difficulty ?? "EXTREME"),
    gdLevelId: String(lvl.gdLevelId ?? ""),
    id: String(lvl.id ?? ""),
    name: String(lvl.name ?? ""),
    nerfCreator: String(lvl.nerfCreator ?? ""),
    originalName: String(lvl.originalName ?? ""),
    points: Number(lvl.points ?? 0),
    publisher: String(lvl.publisher ?? ""),
    rank: Number(lvl.rank ?? 0),
    recordCount: Number(lvl.recordCount ?? 0),
    showcaseUrl: String(lvl.showcaseUrl ?? ""),
    slug: String(lvl.slug ?? ""),
    status: String(lvl.status ?? "RANKED"),
    thumbnailUrl: String(lvl.thumbnailUrl ?? ""),
    verifier: String(lvl.verifier ?? ""),
  }));

  const canonicalString = canonicalizeJson(normalizedLevels);
  return crypto.createHash("sha256").update(canonicalString).digest("hex");
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

export function getBlobAuthMode(): "OIDC" | "legacy token" | "unavailable" {
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return "legacy token";
  }
  if (process.env.VERCEL || process.env.BLOB_STORE_ID || process.env.VERCEL_OIDC_TOKEN) {
    return "OIDC";
  }
  return "unavailable";
}

export function getBlobAuthOptions(): {
  token?: string;
} {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (token) {
    return { token };
  }
  // Modern Vercel OIDC: SDK automatically resolves store credentials
  return {};
}

/**
 * Persists snapshot to Vercel Blob (Durable Tier 3).
 * Enforces:
 * 1. Content-hash change detection (skips upload if identical)
 * 2. Atomic Compare-And-Swap (CAS) with ifMatch (ETag validation)
 * 3. Monotonic generatedAt timestamp ordering (stale worker can never overwrite newer snapshot)
 */
export async function syncSnapshotToDurableBlob(
  snapshot: DurableDemonlistSnapshot,
  maxRetries = 3,
): Promise<{ success: boolean; skippedReason?: string }> {
  const authMode = getBlobAuthMode();
  if (authMode === "unavailable" && !process.env.VERCEL) {
    return { success: false, skippedReason: "no_blob_configured" };
  }

  // Content-hash change detection: don't write identical data repeatedly
  if (lastSyncedContentHash === snapshot.metadata.contentHash) {
    return { success: true, skippedReason: "content_unchanged" };
  }

  const candidateTime = new Date(snapshot.metadata.generatedAt).getTime();
  const authOptions = getBlobAuthOptions();
  const blobKey = "snapshots/demonlist-latest.json";

  try {
    const blobModule = await import("@vercel/blob");

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let currentEtag: string | undefined = undefined;

      try {
        // Strongly consistent latest-snapshot read using @vercel/blob private storage mechanism
        const existingGet = await blobModule.get(blobKey, {
          access: "private",
          useCache: false,
          ...authOptions,
        });

        if (existingGet && existingGet.statusCode === 200 && existingGet.stream) {
          currentEtag = existingGet.blob.etag;
          const text = await new Response(existingGet.stream).text();
          const existing = JSON.parse(text) as DurableDemonlistSnapshot;
          const existingTime = existing?.metadata?.generatedAt
            ? new Date(existing.metadata.generatedAt).getTime()
            : 0;

          if (existingTime >= candidateTime) {
            logger.info("LastKnownGood", "Skipped Blob write: existing snapshot is newer or identical", {
              existingTime: existing.metadata.generatedAt,
              candidateTime: snapshot.metadata.generatedAt,
            });
            return { success: false, skippedReason: "stale_snapshot" };
          }

          if (existing?.metadata?.contentHash === snapshot.metadata.contentHash) {
            lastSyncedContentHash = snapshot.metadata.contentHash;
            return { success: true, skippedReason: "content_unchanged" };
          }
        }
      } catch {
        // Blob does not exist yet (404); proceed with initial creation (no ifMatch)
        currentEtag = undefined;
      }

      try {
        // Atomic conditional write with ifMatch (ETag compare-and-swap)
        await blobModule.put(blobKey, JSON.stringify(snapshot, null, 2), {
          access: "private",
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: "application/json",
          ...(currentEtag ? { ifMatch: currentEtag } : {}),
          ...authOptions,
        });

        lastSyncedContentHash = snapshot.metadata.contentHash;
        logger.info("LastKnownGood", "Successfully published durable Demonlist snapshot to Vercel Blob", {
          levelCount: snapshot.levels.length,
          contentHash: snapshot.metadata.contentHash,
          generatedAt: snapshot.metadata.generatedAt,
        });

        return { success: true };
      } catch (putErr: unknown) {
        // Check if error is BlobPreconditionFailedError (status 412 / ETag mismatch)
        const isPreconditionFailed =
          (putErr instanceof Error &&
            (putErr.name === "BlobPreconditionFailedError" ||
              putErr.message.includes("precondition") ||
              putErr.message.includes("412"))) ||
          (typeof putErr === "object" &&
            putErr !== null &&
            "status" in putErr &&
            (putErr as { status?: unknown }).status === 412);

        if (isPreconditionFailed && attempt < maxRetries - 1) {
          logger.warn("LastKnownGood", "Blob CAS conflict detected, retrying with newest head snapshot", {
            attempt: attempt + 1,
          });
          continue; // Re-read head in next iteration
        }

        throw putErr;
      }
    }

    return { success: false, skippedReason: "cas_retry_exhausted" };
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
  const authMode = getBlobAuthMode();
  if (authMode === "unavailable" && !process.env.VERCEL) {
    return null;
  }

  const authOptions = getBlobAuthOptions();
  const blobKey = "snapshots/demonlist-latest.json";

  try {
    const blobModule = await import("@vercel/blob");
    // Strongly consistent private read from origin without CDN cache
    const getResult = await blobModule.get(blobKey, {
      access: "private",
      useCache: false,
      ...authOptions,
    });

    if (!getResult || getResult.statusCode !== 200 || !getResult.stream) {
      return null;
    }

    const text = await new Response(getResult.stream).text();
    const parsed = JSON.parse(text) as DurableDemonlistSnapshot;
    if (
      parsed?.metadata?.schemaVersion === SNAPSHOT_SCHEMA_VERSION &&
      isValidLevelsData(parsed.levels)
    ) {
      logger.info(
        "LastKnownGood",
        "Successfully retrieved durable Demonlist snapshot from Vercel Blob via consistent private read",
        {
          levelCount: parsed.levels.length,
          generatedAt: parsed.metadata.generatedAt,
          etag: getResult.blob.etag,
        },
      );
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
    try {
      await syncSnapshotToDurableBlob(snapshot);
    } catch (err) {
      logger.warn("LastKnownGood", "Snapshot persistence background task caught error", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
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

