import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  canonicalizeJson,
  clearSnapshotCachesForTest,
  computeDemonlistContentHash,
  type DurableDemonlistSnapshot,
  getBlobAuthMode,
  getDurableLastKnownGoodLevelsAsync,
  getLastKnownGoodLevels,
  recordHealthyLevelSnapshot,
  SNAPSHOT_SCHEMA_VERSION,
  syncSnapshotToDurableBlob,
} from "../lib/last-known-good";
import { FALLBACK_RANKED_LEVELS, type FallbackLevel } from "../lib/fallback-levels";

const SNAPSHOT_DIR = path.join(process.cwd(), ".data");
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, "demonlist-snapshot.json");

function createSampleLevel(overrides: Partial<FallbackLevel> = {}): FallbackLevel {
  return {
    id: "lvl-1",
    slug: "sample-demon",
    rank: 1,
    name: "Sample Demon",
    originalName: "Original Demon",
    gdLevelId: "123456",
    publisher: "HostPlayer",
    nerfCreator: "NerfAuthor",
    verifier: "ProofVerifier",
    thumbnailUrl: "/thumbnails/sample.webp",
    showcaseUrl: "https://youtube.com/watch?v=sample",
    status: "RANKED",
    difficulty: "EXTREME",
    points: 1000,
    description: "Sample test description",
    recordCount: 5,
    ...overrides,
  };
}

