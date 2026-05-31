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

  revalidatePath("/");
  revalidatePath("/players");
  revalidatePath(`/levels/${submission.level.slug}`);
  revalidatePath("/moderation");
  revalidatePath("/admin");
  redirect("/moderation?reviewed=1");
}
