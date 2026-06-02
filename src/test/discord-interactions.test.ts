import fs from "node:fs";
import path from "node:path";

import nacl from "tweetnacl";
import { describe, expect, it, vi } from "vitest";

import {
  GET as GET_INTERACTIONS_HEALTH,
  POST,
} from "@/app/api/discord/interactions/route";
import { GET as GET_NESTED_HEALTH } from "@/app/api/discord/interactions/health/route";
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
  it("GET health routes return safe deployment diagnostics", async () => {
    const originalEnv = {
      DISCORD_PUBLIC_KEY: process.env.DISCORD_PUBLIC_KEY,
      BOT_API_SECRET: process.env.BOT_API_SECRET,
      DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
      DATABASE_URL: process.env.DATABASE_URL,
    };
    process.env.DISCORD_PUBLIC_KEY = "public-key-value-that-must-not-leak";
    process.env.BOT_API_SECRET = "bot-secret-that-must-not-leak";
    process.env.DISCORD_BOT_TOKEN = "discord-token-that-must-not-leak";
    process.env.DATABASE_URL = "postgres://secret-that-must-not-leak";

    try {
      for (const response of [
        GET_INTERACTIONS_HEALTH(),
        GET_NESTED_HEALTH(),
      ]) {
        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toContain(
          "application/json",
        );

        const body = await response.json();
        expect(body).toMatchObject({
          ok: true,
          route: "/api/discord/interactions",
          hasPublicKey: true,
        });
        expect(typeof body.timestamp).toBe("string");
        expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);

        const serialized = JSON.stringify(body);
        expect(serialized).not.toContain("public-key-value-that-must-not-leak");
        expect(serialized).not.toContain("bot-secret-that-must-not-leak");
        expect(serialized).not.toContain("discord-token-that-must-not-leak");
        expect(serialized).not.toContain("postgres://secret-that-must-not-leak");
        expect(serialized).not.toContain("DISCORD_PUBLIC_KEY");
        expect(serialized).not.toContain("BOT_API_SECRET");
        expect(serialized).not.toContain("DISCORD_BOT_TOKEN");
        expect(serialized).not.toContain("DATABASE_URL");
      }
    } finally {
      restoreEnv(originalEnv);
    }
  });

  it("GET health reports missing public key as false", async () => {
    const originalPublicKey = process.env.DISCORD_PUBLIC_KEY;
    delete process.env.DISCORD_PUBLIC_KEY;

    try {
      await expect(GET_INTERACTIONS_HEALTH().json()).resolves.toMatchObject({
        ok: true,
        route: "/api/discord/interactions",
        hasPublicKey: false,
      });
    } finally {
      process.env.DISCORD_PUBLIC_KEY = originalPublicKey;
    }
  });

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
      expect(validResponse.status).toBe(200);
      expect(validResponse.headers.get("content-type")).toContain(
        "application/json",
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
      expect(invalidResponse.headers.get("content-type")).toContain(
        "application/json",
      );
    } finally {
      process.env.DISCORD_PUBLIC_KEY = originalPublicKey;
    }
  });

  it("logs safe diagnostics for signed PING without leaking headers or payload", async () => {
    const keyPair = nacl.sign.keyPair();
    const body = JSON.stringify({ type: 1 });
    const timestamp = "1700000000";
    const signature = toHex(
      nacl.sign.detached(
        new TextEncoder().encode(`${timestamp}${body}`),
        keyPair.secretKey,
      ),
    );
    const originalPublicKey = process.env.DISCORD_PUBLIC_KEY;
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    process.env.DISCORD_PUBLIC_KEY = toHex(keyPair.publicKey);

    try {
      const response = await POST(
        new Request("https://ndl.test/api/discord/interactions", {
          method: "POST",
          body,
          headers: {
            "X-Signature-Ed25519": signature,
            "X-Signature-Timestamp": timestamp,
          },
        }),
      );

      expect(response.status).toBe(200);

      const logText = consoleLog.mock.calls
        .map((call) => JSON.stringify(call))
        .join("\n");

      expect(logText).toContain("[discord-interactions]");
      expect(logText).toContain("route hit");
      expect(logText).toContain("hasSignature");
      expect(logText).toContain("hasTimestamp");
      expect(logText).toContain("hasPublicKey");
      expect(logText).toContain("bodyLength");
      expect(logText).toContain("verified");
      expect(logText).toContain("payloadType");
      expect(logText).toContain("isPing");
      expect(logText).toContain("PING received");
      expect(logText).toContain("PING returning PONG");
      expect(logText).not.toContain(signature);
      expect(logText).not.toContain(timestamp);
      expect(logText).not.toContain(toHex(keyPair.publicKey));
      expect(logText).not.toContain(body);
    } finally {
      process.env.DISCORD_PUBLIC_KEY = originalPublicKey;
      consoleLog.mockRestore();
    }
  });

  it("signed PING does not require database, bot, or staff secrets", async () => {
    const keyPair = nacl.sign.keyPair();
    const body = JSON.stringify({ type: 1 });
    const timestamp = "1700000000";
    const signature = toHex(
      nacl.sign.detached(
        new TextEncoder().encode(`${timestamp}${body}`),
        keyPair.secretKey,
      ),
    );
    const originalEnv = {
      DISCORD_PUBLIC_KEY: process.env.DISCORD_PUBLIC_KEY,
      DATABASE_URL: process.env.DATABASE_URL,
      BOT_API_SECRET: process.env.BOT_API_SECRET,
      DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
    };

    process.env.DISCORD_PUBLIC_KEY = toHex(keyPair.publicKey);
    delete process.env.DATABASE_URL;
    delete process.env.BOT_API_SECRET;
    delete process.env.DISCORD_BOT_TOKEN;

    try {
      const response = await POST(
        new Request("https://ndl.test/api/discord/interactions", {
          method: "POST",
          body,
          headers: {
            "X-Signature-Ed25519": signature,
            "X-Signature-Timestamp": timestamp,
          },
        }),
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ type: 1 });
    } finally {
      restoreEnv(originalEnv);
    }
  });

  it("missing DISCORD_PUBLIC_KEY logs clearly and returns JSON 401", async () => {
    const originalPublicKey = process.env.DISCORD_PUBLIC_KEY;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    delete process.env.DISCORD_PUBLIC_KEY;

    try {
      const response = await POST(
        new Request("https://ndl.test/api/discord/interactions", {
          method: "POST",
          body: JSON.stringify({ type: 1 }),
          headers: {
            "X-Signature-Ed25519": "00",
            "X-Signature-Timestamp": "1700000000",
          },
        }),
      );

      expect(response.status).toBe(401);
      expect(response.headers.get("content-type")).toContain(
        "application/json",
      );
      expect(consoleError).toHaveBeenCalledWith(
        "DISCORD_PUBLIC_KEY is required to verify Discord interactions.",
      );
    } finally {
      process.env.DISCORD_PUBLIC_KEY = originalPublicKey;
      consoleError.mockRestore();
    }
  });

  it("malformed JSON after a valid signature returns a JSON error", async () => {
    const keyPair = nacl.sign.keyPair();
    const body = "{not-json";
    const timestamp = "1700000000";
    const signature = toHex(
      nacl.sign.detached(
        new TextEncoder().encode(`${timestamp}${body}`),
        keyPair.secretKey,
      ),
    );
    const originalPublicKey = process.env.DISCORD_PUBLIC_KEY;
    process.env.DISCORD_PUBLIC_KEY = toHex(keyPair.publicKey);

    try {
      const response = await POST(
        new Request("https://ndl.test/api/discord/interactions", {
          method: "POST",
          body,
          headers: {
            "X-Signature-Ed25519": signature,
            "X-Signature-Timestamp": timestamp,
          },
        }),
      );

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toContain(
        "application/json",
      );
      await expect(response.json()).resolves.toMatchObject({
        type: 4,
        data: {
          flags: 64,
        },
      });
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
    expect(routeSource.indexOf("request.text()")).toBeGreaterThan(-1);
    expect(routeSource.indexOf("request.text()")).toBeLessThan(
      routeSource.indexOf("JSON.parse"),
    );
    expect(docs).toContain(discordInteractionEndpointUrl);
    expect(docs).toContain("Vercel-hosted HTTP Interactions");
  });

  it("has no middleware or proxy that can block the Discord interactions route", () => {
    const repoRoot = process.cwd();
    const blockingFiles = [
      "middleware.ts",
      "middleware.js",
      "proxy.ts",
      "proxy.js",
      "src/middleware.ts",
      "src/middleware.js",
      "src/proxy.ts",
      "src/proxy.js",
    ].filter((fileName) => fs.existsSync(path.join(repoRoot, fileName)));

    expect(blockingFiles).toEqual([]);
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

function restoreEnv(env: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}
