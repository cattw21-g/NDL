import { describe, expect, it, vi } from "vitest";

import { deleteAccountAsAdmin, deleteAccountData } from "../lib/account-deletion";
import type { PrismaClient } from "../generated/prisma/client";

function fakeClient(sharedCount: number) {
  const tx = {
    adminAuditLog: { create: vi.fn().mockResolvedValue({ id: "audit" }) },
    applicationOpening: { count: vi.fn().mockResolvedValue(sharedCount), updateMany: vi.fn().mockResolvedValue({ count: sharedCount }) },
    applicationNote: { count: vi.fn().mockResolvedValue(sharedCount), updateMany: vi.fn().mockResolvedValue({ count: sharedCount }) },
    moderationAction: { count: vi.fn().mockResolvedValue(sharedCount), updateMany: vi.fn().mockResolvedValue({ count: sharedCount }) },
    discordSyncJob: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: "account-to-delete", email: "user@example.com", playerName: "target", displayName: "Target", role: "PLAYER" }),
      count: vi.fn().mockResolvedValue(1),
      upsert: vi.fn().mockResolvedValue({ id: "system-user" }),
      delete: vi.fn().mockResolvedValue({ id: "account-to-delete" }),
    },
  };
  const client = {
    $transaction: async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx),
  } as unknown as PrismaClient;
  return { client, tx };
}

describe("self-service account deletion", () => {
  it("preserves shared staff content before deleting the account", async () => {
    const { client, tx } = fakeClient(1);
    await deleteAccountData(client, "account-to-delete");

    expect(tx.applicationOpening.updateMany).toHaveBeenCalledWith({
      where: { createdById: "account-to-delete" },
      data: { createdById: "system-user" },
    });
    expect(tx.applicationNote.updateMany).toHaveBeenCalledWith({
      where: { authorId: "account-to-delete" },
      data: { authorId: "system-user" },
    });
    expect(tx.moderationAction.updateMany).toHaveBeenCalledWith({
      where: { actorId: "account-to-delete" },
      data: { actorId: "system-user" },
    });
    expect(tx.user.delete).toHaveBeenCalledWith({ where: { id: "account-to-delete" } });
  });

  it("does not create a placeholder owner for an ordinary account", async () => {
    const { client, tx } = fakeClient(0);
    await deleteAccountData(client, "account-to-delete");

    expect(tx.user.upsert).not.toHaveBeenCalled();
    expect(tx.user.delete).toHaveBeenCalledTimes(1);
  });
});

const admin = { id: "admin-user", playerName: "admin", displayName: "Admin", role: "ADMIN" };

describe("administrator account deletion", () => {
  it("audits and deletes a confirmed other user's account", async () => {
    const { client, tx } = fakeClient(1);
    expect(await deleteAccountAsAdmin(client, admin, "account-to-delete", "target")).toBe("deleted");
    expect(tx.adminAuditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      action: "USER_DELETED", actorUserId: "admin-user", entityId: "account-to-delete",
    }) });
    expect(tx.user.delete).toHaveBeenCalledWith({ where: { id: "account-to-delete" } });
  });

  it("rejects self-deletion, stale usernames, and protected accounts", async () => {
    const { client, tx } = fakeClient(0);
    tx.user.findUnique.mockResolvedValueOnce({ id: "admin-user", playerName: "admin" })
      .mockResolvedValueOnce({ id: "account-to-delete", email: "user@example.com", playerName: "changed" })
      .mockResolvedValueOnce({ id: "account-to-delete", email: "deleted-account@nerfeddemonlist.invalid", playerName: "target" });
    expect(await deleteAccountAsAdmin(client, admin, "admin-user", "admin")).toBe("self");
    expect(await deleteAccountAsAdmin(client, admin, "account-to-delete", "target")).toBe("changed");
    expect(await deleteAccountAsAdmin(client, admin, "account-to-delete", "target")).toBe("protected");
    expect(tx.user.delete).not.toHaveBeenCalled();
    expect(tx.adminAuditLog.create).not.toHaveBeenCalled();
  });

  it("does not delete the final admin", async () => {
    const { client, tx } = fakeClient(0);
    tx.user.findUnique.mockResolvedValue({ id: "account-to-delete", email: "other@example.com", playerName: "target", role: "ADMIN" });
    tx.user.count.mockResolvedValue(0);
    expect(await deleteAccountAsAdmin(client, admin, "account-to-delete", "target")).toBe("last-admin");
    expect(tx.user.delete).not.toHaveBeenCalled();
  });
});
