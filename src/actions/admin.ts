"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ModerationActionType } from "@/generated/prisma/enums";
import { writeAuditLog, type AuditLogClient } from "@/lib/audit-log";
import { requireAdmin } from "@/lib/auth";
import { normalizeChangelogSlug } from "@/lib/changelog";
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
  changelogArchiveSchema,
  changelogUpdateSchema,
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

      await writeAuditLog(tx, {
        actor: admin,
        action: "LEVEL_CREATED",
        entityType: "Level",
        entityId: mutation.level.id,
        entityLabel: mutation.level.name,
        after: levelAuditSnapshot(mutation.level),
        note: parsed.data.sourceSuggestionId
          ? "Level created from an approved level suggestion."
          : "Level created from the admin console.",
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

        await writeAuditLog(tx, {
          actor: admin,
          action: "LEVEL_SUGGESTION_CONVERTED",
          entityType: "LevelSuggestion",
          entityId: parsed.data.sourceSuggestionId,
          entityLabel: sourceSuggestion?.name ?? mutation.level.name,
          before: sourceSuggestion
            ? levelSuggestionAuditSnapshot(sourceSuggestion)
            : undefined,
          after: {
            status: "CONVERTED",
            createdLevelId: mutation.level.id,
            createdLevelName: mutation.level.name,
          },
          note: "Approved level suggestion converted into an NDL level.",
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
      const beforeLevel = await tx.level.findUnique({
        where: {
          id: levelId,
        },
      });
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

      await writeLevelUpdateAudit(tx, admin, beforeLevel, mutation.level);

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

    await writeAuditLog(tx, {
      actor: admin,
      action: "USER_ROLE_CHANGED",
      entityType: "User",
      entityId: user.id,
      entityLabel: user.displayName,
      before: userAuditSnapshot(user),
      after: {
        ...userAuditSnapshot(user),
        role: parsed.data.role,
      },
      note: `Role changed from ${user.role} to ${parsed.data.role}.`,
    });

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
    const previousRules = await tx.rulesDocument.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

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

    await writeAuditLog(tx, {
      actor: admin,
      action: "RULES_UPDATED",
      entityType: "RulesDocument",
      entityId: rules.id,
      entityLabel: rules.version,
      before: previousRules
        ? {
            id: previousRules.id,
            version: previousRules.version,
            isActive: previousRules.isActive,
            publishedAt: previousRules.publishedAt,
          }
        : undefined,
      after: {
        id: rules.id,
        version: rules.version,
        isActive: rules.isActive,
        publishedAt: rules.publishedAt,
      },
      note: `Published active rules ${rules.version}.`,
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

  const publishedAt = parsed.data.isPublished ? new Date() : null;
  const slug = normalizeChangelogSlug(parsed.data.slug, parsed.data.title);

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.changelogPost.findUnique({
      where: {
        slug,
      },
    });

    if (existing) {
      return { status: "slug-conflict" as const };
    }

    const createdPost = await tx.changelogPost.create({
      data: {
        title: parsed.data.title,
        slug,
        category: parsed.data.category,
        summary: parsed.data.summary,
        content: parsed.data.content,
        isPublished: parsed.data.isPublished,
        isPinned: parsed.data.isPinned,
        publishedAt,
        authorId: admin.id,
      },
    });

    await tx.moderationAction.create({
      data: {
        actorId: admin.id,
        type: ModerationActionType.CHANGELOG_CREATED,
        targetType: "ChangelogPost",
        targetId: createdPost.id,
        summary: `${admin.displayName} created changelog entry ${createdPost.title}.`,
      },
    });

    await writeAuditLog(tx, {
      actor: admin,
      action: "CHANGELOG_CREATED",
      entityType: "ChangelogPost",
      entityId: createdPost.id,
      entityLabel: createdPost.title,
      after: changelogAuditSnapshot(createdPost),
      note: createdPost.isPublished
        ? "Created a published changelog entry."
        : "Created a draft changelog entry.",
    });

    if (createdPost.isPublished) {
      await writeAuditLog(tx, {
        actor: admin,
        action: "CHANGELOG_PUBLISHED",
        entityType: "ChangelogPost",
        entityId: createdPost.id,
        entityLabel: createdPost.title,
        after: changelogAuditSnapshot(createdPost),
        note: "Changelog entry was created as published.",
      });
    }

    if (createdPost.isPinned) {
      await writeAuditLog(tx, {
        actor: admin,
        action: "CHANGELOG_PINNED",
        entityType: "ChangelogPost",
        entityId: createdPost.id,
        entityLabel: createdPost.title,
        after: changelogAuditSnapshot(createdPost),
        note: "Changelog entry was created as pinned.",
      });
    }

    return { status: "created" as const, slug: createdPost.slug };
  });

  if (result.status === "slug-conflict") {
    redirect("/admin/changelog?error=slug-conflict");
  }

  revalidateChangelogPaths(result.slug);
  redirect("/admin/changelog?created=1");
}

export async function updateChangelogAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = changelogUpdateSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect("/admin/changelog?error=invalid");
  }

  const slug = normalizeChangelogSlug(parsed.data.slug, parsed.data.title);

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.changelogPost.findUnique({
      where: {
        id: parsed.data.id,
      },
    });

    if (!existing) {
      return { status: "missing" as const };
    }

    const slugOwner = await tx.changelogPost.findUnique({
      where: {
        slug,
      },
    });

    if (slugOwner && slugOwner.id !== existing.id) {
      return { status: "slug-conflict" as const };
    }

    const publishedAt = parsed.data.isPublished
      ? (existing.publishedAt ?? new Date())
      : null;

    const updatedPost = await tx.changelogPost.update({
      where: {
        id: existing.id,
      },
      data: {
        title: parsed.data.title,
        slug,
        category: parsed.data.category,
        summary: parsed.data.summary,
        content: parsed.data.content,
        isPublished: parsed.data.isPublished,
        isPinned: parsed.data.isPinned,
        publishedAt,
      },
    });

    await writeAuditLog(tx, {
      actor: admin,
      action: "CHANGELOG_EDITED",
      entityType: "ChangelogPost",
      entityId: updatedPost.id,
      entityLabel: updatedPost.title,
      before: changelogAuditSnapshot(existing),
      after: changelogAuditSnapshot(updatedPost),
      note: "Changelog entry was edited.",
    });

    if (existing.isPublished !== updatedPost.isPublished) {
      await writeAuditLog(tx, {
        actor: admin,
        action: updatedPost.isPublished
          ? "CHANGELOG_PUBLISHED"
          : "CHANGELOG_UNPUBLISHED",
        entityType: "ChangelogPost",
        entityId: updatedPost.id,
        entityLabel: updatedPost.title,
        before: { isPublished: existing.isPublished },
        after: {
          isPublished: updatedPost.isPublished,
          publishedAt: updatedPost.publishedAt,
        },
        note: updatedPost.isPublished
          ? "Changelog entry was published."
          : "Changelog entry was unpublished.",
      });
    }

    if (existing.isPinned !== updatedPost.isPinned) {
      await writeAuditLog(tx, {
        actor: admin,
        action: updatedPost.isPinned
          ? "CHANGELOG_PINNED"
          : "CHANGELOG_UNPINNED",
        entityType: "ChangelogPost",
        entityId: updatedPost.id,
        entityLabel: updatedPost.title,
        before: { isPinned: existing.isPinned },
        after: { isPinned: updatedPost.isPinned },
        note: updatedPost.isPinned
          ? "Changelog entry was pinned."
          : "Changelog entry was unpinned.",
      });
    }

    return {
      status: "updated" as const,
      slug: updatedPost.slug,
      previousSlug: existing.slug,
    };
  });

  if (result.status === "missing") {
    redirect("/admin/changelog?error=missing");
  }

  if (result.status === "slug-conflict") {
    redirect("/admin/changelog?error=slug-conflict");
  }

  revalidateChangelogPaths(result.slug, result.previousSlug);
  redirect("/admin/changelog?updated=1");
}

