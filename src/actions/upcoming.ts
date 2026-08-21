"use server";

import { revalidatePath } from "next/cache";

import { DifficultyCategory, LevelStatus } from "@/generated/prisma/enums";
import { writeAuditLog } from "@/lib/audit-log";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FALLBACK_THUMBNAIL_SRC } from "@/lib/media";
import { updateLevelWithRank } from "@/lib/level-ranking";
import { calculateLevelPoints } from "@/lib/points";
import { slugify } from "@/lib/slug";

export async function addUpcomingLevelAction(formData: FormData) {
  const admin = await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const originalName = String(formData.get("originalName") || "").trim();
  const gdLevelId = String(formData.get("gdLevelId") || "").trim();
  const publisher = String(formData.get("publisher") || "").trim() || "Unknown";
  const nerfCreator = String(formData.get("nerfCreator") || "").trim() || "Unknown";
  const verifier = String(formData.get("verifier") || "").trim();
  const showcaseUrl = String(formData.get("showcaseUrl") || "").trim();
  const verificationVideoUrl = String(formData.get("verificationVideoUrl") || "").trim() || null;
  const thumbnailUrl = String(formData.get("thumbnailUrl") || "").trim() || FALLBACK_THUMBNAIL_SRC;
  const difficultyRaw = String(formData.get("difficulty") || "EXTREME").toUpperCase();
  const description = String(formData.get("description") || "").trim() || `Nerfed version of ${originalName}.`;

  if (!name || !originalName) {
    throw new Error("Level name and original demon name are required.");
  }

  const difficulty = Object.values(DifficultyCategory).includes(
    difficultyRaw as DifficultyCategory,
  )
    ? (difficultyRaw as DifficultyCategory)
    : DifficultyCategory.EXTREME;

  const baseSlug = slugify(name);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  let verifierUserId: string | null = null;
  if (verifier && verifier.toLowerCase() !== "open" && verifier.toLowerCase() !== "unassigned") {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { playerName: { equals: verifier, mode: "insensitive" } },
          { displayName: { equals: verifier, mode: "insensitive" } },
        ],
      },
    });
    if (existingUser) {
      verifierUserId = existingUser.id;
    }
  }

  const level = await prisma.level.create({
    data: {
      name,
      originalName,
      slug,
      gdLevelId,
      publisher,
      nerfCreator,
      verifier: verifier || "",
      verifierUserId,
      showcaseUrl,
      verificationVideoUrl,
      difficulty,
      description,
      status: LevelStatus.PENDING,
      rank: null,
      thumbnailUrl,
    },
  });

  await writeAuditLog(prisma, {
    actor: {
      id: admin.id,
      playerName: admin.playerName,
      displayName: admin.displayName,
      role: admin.role,
    },
    action: "UPCOMING_LEVEL_CREATED",
    entityType: "Level",
    entityId: level.id,
    entityLabel: `${level.name} (Upcoming)`,
    note: verifier ? `Currently Verifying by ${verifier}` : "Waiting for Verifier",
  });

  revalidatePath("/upcoming");
  revalidatePath("/admin/upcoming");
  revalidatePath("/admin/levels");
}

export async function updateUpcomingThumbnailAction(formData: FormData) {
  const admin = await requireAdmin();

  const levelId = String(formData.get("levelId") || "").trim();
  const thumbnailUrl = String(formData.get("thumbnailUrl") || "").trim();

  if (!levelId) {
    throw new Error("Level ID is required.");
  }

  const level = await prisma.level.findUnique({
    where: { id: levelId },
  });

  if (!level) {
    throw new Error("Level not found.");
  }

  await prisma.level.update({
    where: { id: levelId },
    data: {
      thumbnailUrl: thumbnailUrl || FALLBACK_THUMBNAIL_SRC,
    },
  });

  await writeAuditLog(prisma, {
    actor: {
      id: admin.id,
      playerName: admin.playerName,
      displayName: admin.displayName,
      role: admin.role,
    },
    action: "UPCOMING_THUMBNAIL_UPDATED",
    entityType: "Level",
    entityId: level.id,
    entityLabel: `${level.name} (Upcoming Thumbnail)`,
    note: `Updated thumbnail to ${thumbnailUrl || "fallback"}`,
  });

  revalidatePath("/upcoming");
  revalidatePath("/admin/upcoming");
  revalidatePath("/admin/levels");
}

