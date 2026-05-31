"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ModerationActionType } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  createLevelFormErrorState,
  levelMutationErrorState,
  type LevelFormState,
  type LevelFormValues,
  validateLevelFormSubmission,
} from "@/lib/level-form-state";
import {
  createLevelWithRank,
  LevelRankingError,
  updateLevelWithRank,
} from "@/lib/level-ranking";
import {
  assertCanConvertLevelSuggestion,
  LevelSuggestionConversionError,
  levelSuggestionConversionGate,
} from "@/lib/level-suggestion-workflow";
import { slugify } from "@/lib/slug";
import {
  cleanupUploads,
  isUsableFile,
  saveThumbnailUpload,
} from "@/lib/upload-storage";
import {
  applyUserRoleChange,
  canChangeUserRole,
} from "@/lib/user-role-management";
import {
  changelogSchema,
  formDataToObject,
  rulesSchema,
  userRoleSchema,
} from "@/lib/validation";

export async function createLevelAction(
  _prevState: LevelFormState,
  formData: FormData,
): Promise<LevelFormState> {
  const admin = await requireAdmin();
  const parsed = validateLevelFormSubmission(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  const baseSlug = slugify(parsed.data.name);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;
  const sourceSuggestion = parsed.data.sourceSuggestionId
    ? await prisma.levelSuggestion.findUnique({
        where: {
          id: parsed.data.sourceSuggestionId,
        },
      })
    : null;

  if (parsed.data.sourceSuggestionId) {
    const gate = levelSuggestionConversionGate(admin.role, sourceSuggestion);

    if (!gate.allowed) {
      return createLevelFormErrorState(parsed.values, {
        formErrors: [gate.message],
      });
    }
  }

  const upload = await applyThumbnailUpload(formData, parsed.values, parsed.data);

  if (!upload.ok) {
    return upload.state;
  }

  const result = await runLevelMutation(() =>
    prisma.$transaction(async (tx) => {
      if (parsed.data.sourceSuggestionId) {
        const suggestion = await tx.levelSuggestion.findUnique({
          where: {
            id: parsed.data.sourceSuggestionId,
          },
        });

        assertCanConvertLevelSuggestion(admin.role, suggestion);
      }

      const mutation = await createLevelWithRank(tx, {
        ...upload.data,
        slug,
      });

      if (parsed.data.sourceSuggestionId) {
        await tx.levelSuggestion.update({
          where: {
            id: parsed.data.sourceSuggestionId,
          },
          data: {
            status: "CONVERTED",
            createdLevelId: mutation.level.id,
            reviewerId: admin.id,
            reviewedAt: new Date(),
            moderatorNotes:
              sourceSuggestion?.moderatorNotes ??
              "Converted into an NDL level by an admin.",
          },
        });
      }

      await tx.levelHistory.create({
        data: {
          levelId: mutation.level.id,
          actorId: admin.id,
          action: parsed.data.sourceSuggestionId ? "Converted" : "Created",
          notes: parsed.data.sourceSuggestionId
            ? "Level created from an approved level suggestion."
            : "Level added from the admin console.",
        },
      });

      await tx.moderationAction.create({
        data: {
          actorId: admin.id,
          type: ModerationActionType.LEVEL_CREATED,
          targetType: "Level",
          targetId: mutation.level.id,
          summary: parsed.data.sourceSuggestionId
            ? `${admin.displayName} converted ${mutation.level.name} from an approved suggestion.`
            : `${admin.displayName} created ${mutation.level.name}.`,
        },
      });

      if (parsed.data.sourceSuggestionId) {
        await tx.moderationAction.create({
          data: {
            actorId: admin.id,
            type: ModerationActionType.LEVEL_SUGGESTION_CONVERTED,
            targetType: "LevelSuggestion",
            targetId: parsed.data.sourceSuggestionId,
            summary: `${admin.displayName} converted ${mutation.level.name} into a level.`,
          },
        });
      }

      return mutation;
    }),
    upload.uploadedPaths,
  );

  if (!result.ok) {
    return levelMutationErrorState(parsed.values, result.error);
  }

  revalidatePath("/");
  revalidatePath("/players");
  revalidatePath("/moderation");
  revalidatePath("/level-suggestions");
  revalidatePath("/admin");
  revalidatePath("/admin/levels");
  for (const slug of result.value.affectedSlugs) {
    revalidatePath(`/levels/${slug}`);
  }
  redirect(
    parsed.data.sourceSuggestionId
      ? "/admin/levels?converted=1"
      : "/admin/levels?created=1",
  );
}

export async function updateLevelAction(
  _prevState: LevelFormState,
  formData: FormData,
): Promise<LevelFormState> {
  const admin = await requireAdmin();
  const parsed = validateLevelFormSubmission(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  if (!parsed.data.id) {
    return createLevelFormErrorState(parsed.values, {
      formErrors: ["The requested level was not found."],
    });
  }

  const levelId = parsed.data.id;
  const upload = await applyThumbnailUpload(formData, parsed.values, parsed.data);

  if (!upload.ok) {
    return upload.state;
  }

  const result = await runLevelMutation(() =>
    prisma.$transaction(async (tx) => {
      const mutation = await updateLevelWithRank(tx, levelId, upload.data);

      await tx.levelHistory.create({
        data: {
          levelId: mutation.level.id,
          actorId: admin.id,
          action: "Updated",
          notes: "Level metadata, rank, status, or points were updated.",
        },
      });

      await tx.moderationAction.create({
        data: {
          actorId: admin.id,
          type: ModerationActionType.LEVEL_UPDATED,
          targetType: "Level",
          targetId: mutation.level.id,
          summary: `${admin.displayName} updated ${mutation.level.name}.`,
        },
      });

      return mutation;
    }),
    upload.uploadedPaths,
  );

  if (!result.ok) {
    return levelMutationErrorState(parsed.values, result.error);
  }

  revalidatePath("/");
  revalidatePath("/players");
  revalidatePath("/admin/levels");
  for (const slug of result.value.affectedSlugs) {
    revalidatePath(`/levels/${slug}`);
  }
  redirect("/admin/levels?updated=1");
}

async function applyThumbnailUpload<T extends { name: string; thumbnailUrl: string }>(
  formData: FormData,
  values: LevelFormValues,
  data: T,
) {
  const file = formData.get("thumbnailFile");

  if (!isUsableFile(file)) {
    return {
      ok: true as const,
      data,
      uploadedPaths: [] as string[],
    };
  }

  const upload = await saveThumbnailUpload(file, data.name);

  if (!upload.ok) {
    return {
      ok: false as const,
      state: createLevelFormErrorState(values, {
        fieldErrors: {
          thumbnailFile: [upload.error],
        },
      }),
    };
  }

  return {
    ok: true as const,
    data: {
      ...data,
      thumbnailUrl: upload.publicPath,
    },
    uploadedPaths: [upload.absolutePath],
  };
}

async function runLevelMutation<T>(
  mutation: () => Promise<T>,
  uploadedPaths: string[] = [],
) {
  try {
    return {
      ok: true as const,
      value: await mutation(),
    };
  } catch (error) {
    await cleanupUploads(uploadedPaths);

    if (error instanceof LevelRankingError) {
      return {
        ok: false as const,
        error: error.code,
      };
    }

    if (error instanceof LevelSuggestionConversionError) {
      return {
        ok: false as const,
        error: error.code,
      };
    }

    if (isPrismaUniqueConstraintError(error)) {
      return {
        ok: false as const,
        error: "rank-conflict",
      };
    }

    throw error;
  }
}

function isPrismaUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function updateUserRoleAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = userRoleSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect("/admin/users?error=invalid");
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: {
        id: parsed.data.userId,
      },
    });

    if (!user) {
      return {
        status: "missing" as const,
      };
    }

    const otherAdminCount =
      user.role === "ADMIN" && parsed.data.role !== "ADMIN"
        ? await tx.user.count({
            where: {
              role: "ADMIN",
              id: {
                not: user.id,
              },
            },
          })
        : 1;

    const decision = canChangeUserRole({
      actorRole: admin.role,
      targetRole: user.role,
      nextRole: parsed.data.role,
      otherAdminCount,
    });

    if (!decision.allowed) {
      return {
        status: decision.reason,
      };
    }

    await applyUserRoleChange(tx, admin, user, parsed.data.role);

    return {
      status: "updated" as const,
    };
  });

  if (result.status === "missing") {
    redirect("/admin/users?error=missing");
  }

  if (result.status === "last-admin") {
    redirect("/admin/users?error=last-admin");
  }

  if (result.status === "not-admin") {
    redirect("/admin/users?error=forbidden");
  }

  revalidatePath("/admin/users");
  revalidatePath("/moderation");
  redirect("/admin/users?updated=1");
}