export async function archiveChangelogAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = changelogArchiveSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect("/admin/changelog?error=invalid");
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.changelogPost.findUnique({
      where: {
        id: parsed.data.id,
      },
    });

    if (!existing) {
      return { status: "missing" as const };
    }

    const archivedPost = await tx.changelogPost.update({
      where: {
        id: existing.id,
      },
      data: {
        isPublished: false,
        isPinned: false,
        archivedAt: new Date(),
        publishedAt: null,
      },
    });

    await writeAuditLog(tx, {
      actor: admin,
      action: "CHANGELOG_ARCHIVED",
      entityType: "ChangelogPost",
      entityId: archivedPost.id,
      entityLabel: archivedPost.title,
      before: changelogAuditSnapshot(existing),
      after: changelogAuditSnapshot(archivedPost),
      note: "Changelog entry was archived.",
    });

    if (existing.isPublished) {
      await writeAuditLog(tx, {
        actor: admin,
        action: "CHANGELOG_UNPUBLISHED",
        entityType: "ChangelogPost",
        entityId: archivedPost.id,
        entityLabel: archivedPost.title,
        before: { isPublished: existing.isPublished },
        after: { isPublished: archivedPost.isPublished },
        note: "Changelog entry was unpublished because it was archived.",
      });
    }

    if (existing.isPinned) {
      await writeAuditLog(tx, {
        actor: admin,
        action: "CHANGELOG_UNPINNED",
        entityType: "ChangelogPost",
        entityId: archivedPost.id,
        entityLabel: archivedPost.title,
        before: { isPinned: existing.isPinned },
        after: { isPinned: archivedPost.isPinned },
        note: "Changelog entry was unpinned because it was archived.",
      });
    }

    return {
      status: "archived" as const,
      slug: archivedPost.slug,
    };
  });

  if (result.status === "missing") {
    redirect("/admin/changelog?error=missing");
  }

  revalidateChangelogPaths(result.slug);
  redirect("/admin/changelog?archived=1");
}

