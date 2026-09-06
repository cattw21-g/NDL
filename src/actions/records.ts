"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isModeratorRole } from "@/lib/permissions";

export async function toggleRecordVisibilityAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  const user = await requireUser();
  const recordId = String(formData.get("recordId") || "");
  const actionType = String(formData.get("actionType") || "hide"); // hide or restore

  if (!recordId) {
    return { success: false, message: "Missing record ID" };
  }

  const record = await prisma.record.findUnique({
    where: { id: recordId },
    include: {
      level: true,
      player: true,
    },
  });

  if (!record) {
    return { success: false, message: "Record not found." };
  }

  const isOwner = record.playerId === user.id;
  const isMod = isModeratorRole(user.role);

  if (!isOwner && !isMod) {
    return { success: false, message: "Unauthorized to modify this record." };
  }

  // Create audit record
  await prisma.moderationAction.create({
    data: {
      actorId: user.id,
      type: "SUBMISSION_ACCEPTED",
      targetType: "Record",
      targetId: record.id,
      summary: `${user.displayName} ${actionType === "hide" ? "unlisted" : "restored"} record for ${record.level.name}.`,
    },
  });

  revalidatePath(`/levels/${record.level.slug}`);
  revalidatePath(`/players/${record.player.playerName}`);
  revalidatePath("/players");
  revalidatePath("/");

  return {
    success: true,
    message: actionType === "hide"
      ? "Record has been unlisted from public rankings."
      : "Record has been restored to public rankings.",
  };
}
