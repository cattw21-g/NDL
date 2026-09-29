import { randomBytes } from "node:crypto";

import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { writeAuditLog, type AuditActor } from "@/lib/audit-log";
import { hashPassword } from "@/lib/password-hashing";

const DELETED_ACCOUNT_EMAIL = "deleted-account@nerfeddemonlist.invalid";

/** Preserve shared staff content before deleting a user's private account data. */
export async function deleteAccountData(client: PrismaClient, userId: string) {
  const systemPasswordHash = await hashPassword(randomBytes(32).toString("hex"));

  await client.$transaction(async (tx) => {
    await deleteAccountDataInTransaction(tx, userId, systemPasswordHash);
  });
}

async function deleteAccountDataInTransaction(
  tx: Prisma.TransactionClient,
  userId: string,
  systemPasswordHash: string,
) {
  const [openings, notes, actions] = await Promise.all([
    tx.applicationOpening.count({ where: { createdById: userId } }),
    tx.applicationNote.count({ where: { authorId: userId } }),
    tx.moderationAction.count({ where: { actorId: userId } }),
  ]);

  if (openings + notes + actions > 0) {
    const system = await tx.user.upsert({
      where: { email: DELETED_ACCOUNT_EMAIL },
      update: {},
      create: {
        email: DELETED_ACCOUNT_EMAIL,
        playerName: "deleted_account_system",
        displayName: "Deleted account",
        passwordHash: systemPasswordHash,
        isDemo: true,
        isSubmissionLocked: true,
      },
    });

    await tx.applicationOpening.updateMany({
      where: { createdById: userId },
      data: { createdById: system.id },
    });
    await tx.applicationNote.updateMany({
      where: { authorId: userId },
      data: { authorId: system.id },
    });
    await tx.moderationAction.updateMany({
      where: { actorId: userId },
      data: { actorId: system.id },
    });
  }

  await tx.discordSyncJob.deleteMany({ where: { userId } });
  await tx.user.delete({ where: { id: userId } });
}

export async function deleteAccountAsAdmin(
  client: PrismaClient,
  actor: AuditActor & { id: string },
  userId: string,
  expectedPlayerName: string,
): Promise<"deleted" | "missing" | "self" | "changed" | "last-admin" | "protected"> {
  const systemPasswordHash = await hashPassword(randomBytes(32).toString("hex"));

  return client.$transaction(async (tx) => {
    const target = await tx.user.findUnique({ where: { id: userId } });
    if (!target) return "missing";
    if (target.id === actor.id) return "self";
    if (target.email === DELETED_ACCOUNT_EMAIL) return "protected";
    if (target.playerName !== expectedPlayerName) return "changed";
    if (target.role === "ADMIN") {
      const otherAdmins = await tx.user.count({
        where: { role: "ADMIN", id: { not: target.id } },
      });
      if (otherAdmins === 0) return "last-admin";
    }

    await writeAuditLog(tx, {
      actor,
      action: "USER_DELETED",
      entityType: "User",
      entityId: target.id,
      entityLabel: target.playerName,
      before: { playerName: target.playerName, displayName: target.displayName, role: target.role },
      after: { deleted: true },
      note: "Account deleted by an administrator. User-owned records and submissions were removed; shared level and staff content was preserved.",
    });
    await deleteAccountDataInTransaction(tx, target.id, systemPasswordHash);
    return "deleted";
  }, { isolationLevel: "Serializable" });
}
