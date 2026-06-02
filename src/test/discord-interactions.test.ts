import fs from "node:fs";
import path from "node:path";

import nacl from "tweetnacl";
import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/discord/interactions/route";
import type { ApiLevel, ApiPlayer, ApiRecord } from "@/lib/api-serializers";
import {
  DiscordInteractionResponseType,
  DiscordMessageFlags,
  containsSensitiveDiscordOutput,
  discordCommandDefinitions,
  discordInteractionEndpointUrl,
  handleDiscordInteraction,
  verifyDiscordRequestSignature,
  type DiscordDataService,
  type DiscordInteraction,
} from "@/lib/discord-interactions";

describe("Discord HTTP interactions", () => {
  it("verifies valid Ed25519 signatures and rejects invalid signatures", () => {
    const keyPair = nacl.sign.keyPair();
    const body = JSON.stringify({ type: 1 });
    const timestamp = "1700000000";
    const signature = toHex(
      nacl.sign.detached(new TextEncoder().encode(`${timestamp}${body}`), keyPair.secretKey),
    );

    expect(
      verifyDiscordRequestSignature({
        body,
        timestamp,
        signature,
        publicKey: toHex(keyPair.publicKey),
      }),
    ).toBe(true);

    expect(
      verifyDiscordRequestSignature({
        body,
        timestamp,
        signature: "00",
        publicKey: toHex(keyPair.publicKey),
      }),
    ).toBe(false);
  });

  it("route returns PONG for signed Discord PING and 401 for invalid signature", async () => {
    const keyPair = nacl.sign.keyPair();
    const body = JSON.stringify({ type: 1 });
    const timestamp = "1700000000";
    const signature = toHex(
      nacl.sign.detached(new TextEncoder().encode(`${timestamp}${body}`), keyPair.secretKey),
    );
    const originalPublicKey = process.env.DISCORD_PUBLIC_KEY;
    process.env.DISCORD_PUBLIC_KEY = toHex(keyPair.publicKey);

    try {
      const validResponse = await POST(
        new Request("https://ndl.test/api/discord/interactions", {
          method: "POST",
          body,
          headers: {
            "X-Signature-Ed25519": signature,
            "X-Signature-Timestamp": timestamp,
          },
        }),
      );
      await expect(validResponse.json()).resolves.toEqual({ type: 1 });

      const invalidResponse = await POST(
        new Request("https://ndl.test/api/discord/interactions", {
          method: "POST",
          body,
          headers: {
            "X-Signature-Ed25519": "00",
            "X-Signature-Timestamp": timestamp,
          },
        }),
      );

      expect(invalidResponse.status).toBe(401);
    } finally {
      process.env.DISCORD_PUBLIC_KEY = originalPublicKey;
    }
  });

  it("routes /top to a safe public command response", async () => {
    const response = await handleDiscordInteraction(
      commandInteraction("top", [{ name: "count", value: 1 }]),
      {
        service: fakeDiscordService(),
        env: {
          NEXT_PUBLIC_SITE_URL: "https://nerfeddemonlist.net",
        },
      },
    );

    expect(response.type).toBe(DiscordInteractionResponseType.ChannelMessageWithSource);
    expect(JSON.stringify(response)).toContain("320 pts");
    expect(JSON.stringify(response)).toContain("/levels/demo-level");
    expect(containsSensitiveDiscordOutput(response)).toBe(false);
  });

  it("routes /player to a safe public command response", async () => {
    const response = await handleDiscordInteraction(
      commandInteraction("player", [{ name: "handle", value: "player" }]),
      {
        service: fakeDiscordService(),
        env: {
          NEXT_PUBLIC_SITE_URL: "https://nerfeddemonlist.net",
        },
      },
    );

    expect(JSON.stringify(response)).toContain("Player One");
    expect(JSON.stringify(response)).toContain("Hardest ranked record");
    expect(JSON.stringify(response)).not.toContain("rawFootageUrl");
    expect(containsSensitiveDiscordOutput(response)).toBe(false);
  });

  it("denies staff commands without the configured staff role", async () => {
    const missingRole = await handleDiscordInteraction(
      commandInteraction("pending-records", [], ["other-role"]),
      {
        service: fakeDiscordService(),
        env: {
          DISCORD_STAFF_ROLE_ID: "staff-role",
        },
      },
    );

    expect(missingRole).toEqual({
      type: DiscordInteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "You do not have permission to use this command.",
        flags: DiscordMessageFlags.Ephemeral,
        allowed_mentions: { parse: [] },
      },
    });

    const missingConfig = await handleDiscordInteraction(
      commandInteraction("pending-records", [], ["staff-role"]),
      {
        service: fakeDiscordService(),
        env: {},
      },
    );

    expect(missingConfig).toEqual(missingRole);
  });

  it("allows staff commands with the configured role and replies ephemerally", async () => {
    const response = await handleDiscordInteraction(
      commandInteraction("stats", [], ["staff-role"]),
      {
        service: fakeDiscordService(),
        env: {
          DISCORD_STAFF_ROLE_ID: "staff-role",
        },
      },
    );

    expect(response.type).toBe(DiscordInteractionResponseType.ChannelMessageWithSource);
    expect("data" in response ? response.data.flags : null).toBe(
      DiscordMessageFlags.Ephemeral,
    );
    expect(JSON.stringify(response)).toContain("Pending records");
  });

  it("defines public and staff command registration JSON", () => {
    expect(discordCommandDefinitions.map((command) => command.name)).toEqual([
      "top",
      "level",
      "player",
      "records",
      "recent",
      "search",
      "rules",
      "pending-records",
      "pending-suggestions",
      "submission",
      "suggestion",
      "audit",
      "stats",
    ]);
    expect(
      discordCommandDefinitions
        .find((command) => command.name === "top")
        ?.options?.find((option) => option.name === "count")?.max_value,
    ).toBe(50);
  });

  it("keeps route independent from DISCORD_BOT_TOKEN and documents Vercel HTTP mode", () => {
    const routeSource = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/app/api/discord/interactions/route.ts",
      ),
      "utf8",
    );
    const docs = fs.readFileSync(
      path.join(process.cwd(), "docs/discord-bot.md"),
      "utf8",
    );

    expect(routeSource).not.toContain("DISCORD_BOT_TOKEN");
    expect(docs).toContain(discordInteractionEndpointUrl);
    expect(docs).toContain("Vercel-hosted HTTP Interactions");
  });
});

