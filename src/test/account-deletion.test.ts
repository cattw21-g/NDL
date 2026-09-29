import { describe, expect, it, vi } from "vitest";

import { deleteAccountData } from "../lib/account-deletion";
import type { PrismaClient } from "../generated/prisma/client";

function fakeClient(sharedCount: number) {
  const tx = {
    applicationOpening: { count: vi.fn().mockResolvedValue(sharedCount), updateMany: vi.fn().mockResolvedValue({ count: sharedCount }) },
    applicationNote: { count: vi.fn().mockResolvedValue(sharedCount), updateMany: vi.fn().mockResolvedValue({ count: sharedCount }) },
    moderationAction: { count: vi.fn().mockResolvedValue(sharedCount), updateMany: vi.fn().mockResolvedValue({ count: sharedCount }) },
    discordSyncJob: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    user: {
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
