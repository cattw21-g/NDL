import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireUser, isCurrentSessionRecent, deleteAccountData, deleteCookie } = vi.hoisted(() => ({
  requireUser: vi.fn(),
  isCurrentSessionRecent: vi.fn(),
  deleteAccountData: vi.fn(),
  deleteCookie: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requireUser, isCurrentSessionRecent }));
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/account-deletion", () => ({ deleteAccountData }));
vi.mock("next/headers", () => ({ cookies: async () => ({ delete: deleteCookie }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));

import { deleteOwnAccountAction } from "../actions/account-deletion";

describe("delete own account action", () => {
  beforeEach(() => {
    requireUser.mockReset().mockResolvedValue({ id: "session-owner", playerName: "Alice" });
    isCurrentSessionRecent.mockReset().mockResolvedValue(true);
    deleteAccountData.mockReset().mockResolvedValue(undefined);
    deleteCookie.mockReset();
  });

  it("rejects a stale session without touching the database", async () => {
    isCurrentSessionRecent.mockResolvedValue(false);
    const form = new FormData();
    form.set("confirmation", "DELETE Alice");
    form.set("understood", "yes");
    await expect(deleteOwnAccountAction(form)).rejects.toThrow("redirect:/settings/delete-account?error=");
    expect(deleteAccountData).not.toHaveBeenCalled();
  });

  it("only deletes the signed-in account after exact confirmation", async () => {
    const wrongForm = new FormData();
    wrongForm.set("confirmation", "DELETE Bob");
    wrongForm.set("understood", "yes");
    await expect(deleteOwnAccountAction(wrongForm)).rejects.toThrow("redirect:/settings/delete-account?error=");
    expect(deleteAccountData).not.toHaveBeenCalled();

    const form = new FormData();
    form.set("confirmation", "DELETE Alice");
    form.set("understood", "yes");
    await expect(deleteOwnAccountAction(form)).rejects.toThrow("redirect:/login?deleted=1");
    expect(deleteAccountData).toHaveBeenCalledWith({}, "session-owner");
    expect(deleteCookie).toHaveBeenCalledWith("ndl_session");
  });
});
