import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdmin, requireUser, prismaUpdate, prismaFindUnique, revalidatePath } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  requireUser: vi.fn(),
  prismaUpdate: vi.fn(),
  prismaFindUnique: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requireAdmin, requireUser }));
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
import { serializePublicPlayer } from "../lib/api-serializers";

describe("admin user city privacy & management", () => {
  beforeEach(() => {
    requireAdmin.mockReset().mockResolvedValue({ id: "admin-id", playerName: "admin", role: "ADMIN" });
    requireUser.mockReset().mockResolvedValue({ id: "user-id", playerName: "player1", displayName: "Player One" });
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

  it("strictly excludes city from public player serialization", () => {
    const publicPlayer = serializePublicPlayer({
      id: "user-123",
      playerName: "publicplayer",
      displayName: "Public Player",
      bio: "Hello world",
      createdAt: new Date("2026-01-01"),
      // @ts-expect-error city should not exist in public player
      city: "Secret City",
    });

    expect(publicPlayer).not.toHaveProperty("city");
    expect(Object.keys(publicPlayer)).toEqual(["id", "handle", "displayName", "bio", "createdAt"]);
  });
});
