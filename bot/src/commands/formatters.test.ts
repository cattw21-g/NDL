import { describe, expect, it } from "vitest";

import type {
  AuditEntry,
  NdlLeaderboardRow,
  NdlLevel,
  NdlPlayer,
  NdlRecord,
  StaffRecordSubmission,
  StaffStats,
} from "../ndl-api.js";
import {
  containsSensitiveOutput,
  formatPendingRecordsEmbed,
  formatPlayerEmbed,
  formatStatsEmbed,
  formatTopLevelsEmbed,
} from "./formatters.js";

describe("Discord command formatters", () => {
  it("formats public top levels without sensitive fields", () => {
    const embed = formatTopLevelsEmbed([level], "https://nerfeddemonlist.net");
    const json = embed.toJSON();

    expect(JSON.stringify(json)).toContain("#1");
    expect(JSON.stringify(json)).toContain("320 pts");
    expect(JSON.stringify(json)).toContain("/levels/demo-level");
    expect(containsSensitiveOutput(json)).toBe(false);
  });

  it("formats player summaries with hardest ranked records", () => {
    const embed = formatPlayerEmbed(
      player,
      summary,
      [{ ...record, rawFootageUrl: "https://private.example/raw.mp4" } as never],
      "https://nerfeddemonlist.net",
    );
    const output = JSON.stringify(embed.toJSON());

    expect(output).toContain("Hardest ranked record");
    expect(output).toContain("Demo Level");
    expect(output).not.toContain("raw.mp4");
  });

  it("formats staff queues ephemerally safe without emails or secrets", () => {
    const embed = formatPendingRecordsEmbed(
      [
        {
          ...staffSubmission,
          player: {
            id: "user-1",
            handle: "player",
            displayName: "Player One",
            email: "hidden@example.com",
          } as never,
        },
      ],
      "https://nerfeddemonlist.net",
    );
    const output = JSON.stringify(embed.toJSON());

    expect(output).toContain("Pending Record Submissions");
    expect(output).not.toContain("hidden@example.com");
    expect(output).not.toContain("password");
    expect(output).not.toContain("token");
  });

  it("formats stats and does not leak audit-sensitive values", () => {
    const statsEmbed = formatStatsEmbed(stats);
    const auditEntry: AuditEntry = {
      id: "audit-1",
      actor: {
        id: "user-1",
        handle: "admin",
        displayName: "Admin",
        role: "ADMIN",
      },
      action: "LEVEL_UPDATED",
      entityType: "Level",
      entityId: "level-1",
      entityLabel: "Demo Level",
      before: { passwordHash: "[redacted]" },
      after: { tokenHash: "[redacted]" },
      note: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    expect(JSON.stringify(statsEmbed.toJSON())).toContain("Pending records");
    expect(JSON.stringify(auditEntry)).not.toContain("real-secret");
  });
});

const level: NdlLevel = {
  id: "level-1",
  slug: "demo-level",
  rank: 1,
  name: "Demo Level",
  originalName: "Original Demo",
  gdLevelId: "123",
  publisher: "Publisher",
  nerfCreator: "Nerfer",
  verifier: "Verifier",
  thumbnailUrl: "/uploads/thumbnails/demo.webp",
  showcaseUrl: "https://example.com/showcase",
  placementDate: null,
  status: "RANKED",
  difficulty: "EXTREME",
  points: 320,
  description: "Description",
  versionNotes: null,
  recordCount: 3,
};

const player: NdlPlayer = {
  id: "user-1",
  handle: "player",
  displayName: "Player One",
  bio: null,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const summary: NdlLeaderboardRow = {
  rank: 1,
  handle: "player",
  displayName: "Player One",
  points: 320,
  records: 1,
  lastRecordAt: "2026-01-02T00:00:00.000Z",
};

const record: NdlRecord = {
  id: "record-1",
  player,
  level,
  videoUrl: "https://example.com/video",
  fps: 240,
  cbfUsed: true,
  pointsAwarded: 320,
  acceptedAt: "2026-01-02T00:00:00.000Z",
};

const staffSubmission: StaffRecordSubmission = {
  id: "submission-1",
  status: "PENDING",
  player,
  level,
  videoUrl: "https://example.com/video",
  rawFootageUrl: "https://staff-only.example/raw.mp4",
  proofImageUrl: null,
  fps: 240,
  cbfUsed: false,
  clickAudioIncluded: true,
  separateMicClickTrack: false,
  gameAudioIncluded: true,
  rawFootageIncluded: true,
  fpsOverlayVisible: true,
  cpsCounterVisible: true,
  cheatIndicatorVisible: false,
  microphoneModel: null,
  inputDevice: "Mouse",
  proofNotes: "Proof notes",
  comments: null,
  moderatorNotes: "Staff note",
  submittedAt: "2026-01-02T00:00:00.000Z",
  reviewedAt: null,
  reviewer: null,
};

const stats: StaffStats = {
  pendingRecords: 1,
  pendingSuggestions: 2,
  rankedLevels: 50,
  users: 100,
  acceptedRecords: 200,
  moderationActions24h: 3,
  auditEvents24h: 4,
  generatedAt: "2026-01-02T00:00:00.000Z",
};
