"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ModerationActionType } from "@/generated/prisma/enums";
import { requireModerator, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  checkRateLimit,
  userRateLimitKey,
} from "@/lib/rate-limit";
import {
  canTransitionSubmission,
  type SubmissionStatus,
} from "@/lib/submission-status";
import {
  applySubmissionReview,
  buildSubmissionCreateData,
} from "@/lib/submission-workflow";
import {
  createSubmissionFormErrorState,
  type SubmissionFormState,
  validateSubmissionFormSubmission,
} from "@/lib/submission-form-state";
import {
  notifyNewSubmission,
  notifyRecordAccepted,
} from "@/lib/discord-notify";
import { syncAllLinkedDiscordUsers } from "@/lib/discord-role-sync";
import { sendRecordStatusEmail } from "@/lib/email";
import { calculateCurrentLevelPoints } from "@/lib/points";
import { absoluteSiteUrl } from "@/lib/site-url";
import type { StructuredSubmissionProof } from "@/lib/submission-proof";
import {
  cleanupUploads,
  isUsableFile,
  saveProofImageUpload,
  saveVideoUpload,
} from "@/lib/upload-storage";
import {
  formDataToObject,
  reviewSchema,
} from "@/lib/validation";

export async function submitRecordAction(
  _prevState: SubmissionFormState,
  formData: FormData,
): Promise<SubmissionFormState> {
  const user = await requireUser();
  const parsed = validateSubmissionFormSubmission(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  const rateLimit = await checkRateLimit(
    prisma,
    "record-submission",
    userRateLimitKey(user.id),
  );

  if (!rateLimit.allowed) {
    return createSubmissionFormErrorState(parsed.values, {
      formErrors: [rateLimit.message],
    });
  }

  const level = await prisma.level.findUnique({
    where: {
      id: parsed.data.levelId,
    },
  });

  if (!level || (level.status !== "RANKED" && level.status !== "LEGACY")) {
    return createSubmissionFormErrorState(parsed.values, {
      fieldErrors: {
        levelId: ["That level is not available for submissions."],
      },
    });
  }

  const upload = await applySubmissionUploads(formData, parsed.data, level.name);

  if (!upload.ok) {
    return createSubmissionFormErrorState(parsed.values, {
      fieldErrors: {
        [upload.field]: [upload.error],
      },
    });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const submission = await tx.recordSubmission.create({
        data: buildSubmissionCreateData(user.id, upload.data),
      });

      await tx.moderationAction.create({
        data: {
          actorId: user.id,
          type: ModerationActionType.SUBMISSION_CREATED,
          targetType: "RecordSubmission",
          targetId: submission.id,
          summary: `${user.displayName} submitted a record for ${level.name}.`,
        },
      });
    });
  } catch {
    await cleanupUploads(upload.uploadedPaths);
    return createSubmissionFormErrorState(parsed.values, {
      formErrors: ["That submission could not be saved. Refresh and try again."],
    });
  }

  await notifyNewSubmission({
    playerName: user.displayName,
    playerHandle: user.playerName,
    levelName: level.name,
    levelSlug: level.slug,
    levelRank: level.rank,
    progress: upload.data.progress ?? 100,
    videoUrl: upload.data.videoUrl,
  }).catch((err) => {
    console.error("Failed to dispatch notifyNewSubmission:", err);
  });

  revalidatePath(`/levels/${level.slug}`);
  revalidatePath("/");
  revalidatePath("/players");
  revalidatePath(`/players/${user.playerName}`);
  revalidatePath("/submissions");
  revalidatePath("/moderation");
  revalidatePath("/admin");
  redirect("/submissions?created=1");
}

