import { randomBytes } from "node:crypto";

import type { PrismaClient } from "@/generated/prisma/client";
import { hashPassword } from "@/lib/password-hashing";

const DELETED_ACCOUNT_EMAIL = "deleted-account@nerfeddemonlist.invalid";

/** Preserve shared staff content before deleting a user's private account data. */
export async function deleteAccountData(client: PrismaClient, userId: string) {
  const systemPasswordHash = await hashPassword(randomBytes(32).toString("hex"));

  await client.$transaction(async (tx) => {
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
  });
}
