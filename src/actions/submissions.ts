"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { ModerationActionType } from "@/generated/prisma/enums";
import { getCurrentUser, requireModerator } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeVideoUrl } from "@/lib/video-validation";
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
import { calculateCurrentLevelPoints, getLevelTier } from "@/lib/points";
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
  const sessionUser = await getCurrentUser();
  const parsed = validateSubmissionFormSubmission(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  // Determine submitting player (session user or guest)
  let effectiveUser: { id: string; playerName: string; displayName: string };
  const guestRawName = String(formData.get("playerName") || "").trim();

  if (sessionUser) {
    effectiveUser = sessionUser;
  } else {
    // Guest submission
    if (!guestRawName || guestRawName.length < 2) {
      return createSubmissionFormErrorState(parsed.values, {
        fieldErrors: {
          playerName: ["Please enter your player name / Geometry Dash username."],
        },
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { playerName: { equals: guestRawName, mode: "insensitive" } },
          { displayName: { equals: guestRawName, mode: "insensitive" } },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.isSubmissionLocked) {
        return createSubmissionFormErrorState(parsed.values, {
          formErrors: [
            `Submissions for "${existingUser.displayName}" (@${existingUser.playerName}) are locked by the claimed account owner. Please log in to your account to submit records.`,
          ],
        });
      }
      effectiveUser = existingUser;
    } else {
      const cleanHandle =
        guestRawName.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30) ||
        `player_${Date.now()}`;
      let uniqueHandle = cleanHandle;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { playerName: uniqueHandle } })) {
        uniqueHandle = `${cleanHandle}_${counter++}`;
      }

      effectiveUser = await prisma.user.create({
        data: {
          email: `${uniqueHandle}_guest@nerfeddemonlist.local`,
          emailVerifiedAt: null,
          passwordHash: "UNCLAIMED_GUEST_ACCOUNT",
          playerName: uniqueHandle,
          displayName: guestRawName,
          role: "PLAYER",
        },
      });
    }
  }

  // Rate Limiting
  const headerList = await headers();
  const clientIp =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("cf-connecting-ip") ||
    "guest-client";

  const rateLimitKey = sessionUser
    ? userRateLimitKey(sessionUser.id)
    : `guest:${clientIp}`;

  const rateLimit = await checkRateLimit(
    prisma,
    "record-submission",
    rateLimitKey,
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

  if (!level) {
    return createSubmissionFormErrorState(parsed.values, {
      fieldErrors: {
        levelId: ["That level is not available for submissions."],
      },
    });
  }

  const isAssignedVerifier =
    level.status === "PENDING" &&
    (level.verifierUserId === effectiveUser.id ||
      level.verifier?.toLowerCase() === effectiveUser.displayName?.toLowerCase() ||
      level.verifier?.toLowerCase() === effectiveUser.playerName?.toLowerCase());

  if (level.status !== "RANKED" && level.status !== "LEGACY" && !isAssignedVerifier) {
    return createSubmissionFormErrorState(parsed.values, {
      fieldErrors: {
        levelId: ["That level is currently in upcoming verification. Only the assigned verifier can submit verification runs."],
      },
    });
  }

  // Minimum progress validation (Pointercrate parity & 30% floor)
  const submittedProgress = parsed.data.progress ?? 100;
  if (submittedProgress < 100) {
    if (submittedProgress < 30) {
      return createSubmissionFormErrorState(parsed.values, {
        fieldErrors: {
          progress: ["Progress submissions must be at least 30%."],
        },
      });
    }

    if (level.status !== "PENDING") {
      const tier = getLevelTier(level.rank, level.status);
      if (tier !== "MAIN") {
        return createSubmissionFormErrorState(parsed.values, {
          fieldErrors: {
            progress: [
              "Extended List (#76–#150) and Legacy levels only accept 100% completions. Progress records are only accepted for Main List demons.",
            ],
          },
        });
      }

      const req = level.minimumProgress ?? 50;
      if (submittedProgress < req) {
        return createSubmissionFormErrorState(parsed.values, {
          fieldErrors: {
            progress: [
              `Progress submissions for "${level.name}" must be at least ${req}% (the level's minimum requirement).`,
            ],
          },
        });
      }
    }
  }

  const upload = await applySubmissionUploads(formData, parsed.data, level.name);

  if (!upload.ok) {
    return createSubmissionFormErrorState(parsed.values, {
      fieldErrors: {
        [upload.field]: [upload.error],
      },
    });
  }

  // Automatic Video-Link Normalization (Feature 3)
  const rawVideoUrl = (upload.data.videoUrl ?? "").trim();
  const normalizedVideo = normalizeVideoUrl(rawVideoUrl);
  if (normalizedVideo.isValid) {
    upload.data.videoUrl = normalizedVideo.normalizedUrl;
  }

  // Duplicate submission detection
  const submittedVideoUrl = upload.data.videoUrl;

  const existingAcceptedRecord = await prisma.record.findFirst({
    where: {
      playerId: effectiveUser.id,
      levelId: level.id,
    },
    select: {
      id: true,
      progress: true,
    },
  });

  if (existingAcceptedRecord && existingAcceptedRecord.progress >= submittedProgress) {
    await cleanupUploads(upload.uploadedPaths);
    return createSubmissionFormErrorState(parsed.values, {
      formErrors: [
        existingAcceptedRecord.progress === 100
          ? "Duplicate submission rejected: You already have an accepted 100% completion for this level."
          : `Duplicate submission rejected: You already have an accepted record for this level with equal or greater progress (${existingAcceptedRecord.progress}%).`,
      ],
    });
  }

  const existingPendingSubmission = await prisma.recordSubmission.findFirst({
    where: {
      playerId: effectiveUser.id,
      levelId: level.id,
      status: { in: ["PENDING", "UNDER_CONSIDERATION", "NEEDS_CHANGES"] },
      progress: { gte: submittedProgress },
    },
    select: { id: true, status: true, progress: true },
  });

  if (existingPendingSubmission) {
    await cleanupUploads(upload.uploadedPaths);
    return createSubmissionFormErrorState(parsed.values, {
      formErrors: [
        `You already have a submission in review (${existingPendingSubmission.status}) with ${existingPendingSubmission.progress}% progress. Wait for it to be processed before submitting another equal or lower run.`,
      ],
    });
  }

  if (submittedVideoUrl && submittedVideoUrl.startsWith("http")) {
    const existingVideoRecord = await prisma.record.findFirst({
      where: {
        videoUrl: { equals: submittedVideoUrl, mode: "insensitive" },
      },
      select: { id: true },
    });

    const existingVideoSubmission = await prisma.recordSubmission.findFirst({
      where: {
        videoUrl: { equals: submittedVideoUrl, mode: "insensitive" },
        status: { in: ["PENDING", "UNDER_CONSIDERATION"] },
      },
      select: { id: true },
    });

    if (existingVideoRecord || existingVideoSubmission) {
      await cleanupUploads(upload.uploadedPaths);
      return createSubmissionFormErrorState(parsed.values, {
        fieldErrors: {
          videoUrl: [
            "This video proof link has already been submitted for a record on the Demonlist.",
          ],
        },
      });
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const submission = await tx.recordSubmission.create({
        data: buildSubmissionCreateData(effectiveUser.id, upload.data),
      });

      await tx.moderationAction.create({
        data: {
          actorId: effectiveUser.id,
          type: ModerationActionType.SUBMISSION_CREATED,
          targetType: "RecordSubmission",
          targetId: submission.id,
          summary: `${effectiveUser.displayName} submitted a record for ${level.name}.`,
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
    playerName: effectiveUser.displayName,
    playerHandle: effectiveUser.playerName,
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
  revalidatePath(`/players/${effectiveUser.playerName}`);
  revalidatePath("/submissions");
  revalidatePath("/moderation");
  revalidatePath("/admin");

  if (sessionUser) {
    redirect("/submissions?created=1");
  } else {
    redirect(`/levels/${level.slug}?submitted=1`);
  }
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
      thumbnailUrl: submission.level.thumbnailUrl,
      fps: submission.fps,
      cbfUsed: submission.cbfUsed,
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
