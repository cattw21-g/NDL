"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getCurrentUser, requireAdmin, revokeAllUserSessions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit-log";
import { checkRateLimit, userRateLimitKey } from "@/lib/rate-limit";
import { extractClientIp, hashClientIp } from "@/lib/anti-alt";
import { syncAllLinkedDiscordUsers } from "@/lib/discord-role-sync";
import { generateSecureBetaKey, normalizeBetaKey, isValidBetaKeyFormat } from "@/lib/beta-keys";
import { ensureBetaKeysSchema } from "@/lib/ensure-beta-keys-schema";
import { isAllowedInClosedBeta } from "@/lib/closed-beta";

export type BetaKeyActionResult = {
  success: boolean;
  message?: string;
  error?: string;
  keys?: string[];
};

/**
 * Admin action to batch-generate single-use Beta Invite Keys.
 */
export async function generateBetaKeysAction(
  formData: FormData,
): Promise<BetaKeyActionResult> {
  const admin = await requireAdmin();
  await ensureBetaKeysSchema();

  const rawCount = formData.get("count");
  const count = Math.min(Math.max(Number(rawCount) || 1, 1), 50);
  const rawNotes = formData.get("notes");
  const notes = typeof rawNotes === "string" && rawNotes.trim().length > 0
    ? rawNotes.trim().slice(0, 200)
    : null;
  const rawDays = formData.get("expiresInDays");
  const expiresInDays = Number(rawDays) > 0 ? Number(rawDays) : null;
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const generatedKeys: string[] = [];

  for (let i = 0; i < count; i++) {
    let key = generateSecureBetaKey();
    let attempts = 0;
    while (attempts < 5 && (await prisma.betaInviteKey.findUnique({ where: { key } }))) {
      key = generateSecureBetaKey();
      attempts++;
    }

    await prisma.betaInviteKey.create({
      data: {
        key,
        createdById: admin.id,
        notes,
        expiresAt,
      },
    });

    generatedKeys.push(key);
  }

  await writeAuditLog(prisma, {
    actor: {
      id: admin.id,
      playerName: admin.playerName,
      displayName: admin.displayName,
      role: admin.role,
    },
    action: "BETA_KEYS_GENERATED",
    entityType: "BetaInviteKey",
    entityId: generatedKeys[0] || "batch",
    entityLabel: `${count} Beta Invite Key(s)`,
    after: {
      count,
      notes,
      expiresAt,
      sampleKey: generatedKeys[0],
    },
    note: `Generated ${count} single-use beta invite key(s).`,
  });

  revalidatePath("/admin/beta-keys");
  return {
    success: true,
    message: `Successfully generated ${count} single-use Beta Key(s).`,
    keys: generatedKeys,
  };
}

/**
 * Redeems a 1-time Beta Invite Key for the current user.
 */
export async function redeemBetaKeyAction(
  formData: FormData,
): Promise<BetaKeyActionResult> {
  await ensureBetaKeysSchema();

  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "Please sign in or create an account first to redeem your Beta Key.",
    };
  }

  const rawKey = formData.get("key");
  if (typeof rawKey !== "string" || !rawKey.trim()) {
    return {
      success: false,
      error: "Please enter a valid Beta Invite Key.",
    };
  }

  const normalizedKey = normalizeBetaKey(rawKey);
  if (!isValidBetaKeyFormat(normalizedKey)) {
    return {
      success: false,
      error: "Invalid Beta Key format. Expected format: NDL-XXXX-YYYY.",
    };
  }

  // Already authorized check
  if (isAllowedInClosedBeta(user.role, user.playerName)) {
    return {
      success: true,
      message: "Your account is already authorized for Closed Beta testing!",
    };
  }

  // Anti-Brute Force Rate Limiting: Max 5 failed attempts per 10 minutes
  const headerList = await headers();
  const clientIp = extractClientIp(headerList);
  const ipHash = hashClientIp(clientIp);

  const rateLimit = await checkRateLimit(
    prisma,
    "beta-key-redeem",
    userRateLimitKey(user.id),
  );
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: "Too many key redemption attempts. Please wait 10 minutes before trying again.",
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const inviteKey = await tx.betaInviteKey.findUnique({
        where: { key: normalizedKey },
        include: { redeemedBy: true },
      });

      if (!inviteKey) {
        return {
          status: "not_found" as const,
        };
      }

      if (inviteKey.isRevoked) {
        return {
          status: "revoked" as const,
        };
      }

      if (inviteKey.expiresAt && inviteKey.expiresAt < new Date()) {
        return {
          status: "expired" as const,
        };
      }

      if (inviteKey.redeemedById) {
        return {
          status: "already_redeemed" as const,
          redeemedByName: inviteKey.redeemedBy?.displayName ?? "another tester",
          redeemedAt: inviteKey.redeemedAt,
        };
      }

      // 1. Mark key as redeemed
      await tx.betaInviteKey.update({
        where: { id: inviteKey.id },
        data: {
          redeemedById: user.id,
          redeemedAt: new Date(),
          redeemedIp: ipHash,
        },
      });

      // 2. Promote user to BETA_TESTER
      await tx.user.update({
        where: { id: user.id },
        data: {
          role: "BETA_TESTER",
        },
      });

      // 3. Create Welcome notification
      await tx.userNotification.create({
        data: {
          userId: user.id,
          title: "🧪 Welcome to Closed Beta!",
          message: "Your Beta Key has been verified. You now have full access to explore the list and test submissions.",
          link: "/",
        },
      });

      // 4. Audit Log
      await writeAuditLog(tx, {
        actor: {
          id: user.id,
          playerName: user.playerName,
          displayName: user.displayName,
          role: "BETA_TESTER",
        },
        action: "BETA_KEY_REDEEMED",
        entityType: "BetaInviteKey",
        entityId: inviteKey.id,
        entityLabel: inviteKey.key,
        before: { role: user.role, key: inviteKey.key },
        after: { role: "BETA_TESTER", redeemedById: user.id },
        note: `User @${user.playerName} redeemed beta invite key ${inviteKey.key}.`,
      });

      return { status: "success" as const };
    });

    if (result.status === "not_found") {
      return {
        success: false,
        error: "Beta Key not found. Please double-check your code and try again.",
      };
    }

    if (result.status === "revoked") {
      return {
        success: false,
        error: "This Beta Key has been revoked by an administrator.",
      };
    }

    if (result.status === "expired") {
      return {
        success: false,
        error: "This Beta Key has expired. Please request a new invite key.",
      };
    }

    if (result.status === "already_redeemed") {
      return {
        success: false,
        error: `This Beta Key has already been redeemed and cannot be shared.`,
      };
    }

    // Trigger background Discord role sync for the newly promoted tester
    void syncAllLinkedDiscordUsers().catch((err) => {
      console.error("Discord role sync on beta key redeem:", err);
    });

    revalidatePath("/");
    revalidatePath("/admin/beta-keys");
    revalidatePath("/beta/feedback");

    return {
      success: true,
      message: "🎉 Beta Key verified! Welcome to the Nerfed Demonlist Closed Beta.",
    };
  } catch (err) {
    console.error("Failed to redeem beta key:", err);
    return {
      success: false,
      error: "An unexpected error occurred while verifying your key. Please try again.",
    };
  }
}