function revalidateChangelogPaths(...slugs: Array<string | undefined>) {
  revalidatePath("/");
  revalidatePath("/changelog");
  revalidatePath("/news");
  revalidatePath("/admin");
  revalidatePath("/admin/changelog");
  for (const slug of slugs) {
    if (slug) {
      revalidatePath(`/changelog/${slug}`);
      revalidatePath(`/news/${slug}`);
    }
  }
}

function levelAuditSnapshot(level: {
  id: string;
  slug: string;
  rank: number | null;
  name: string;
  originalName: string;
  gdLevelId: string;
  publisher: string;
  nerfCreator: string;
  verifier: string;
  thumbnailUrl: string;
  showcaseUrl: string;
  placementDate: Date | null;
  status: string;
  difficulty: string;
  points: number;
  description: string;
  versionNotes: string | null;
}) {
  return {
    id: level.id,
    slug: level.slug,
    rank: level.rank,
    name: level.name,
    originalName: level.originalName,
    gdLevelId: level.gdLevelId,
    publisher: level.publisher,
    nerfCreator: level.nerfCreator,
    verifier: level.verifier,
    thumbnailUrl: level.thumbnailUrl,
    showcaseUrl: level.showcaseUrl,
    placementDate: level.placementDate,
    status: level.status,
    difficulty: level.difficulty,
    points: level.points,
    description: level.description,
    versionNotes: level.versionNotes,
  };
}

function changelogAuditSnapshot(post: {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  isPublished: boolean;
  isPinned: boolean;
  isDemo: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
  archivedAt: Date | null;
  authorId: string | null;
}) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    category: post.category,
    summary: post.summary,
    content: post.content,
    isPublished: post.isPublished,
    isPinned: post.isPinned,
    isDemo: post.isDemo,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    archivedAt: post.archivedAt,
    authorId: post.authorId,
  };
}

