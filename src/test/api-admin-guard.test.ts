import { describe, expect, it } from "vitest";
import { requireApiAdmin } from "@/lib/api-admin-guard";

describe("API Admin Guard", () => {
  it("authorizes requests with a valid Bearer token", async () => {
    process.env.BOT_API_SECRET = "test-secret-12345";

    const request = new Request("https://example.com/api/admin/test", {
      headers: {
        authorization: "Bearer test-secret-12345",
      },
    });

    const result = await requireApiAdmin(request);
    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.actor.isService).toBe(true);
    }
  });

  it("authorizes requests with an active Admin session", async () => {
    const request = new Request("https://example.com/api/admin/test");
    const mockGetUser = async () => ({
      id: "admin-1",
      playerName: "ndl_admin",
      role: "ADMIN",
    });

    const result = await requireApiAdmin(request, mockGetUser);
    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.actor.id).toBe("admin-1");
      expect(result.actor.isService).toBe(false);
    }
  });

  it("rejects non-admin users", async () => {
    const request = new Request("https://example.com/api/admin/test");
    const mockGetUser = async () => ({
      id: "player-1",
      playerName: "regular_player",
      role: "PLAYER",
    });

    const result = await requireApiAdmin(request, mockGetUser);
    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(401);
    }
  });

  it("rejects requests with an invalid Bearer token", async () => {
    process.env.BOT_API_SECRET = "test-secret-12345";

    const request = new Request("https://example.com/api/admin/test", {
      headers: {
        authorization: "Bearer wrong-secret",
      },
    });

    const result = await requireApiAdmin(request, async () => null);
    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(401);
    }
  });

  it("rejects unauthenticated requests without token or session", async () => {
    const request = new Request("https://example.com/api/admin/test");
    const result = await requireApiAdmin(request, async () => null);
    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(401);
    }
  });
});