export async function assignVerifierAction(formData: FormData) {
  const admin = await requireAdmin();

  const levelId = String(formData.get("levelId") || "").trim();
  const verifier = String(formData.get("verifier") || "").trim();
  const verificationVideoUrl = String(formData.get("verificationVideoUrl") || "").trim() || null;

  if (!levelId) {
    throw new Error("Level ID is required.");
  }

  let verifierUserId: string | null = null;
  if (verifier && verifier.toLowerCase() !== "open" && verifier.toLowerCase() !== "unassigned") {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { playerName: { equals: verifier, mode: "insensitive" } },
          { displayName: { equals: verifier, mode: "insensitive" } },
        ],
      },
    });
    if (existingUser) {
      verifierUserId = existingUser.id;
    }
  }

  const level = await prisma.level.update({
    where: { id: levelId },
    data: {
      verifier: verifier || "",
      verifierUserId,
      ...(verificationVideoUrl ? { verificationVideoUrl } : {}),
    },
  });

  await writeAuditLog(prisma, {
    actor: {
      id: admin.id,
      playerName: admin.playerName,
      displayName: admin.displayName,
      role: admin.role,
    },
    action: "UPCOMING_VERIFIER_ASSIGNED",
    entityType: "Level",
    entityId: level.id,
    entityLabel: `${level.name} -> Verifier: ${verifier || "Open"}`,
    note: `Verifier updated to ${verifier || "Open"}`,
  });

  revalidatePath("/upcoming");
  revalidatePath("/admin/upcoming");
}

export async function promoteUpcomingLevelAction(formData: FormData) {
  const admin = await requireAdmin();

  const levelId = String(formData.get("levelId") || "").trim();
  const rank = parseInt(String(formData.get("rank") || "1"), 10);
  const verificationVideoUrl = String(formData.get("verificationVideoUrl") || "").trim();
  const verifier = String(formData.get("verifier") || "").trim();

  if (!levelId || isNaN(rank) || rank < 1) {
    throw new Error("Valid level ID and rank number are required.");
  }

  const existingLevel = await prisma.level.findUnique({
    where: { id: levelId },
  });

  if (!existingLevel) {
    throw new Error("Level not found.");
  }

  const finalVerifier = verifier || existingLevel.verifier || "Unknown";
  const finalVideo = verificationVideoUrl || existingLevel.verificationVideoUrl || existingLevel.showcaseUrl || "";

  let verifierUser = await prisma.user.findFirst({
    where: {
      OR: [
        { playerName: { equals: finalVerifier, mode: "insensitive" } },
        { displayName: { equals: finalVerifier, mode: "insensitive" } },
      ],
    },
  });

  if (!verifierUser && finalVerifier && finalVerifier !== "Unknown") {
    const slugName = slugify(finalVerifier) || `verifier-${Date.now().toString(36)}`;
    verifierUser = await prisma.user.create({
      data: {
        email: `${slugName}@ndl.local`,
        playerName: slugName,
        displayName: finalVerifier,
        passwordHash: "external-verifier",
        role: "PLAYER",
      },
    });
  }

  await prisma.$transaction(async (tx) => {
    await updateLevelWithRank(tx, existingLevel.id, {
      name: existingLevel.name,
      originalName: existingLevel.originalName,
      gdLevelId: existingLevel.gdLevelId,
      publisher: existingLevel.publisher,
      nerfCreator: existingLevel.nerfCreator,
      verifier: finalVerifier,
      verifierUserId: verifierUser?.id || undefined,
      verificationVideoUrl: finalVideo,
      thumbnailUrl: existingLevel.thumbnailUrl,
      showcaseUrl: existingLevel.showcaseUrl,
      placementDate: new Date(),
      status: LevelStatus.RANKED,
      difficulty: existingLevel.difficulty,
      description: existingLevel.description,
      versionNotes: existingLevel.versionNotes || undefined,
      rank,
    });

    if (verifierUser && finalVideo) {
      const points = calculateLevelPoints(rank, LevelStatus.RANKED);
      await tx.record.create({
        data: {
          playerId: verifierUser.id,
          levelId: existingLevel.id,
          progress: 100,
          isVerifier: true,
          videoUrl: finalVideo,
          fps: 360,
          cbfUsed: false,
          pointsAwarded: points,
          isDemo: Boolean(existingLevel.isDemo),
          acceptedAt: new Date(),
        },
      });
    }
  });

  await writeAuditLog(prisma, {
    actor: {
      id: admin.id,
      playerName: admin.playerName,
      displayName: admin.displayName,
      role: admin.role,
    },
    action: "UPCOMING_LEVEL_PROMOTED",
    entityType: "Level",
    entityId: existingLevel.id,
    entityLabel: `${existingLevel.name} ranked #${rank}`,
    note: `Promoted from upcoming queue to main ranked list at #${rank}`,
  });

  revalidatePath("/");
  revalidatePath("/upcoming");
  revalidatePath("/players");
  revalidatePath(`/levels/${existingLevel.slug}`);
  revalidatePath("/admin/upcoming");
  revalidatePath("/admin/levels");
}