function commandInteraction(
  name: string,
  options: Array<{ name: string; value: string | number | boolean }> = [],
  roles: string[] = [],
): DiscordInteraction {
  return {
    type: 2,
    data: {
      name,
      options,
    },
    member: {
      roles,
    },
  };
}

function fakeDiscordService(): DiscordDataService {
  return {
    async getTopLevels() {
      return [level];
    },
    async search() {
      return {
      levels: [level],
      players: [player],
      };
    },
    async getPlayer() {
      return {
      player,
      summary: {
        rank: 1,
        handle: "player",
        displayName: "Player One",
        points: 320,
        records: 1,
        lastRecordAt: "2026-01-01T00:00:00.000Z",
      },
      records: [record],
      };
    },
    async getPlayerRecords() {
      return [record];
    },
    async getRecentRecords() {
      return [record];
    },
    async getRules() {
      return {
      id: "rules-1",
      version: "v1",
      content: "NDL rules summary.\n\nFull rules.",
      isActive: true,
      publishedAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      };
    },
    async getPendingRecords() {
      return [
      {
        id: "submission-1",
        status: "PENDING",
        player,
        level,
        videoUrl: "https://example.com/video",
        rawFootageUrl: "https://staff.example/raw.mp4",
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
        submittedAt: "2026-01-01T00:00:00.000Z",
        reviewedAt: null,
        reviewer: null,
      },
      ];
    },
    async getPendingSuggestions() {
      return [
      {
        id: "suggestion-1",
        name: "Suggested Level",
        originalName: "Original",
        gdLevelId: "123",
        publisher: "Publisher",
        nerfCreator: "Nerfer",
        verifier: "Verifier",
        showcaseUrl: "https://example.com/showcase",
        thumbnailUrl: null,
        versionNotes: null,
        compatibilityNotes: "Compatible",
        status: "PENDING",
        moderatorNotes: "Staff note",
        submittedAt: "2026-01-01T00:00:00.000Z",
        reviewedAt: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        submitter: player,
        reviewer: null,
        createdLevel: null,
      },
      ];
    },
    async getSubmission() {
      return null;
    },
    async getSuggestion() {
      return null;
    },
    async getAudit() {
      return [];
    },
    async getStats() {
      return {
      pendingRecords: 1,
      pendingSuggestions: 2,
      rankedLevels: 3,
      users: 4,
      acceptedRecords: 5,
      moderationActions24h: 6,
      auditEvents24h: 7,
      generatedAt: "2026-01-01T00:00:00.000Z",
      };
    },
  };
}

const player = {
  id: "user-1",
  handle: "player",
  displayName: "Player One",
  bio: null,
  createdAt: "2026-01-01T00:00:00.000Z",
} satisfies ApiPlayer;

const level = {
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
  recordCount: 1,
} satisfies ApiLevel;

const record = {
  id: "record-1",
  player,
  level,
  videoUrl: "https://example.com/video",
  fps: 240,
  cbfUsed: true,
  pointsAwarded: 320,
  acceptedAt: "2026-01-01T00:00:00.000Z",
} satisfies ApiRecord;

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