/**
 * Revokes a Beta Invite Key. If already redeemed, demotes user back to PLAYER.
 */
export async function revokeBetaKeyAction(
  formData: FormData,
): Promise<BetaKeyActionResult> {
  const admin = await requireAdmin();
  await ensureBetaKeysSchema();

  const keyId = formData.get("keyId");
  if (typeof keyId !== "string" || !keyId.trim()) {
    return { success: false, error: "Missing key ID." };
  }

  const inviteKey = await prisma.betaInviteKey.findUnique({
    where: { id: keyId.trim() },
    include: { redeemedBy: true },
  });

  if (!inviteKey) {
    return { success: false, error: "Key not found." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.betaInviteKey.update({
      where: { id: inviteKey.id },
      data: { isRevoked: true },
    });

    // If key was redeemed and user is still BETA_TESTER, demote back to PLAYER
    if (inviteKey.redeemedById && inviteKey.redeemedBy?.role === "BETA_TESTER") {
      await tx.user.update({
        where: { id: inviteKey.redeemedById },
        data: { role: "PLAYER" },
      });

      await revokeAllUserSessions(inviteKey.redeemedById);

      await tx.userNotification.create({
        data: {
          userId: inviteKey.redeemedById,
          title: "Beta Access Revoked",
          message: "Your Beta Tester access has been revoked by an administrator.",
          link: "/",
        },
      });
    }

    await writeAuditLog(tx, {
      actor: {
        id: admin.id,
        playerName: admin.playerName,
        displayName: admin.displayName,
        role: admin.role,
      },
      action: "BETA_KEY_REVOKED",
      entityType: "BetaInviteKey",
      entityId: inviteKey.id,
      entityLabel: inviteKey.key,
      note: `Revoked beta key ${inviteKey.key}${
        inviteKey.redeemedBy ? ` (redeemed by @${inviteKey.redeemedBy.playerName})` : ""
      }.`,
    });
  });

  void syncAllLinkedDiscordUsers().catch(() => {});

  revalidatePath("/admin/beta-keys");
  return { success: true, message: "Beta Key revoked successfully." };
}

/**
 * Deletes an unredeemed Beta Invite Key.
 */
export async function deleteBetaKeyAction(
  formData: FormData,
): Promise<BetaKeyActionResult> {
  const admin = await requireAdmin();
  await ensureBetaKeysSchema();

  const keyId = formData.get("keyId");
  if (typeof keyId !== "string" || !keyId.trim()) {
    return { success: false, error: "Missing key ID." };
  }

  await prisma.betaInviteKey.delete({
    where: { id: keyId.trim() },
  });

  await writeAuditLog(prisma, {
    actor: {
      id: admin.id,
      playerName: admin.playerName,
      displayName: admin.displayName,
      role: admin.role,
    },
    action: "BETA_KEY_DELETED",
    entityType: "BetaInviteKey",
    entityId: keyId.trim(),
    entityLabel: "Beta Key",
    note: "Deleted unredeemed beta key.",
  });

  revalidatePath("/admin/beta-keys");
  return { success: true, message: "Beta Key deleted." };
}
