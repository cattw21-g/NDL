"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncDiscordRolesForUser } from "@/lib/discord-role-sync";

export type LinkDiscordState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function linkDiscordAccountAction(
  _prevState: LinkDiscordState,
  formData: FormData,
): Promise<LinkDiscordState> {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "You must be logged in to link your Discord account." };
  }

  const discordUserId = formData.get("discordUserId")?.toString().trim();
  const discordUsername = formData.get("discordUsername")?.toString().trim() || null;

  if (!discordUserId) {
    return { status: "error", message: "Please provide your Discord User ID." };
  }

  if (!/^\d{17,20}$/.test(discordUserId)) {
    return {
      status: "error",
      message: "Invalid Discord User ID. A Discord ID is a 17-20 digit number (Right-click your profile in Discord ➔ Copy User ID).",
    };
  }

  // Check if ID is already linked to another account
  const existing = await prisma.user.findUnique({
    where: { discordUserId },
  });

  if (existing && existing.id !== user.id) {
    return { status: "error", message: "This Discord account is already linked to another NDL profile." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      discordUserId,
      discordUsername,
      discordLinkedAt: new Date(),
    },
  });

  // Automatically sync Discord roles immediately
  const syncRes = await syncDiscordRolesForUser(user.id);

  revalidatePath(`/players/${user.playerName}`);
  revalidatePath("/players");

  const roleNote = syncRes.addedRoles.length > 0
    ? ` Automatically assigned: ${syncRes.addedRoles.join(", ")}!`
    : " Your roles have been synchronized!";

  return {
    status: "success",
    message: `✅ Discord account successfully linked!${roleNote}`,
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
