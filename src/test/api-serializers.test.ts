import { describe, expect, it } from "vitest";

import { isValidBotAuthorization } from "../lib/api-auth";
import {
  redactApiValue,
  serializeAuditLogEntry,
  serializePublicLevel,
  serializePublicRecord,
  serializeStaffRecordSubmission,
} from "../lib/api-serializers";

const rankedLevel = {
  id: "level-1",
  slug: "rank-one",
  rank: 1,
  name: "Rank One",
  originalName: "Original",
  gdLevelId: "123",
  publisher: "Host",
  nerfCreator: "Nerfer",
  verifier: "Verifier",
  thumbnailUrl: "/thumbnails/rank-one.png",
  showcaseUrl: "https://example.com/showcase",
  placementDate: new Date("2026-01-01T00:00:00.000Z"),
  status: "RANKED" as const,
  difficulty: "EXTREME",
  description: "A public level description.",
  versionNotes: "v1",
  _count: {
    records: 2,
  },
};

const player = {
  id: "player-1",
  playerName: "player",
  displayName: "Player",
  bio: null,
  createdAt: new Date("2026-01-02T00:00:00.000Z"),
};

describe("API serializers", () => {
  it("serializes public level points from the 320/310 scale", () => {
    const rankOne = serializePublicLevel(rankedLevel);
    const rankTwo = serializePublicLevel({
      ...rankedLevel,
      id: "level-2",
      rank: 2,
    });

    expect(rankOne.points).toBe(320);
    expect(rankTwo.points).toBe(310);
  });

  it("keeps public records free of private moderation fields", () => {
    const serialized = serializePublicRecord({
      id: "record-1",
      videoUrl: "https://example.com/video",
      fps: 240,
      cbfUsed: true,
      acceptedAt: new Date("2026-01-03T00:00:00.000Z"),
      player,
      level: rankedLevel,
    });
    const output = JSON.stringify(serialized).toLowerCase();

    expect(serialized.pointsAwarded).toBe(320);
    expect(output).not.toContain("email");
    expect(output).not.toContain("passwordhash");
    expect(output).not.toContain("tokenhash");
    expect(output).not.toContain("session");
    expect(output).not.toContain("rawfootageurl");
    expect(output).not.toContain("moderatornotes");
  });

  it("serializes staff submissions with proof links but without user emails", () => {
    const serialized = serializeStaffRecordSubmission({
      id: "submission-1",
      videoUrl: "https://example.com/video",
      rawFootageUrl: "https://example.com/raw",
      proofImageUrl: "https://example.com/proof.png",
      fps: 240,
      cbfUsed: false,
      clickAudioIncluded: true,
      separateMicClickTrack: false,
      gameAudioIncluded: true,
      rawFootageIncluded: true,
      fpsOverlayVisible: true,
      cpsCounterVisible: false,
      cheatIndicatorVisible: true,
      microphoneModel: "USB mic",
      inputDevice: "Keyboard",
      proofNotes: "Clicks audible.",
      comments: "Clean run.",
      status: "PENDING",
      moderatorNotes: "Review this.",
      submittedAt: new Date("2026-01-04T00:00:00.000Z"),
      reviewedAt: null,
      player,
      level: rankedLevel,
      reviewer: null,
    });
    const output = JSON.stringify(serialized).toLowerCase();

    expect(serialized.rawFootageUrl).toBe("https://example.com/raw");
    expect(serialized.moderatorNotes).toBe("Review this.");
    expect(output).not.toContain("email");
    expect(output).not.toContain("passwordhash");
    expect(output).not.toContain("session");
    expect(output).not.toContain("tokenhash");
  });

  it("redacts sensitive audit values before staff API output", () => {
    const serialized = serializeAuditLogEntry({
      id: "audit-1",
      actorUserId: "admin-1",
      actorHandle: "admin",
      actorName: "Admin",
      actorRole: "ADMIN",
      action: "USER_ROLE_CHANGED",
      entityType: "User",
      entityId: "user-1",
      entityLabel: "Player",
      beforeJson: {
        email: "player@example.com",
        passwordHash: "secret",
        sessionToken: "token",
        safe: "visible",
      },
      afterJson: null,
      note: "Changed role.",
      createdAt: new Date("2026-01-05T00:00:00.000Z"),
    });

    expect(JSON.stringify(serialized.before)).toContain("[redacted]");
    expect(JSON.stringify(serialized.before)).toContain("visible");
    expect(JSON.stringify(serialized.before)).not.toContain("player@example.com");
  });

  it("redacts standalone secret-like values recursively", () => {
    expect(
      redactApiValue({
        nested: {
          DATABASE_URL: "postgres://secret",
          SMTP_PASSWORD: "secret",
          tokenHash: "hash",
          publicValue: "ok",
        },
      }),
    ).toEqual({
      nested: {
        DATABASE_URL: "[redacted]",
        SMTP_PASSWORD: "[redacted]",
        tokenHash: "[redacted]",
        publicValue: "ok",
      },
    });
  });
});

describe("bot API bearer auth", () => {
  it("accepts only the configured bearer token", () => {
    expect(isValidBotAuthorization("Bearer secret", "secret")).toBe(true);
    expect(isValidBotAuthorization(null, "secret")).toBe(false);
    expect(isValidBotAuthorization("Bearer wrong", "secret")).toBe(false);
    expect(isValidBotAuthorization("Basic secret", "secret")).toBe(false);
    expect(isValidBotAuthorization("Bearer secret", "")).toBe(false);
  });
});
