"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import {
  extractClientIp,
  hasNetworkConflict,
  hashClientIp,
} from "@/lib/anti-alt";

import { ModerationActionType } from "@/generated/prisma/enums";
import { writeAuditLog } from "@/lib/audit-log";
import { requireAdmin, requireModerator, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteBlobSafely, isVercelBlobUrl } from "@/lib/blob-cleanup";
import {
  createLevelSuggestionFormErrorState,
  type LevelSuggestionFormState,
  validateLevelSuggestionFormSubmission,
} from "@/lib/level-suggestion-form-state";
import { sendLevelSuggestionStatusEmail } from "@/lib/email";
import { notifyNewSuggestion } from "@/lib/discord-notify";
import {
  levelSuggestionConversionGate,
  moderationActionForSuggestionStatus,
} from "@/lib/level-suggestion-workflow";
import {
  checkRateLimit,
  userRateLimitKey,
} from "@/lib/rate-limit";
import {
  cleanupUploads,
  isUsableFile,
  localUploadsEnabled,
  saveThumbnailUpload,
} from "@/lib/upload-storage";
import { isBotSubmission } from "@/lib/honeypot";
import {
  formDataToObject,
  levelSuggestionConvertSchema,
  levelSuggestionReviewSchema,
} from "@/lib/validation";

