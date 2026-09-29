import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { compareListRanks } from "../lib/list-rank-changes";

const currentRoleId = "1541547196808433685";
const staleRoleId = "1511407864613306621";
const sent: Record<string, unknown>[] = [];

beforeEach(() => {
  vi.resetModules();
  sent.length = 0;
  vi.stubEnv("DISCORD_BOT_TOKEN", "test-token");
  vi.stubEnv("DISCORD_GUILD_ID", "1541532007304003595");
  vi.stubEnv("DISCORD_NOTIFY_MENTION", `<@&${staleRoleId}>`);
  vi.stubEnv("DISCORD_STAFF_ROLE_ID", "");
  vi.stubEnv("DISCORD_OWNER_ID", "");
  vi.stubEnv("DISCORD_NOTIFY_USER_ID", "");
  vi.stubGlobal("fetch", vi.fn(async (url: string, options?: RequestInit) => {
    if (url.endsWith("/roles")) return Response.json([{ id: currentRoleId, name: "⚖️ List Moderator" }]);
    if (url.endsWith("/channels")) return Response.json([
      { id: "list-channel", name: "📰・list-updates", type: 0 },
      { id: "queue-channel", name: "📋・record-queue-logs", type: 0 },
    ]);
    if (options?.method === "POST") {
      sent.push(JSON.parse(String(options.body)));
      return Response.json({ id: "message" });
    }
    return new Response(null, { status: 204 });
  }));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("list update and staff notifications", () => {
  it("announces a removal and the actual shifts from #4 to #3 and #5 to #4", async () => {
    const shifts = compareListRanks([
      { id: "removed", name: "Removed Demon", rank: 3 },
      { id: "next", name: "Next Demon", rank: 4 },
      { id: "last", name: "Last Demon", rank: 5 },
    ], [
      { id: "next", name: "Next Demon", rank: 3 },
      { id: "last", name: "Last Demon", rank: 4 },
    ], "removed");
    const { notifyLevelUpdated } = await import("../lib/discord-notify");
    await notifyLevelUpdated({ levelName: "Removed Demon", levelSlug: "removed", oldRank: 3, newRank: null, status: "REMOVED", points: 0, rankChanges: shifts });
    expect(sent).toHaveLength(1);
    const embed = (sent[0].embeds as { title: string; fields: { value: string }[] }[])[0];
    expect(embed.title).toContain("Demon Removed — Removed Demon");
    expect(embed.fields.map((field) => field.value).join("\n")).toContain("**Next Demon**: #4 → **#3**");
    expect(embed.fields.map((field) => field.value).join("\n")).toContain("**Last Demon**: #5 → **#4**");
  });

  it("replaces a deleted configured role with the server's current moderator role", async () => {
    const { notifyNewSubmission } = await import("../lib/discord-notify");
    await notifyNewSubmission({ playerName: "Player", playerHandle: "player", levelName: "Demon", levelSlug: "demon", levelRank: 3, progress: 100, videoUrl: "https://example.com/run" });
    expect(sent[0].content).toContain(`<@&${currentRoleId}>`);
    expect(sent[0].content).not.toContain(staleRoleId);
    expect(sent[0].allowed_mentions).toEqual({ parse: [], users: [], roles: [currentRoleId] });
  });

  it("validates the staff role setting when there is no custom mention", async () => {
    vi.stubEnv("DISCORD_NOTIFY_MENTION", "");
    vi.stubEnv("DISCORD_STAFF_ROLE_ID", staleRoleId);
    const { resolveStaffMention } = await import("../lib/discord-notify");
    expect(await resolveStaffMention("1541532007304003595", "test-token")).toBe(`<@&${currentRoleId}>`);
  });

  it("omits invalid roles when the server has no matching moderator role", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json([])));
    const { resolveStaffMention } = await import("../lib/discord-notify");
    const mention = await resolveStaffMention("1541532007304003595", "test-token");
    expect(mention).not.toContain("<@&");
  });

  it("keeps large rank-shift reports within Discord embed limits", async () => {
    const { notifyLevelUpdated } = await import("../lib/discord-notify");
    await notifyLevelUpdated({ levelName: "Removed", levelSlug: "removed", oldRank: 1, newRank: null, status: "REMOVED", points: 0,
      rankChanges: Array.from({ length: 150 }, (_, index) => ({ levelName: "A long demon name ".repeat(8), oldRank: index + 2, newRank: index + 1 })),
    });
    const embed = (sent[0].embeds as { title: string; description: string; fields: { name: string; value: string }[] }[])[0];
    expect(embed.fields.every((field) => field.value.length <= 1024)).toBe(true);
    const total = embed.title.length + embed.description.length + embed.fields.reduce((count, field) => count + field.name.length + field.value.length, 0);
    expect(total).toBeLessThan(5800);
    expect(embed.fields.some((field) => field.name === "More changes")).toBe(true);
  });
});