export async function deleteUpcomingLevelAction(formData: FormData) {
  const admin = await requireAdmin();

  const levelId = String(formData.get("levelId") || "").trim();
  if (!levelId) {
    throw new Error("Level ID is required.");
  }

  const level = await prisma.level.findUnique({
    where: { id: levelId },
  });

  if (!level || level.status !== LevelStatus.PENDING) {
    return;
  }

  await prisma.level.delete({
    where: { id: levelId },
  });

  await writeAuditLog(prisma, {
    actor: {
      id: admin.id,
      playerName: admin.playerName,
      displayName: admin.displayName,
      role: admin.role,
    },
    action: "UPCOMING_LEVEL_DELETED",
    entityType: "Level",
    entityId: levelId,
    entityLabel: `${level.name}`,
    note: "Removed from upcoming queue",
  });

  revalidatePath("/upcoming");
  revalidatePath("/admin/upcoming");
}

export async function deleteUpcomingSuggestionAction(formData: FormData) {
  const admin = await requireAdmin();

  const suggestionId = String(formData.get("suggestionId") || "").trim();
  if (!suggestionId) {
    throw new Error("Suggestion ID is required.");
  }

  const suggestion = await prisma.levelSuggestion.findUnique({
    where: { id: suggestionId },
  });

  if (!suggestion) {
    return;
  }

  await prisma.levelSuggestion.delete({
    where: { id: suggestionId },
  });

  await writeAuditLog(prisma, {
    actor: {
      id: admin.id,
      playerName: admin.playerName,
      displayName: admin.displayName,
      role: admin.role,
    },
    action: "UPCOMING_SUGGESTION_DELETED",
    entityType: "LevelSuggestion",
    entityId: suggestionId,
    entityLabel: `${suggestion.name} (Suggestion)`,
    note: "Removed from upcoming queue",
  });

  revalidatePath("/upcoming");
  revalidatePath("/admin/upcoming");
  revalidatePath("/level-suggestions");
}