describe("Durable Last-Known-Good Snapshot System", () => {
  beforeEach(() => {
    clearSnapshotCachesForTest();
  });

  afterEach(() => {
    clearSnapshotCachesForTest();
    vi.restoreAllMocks();
  });

  it("serves static seed fallback on fresh cold start when no durable snapshot exists", () => {
    const result = getLastKnownGoodLevels();

    expect(result.source).toBe("seed-fallback");
    expect(result.levels.length).toBe(FALLBACK_RANKED_LEVELS.length);
    expect(result.lastHealthyAt).toBeNull();
    expect(result.schemaVersion).toBe(SNAPSHOT_SCHEMA_VERSION);
  });

  it("records a healthy level snapshot into memory and durable disk cache", () => {
    const mockLevels = [createSampleLevel({ name: "Mock Demon 1" })];

    const { snapshot, persistTask } = recordHealthyLevelSnapshot(mockLevels);
    expect(snapshot).not.toBeNull();
    expect(persistTask).toBeInstanceOf(Promise);

    // Verify in-process memory cache (Tier 1)
    const memResult = getLastKnownGoodLevels();
    expect(memResult.source).toBe("live-cache");
    expect(memResult.levels).toHaveLength(1);
    expect(memResult.levels[0].name).toBe("Mock Demon 1");
    expect(memResult.lastHealthyAt).toBeInstanceOf(Date);

    // Verify persistent local file was written (Tier 2)
    expect(fs.existsSync(SNAPSHOT_FILE)).toBe(true);
    const diskContent = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf8"));
    expect(diskContent.metadata.schemaVersion).toBe(SNAPSHOT_SCHEMA_VERSION);
    expect(diskContent.metadata.levelCount).toBe(1);
    expect(diskContent.levels[0].name).toBe("Mock Demon 1");
  });

  it("survives a cold start during a database outage by loading from durable disk cache", () => {
    const mockLevels = [createSampleLevel({ name: "Survivor Demon" })];

    // Populate and persist
    recordHealthyLevelSnapshot(mockLevels);

    // Simulate process cold start: clear in-process memory while leaving disk file intact
    const originalClear = clearSnapshotCachesForTest;
    try {
      const diskContent = fs.readFileSync(SNAPSHOT_FILE, "utf8");
      originalClear();
      fs.writeFileSync(SNAPSHOT_FILE, diskContent, "utf8");

      const coldStartResult = getLastKnownGoodLevels();
      expect(coldStartResult.source).toMatch(/local-dev-file|ephemeral-tmp/);
      expect(coldStartResult.levels).toHaveLength(1);
      expect(coldStartResult.levels[0].name).toBe("Survivor Demon");
      expect(coldStartResult.lastHealthyAt).toBeInstanceOf(Date);
      expect(coldStartResult.schemaVersion).toBe(SNAPSHOT_SCHEMA_VERSION);
    } finally {
      clearSnapshotCachesForTest();
    }
  });

  it("rejects invalid, empty, or partial data to prevent corrupting durable snapshots", () => {
    // 1. Rejects empty array
    const emptyRes = recordHealthyLevelSnapshot([]);
    expect(emptyRes.snapshot).toBeNull();

    // 2. Rejects malformed objects
    const invalidRes = recordHealthyLevelSnapshot([
      {
        slug: "",
        name: "",
        rank: null,
        originalName: "",
        publisher: "",
        nerfCreator: "",
        verifier: "",
        thumbnailUrl: "",
        status: "RANKED",
        difficulty: "EXTREME",
        points: 100,
      },
    ]);
    expect(invalidRes.snapshot).toBeNull();

    // Snapshot file must not be created
    expect(fs.existsSync(SNAPSHOT_FILE)).toBe(false);
  });

  describe("Canonical Full-Payload Content Hash Tests (A through H)", () => {
    it("A. identical list -> identical hash", () => {
      const listA = [createSampleLevel()];
      const listB = [createSampleLevel()];
      expect(computeDemonlistContentHash(listA)).toBe(computeDemonlistContentHash(listB));
    });

    it("B. rank change -> hash changes", () => {
      const base = [createSampleLevel({ rank: 1 })];
      const changed = [createSampleLevel({ rank: 2 })];
      expect(computeDemonlistContentHash(base)).not.toBe(computeDemonlistContentHash(changed));
    });

    it("C. points change -> hash changes", () => {
      const base = [createSampleLevel({ points: 1000 })];
      const changed = [createSampleLevel({ points: 950 })];
      expect(computeDemonlistContentHash(base)).not.toBe(computeDemonlistContentHash(changed));
    });

    it("D. level name change -> hash changes", () => {
      const base = [createSampleLevel({ name: "Acheron Nerfed" })];
      const changed = [createSampleLevel({ name: "Acheron ULDM" })];
      expect(computeDemonlistContentHash(base)).not.toBe(computeDemonlistContentHash(changed));
    });

    it("E. thumbnail change -> hash changes", () => {
      const base = [createSampleLevel({ thumbnailUrl: "/thumbnails/v1.webp" })];
      const changed = [createSampleLevel({ thumbnailUrl: "/thumbnails/v2.webp" })];
      expect(computeDemonlistContentHash(base)).not.toBe(computeDemonlistContentHash(changed));
    });

    it("F. verifier or nerfer change -> hash changes", () => {
      const base = [createSampleLevel({ verifier: "PlayerA", nerfCreator: "AuthorX" })];
      const changedVerifier = [createSampleLevel({ verifier: "PlayerB", nerfCreator: "AuthorX" })];
      const changedNerfer = [createSampleLevel({ verifier: "PlayerA", nerfCreator: "AuthorY" })];
      expect(computeDemonlistContentHash(base)).not.toBe(computeDemonlistContentHash(changedVerifier));
      expect(computeDemonlistContentHash(base)).not.toBe(computeDemonlistContentHash(changedNerfer));
    });

    it("G. record count / public metadata change -> hash changes", () => {
      const base = [createSampleLevel({ recordCount: 3, description: "Desc 1" })];
      const changedCount = [createSampleLevel({ recordCount: 4, description: "Desc 1" })];
      const changedDesc = [createSampleLevel({ recordCount: 3, description: "Desc 2" })];
      expect(computeDemonlistContentHash(base)).not.toBe(computeDemonlistContentHash(changedCount));
      expect(computeDemonlistContentHash(base)).not.toBe(computeDemonlistContentHash(changedDesc));
    });

    it("H. generatedAt / lastHealthyAt change alone -> hash does NOT change", () => {
      const level = createSampleLevel();
      const hash1 = computeDemonlistContentHash({
        levels: [level],
        metadata: {
          generatedAt: "2026-01-01T00:00:00.000Z",
          lastHealthyAt: "2026-01-01T00:00:00.000Z",
        },
      });
      const hash2 = computeDemonlistContentHash({
        levels: [level],
        metadata: {
          generatedAt: "2026-09-23T18:00:00.000Z",
          lastHealthyAt: "2026-09-23T18:00:00.000Z",
        },
      });
      expect(hash1).toBe(hash2);
    });

    it("guarantees deterministic canonicalization regardless of object key insertion order", () => {
      const objA = { z: 1, a: "hello", m: [3, 2, 1] };
      const objB = { a: "hello", m: [3, 2, 1], z: 1 };
      expect(canonicalizeJson(objA)).toBe(canonicalizeJson(objB));
    });
  });

  describe("Blob Authentication & Concurrency Control", () => {
    it("reports correct blob authentication mode", () => {
      const mode = getBlobAuthMode();
      expect(["OIDC", "legacy token", "unavailable"]).toContain(mode);
    });

    it("proves atomic CAS prevents stale worker A (T1) from overwriting newer worker B (T2)", async () => {
      // Simulate Vercel Blob store in memory
      let storeBlob: {
        etag: string;
        url: string;
        content: string;
      } | null = {
        etag: "etag-t0",
        url: "https://blob.example.com/snapshots/demonlist-latest.json",
        content: JSON.stringify({
          metadata: {
            schemaVersion: SNAPSHOT_SCHEMA_VERSION,
            generatedAt: "2026-09-23T10:00:00.000Z", // T0
            lastHealthyAt: "2026-09-23T10:00:00.000Z",
            contentHash: "hash-t0",
          },
          levels: [createSampleLevel({ name: "T0 Demon" })],
        }),
      };

      // Mock @vercel/blob get and put with private access verification
      const mockGet = vi.fn(async (key: string, options: { access: string; useCache?: boolean }) => {
        expect(options.access).toBe("private");
        expect(options.useCache).toBe(false);
        if (!storeBlob) return null;
        return {
          statusCode: 200,
          stream: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(storeBlob!.content));
              controller.close();
            },
          }),
          headers: new Headers(),
          blob: {
            url: storeBlob.url,
            downloadUrl: storeBlob.url,
            pathname: key,
            contentType: "application/json",
            contentDisposition: "",
            cacheControl: "no-cache",
            size: storeBlob.content.length,
            uploadedAt: new Date(),
            etag: storeBlob.etag,
          },
        };
      });

      const mockPut = vi.fn(async (_key: string, body: string, options: { access: string; ifMatch?: string }) => {
        expect(options.access).toBe("private");
        if (storeBlob && options.ifMatch && options.ifMatch !== storeBlob.etag) {
          const err = new Error("Precondition Failed");
          err.name = "BlobPreconditionFailedError";
          Object.assign(err, { status: 412 });
          throw err;
        }

        const newEtag = `etag-${Math.random().toString(36).slice(2)}`;
        storeBlob = {
          etag: newEtag,
          url: "https://blob.example.com/snapshots/demonlist-latest.json",
          content: body,
        };
        return { etag: newEtag, url: storeBlob.url };
      });

      vi.doMock("@vercel/blob", () => ({
        get: mockGet,
        put: mockPut,
      }));

      try {
        const originalToken = process.env.BLOB_READ_WRITE_TOKEN;
        process.env.BLOB_READ_WRITE_TOKEN = "mock-blob-token-for-race-test";

        // Snapshot T1 (Generated at 11:00:00)
        const snapshotT1: DurableDemonlistSnapshot = {
          metadata: {
            schemaVersion: SNAPSHOT_SCHEMA_VERSION,
            generatedAt: "2026-09-23T11:00:00.000Z", // T1
            lastHealthyAt: "2026-09-23T11:00:00.000Z",
            levelCount: 1,
            contentHash: "hash-t1",
            source: "ephemeral-tmp",
          },
          levels: [createSampleLevel({ name: "Worker A Demon T1" })],
        };

        // Snapshot T2 (Generated at 12:00:00, where T2 > T1)
        const snapshotT2: DurableDemonlistSnapshot = {
          metadata: {
            schemaVersion: SNAPSHOT_SCHEMA_VERSION,
            generatedAt: "2026-09-23T12:00:00.000Z", // T2 > T1
            lastHealthyAt: "2026-09-23T12:00:00.000Z",
            levelCount: 1,
            contentHash: "hash-t2",
            source: "ephemeral-tmp",
          },
          levels: [createSampleLevel({ name: "Worker B Demon T2" })],
        };

        // Step 1: Worker B writes T2 first!
        const resB = await syncSnapshotToDurableBlob(snapshotT2);
        expect(resB.success).toBe(true);

        const currentInStoreAfterB = JSON.parse(storeBlob!.content);
        expect(currentInStoreAfterB.metadata.generatedAt).toBe("2026-09-23T12:00:00.000Z");
        expect(currentInStoreAfterB.levels[0].name).toBe("Worker B Demon T2");

        // Step 2: Now Worker A attempts to write stale snapshot T1!
        const resA = await syncSnapshotToDurableBlob(snapshotT1);

        // Worker A MUST be rejected due to stale_snapshot
        expect(resA.success).toBe(false);
        expect(resA.skippedReason).toBe("stale_snapshot");

        // Step 3: Verify the Blob store REMAINED T2! (Worker A did NOT revert it)
        const finalInStore = JSON.parse(storeBlob!.content);
        expect(finalInStore.metadata.generatedAt).toBe("2026-09-23T12:00:00.000Z");
        expect(finalInStore.levels[0].name).toBe("Worker B Demon T2");

        process.env.BLOB_READ_WRITE_TOKEN = originalToken;
      } finally {
        vi.doUnmock("@vercel/blob");
      }
    });

    it("verifies consistency-sensitive read always returns newest overwritten snapshot B", async () => {
      let currentContent = JSON.stringify({
        metadata: {
          schemaVersion: SNAPSHOT_SCHEMA_VERSION,
          generatedAt: "2026-09-23T10:00:00.000Z",
          lastHealthyAt: "2026-09-23T10:00:00.000Z",
          contentHash: "hash-a",
        },
        levels: [createSampleLevel({ name: "Snapshot A" })],
      });

      const mockGet = vi.fn(async (key: string, options: { access: string; useCache?: boolean }) => {
        expect(options.access).toBe("private");
        expect(options.useCache).toBe(false);
        return {
          statusCode: 200,
          stream: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(currentContent));
              controller.close();
            },
          }),
          headers: new Headers(),
          blob: {
            url: "https://blob.example.com/snapshots/demonlist-latest.json",
            downloadUrl: "https://blob.example.com/snapshots/demonlist-latest.json",
            pathname: key,
            contentType: "application/json",
            contentDisposition: "",
            cacheControl: "no-cache",
            size: currentContent.length,
            uploadedAt: new Date(),
            etag: "etag-fixed",
          },
        };
      });

      vi.doMock("@vercel/blob", () => ({
        get: mockGet,
      }));

      try {
        const originalToken = process.env.BLOB_READ_WRITE_TOKEN;
        process.env.BLOB_READ_WRITE_TOKEN = "mock-blob-token-for-consistency-test";

        // Read initial state (A)
        clearSnapshotCachesForTest();
        const readA = await getDurableLastKnownGoodLevelsAsync();
        expect(readA.levels[0].name).toBe("Snapshot A");

        // Overwrite in store with B
        currentContent = JSON.stringify({
          metadata: {
            schemaVersion: SNAPSHOT_SCHEMA_VERSION,
            generatedAt: "2026-09-23T11:00:00.000Z",
            lastHealthyAt: "2026-09-23T11:00:00.000Z",
            contentHash: "hash-b",
          },
          levels: [createSampleLevel({ name: "Snapshot B" })],
        });

        // Consistency-sensitive read (clearing local memory cache to simulate fresh serverless instance)
        clearSnapshotCachesForTest();
        const readB = await getDurableLastKnownGoodLevelsAsync();
        expect(readB.levels[0].name).toBe("Snapshot B");

        process.env.BLOB_READ_WRITE_TOKEN = originalToken;
      } finally {
        vi.doUnmock("@vercel/blob");
      }
    });
  });
});
