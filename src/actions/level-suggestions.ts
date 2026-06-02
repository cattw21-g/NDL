"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ModerationActionType } from "@/generated/prisma/enums";
import { writeAuditLog } from "@/lib/audit-log";
import { requireAdmin, requireModerator, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  createLevelSuggestionFormErrorState,
  type LevelSuggestionFormState,
  validateLevelSuggestionFormSubmission,
} from "@/lib/level-suggestion-form-state";
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
import {
  formDataToObject,
  levelSuggestionConvertSchema,
  levelSuggestionReviewSchema,
} from "@/lib/validation";

export async function submitLevelSuggestionAction(
  _prevState: LevelSuggestionFormState,
  formData: FormData,
): Promise<LevelSuggestionFormState> {
  const user = await requireUser();
  const parsed = validateLevelSuggestionFormSubmission(formData);

  if (!parsed.success) {
    return parsed.state;
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
    const suggestion = await prisma.levelSuggestion.create({
      data: {
        submitterId: user.id,
        name: parsed.data.name,
        originalName: parsed.data.originalName,
        gdLevelId: parsed.data.gdLevelId,
        publisher: parsed.data.publisher,
        nerfCreator: parsed.data.nerfCreator,
        verifier: parsed.data.verifier,
        showcaseUrl: parsed.data.showcaseUrl,
        thumbnailUrl,
        versionNotes: parsed.data.versionNotes,
        compatibilityNotes: parsed.data.compatibilityNotes,
      },
    });

    await prisma.moderationAction.create({
      data: {
        actorId: user.id,
        type: ModerationActionType.LEVEL_SUGGESTION_CREATED,
        targetType: "LevelSuggestion",
        targetId: suggestion.id,
        summary: `${user.displayName} suggested ${suggestion.name}.`,
      },
    });
  } catch {
    await cleanupUploads(uploadedPaths);
    return createLevelSuggestionFormErrorState(parsed.values, {
      formErrors: ["That level suggestion could not be saved. Refresh and try again."],
    });
  }

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