export async function updateRulesAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = rulesSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect("/admin/rules?error=invalid");
  }

  await prisma.$transaction(async (tx) => {
    await tx.rulesDocument.updateMany({
      data: {
        isActive: false,
      },
    });

    const rules = await tx.rulesDocument.create({
      data: {
        version: parsed.data.version,
        content: parsed.data.content,
        isActive: true,
      },
    });

    await tx.moderationAction.create({
      data: {
        actorId: admin.id,
        type: ModerationActionType.RULES_UPDATED,
        targetType: "RulesDocument",
        targetId: rules.id,
        summary: `${admin.displayName} published rules ${rules.version}.`,
      },
    });
  });

  revalidatePath("/rules");
  redirect("/admin/rules?updated=1");
}

export async function createChangelogAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = changelogSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect("/admin/changelog?error=invalid");
  }

  const post = await prisma.changelogPost.create({
    data: {
      title: parsed.data.title,
      slug: `${slugify(parsed.data.title)}-${Date.now().toString(36)}`,
      content: parsed.data.content,
      authorId: admin.id,
    },
  });

  await prisma.moderationAction.create({
    data: {
      actorId: admin.id,
      type: ModerationActionType.CHANGELOG_CREATED,
      targetType: "ChangelogPost",
      targetId: post.id,
      summary: `${admin.displayName} published changelog entry ${post.title}.`,
    },
  });

  revalidatePath("/changelog");
  redirect("/admin/changelog?created=1");
}
