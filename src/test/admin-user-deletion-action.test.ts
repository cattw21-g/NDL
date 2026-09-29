import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdmin, isCurrentSessionRecent, deleteAccountAsAdmin, revalidatePath } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  isCurrentSessionRecent: vi.fn(),
  deleteAccountAsAdmin: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requireAdmin, isCurrentSessionRecent }));
vi.mock("@/lib/account-deletion", () => ({ deleteAccountAsAdmin }));
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));

import { deleteUserAsAdminAction } from "../actions/admin-user-deletion";

function confirmationForm(value = "DELETE @target") {
  const form = new FormData();
  form.set("userId", "target-id");
  form.set("playerName", "target");
  form.set("confirmation", value);
  form.set("understood", "yes");
  return form;
}

describe("admin user deletion action", () => {
  beforeEach(() => {
    requireAdmin.mockReset().mockResolvedValue({ id: "admin-id", playerName: "admin", role: "ADMIN" });
    isCurrentSessionRecent.mockReset().mockResolvedValue(true);
    deleteAccountAsAdmin.mockReset().mockResolvedValue("deleted");
    revalidatePath.mockReset();
  });

  it("requires admin authorization", async () => {
    requireAdmin.mockRejectedValue(new Error("unauthorized"));
    await expect(deleteUserAsAdminAction(confirmationForm())).rejects.toThrow("unauthorized");
    expect(deleteAccountAsAdmin).not.toHaveBeenCalled();
  });

  it("requires a recent session and exact confirmation", async () => {
    isCurrentSessionRecent.mockResolvedValueOnce(false);
    await expect(deleteUserAsAdminAction(confirmationForm())).rejects.toThrow("session-expired");
    await expect(deleteUserAsAdminAction(confirmationForm("DELETE @wrong"))).rejects.toThrow("invalid-confirmation");
    expect(deleteAccountAsAdmin).not.toHaveBeenCalled();
  });

  it("deletes only the selected account after server-side checks", async () => {
    await expect(deleteUserAsAdminAction(confirmationForm())).rejects.toThrow("redirect:/admin/users?deleted=1");
    expect(deleteAccountAsAdmin).toHaveBeenCalledWith({}, expect.objectContaining({ id: "admin-id" }), "target-id", "target");
    expect(revalidatePath).toHaveBeenCalledWith("/players/target");
  });

  it("does not report success when the deletion service refuses", async () => {
    deleteAccountAsAdmin.mockResolvedValue("last-admin");
    await expect(deleteUserAsAdminAction(confirmationForm())).rejects.toThrow("error=last-admin");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
