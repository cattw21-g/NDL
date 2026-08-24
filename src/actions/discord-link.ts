"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncDiscordRolesForUser } from "@/lib/discord-role-sync";

export type LinkDiscordState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function linkDiscordWithCodeAction(
  _prevState: LinkDiscordState,
  formData: FormData,
): Promise<LinkDiscordState> {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "You must be logged in to link your Discord account." };
  }

  const codeInput = formData.get("verificationCode")?.toString().trim().toUpperCase();

  if (!codeInput) {
    return { status: "error", message: "Please provide a verification code." };
  }

  // 1. Find active token
  const token = await prisma.discordLinkToken.findUnique({
    where: { code: codeInput },
  });

  if (!token || token.expiresAt < new Date()) {
    return {
      status: "error",
      message: "❌ Invalid or expired verification code. Click '🔗 Link NDL Account' in Discord to generate a new code.",
    };
  }

  // 2. Clear any other account with this discordUserId
  await prisma.user.updateMany({
    where: { discordUserId: token.discordUserId },
    data: { discordUserId: null, discordUsername: null, discordLinkedAt: null },
  });

  // 3. Link account to current user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      discordUserId: token.discordUserId,
      discordUsername: token.discordUsername,
      discordLinkedAt: new Date(),
    },
  });

  // 4. Delete used token
  await prisma.discordLinkToken.delete({
    where: { id: token.id },
  }).catch(() => {});

  // 5. Automatically sync Discord roles immediately
  const syncRes = await syncDiscordRolesForUser(user.id);

  revalidatePath(`/players/${user.playerName}`);
  revalidatePath("/players");

  const roleNote = syncRes.addedRoles.length > 0
    ? ` Automatically assigned: ${syncRes.addedRoles.join(", ")}!`
    : " Your roles have been synchronized!";

  return {
    status: "success",
    message: `🎉 Discord account successfully verified & linked!${roleNote}`,
  };
}

export async function unlinkDiscordAccountAction(): Promise<LinkDiscordState> {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "You must be logged in." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      discordUserId: null,
      discordUsername: null,
      discordLinkedAt: null,
    },
  });

  revalidatePath(`/players/${user.playerName}`);
  revalidatePath("/players");

  return {
    status: "success",
    message: "Discord account unlinked.",
  };
}