export async function moveSuggestionToWaitingAction(formData: FormData) {
  const admin = await requireAdmin();

  const suggestionId = String(formData.get("suggestionId") || "").trim();
  if (!suggestionId) {
    throw new Error("Suggestion ID is required.");
  }

  const suggestion = await prisma.levelSuggestion.findUnique({
    where: { id: suggestionId },
  });

  if (!suggestion) {
    throw new Error("Suggestion not found.");
  }

  const baseSlug = slugify(suggestion.name);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const level = await prisma.level.create({
    data: {
      name: suggestion.name,
      originalName: suggestion.originalName,
      slug,
      gdLevelId: suggestion.gdLevelId,
      publisher: suggestion.publisher,
      nerfCreator: suggestion.nerfCreator,
      verifier: "",
      verifierUserId: null,
      showcaseUrl: suggestion.showcaseUrl,
      verificationVideoUrl: suggestion.verificationVideoUrl || null,
      thumbnailUrl: suggestion.thumbnailUrl || FALLBACK_THUMBNAIL_SRC,
      difficulty: DifficultyCategory.EXTREME,
      description:
        suggestion.versionNotes ||
        `Approved nerfed version of ${suggestion.originalName}.`,
      status: LevelStatus.PENDING,
      rank: null,
      isDemo: Boolean(suggestion.isDemo),
    },
  });

  await prisma.levelSuggestion.update({
    where: { id: suggestionId },
    data: {
      status: "CONVERTED",
      createdLevelId: level.id,
    },
  });

  await writeAuditLog(prisma, {
    actor: {
      id: admin.id,
      playerName: admin.playerName,
      displayName: admin.displayName,
      role: admin.role,
    },
    action: "SUGGESTION_MOVED_TO_WAITING",
    entityType: "Level",
    entityId: level.id,
    entityLabel: `${level.name} (Waiting Levels)`,
    note: `Approved suggestion moved to Waiting Levels queue`,
  });

  revalidatePath("/upcoming");
  revalidatePath("/admin/upcoming");
  revalidatePath("/level-suggestions");
}

export async function moveSuggestionToVerifyingAction(formData: FormData) {
  const admin = await requireAdmin();

  const suggestionId = String(formData.get("suggestionId") || "").trim();
  const verifier = String(formData.get("verifier") || "").trim();

  if (!suggestionId || !verifier) {
    throw new Error("Suggestion ID and Verifier name are required.");
  }

  const suggestion = await prisma.levelSuggestion.findUnique({
    where: { id: suggestionId },
  });

  if (!suggestion) {
    throw new Error("Suggestion not found.");
  }

  let verifierUserId: string | null = null;
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { playerName: { equals: verifier, mode: "insensitive" } },
        { displayName: { equals: verifier, mode: "insensitive" } },
      ],
    },
  });
  if (existingUser) {
    verifierUserId = existingUser.id;
  }

  const baseSlug = slugify(suggestion.name);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const level = await prisma.level.create({
    data: {
      name: suggestion.name,
      originalName: suggestion.originalName,
      slug,
      gdLevelId: suggestion.gdLevelId,
      publisher: suggestion.publisher,
      nerfCreator: suggestion.nerfCreator,
      verifier,
      verifierUserId,
      showcaseUrl: suggestion.showcaseUrl,
      verificationVideoUrl: suggestion.verificationVideoUrl || null,
      thumbnailUrl: suggestion.thumbnailUrl || FALLBACK_THUMBNAIL_SRC,
      difficulty: DifficultyCategory.EXTREME,
      description:
        suggestion.versionNotes ||
        `Approved nerfed version of ${suggestion.originalName}.`,
      status: LevelStatus.PENDING,
      rank: null,
      isDemo: Boolean(suggestion.isDemo),
    },
  });

  await prisma.levelSuggestion.update({
    where: { id: suggestionId },
    data: {
      status: "CONVERTED",
      createdLevelId: level.id,
    },
  });

  await writeAuditLog(prisma, {
    actor: {
      id: admin.id,
      playerName: admin.playerName,
      displayName: admin.displayName,
      role: admin.role,
    },
    action: "SUGGESTION_MOVED_TO_VERIFYING",
    entityType: "Level",
    entityId: level.id,
    entityLabel: `${level.name} (Verifier: ${verifier})`,
    note: `Approved suggestion assigned to verifier ${verifier} in Currently Verifying queue`,
  });

  revalidatePath("/upcoming");
  revalidatePath("/admin/upcoming");
  revalidatePath("/level-suggestions");
}
