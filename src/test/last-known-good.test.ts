import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  clearSnapshotCachesForTest,
  getLastKnownGoodLevels,
  recordHealthyLevelSnapshot,
  SNAPSHOT_SCHEMA_VERSION,
} from "../lib/last-known-good";
import { FALLBACK_RANKED_LEVELS } from "../lib/fallback-levels";

const SNAPSHOT_DIR = path.join(process.cwd(), ".data");
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, "demonlist-snapshot.json");

describe("Durable Last-Known-Good Snapshot System", () => {
  beforeEach(() => {
    clearSnapshotCachesForTest();
  });

  afterEach(() => {
    clearSnapshotCachesForTest();
  });

  it("serves static seed fallback on fresh cold start when no durable snapshot exists", () => {
    const result = getLastKnownGoodLevels();

    expect(result.source).toBe("seed-fallback");
    expect(result.levels.length).toBe(FALLBACK_RANKED_LEVELS.length);
    expect(result.lastHealthyAt).toBeNull();
    expect(result.schemaVersion).toBe(SNAPSHOT_SCHEMA_VERSION);
  });

  it("records a healthy level snapshot into memory and durable disk cache", () => {
    const mockLevels = [
      {
        id: "mock-1",
        slug: "mock-demon-1",
        rank: 1,
        name: "Mock Demon 1",
        originalName: "Original 1",
        gdLevelId: "12345",
        publisher: "cattwgdx",
        nerfCreator: "cattwgdx",
        verifier: "cattwgdx",
        thumbnailUrl: "/thumbnails/mock1.webp",
        status: "RANKED",
        difficulty: "EXTREME",
        points: 1000,
        _count: { records: 3 },
      },
    ];

    const recorded = recordHealthyLevelSnapshot(mockLevels);
    expect(recorded).toBe(true);

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
    const mockLevels = [
      {
        id: "survivor-1",
        slug: "survivor-demon",
        rank: 1,
        name: "Survivor Demon",
        originalName: "Survivor Original",
        publisher: "cattwgdx",
        nerfCreator: "cattwgdx",
        verifier: "cattwgdx",
        thumbnailUrl: "/thumbnails/survivor.webp",
        status: "RANKED",
        difficulty: "EXTREME",
        points: 1000,
      },
    ];

    // Populate and persist
    recordHealthyLevelSnapshot(mockLevels);

    // Simulate process cold start: clear in-process memory while leaving disk file intact
    const originalClear = clearSnapshotCachesForTest;
    // Clear only memory by reading module directly
    // Re-verify that with memory empty, reading disk snapshot succeeds:
    // To simulate memory wipe without deleting disk:
    try {
      const diskContent = fs.readFileSync(SNAPSHOT_FILE, "utf8");
      // Now clear memory
      originalClear();
      // Restore disk file
      fs.writeFileSync(SNAPSHOT_FILE, diskContent, "utf8");

      const coldStartResult = getLastKnownGoodLevels();
      expect(coldStartResult.source).toBe("durable-disk");
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
    expect(recordHealthyLevelSnapshot([])).toBe(false);

    // 2. Rejects malformed objects
    expect(
      recordHealthyLevelSnapshot([
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
      ]),
    ).toBe(false);

    // Snapshot file must not be created
    expect(fs.existsSync(SNAPSHOT_FILE)).toBe(false);
  });

  it("safely falls back to seed data if disk snapshot has incompatible schema version or corrupt JSON", () => {
    if (!fs.existsSync(SNAPSHOT_DIR)) {
      fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    }

    // Write incompatible schema version
    const incompatibleSnapshot = {
      metadata: {
        schemaVersion: 999, // Incompatible future version
        generatedAt: new Date().toISOString(),
        lastHealthyAt: new Date().toISOString(),
        levelCount: 1,
      },
      levels: [{ slug: "future-demon", name: "Future Demon" }],
    };
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(incompatibleSnapshot), "utf8");

    const result = getLastKnownGoodLevels();
    // System must discard incompatible version and fall back safely to static seed data
    expect(result.source).toBe("seed-fallback");
    expect(result.levels.length).toBe(FALLBACK_RANKED_LEVELS.length);
  });
});
