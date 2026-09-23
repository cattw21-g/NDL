"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";

export async function deleteRecordAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  const user = await requireUser();
  const recordId = String(formData.get("recordId") || "");

  if (!recordId) {
    return { success: false, message: "Missing record ID" };
  }

  const record = await prisma.record.findUnique({
    where: { id: recordId },
    include: {
      level: true,
      player: true,
      submission: true,
    },
  });

  if (!record) {
    return { success: false, message: "Record not found." };
  }

  const isOwner = record.playerId === user.id;
  const isAdmin = isAdminRole(user.role, user.playerName);

  if (!isOwner && !isAdmin) {
    return { success: false, message: "Unauthorized to remove this record. Only the record owner or an Admin can delete records." };
  }

  await prisma.$transaction(async (tx) => {
    // If record originated from a submission, transition submission to REJECTED with audit note
    if (record.submissionId) {
      await tx.recordSubmission.update({
        where: { id: record.submissionId },
        data: {
          status: "REJECTED",
          moderatorNotes: `Record revoked by ${user.displayName} (${user.role}): removed from rankings.`,
          reviewedAt: new Date(),
          reviewerId: user.id,
        },
      });
    }

    await tx.record.delete({
      where: { id: record.id },
    });

    await tx.moderationAction.create({
      data: {
        actorId: user.id,
        type: "SUBMISSION_REJECTED",
        targetType: "Record",
        targetId: record.id,
        summary: `${user.displayName} removed record for ${record.level.name} (${record.progress}%, video: ${record.videoUrl}, points: ${record.pointsAwarded}).`,
      },
    });
  });

  revalidatePath(`/levels/${record.level.slug}`);
  revalidatePath(`/players/${record.player.playerName}`);
  revalidatePath("/players");
  revalidatePath("/");

  return {
    success: true,
    message: "Record has been removed from public rankings.",
  };
}