function levelSuggestionAuditSnapshot(suggestion: {
  id: string;
  status: string;
  name: string;
  originalName: string;
  gdLevelId: string;
  publisher: string;
  nerfCreator: string;
  verifier: string;
  thumbnailUrl: string | null;
  showcaseUrl: string;
  versionNotes: string | null;
  compatibilityNotes: string;
  createdLevelId: string | null;
}) {
  return {
    id: suggestion.id,
    status: suggestion.status,
    name: suggestion.name,
    originalName: suggestion.originalName,
    gdLevelId: suggestion.gdLevelId,
    publisher: suggestion.publisher,
    nerfCreator: suggestion.nerfCreator,
    verifier: suggestion.verifier,
    thumbnailUrl: suggestion.thumbnailUrl,
    showcaseUrl: suggestion.showcaseUrl,
    versionNotes: suggestion.versionNotes,
    compatibilityNotes: suggestion.compatibilityNotes,
    createdLevelId: suggestion.createdLevelId,
  };
}

function userAuditSnapshot(user: {
  id: string;
  playerName: string;
  displayName: string;
  role: string;
  emailVerifiedAt: Date | null;
}) {
  return {
    id: user.id,
    playerName: user.playerName,
    displayName: user.displayName,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
  };
}

async function writeLevelUpdateAudit(
  tx: AuditLogClient,
  admin: Awaited<ReturnType<typeof requireAdmin>>,
  beforeLevel: Parameters<typeof levelAuditSnapshot>[0] | null,
  afterLevel: Parameters<typeof levelAuditSnapshot>[0],
) {
  const after = levelAuditSnapshot(afterLevel);

  await writeAuditLog(tx, {
    actor: admin,
    action: "LEVEL_UPDATED",
    entityType: "Level",
    entityId: afterLevel.id,
    entityLabel: afterLevel.name,
    before: beforeLevel ? levelAuditSnapshot(beforeLevel) : undefined,
    after,
    note: "Level metadata, rank, status, or points were updated.",
  });

  if (!beforeLevel) {
    return;
  }

  const before = levelAuditSnapshot(beforeLevel);

  if (before.rank !== after.rank) {
    await writeAuditLog(tx, {
      actor: admin,
      action: "LEVEL_RANK_CHANGED",
      entityType: "Level",
      entityId: afterLevel.id,
      entityLabel: afterLevel.name,
      before: { rank: before.rank },
      after: { rank: after.rank },
      note: `Rank changed from ${before.rank ?? "unranked"} to ${
        after.rank ?? "unranked"
      }.`,
    });
  }

  if (before.status !== after.status) {
    await writeAuditLog(tx, {
      actor: admin,
      action: "LEVEL_STATUS_CHANGED",
      entityType: "Level",
      entityId: afterLevel.id,
      entityLabel: afterLevel.name,
      before: { status: before.status },
      after: { status: after.status },
      note: `Status changed from ${before.status} to ${after.status}.`,
    });

    if (after.status === "LEGACY" || after.status === "REMOVED") {
      await writeAuditLog(tx, {
        actor: admin,
        action: "LEVEL_RETIRED_REMOVED",
        entityType: "Level",
        entityId: afterLevel.id,
        entityLabel: afterLevel.name,
        before: { status: before.status, rank: before.rank },
        after: { status: after.status, rank: after.rank },
        note: `Level moved out of the active ranked list as ${after.status}.`,
      });
    }
  }

  if (before.thumbnailUrl !== after.thumbnailUrl) {
    await writeAuditLog(tx, {
      actor: admin,
      action: "LEVEL_THUMBNAIL_CHANGED",
      entityType: "Level",
      entityId: afterLevel.id,
      entityLabel: afterLevel.name,
      before: { thumbnailUrl: before.thumbnailUrl },
      after: { thumbnailUrl: after.thumbnailUrl },
      note: "Level thumbnail changed.",
    });
  }
}