export async function submitLevelSuggestionAction(
  _prevState: LevelSuggestionFormState,
  formData: FormData,
): Promise<LevelSuggestionFormState> {
  // Anti-Bot Honeypot Defense: Silently absorb automated spam
  if (isBotSubmission(formData)) {
    return {
      ok: true,
      summary: "Suggestion received.",
      formErrors: [],
      fieldErrors: {},
      values: _prevState.values,
    };
  }

  const user = await requireUser();
  const parsed = validateLevelSuggestionFormSubmission(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  // Duplicate GD Level ID Prevention: Block duplicates of existing levels or pending suggestions
  const cleanGdId = parsed.data.gdLevelId.trim();
  const existingLevel = await prisma.level.findFirst({
    where: {
      gdLevelId: cleanGdId,
    },
    select: { id: true, name: true, status: true },
  });

  if (existingLevel) {
    return createLevelSuggestionFormErrorState(parsed.values, {
      fieldErrors: {
        gdLevelId: [
          `This Geometry Dash Level ID is already registered on NDL as "${existingLevel.name}" (${existingLevel.status}).`,
        ],
      },
    });
  }

  const existingSuggestion = await prisma.levelSuggestion.findFirst({
    where: {
      gdLevelId: cleanGdId,
      status: { in: ["PENDING", "APPROVED"] },
    },
    select: { id: true, name: true, status: true },
  });

  if (existingSuggestion) {
    return createLevelSuggestionFormErrorState(parsed.values, {
      fieldErrors: {
        gdLevelId: [
          `A suggestion for this Geometry Dash Level ID ("${existingSuggestion.name}") is already in the review queue (${existingSuggestion.status}).`,
        ],
      },
    });
  }

  const rateLimit = await checkRateLimit(
    prisma,
    "level-suggestion",
    userRateLimitKey(user.id),
  );

  if (!rateLimit.allowed) {
    return createLevelSuggestionFormErrorState(parsed.values, {
      formErrors: [rateLimit.message],
    });
  }

  const thumbnailFile = formData.get("thumbnailFile");
  let thumbnailUrl: string | null = parsed.data.thumbnailUrl ?? null;
  const uploadedPaths: string[] = [];

  if (localUploadsEnabled() && isUsableFile(thumbnailFile)) {
    const upload = await saveThumbnailUpload(thumbnailFile, parsed.data.name);

    if (!upload.ok) {
      return createLevelSuggestionFormErrorState(parsed.values, {
        fieldErrors: {
          thumbnailFile: [upload.error],
        },
      });
    }

    thumbnailUrl = upload.publicPath;
    uploadedPaths.push(upload.absolutePath);
  }

  try {
    const isExplicitOpen = parsed.data.isOpenVerification === true;
    const isVerifierOpen =
      parsed.data.verifier &&
      ["open", "open verification", "unassigned", "none", "n/a"].includes(
        parsed.data.verifier.trim().toLowerCase(),
      );
    const isOpen = isExplicitOpen || isVerifierOpen;

    const verifier =
      isOpen && (!parsed.data.verifier || parsed.data.verifier.trim() === "")
        ? "Open Verification"
        : (parsed.data.verifier?.trim() || "Open Verification");

    const verificationVideoUrl =
      isOpen && !parsed.data.verificationVideoUrl
        ? null
        : (parsed.data.verificationVideoUrl ?? null);

    const suggestion = await prisma.levelSuggestion.create({
      data: {
        submitterId: user.id,
        name: parsed.data.name,
        originalName: parsed.data.originalName,
        gdLevelId: parsed.data.gdLevelId,
        publisher: parsed.data.publisher,
        nerfCreator: parsed.data.nerfCreator,
        verifier,
        verifierPlayerName: isOpen ? null : parsed.data.verifierPlayerName,
        verificationVideoUrl,
        showcaseUrl: parsed.data.showcaseUrl,
        thumbnailUrl,
        versionNotes: parsed.data.versionNotes,
        compatibilityNotes: parsed.data.compatibilityNotes,
      },
    });

    const headerList = await headers();
    const clientIp = extractClientIp(headerList);
    const submitterIpHash = hashClientIp(clientIp);

    await prisma.moderationAction.create({
      data: {
        actorId: user.id,
        type: ModerationActionType.LEVEL_SUGGESTION_CREATED,
        targetType: "LevelSuggestion",
        targetId: suggestion.id,
        summary: `${user.displayName} suggested ${suggestion.name}.`,
        metadata: submitterIpHash ? { submitterIpHash } : undefined,
      },
    });
  } catch {
    await cleanupUploads(uploadedPaths);
    return createLevelSuggestionFormErrorState(parsed.values, {
      formErrors: ["That level suggestion could not be saved. Refresh and try again."],
    });
  }

  await notifyNewSuggestion({
    userName: user.displayName,
    userHandle: user.playerName,
    levelName: parsed.data.name,
    originalName: parsed.data.originalName,
    videoUrl: parsed.data.showcaseUrl || parsed.data.verificationVideoUrl || "",
  }).catch((err) => {
    console.error("Failed to dispatch notifyNewSuggestion:", err);
  });

  revalidatePath("/level-suggestions");
  revalidatePath("/moderation");
  revalidatePath("/admin");
  redirect("/level-suggestions?created=1");
}

export async function reviewLevelSuggestionAction(formData: FormData) {
  const moderator = await requireModerator();
  const parsed = levelSuggestionReviewSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect("/moderation?error=invalid");
  }

  const suggestion = await prisma.levelSuggestion.findUnique({
    where: {
      id: parsed.data.suggestionId,
    },
    include: {
      submitter: true,
    },
  });

  if (!suggestion) {
    redirect("/moderation?error=missing");
  }

  // Security: Moderators cannot approve their own level suggestions
  if (suggestion.submitterId === moderator.id && parsed.data.status === "APPROVED") {
    redirect("/moderation?error=self_approval_forbidden");
  }

  // Security: Network Conflict Detection (Anti-Alt / Same Network or Device)
  if (parsed.data.status === "APPROVED") {
    const headerList = await headers();
    const reviewerIp = extractClientIp(headerList);

    const creationAction = await prisma.moderationAction.findFirst({
      where: {
        targetType: "LevelSuggestion",
        targetId: suggestion.id,
        type: ModerationActionType.LEVEL_SUGGESTION_CREATED,
      },
      select: { metadata: true },
    });

    const submitterIpHash = (
      creationAction?.metadata as { submitterIpHash?: string } | null
    )?.submitterIpHash;

    if (
      hasNetworkConflict({
        submitterIpHash,
        reviewerIp,
        reviewerRole: moderator.role,
      })
    ) {
      redirect("/moderation?error=conflict_of_interest");
    }
  }

  // Security: Moderator action rate-limiting to prevent compromised automated mass actions
  const rateLimit = await checkRateLimit(
    prisma,
    "moderation-suggestion-review",
    moderator.id,
  );
  if (!rateLimit.allowed) {
    redirect("/moderation?error=rate_limited");
  }

  if (suggestion.createdLevelId || suggestion.status === "CONVERTED") {
    redirect("/moderation?error=transition");
  }

  const reviewedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.levelSuggestion.update({
      where: {
        id: suggestion.id,
      },
      data: {
        status: parsed.data.status,
        moderatorNotes: parsed.data.moderatorNotes,
        reviewerId: moderator.id,
        reviewedAt,
      },
    });

    await tx.moderationAction.create({
      data: {
        actorId: moderator.id,
        type: moderationActionForSuggestionStatus(parsed.data.status),
        targetType: "LevelSuggestion",
        targetId: suggestion.id,
        summary: `${moderator.displayName} marked ${suggestion.name} as ${parsed.data.status.toLowerCase().replace("_", " ")}.`,
      },
    });

    await writeAuditLog(tx, {
      actor: moderator,
      action:
        parsed.data.status === "APPROVED"
          ? "LEVEL_SUGGESTION_APPROVED"
          : parsed.data.status === "REJECTED"
            ? "LEVEL_SUGGESTION_REJECTED"
            : "LEVEL_SUGGESTION_NEEDS_CHANGES",
      entityType: "LevelSuggestion",
      entityId: suggestion.id,
      entityLabel: suggestion.name,
      before: {
        status: suggestion.status,
        reviewerId: suggestion.reviewerId,
        reviewedAt: suggestion.reviewedAt,
      },
      after: {
        status: parsed.data.status,
        reviewerId: moderator.id,
        reviewedAt,
      },
      note: parsed.data.moderatorNotes,
    });
  });

  if (
    suggestion.submitter.email &&
    !suggestion.submitter.email.endsWith(".local") &&
    !suggestion.submitter.email.includes("_guest@")
  ) {
    void sendLevelSuggestionStatusEmail({
      to: suggestion.submitter.email,
      submitterName: suggestion.submitter.displayName,
      levelName: suggestion.name,
      status: parsed.data.status,
      moderatorNotes: parsed.data.moderatorNotes || null,
    }).catch(() => {
      // Ignore background email delivery error
    });
  }

  if (
    parsed.data.status === "REJECTED" &&
    suggestion.thumbnailUrl &&
    isVercelBlobUrl(suggestion.thumbnailUrl)
  ) {
    const countL = await prisma.level.count({ where: { thumbnailUrl: suggestion.thumbnailUrl } });
    const countS = await prisma.levelSuggestion.count({
      where: {
        thumbnailUrl: suggestion.thumbnailUrl,
        status: { not: "REJECTED" },
      },
    });
    if (countL === 0 && countS === 0) {
      await deleteBlobSafely(suggestion.thumbnailUrl);
    }
  }

  revalidatePath("/moderation");
  revalidatePath("/level-suggestions");
  revalidatePath("/admin");
  redirect("/moderation?reviewed=1");
}

export async function convertLevelSuggestionAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = levelSuggestionConvertSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect("/moderation?error=invalid");
  }

  const suggestion = await prisma.levelSuggestion.findUnique({
    where: {
      id: parsed.data.suggestionId,
    },
  });
  const gate = levelSuggestionConversionGate(admin.role, suggestion);

  if (!gate.allowed) {
    redirect(`/moderation?error=${gate.code}`);
  }

  redirect(`/admin/levels?suggestionId=${parsed.data.suggestionId}#add-level`);
}
