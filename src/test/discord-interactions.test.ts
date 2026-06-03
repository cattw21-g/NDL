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
  DiscordInteractionType,
  DiscordMessageFlags,
  containsSensitiveDiscordOutput,
  discordCommandDefinitions,
  discordInteractionEndpointUrl,
  getDiscordCommandGroups,
  handleDiscordInteraction,
  verifyDiscordRequestSignature,
  type DiscordDataService,
  type DiscordInteraction,
  type DiscordInteractionResponse,
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
      nacl.sign.detached(
        new TextEncoder().encode(`${timestamp}${body}`),
        keyPair.secretKey,
      ),
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
      nacl.sign.detached(
        new TextEncoder().encode(`${timestamp}${body}`),
        keyPair.secretKey,
      ),
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

  it("routes every public command to safe polished responses", async () => {
    const publicCommands = [
      commandInteraction("top", [
        { name: "count", value: 2 },
        { name: "status", value: "ranked" },
      ]),
      commandInteraction("level", [{ name: "query", value: "demo" }]),
      commandInteraction("player", [{ name: "handle", value: "player" }]),
      commandInteraction("records", [
        { name: "handle", value: "player" },
        { name: "limit", value: 2 },
      ]),
      commandInteraction("recent", [{ name: "count", value: 2 }]),
      commandInteraction("search", [{ name: "query", value: "demo" }]),
      commandInteraction("rules"),
      commandInteraction("level-records", [
        { name: "level", value: "demo" },
        { name: "limit", value: 2 },
      ]),
      commandInteraction("leaderboard", [{ name: "count", value: 2 }]),
      commandInteraction("about"),
      commandInteraction("status"),
    ];

    for (const interaction of publicCommands) {
      const response = await handleDiscordInteraction(interaction, {
        service: fakeDiscordService(),
        env: {
          NEXT_PUBLIC_SITE_URL: "https://www.nerfeddemonlist.net",
        },
      });
      const data = messageData(response);

      expect(data.allowed_mentions).toEqual({ parse: [] });
      expect(JSON.stringify(response)).toContain("Nerfed Demonlist");
      expect(containsSensitiveDiscordOutput(response)).toBe(false);
    }
  });

  it("formats key public command details", async () => {
    const service = fakeDiscordService();
    const env = { NEXT_PUBLIC_SITE_URL: "https://www.nerfeddemonlist.net" };

    await expectCommandText(
      commandInteraction("top", [
        { name: "count", value: 2 },
        { name: "status", value: "all-public" },
      ]),
      service,
      env,
      ["320 pts", "View full ranked list"],
    );
    await expectCommandText(
      commandInteraction("level", [{ name: "query", value: "demo" }]),
      service,
      env,
      ["Publisher/host", "Other matches", "/levels/demo-level"],
    );
    await expectCommandText(
      commandInteraction("player", [{ name: "handle", value: "player" }]),
      service,
      env,
      ["Player One", "Top records", "Hardest ranked record"],
    );
    await expectCommandText(
      commandInteraction("records", [{ name: "handle", value: "player" }]),
      service,
      env,
      ["Records for player", "100%", "View more on NDL"],
    );
    await expectCommandText(commandInteraction("rules"), service, env, [
      "Accepted NDL versions are required",
      "CBF is currently allowed",
      "/rules",
    ]);
    await expectCommandText(commandInteraction("status"), service, env, [
      "API reachable",
      "Vercel HTTP interactions",
      "Ranked levels",
    ]);
  });

  it("returns clear not-found and API error messages", async () => {
    const missingPlayer = await handleDiscordInteraction(
      commandInteraction("player", [{ name: "handle", value: "missing" }]),
      {
        service: fakeDiscordService({
          async getPlayer() {
            return null;
          },
        }),
      },
    );

    expect(JSON.stringify(missingPlayer)).toContain(
      "No public player found for that handle.",
    );

    const rateLimited = await handleDiscordInteraction(commandInteraction("top"), {
      service: fakeDiscordService({
        async getTopLevels() {
          throw new Error("429 rate limited");
        },
      }),
    });

    expect(JSON.stringify(rateLimited)).toContain("rate limiting");
  });

  it("does not let public commands call staff data methods", async () => {
    const service = fakeDiscordService({
      async getPendingRecords() {
        throw new Error("staff method should not be called");
      },
      async getPendingSuggestions() {
        throw new Error("staff method should not be called");
      },
      async getSubmission() {
        throw new Error("staff method should not be called");
      },
      async getSuggestion() {
        throw new Error("staff method should not be called");
      },
      async getAudit() {
        throw new Error("staff method should not be called");
      },
      async getStats() {
        throw new Error("staff method should not be called");
      },
    });

    for (const commandName of getDiscordCommandGroups().public) {
      const response = await handleDiscordInteraction(
        publicInteractionFor(commandName),
        {
          service,
          env: {
            NEXT_PUBLIC_SITE_URL: "https://www.nerfeddemonlist.net",
          },
        },
      );

      expect(JSON.stringify(response)).not.toContain(
        "staff method should not be called",
      );
    }
  });

  it("supports level and player autocomplete safely", async () => {
    const levelResponse = await handleDiscordInteraction(
      autocompleteInteraction("level", "query", "demo"),
      {
        service: fakeDiscordService(),
      },
    );
    const playerResponse = await handleDiscordInteraction(
      autocompleteInteraction("player", "handle", "pla"),
      {
        service: fakeDiscordService(),
      },
    );
    const emptyResponse = await handleDiscordInteraction(
      autocompleteInteraction("level", "query", ""),
      {
        service: fakeDiscordService(),
      },
    );
    const errorResponse = await handleDiscordInteraction(
      autocompleteInteraction("records", "handle", "pla"),
      {
        service: fakeDiscordService({
          async search() {
            throw new Error("API unavailable");
          },
        }),
      },
    );

    expect(autocompleteChoices(levelResponse)[0]).toMatchObject({
      value: "Demo Level",
    });
    expect(autocompleteChoices(playerResponse)[0]).toMatchObject({
      value: "player",
    });
    expect(autocompleteChoices(emptyResponse)).toEqual([]);
    expect(autocompleteChoices(errorResponse)).toEqual([]);
    expect(containsSensitiveDiscordOutput(levelResponse)).toBe(false);
  });

  it("denies every staff command without the configured staff role", async () => {
    for (const commandName of getDiscordCommandGroups().staff) {
      const missingRole = await handleDiscordInteraction(
        staffInteractionFor(commandName, ["other-role"]),
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
        staffInteractionFor(commandName, ["staff-role"]),
        {
          service: fakeDiscordService(),
          env: {},
        },
      );

      expect(missingConfig).toEqual(missingRole);
    }
  });

  it("allows staff commands with the configured role and keeps replies ephemeral", async () => {
    for (const commandName of getDiscordCommandGroups().staff) {
      const response = await handleDiscordInteraction(
        staffInteractionFor(commandName, ["staff-role"]),
        {
          service: fakeDiscordService(),
          env: {
            DISCORD_STAFF_ROLE_ID: "staff-role",
            NEXT_PUBLIC_SITE_URL: "https://www.nerfeddemonlist.net",
          },
        },
      );
      const data = messageData(response);

      expect(data.flags).toBe(DiscordMessageFlags.Ephemeral);
      expect(containsSensitiveDiscordOutput(response)).toBe(false);
    }
  });

  it("truncates oversized embed content to Discord-safe limits", async () => {
    const response = await handleDiscordInteraction(
      commandInteraction("level", [{ name: "query", value: "long" }]),
      {
        service: fakeDiscordService({
          async search() {
            return {
              levels: [
                {
                  ...level,
                  name: "Long ".repeat(1200),
                  originalName: "Original ".repeat(400),
                  publisher: "Publisher ".repeat(400),
                  nerfCreator: "Nerfer ".repeat(400),
                  verifier: "Verifier ".repeat(400),
                  gdLevelId: "123",
                },
              ],
              players: [],
            };
          },
        }),
      },
    );
    const embed = messageData(response).embeds?.[0];

    expect(embed?.title?.length).toBeLessThanOrEqual(256);
    expect(embed?.description?.length).toBeLessThanOrEqual(4096);
    for (const field of embed?.fields ?? []) {
      expect(field.name.length).toBeLessThanOrEqual(256);
      expect(field.value.length).toBeLessThanOrEqual(1024);
    }
  });

  it("defines v1 public and staff command registration JSON", () => {
    expect(discordCommandDefinitions.map((command) => command.name)).toEqual([
      "top",
      "level",
      "player",
      "records",
      "recent",
      "search",
      "rules",
      "level-records",
      "leaderboard",
      "about",
      "status",
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
    expect(
      discordCommandDefinitions
        .find((command) => command.name === "top")
        ?.options?.find((option) => option.name === "status")?.choices,
    ).toEqual([
      { name: "ranked", value: "ranked" },
      { name: "legacy", value: "legacy" },
      { name: "all-public", value: "all-public" },
    ]);
    expect(
      discordCommandDefinitions
        .find((command) => command.name === "level")
        ?.options?.find((option) => option.name === "query")?.autocomplete,
    ).toBe(true);
    expect(
      discordCommandDefinitions
        .find((command) => command.name === "records")
        ?.options?.find((option) => option.name === "handle")?.autocomplete,
    ).toBe(true);
  });

  it("keeps route independent from DISCORD_BOT_TOKEN and documents Vercel HTTP mode", () => {
    const routeSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/discord/interactions/route.ts"),
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
    expect(docs).toContain("global commands may take time to propagate");
    expect(docs).toContain("/level-records");
    expect(docs).toContain("/leaderboard");
    expect(docs).toContain("/about");
    expect(docs).toContain("/status");
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
  options: Array<{
    name: string;
    value: string | number | boolean;
    focused?: boolean;
  }> = [],
  roles: string[] = [],
): DiscordInteraction {
  return {
    type: DiscordInteractionType.ApplicationCommand,
    data: {
      name,
      options,
    },
    member: {
      roles,
    },
  };
}

function autocompleteInteraction(
  name: string,
  optionName: string,
  value: string,
): DiscordInteraction {
  return {
    type: DiscordInteractionType.ApplicationCommandAutocomplete,
    data: {
      name,
      options: [{ name: optionName, value, focused: true }],
    },
    member: {
      roles: [],
    },
  };
}

function publicInteractionFor(commandName: string) {
  switch (commandName) {
    case "level":
      return commandInteraction(commandName, [{ name: "query", value: "demo" }]);
    case "player":
    case "records":
      return commandInteraction(commandName, [{ name: "handle", value: "player" }]);
    case "search":
      return commandInteraction(commandName, [{ name: "query", value: "demo" }]);
    case "level-records":
      return commandInteraction(commandName, [{ name: "level", value: "demo" }]);
    default:
      return commandInteraction(commandName);
  }
}

function staffInteractionFor(commandName: string, roles: string[]) {
  switch (commandName) {
    case "submission":
      return commandInteraction(commandName, [{ name: "id", value: "submission-1" }], roles);
    case "suggestion":
      return commandInteraction(commandName, [{ name: "id", value: "suggestion-1" }], roles);
    case "audit":
      return commandInteraction(commandName, [{ name: "query", value: "level" }], roles);
    default:
      return commandInteraction(commandName, [], roles);
  }
}

async function expectCommandText(
  interaction: DiscordInteraction,
  service: DiscordDataService,
  env: Record<string, string | undefined>,
  snippets: string[],
) {
  const response = await handleDiscordInteraction(interaction, { service, env });
  const serialized = JSON.stringify(response);

  for (const snippet of snippets) {
    expect(serialized).toContain(snippet);
  }
}

function messageData(response: DiscordInteractionResponse) {
  expect(response.type).toBe(
    DiscordInteractionResponseType.ChannelMessageWithSource,
  );

  if (response.type !== DiscordInteractionResponseType.ChannelMessageWithSource) {
    throw new Error("Expected a Discord message response.");
  }

  return response.data;
}

function autocompleteChoices(response: DiscordInteractionResponse) {
  expect(response.type).toBe(
    DiscordInteractionResponseType.ApplicationCommandAutocompleteResult,
  );

  if (
    response.type !==
    DiscordInteractionResponseType.ApplicationCommandAutocompleteResult
  ) {
    throw new Error("Expected a Discord autocomplete response.");
  }

  return response.data.choices;
}

function fakeDiscordService(
  overrides: Partial<DiscordDataService> = {},
): DiscordDataService {
  const base: DiscordDataService = {
    async getTopLevels(_limit = 10, status = "ranked") {
      void _limit;

      return status === "legacy" ? [legacyLevel] : [level, secondLevel];
    },
    async search() {
      return {
        levels: [level, secondLevel],
        players: [player],
      };
    },
    async getLevelRecords() {
      return {
        level,
        matches: [level, secondLevel],
        records: [record, secondRecord],
      };
    },
    async getLeaderboard() {
      return [
        {
          rank: 1,
          handle: "player",
          displayName: "Player One",
          points: 630,
          records: 2,
          lastRecordAt: "2026-01-02T00:00:00.000Z",
        },
      ];
    },
    async getPlayer() {
      return {
        player,
        summary: {
          rank: 1,
          handle: "player",
          displayName: "Player One",
          points: 630,
          records: 2,
          lastRecordAt: "2026-01-02T00:00:00.000Z",
        },
        records: [record, secondRecord],
      };
    },
    async getPlayerRecords() {
      return [record, secondRecord];
    },
    async getRecentRecords() {
      return [record, secondRecord];
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
    async getStatusStats() {
      return {
        apiReachable: true,
        rankedLevels: 2,
        legacyLevels: 1,
        acceptedRecords7d: 2,
        latestAcceptedAt: "2026-01-02T00:00:00.000Z",
        botMode: "Vercel HTTP interactions",
        generatedAt: "2026-01-02T00:00:00.000Z",
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
      return {
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
      };
    },
    async getSuggestion() {
      return {
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
      };
    },
    async getAudit() {
      return [
        {
          id: "audit-1",
          actor: {
            id: "user-1",
            handle: "admin",
            displayName: "Admin",
            role: "ADMIN",
          },
          action: "LEVEL_UPDATED",
          entityType: "LEVEL",
          entityId: "level-1",
          entityLabel: "Demo Level",
          before: null,
          after: null,
          note: null,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ];
    },
    async getStats() {
      return {
        pendingRecords: 1,
        pendingSuggestions: 2,
        rankedLevels: 3,
        legacyLevels: 1,
        users: 4,
        acceptedRecords: 5,
        acceptedRecords7d: 2,
        moderationActions24h: 6,
        auditEvents24h: 7,
        generatedAt: "2026-01-01T00:00:00.000Z",
      };
    },
  };

  return {
    ...base,
    ...overrides,
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

const secondLevel = {
  ...level,
  id: "level-2",
  slug: "second-level",
  rank: 2,
  name: "Second Level",
  points: 310,
} satisfies ApiLevel;

const legacyLevel = {
  ...level,
  id: "legacy-level",
  slug: "legacy-level",
  rank: null,
  name: "Legacy Level",
  status: "LEGACY",
  points: 25,
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

const secondRecord = {
  ...record,
  id: "record-2",
  level: secondLevel,
  pointsAwarded: 310,
  acceptedAt: "2026-01-02T00:00:00.000Z",
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
