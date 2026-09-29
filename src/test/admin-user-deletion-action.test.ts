import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdmin, deleteAccountAsAdmin, revalidatePath } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  deleteAccountAsAdmin: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requireAdmin }));
vi.mock("@/lib/account-deletion", () => ({ deleteAccountAsAdmin }));
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));

import { deleteUserAsAdminAction } from "../actions/admin-user-deletion";

function deletionForm() {
  const form = new FormData();
  form.set("userId", "target-id");
  form.set("playerName", "target");
  return form;
}

describe("admin user deletion action", () => {
  beforeEach(() => {
    requireAdmin.mockReset().mockResolvedValue({ id: "admin-id", playerName: "admin", role: "ADMIN" });
    deleteAccountAsAdmin.mockReset().mockResolvedValue("deleted");
    revalidatePath.mockReset();
  });

  it("requires admin authorization", async () => {
    requireAdmin.mockRejectedValue(new Error("unauthorized"));
    await expect(deleteUserAsAdminAction(deletionForm())).rejects.toThrow("unauthorized");
    expect(deleteAccountAsAdmin).not.toHaveBeenCalled();
  });

  it("rejects a malformed target ID", async () => {
    const form = deletionForm();
    form.set("userId", "../wrong");
    await expect(deleteUserAsAdminAction(form)).rejects.toThrow("error=invalid");
    expect(deleteAccountAsAdmin).not.toHaveBeenCalled();
  });

  it("deletes the selected account with just the button's target fields", async () => {
    await expect(deleteUserAsAdminAction(deletionForm())).rejects.toThrow("redirect:/admin/users?deleted=1");
    expect(deleteAccountAsAdmin).toHaveBeenCalledWith({}, expect.objectContaining({ id: "admin-id" }), "target-id", "target");
    expect(revalidatePath).toHaveBeenCalledWith("/players/target");
  });

  it("does not report success when the deletion service refuses", async () => {
    deleteAccountAsAdmin.mockResolvedValue("last-admin");
    await expect(deleteUserAsAdminAction(deletionForm())).rejects.toThrow("error=last-admin");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
