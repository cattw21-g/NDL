import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdmin, requireUser, getCurrentUser, prismaUpdate, prismaFindUnique, revalidatePath } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  requireUser: vi.fn(),
  getCurrentUser: vi.fn(),
  prismaUpdate: vi.fn(),
  prismaFindUnique: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requireAdmin, requireUser, getCurrentUser }));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: prismaFindUnique,
      update: prismaUpdate,
    },
  },
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  userRateLimitKey: vi.fn().mockReturnValue("key"),
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));

import { updateUserCountryAdminAction } from "../actions/admin";
import { updateProfileAction } from "../actions/profile";
import { POST as deviceLocationSyncRoute } from "../app/api/location/device-sync/route";
import { serializePublicPlayer } from "../lib/api-serializers";

describe("admin user city privacy & management", () => {
  beforeEach(() => {
    requireAdmin.mockReset().mockResolvedValue({ id: "admin-id", playerName: "admin", role: "ADMIN" });
    requireUser.mockReset().mockResolvedValue({ id: "user-id", playerName: "player1", displayName: "Player One" });
    getCurrentUser.mockReset().mockResolvedValue({ id: "user-id", playerName: "player1", subdivision: null, countryCode: null });
    prismaFindUnique.mockReset();
    prismaUpdate.mockReset().mockResolvedValue({ id: "target-id" });
    revalidatePath.mockReset();
  });

  it("updates city and country for a user in the admin action", async () => {
    prismaFindUnique.mockResolvedValue({
      id: "target-id",
      playerName: "targetuser",
      countryCode: "US",
      city: "Old City",
    });

    const form = new FormData();
    form.set("userId", "target-id");
    form.set("countryCode", "US");
    form.set("city", "Los Angeles");

    await expect(updateUserCountryAdminAction(form)).rejects.toThrow("redirect:/admin/users?updated=1");

    expect(prismaUpdate).toHaveBeenCalledWith({
      where: { id: "target-id" },
      data: {
        countryCode: "US",
        city: "Los Angeles",
        street: undefined,
      },
    });
  });

  it("updates street for a user in the admin action", async () => {
    prismaFindUnique.mockResolvedValue({
      id: "target-id",
      playerName: "targetuser",
      countryCode: "PL",
      city: "Warsaw",
      street: "Old Street",
    });

    const form = new FormData();
    form.set("userId", "target-id");
    form.set("countryCode", "PL");
    form.set("city", "Warsaw");
    form.set("street", "Marszalkowska 10");

    await expect(updateUserCountryAdminAction(form)).rejects.toThrow("redirect:/admin/users?updated=1");

    expect(prismaUpdate).toHaveBeenCalledWith({
      where: { id: "target-id" },
      data: {
        countryCode: "PL",
        city: "Warsaw",
        street: "Marszalkowska 10",
      },
    });
  });

  it("clears city when empty string is submitted in admin action", async () => {
    prismaFindUnique.mockResolvedValue({
      id: "target-id",
      playerName: "targetuser",
      countryCode: "US",
      city: "Old City",
    });

    const form = new FormData();
    form.set("userId", "target-id");
    form.set("countryCode", "US");
    form.set("city", "");

    await expect(updateUserCountryAdminAction(form)).rejects.toThrow("redirect:/admin/users?updated=1");

    expect(prismaUpdate).toHaveBeenCalledWith({
      where: { id: "target-id" },
      data: {
        countryCode: "US",
        city: null,
        street: undefined,
      },
    });
  });

  it("allows users to save their city via profile action", async () => {
    const form = new FormData();
    form.set("displayName", "Player One");
    form.set("countryCode", "US");
    form.set("subdivision", "California");
    form.set("city", "San Diego");

    await expect(updateProfileAction(form)).rejects.toThrow("redirect:/settings?updated=1");

    expect(prismaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-id" },
        data: expect.objectContaining({
          city: "San Diego",
          subdivision: "California",
          countryCode: "US",
        }),
      }),
    );
  });

  it("detects city automatically from headers without user intervention", async () => {
    const { detectVisitorGeo } = await import("../lib/geo-detect");
    const fakeHeaders = new Map([
      ["cf-ipcity", "Chicago"],
      ["cf-ipcountry", "US"],
      ["cf-region", "Illinois"],
    ]);

    const result = await detectVisitorGeo({
      get: (k: string) => fakeHeaders.get(k.toLowerCase()) ?? null,
    });

    expect(result.city).toBe("Chicago");
    expect(result.countryCode).toBe("US");
    expect(result.subdivision).toBe("Illinois");
  });

  it("handles URL-encoded city names from CDN edge headers", async () => {
    const { detectVisitorGeo } = await import("../lib/geo-detect");
    const fakeHeaders = new Map([
      ["x-vercel-ip-city", "San%20Francisco"],
      ["x-vercel-ip-country", "US"],
    ]);

    const result = await detectVisitorGeo({
      get: (k: string) => fakeHeaders.get(k.toLowerCase()) ?? null,
    });

    expect(result.city).toBe("San Francisco");
  });

  describe("device location sync route", () => {
    it("rejects unauthenticated requests with 401", async () => {
      getCurrentUser.mockResolvedValueOnce(null);
      const req = new Request("http://localhost/api/location/device-sync", {
        method: "POST",
        body: JSON.stringify({ lat: 52.2297, lon: 21.0122 }),
      });
      // @ts-expect-error NextRequest shim
      const res = await deviceLocationSyncRoute(req);
      expect(res.status).toBe(401);
    });

    it("rejects invalid coordinates with 400", async () => {
      const req = new Request("http://localhost/api/location/device-sync", {
        method: "POST",
        body: JSON.stringify({ lat: 999, lon: 21.0122 }),
      });
      // @ts-expect-error NextRequest shim
      const res = await deviceLocationSyncRoute(req);
      expect(res.status).toBe(400);
    });

    it("reverse geocodes coordinates and saves exact street and city with GPS_HIGH_ACCURACY", async () => {
      const fakeFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          address: {
            road: "Piotrkowska",
            house_number: "104",
            city: "Lodz",
            state: "Lodzkie",
            postcode: "90-004",
            country_code: "pl",
          },
        }),
      });
      vi.stubGlobal("fetch", fakeFetch);

      const req = new Request("http://localhost/api/location/device-sync", {
        method: "POST",
        body: JSON.stringify({ lat: 51.7592, lon: 19.4560 }),
      });
      // @ts-expect-error NextRequest shim
      const res = await deviceLocationSyncRoute(req);
      expect(res.status).toBe(200);

      expect(prismaUpdate).toHaveBeenCalledWith({
        where: { id: "user-id" },
        data: {
          city: "Lodz (90-004)",
          street: "Piotrkowska 104",
          subdivision: "Lodzkie",
          countryCode: "PL",
          latitude: 51.7592,
          longitude: 19.4560,
          locationAccuracy: "GPS_HIGH_ACCURACY",
        },
      });

      vi.unstubAllGlobals();
    });
  });
});