async function applySubmissionUploads(
  formData: FormData,
  data: StructuredSubmissionProof,
  levelName: string,
) {
  const uploadedPaths: string[] = [];
  const nextData: StructuredSubmissionProof = { ...data };
  const completionVideoFile = formData.get("completionVideoFile");
  const rawFootageFile = formData.get("rawFootageFile");
  const proofImageFile = formData.get("proofImageFile");

  if (isUsableFile(completionVideoFile)) {
    const upload = await saveVideoUpload(
      completionVideoFile,
      `${levelName}-completion`,
      "completion-video",
    );

    if (!upload.ok) {
      await cleanupUploads(uploadedPaths);
      return {
        ok: false as const,
        field: "completionVideoFile" as const,
        error: upload.error,
      };
    }

    uploadedPaths.push(upload.absolutePath);
    nextData.videoUrl = upload.publicPath;
  }

  if (isUsableFile(rawFootageFile)) {
    const upload = await saveVideoUpload(
      rawFootageFile,
      `${levelName}-raw`,
      "raw-footage",
    );

    if (!upload.ok) {
      await cleanupUploads(uploadedPaths);
      return {
        ok: false as const,
        field: "rawFootageFile" as const,
        error: upload.error,
      };
    }

    uploadedPaths.push(upload.absolutePath);
    nextData.rawFootageUrl = upload.publicPath;
    nextData.rawFootageIncluded = true;
  }

  if (isUsableFile(proofImageFile)) {
    const upload = await saveProofImageUpload(proofImageFile, `${levelName}-proof`);

    if (!upload.ok) {
      await cleanupUploads(uploadedPaths);
      return {
        ok: false as const,
        field: "proofImageFile" as const,
        error: upload.error,
      };
    }

    uploadedPaths.push(upload.absolutePath);
    nextData.proofImageUrl = upload.publicPath;
  }

  return {
    ok: true as const,
    data: nextData,
    uploadedPaths,
  };
}

export async function reviewSubmissionAction(formData: FormData) {
  const moderator = await requireModerator();
  const parsed = reviewSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect("/moderation?error=invalid");
  }

  const submission = await prisma.recordSubmission.findUnique({
    where: {
      id: parsed.data.submissionId,
    },
    include: {
      level: true,
      player: true,
    },
  });

  if (!submission) {
    redirect("/moderation?error=missing");
  }

  if (
    !canTransitionSubmission(
      submission.status as SubmissionStatus,
      parsed.data.status,
    )
  ) {
    redirect("/moderation?error=transition");
  }

  await prisma.$transaction(async (tx) => {
    await applySubmissionReview(tx, submission, moderator, parsed.data);
  });

  if (submission.player.email) {
    const levelUrl = absoluteSiteUrl(`/levels/${submission.level.slug}`);
    const progress = submission.progress ?? 100;
    const computedPoints = calculateCurrentLevelPoints(submission.level);
    const levelPoints =
      computedPoints > 0 ? computedPoints : (submission.level.points ?? 0);
    const pointsAwarded =
      parsed.data.status === "ACCEPTED" && progress === 100
        ? levelPoints
        : 0;

    void sendRecordStatusEmail({
      to: submission.player.email,
      playerName: submission.player.displayName,
      levelName: submission.level.name,
      status: parsed.data.status,
      progress,
      pointsAwarded: parsed.data.status === "ACCEPTED" ? pointsAwarded : null,
      moderatorNotes: parsed.data.moderatorNotes || null,
      levelUrl,
    }).catch(() => {
      // Ignore background email delivery errors
    });
  }

  if (parsed.data.status === "ACCEPTED") {
    const computedPoints = calculateCurrentLevelPoints(submission.level);
    const levelPoints =
      computedPoints > 0 ? computedPoints : (submission.level.points ?? 0);
    const pointsAwarded =
      (submission.progress ?? 100) === 100 ? levelPoints : 0;

    await notifyRecordAccepted({
      playerName: submission.player.displayName,
      playerHandle: submission.player.playerName,
      levelName: submission.level.name,
      levelSlug: submission.level.slug,
      levelRank: submission.level.rank,
      progress: submission.progress ?? 100,
      pointsAwarded,
      videoUrl: submission.videoUrl,
      reviewerName: moderator.displayName,
    }).catch((err) => {
      console.error("Failed to dispatch notifyRecordAccepted:", err);
    });

    await syncAllLinkedDiscordUsers().catch((err) => {
      console.error("Failed to sync Discord roles on record acceptance:", err);
    });
  }

  revalidatePath("/");
  revalidatePath("/players");
  revalidatePath(`/levels/${submission.level.slug}`);
  revalidatePath("/moderation");
  revalidatePath("/admin");
  redirect("/moderation?reviewed=1");
}
