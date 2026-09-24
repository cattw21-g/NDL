"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { canManageApplications, isBetaTester } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { createUserNotification } from "@/lib/notifications";
import { APPLICATION_TEMPLATES } from "@/lib/application-templates";
import {
  type ApplicationRole,
  type ApplicationOpeningStatus,
  type ApplicationQuestionType,
  type BetaFeedbackType,
  type BetaFeedbackStatus,
  type Role,
  ModerationActionType,
} from "@/generated/prisma/enums";

export type ActionResult<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

// ==========================================
// APPLICANT ACTIONS
// ==========================================

export async function saveApplicationDraftAction(params: {
  openingId: string;
  answers: Record<string, unknown>;
}): Promise<ActionResult<{ submissionId: string; updatedAt: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be signed in to save an application." };
  }

  try {
    let opening = await prisma.applicationOpening.findUnique({
      where: { id: params.openingId },
      select: { id: true, status: true, deadline: true },
    });

    if (!opening) {
      opening = await prisma.applicationOpening.findUnique({
        where: { slug: params.openingId },
        select: { id: true, status: true, deadline: true },
      });
    }

    if (!opening) {
      return { success: false, error: "Application opening not found." };
    }

    if (opening.status !== "OPEN") {
      return { success: false, error: "This application opening is currently closed." };
    }

    if (opening.deadline && new Date() > opening.deadline) {
      return { success: false, error: "The deadline for this opening has passed." };
    }

    // Find or create draft
    const existing = await prisma.applicationSubmission.findUnique({
      where: {
        openingId_userId: {
          openingId: opening.id,
          userId: user.id,
        },
      },
    });

    if (existing && existing.status !== "DRAFT" && existing.status !== "WITHDRAWN") {
      return { success: false, error: "You have already submitted this application." };
    }

    const answersJson = JSON.stringify(params.answers);

    if (existing) {
      const updated = await prisma.applicationSubmission.update({
        where: { id: existing.id },
        data: {
          answers: answersJson,
          status: "DRAFT",
        },
      });
      return {
        success: true,
        message: "Draft saved.",
        data: { submissionId: updated.id, updatedAt: updated.updatedAt.toISOString() },
      };
    }

    const created = await prisma.applicationSubmission.create({
      data: {
        openingId: opening.id,
        userId: user.id,
        status: "DRAFT",
        answers: answersJson,
      },
    });

    return {
      success: true,
      message: "Draft created.",
      data: { submissionId: created.id, updatedAt: created.updatedAt.toISOString() },
    };
  } catch (err: unknown) {
    console.error("saveApplicationDraftAction error:", err);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("connect") || message.includes("timeout") || message.includes("quota") || message.includes("ECONNREFUSED")) {
      return { success: false, error: "The database is temporarily unavailable. Your answers are preserved locally — please try saving again in a moment." };
    }
    return { success: false, error: "Failed to save draft. Please try again." };
  }
}

export async function submitApplicationAction(params: {
  openingId: string;
  answers: Record<string, unknown>;
}): Promise<ActionResult<{ submissionId: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be signed in to submit an application." };
  }

  try {
    let opening = await prisma.applicationOpening.findUnique({
      where: { id: params.openingId },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!opening) {
      opening = await prisma.applicationOpening.findUnique({
        where: { slug: params.openingId },
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
        },
      });
    }

    if (!opening) {
      return { success: false, error: "Application opening not found." };
    }

    if (opening.status !== "OPEN") {
      return { success: false, error: "This application opening is not currently accepting submissions." };
    }

    if (opening.deadline && new Date() > opening.deadline) {
      return { success: false, error: "The deadline for this opening has passed." };
    }

    // Validate all required questions
    for (const q of opening.questions) {
      const ans = params.answers[q.id];
      const strVal = typeof ans === "string" ? ans.trim() : "";

      if (q.required) {
        if (ans === undefined || ans === null || strVal === "") {
          return {
            success: false,
            error: `Question "${q.prompt.slice(0, 40)}..." is required.`,
          };
        }
      }

      if (strVal && q.minLength && strVal.length < q.minLength) {
        return {
          success: false,
          error: `Question "${q.prompt.slice(0, 40)}..." must be at least ${q.minLength} characters.`,
        };
      }

      if (strVal && q.maxLength && strVal.length > q.maxLength) {
        return {
          success: false,
          error: `Question "${q.prompt.slice(0, 40)}..." cannot exceed ${q.maxLength} characters.`,
        };
      }
    }

    // Freeze immutable question snapshot
    const questionSnapshot = JSON.stringify(
      opening.questions.map((q) => ({
        id: q.id,
        order: q.order,
        prompt: q.prompt,
        description: q.description,
        type: q.type,
        required: q.required,
        options: q.options ? JSON.parse(q.options) : null,
      })),
    );

    const answersJson = JSON.stringify(params.answers);

    const existing = await prisma.applicationSubmission.findUnique({
      where: {
        openingId_userId: {
          openingId: opening.id,
          userId: user.id,
        },
      },
    });

    let submission;

    if (existing) {
      if (existing.status !== "DRAFT" && existing.status !== "WITHDRAWN") {
        return { success: false, error: "You have already submitted this application." };
      }

      submission = await prisma.applicationSubmission.update({
        where: { id: existing.id },
        data: {
          status: "SUBMITTED",
          answers: answersJson,
          questionSnapshot,
          submittedAt: new Date(),
        },
      });
    } else {
      submission = await prisma.applicationSubmission.create({
        data: {
          openingId: opening.id,
          userId: user.id,
          status: "SUBMITTED",
          answers: answersJson,
          questionSnapshot,
          submittedAt: new Date(),
        },
      });
    }

    // Send applicant a confirmation notification
    await createUserNotification({
      userId: user.id,
      title: "Application Submitted",
      message: `Your application for "${opening.title}" has been successfully submitted and is under review.`,
      link: "/applications/mine",
      type: "APPLICATION",
    });

    revalidatePath(`/applications/${opening.slug}`);
    revalidatePath("/applications/mine");
    revalidatePath(`/admin/applications/${opening.id}`);

    return {
      success: true,
      message: "Application submitted successfully.",
      data: { submissionId: submission.id },
    };
  } catch (err: unknown) {
    console.error("submitApplicationAction error:", err);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("connect") || message.includes("timeout") || message.includes("quota") || message.includes("ECONNREFUSED")) {
      return { success: false, error: "The database is temporarily unavailable. Your answers have been preserved — please try submitting again in a few minutes." };
    }
    return { success: false, error: "Submission failed due to a server error. Please try again." };
  }
}

export async function withdrawApplicationAction(params: {
  submissionId: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Row lock the submission to serialize against concurrent accept/reject decisions
      await tx.$queryRaw`SELECT "id" FROM "ApplicationSubmission" WHERE "id" = ${params.submissionId} FOR UPDATE`;

      const submission = await tx.applicationSubmission.findUnique({
        where: { id: params.submissionId },
        include: { opening: true },
      });

      if (!submission || submission.userId !== user.id) {
        throw new Error("Application not found.");
      }

      if (submission.status === "ACCEPTED") {
        throw new Error("Cannot withdraw an accepted application.");
      }

      if (submission.status === "WITHDRAWN") {
        return { success: true, message: "Application already withdrawn." };
      }

      if (submission.status === "REJECTED") {
        throw new Error("Application has already been reviewed.");
      }

      await tx.applicationSubmission.update({
        where: { id: submission.id },
        data: {
          status: "WITHDRAWN",
        },
      });

      return { success: true, message: "Application withdrawn." };
    });

    revalidatePath("/applications/mine");
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// ==========================================
// ADMIN ACTIONS: OPENINGS & REVIEW
// ==========================================

export async function createApplicationOpeningAction(params: {
  title: string;
  slug: string;
  role: ApplicationRole;
  description: string;
  requirements?: string[];
  status?: ApplicationOpeningStatus;
  openAt?: string | null;
  deadline?: string | null;
  maxPositions?: number | null;
  questions: Array<{
    order: number;
    prompt: string;
    description?: string;
    type: ApplicationQuestionType;
    required: boolean;
    options?: string[];
    placeholder?: string;
    minLength?: number;
    maxLength?: number;
  }>;
}): Promise<ActionResult<{ openingId: string; slug: string }>> {
  const user = await getCurrentUser();
  if (!user || !canManageApplications(user.role, user.playerName)) {
    return { success: false, error: "Administrator authorization required." };
  }

  const cleanSlug = params.slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
  if (!cleanSlug) {
    return { success: false, error: "A valid URL slug is required." };
  }

  try {
    const existingSlug = await prisma.applicationOpening.findUnique({
      where: { slug: cleanSlug },
    });
    if (existingSlug) {
      return { success: false, error: `An opening with slug "${cleanSlug}" already exists.` };
    }
  } catch {
    const { ensureApplicationSchemaAndOpenings } = await import("@/lib/ensure-application-schema");
    await ensureApplicationSchemaAndOpenings();
  }

  const opening = await prisma.applicationOpening.create({
    data: {
      title: params.title.trim(),
      slug: cleanSlug,
      role: params.role,
      description: params.description.trim(),
      requirements: params.requirements ? JSON.stringify(params.requirements) : null,
      status: params.status || "DRAFT",
      isPublished: params.status === "OPEN",
      openAt: params.openAt ? new Date(params.openAt) : new Date(),
      deadline: params.deadline ? new Date(params.deadline) : null,
      maxPositions: params.maxPositions || null,
      createdById: user.id,
      questions: {
        create: params.questions.map((q, idx) => ({
          order: q.order ?? idx + 1,
          prompt: q.prompt.trim(),
          description: q.description?.trim() || null,
          type: q.type,
          required: q.required ?? true,
          options: q.options ? JSON.stringify(q.options) : null,
          placeholder: q.placeholder?.trim() || null,
          minLength: q.minLength || null,
          maxLength: q.maxLength || null,
        })),
      },
    },
  });

  revalidatePath("/applications");
  revalidatePath("/admin/applications");

  return {
    success: true,
    message: "Application opening created.",
    data: { openingId: opening.id, slug: opening.slug },
  };
}

export async function updateOpeningStatusAction(params: {
  openingId: string;
  status: ApplicationOpeningStatus;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !canManageApplications(user.role, user.playerName)) {
    return { success: false, error: "Administrator authorization required." };
  }

  await prisma.applicationOpening.update({
    where: { id: params.openingId },
    data: {
      status: params.status,
      isPublished: params.status === "OPEN",
    },
  });

  revalidatePath("/applications");
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${params.openingId}`);

  return { success: true, message: `Opening status updated to ${params.status}.` };
}

export async function createOpeningFromTemplateAction(
  role: ApplicationRole,
): Promise<ActionResult<{ openingId: string; slug: string }>> {
  const user = await getCurrentUser();
  if (!user || !canManageApplications(user.role, user.playerName)) {
    return { success: false, error: "Administrator authorization required." };
  }

  const tmpl = APPLICATION_TEMPLATES[role];
  if (!tmpl) {
    return { success: false, error: `Template for role "${role}" not found.` };
  }

  // Generate unique slug if already exists
  let targetSlug = tmpl.slug;
  const existing = await prisma.applicationOpening.findUnique({
    where: { slug: targetSlug },
  });
  if (existing) {
    targetSlug = `${tmpl.slug}-${Date.now().toString(36)}`;
  }

  return createApplicationOpeningAction({
    title: tmpl.title,
    slug: targetSlug,
    role: tmpl.role,
    description: tmpl.description,
    requirements: tmpl.requirements,
    status: "DRAFT",
    maxPositions: tmpl.defaultMaxPositions,
    questions: tmpl.questions,
  });
}

export async function addApplicationNoteAction(params: {
  submissionId: string;
  content: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !canManageApplications(user.role, user.playerName)) {
    return { success: false, error: "Administrator authorization required." };
  }

  const cleanContent = params.content.trim();
  if (!cleanContent) {
    return { success: false, error: "Note content cannot be empty." };
  }

  await prisma.applicationNote.create({
    data: {
      submissionId: params.submissionId,
      authorId: user.id,
      content: cleanContent,
    },
  });

  revalidatePath(`/admin/applications`);

  return { success: true, message: "Note added." };
}

export async function shortlistApplicationAction(params: {
  submissionId: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !canManageApplications(user.role, user.playerName)) {
    return { success: false, error: "Administrator authorization required." };
  }

  const submission = await prisma.applicationSubmission.update({
    where: { id: params.submissionId },
    data: {
      status: "SHORTLISTED",
    },
  });

  revalidatePath(`/admin/applications/${submission.openingId}`);

  return { success: true, message: "Applicant shortlisted." };
}

export async function executeApplicationDecision(
  tx: Prisma.TransactionClient,
  params: {
    submissionId: string;
    decision: "ACCEPTED" | "REJECTED";
    adminUser: { id: string; displayName: string; role: Role; playerName: string };
    decisionNotes?: string;
    ignorePositionLimit?: boolean;
  },
) {
  // Lock the submission row with SELECT ... FOR UPDATE to eliminate races between concurrent decisions / withdrawals
  await tx.$queryRaw`SELECT "id" FROM "ApplicationSubmission" WHERE "id" = ${params.submissionId} FOR UPDATE`;

  const submission = await tx.applicationSubmission.findUnique({
    where: { id: params.submissionId },
    include: {
      opening: true,
      user: true,
    },
  });

  if (!submission) {
    throw new Error("Application submission not found.");
  }

  if (submission.status === "ACCEPTED") {
    throw new Error("Application has already been accepted.");
  }

  if (submission.status === "REJECTED") {
    throw new Error("Application has already been rejected.");
  }

  if (submission.status === "WITHDRAWN") {
    throw new Error("Cannot decide a withdrawn application.");
  }

  if (params.decision === "ACCEPTED") {
    // If position limits apply, lock the ApplicationOpening row FOR UPDATE before counting to serialize capacity decisions
    if (submission.opening.maxPositions && !params.ignorePositionLimit) {
      await tx.$queryRaw`SELECT "id" FROM "ApplicationOpening" WHERE "id" = ${submission.openingId} FOR UPDATE`;

      const acceptedCount = await tx.applicationSubmission.count({
        where: {
          openingId: submission.openingId,
          status: "ACCEPTED",
        },
      });

      if (acceptedCount >= submission.opening.maxPositions) {
        throw new Error(
          `Position limit reached (${acceptedCount}/${submission.opening.maxPositions} accepted). Position is already filled.`,
        );
      }
    }

    // Map ApplicationRole to user Role
    const roleMapping: Record<ApplicationRole, Role> = {
      LIST_REVIEWER: "LIST_REVIEWER",
      LIST_MODERATOR: "LIST_MODERATOR",
      BETA_TESTER: "BETA_TESTER",
    };

    const targetUserRole = roleMapping[submission.opening.role];

    // Atomically execute: update submission, update user role, create moderation audit log, notification, outbox job
    const updatedSubmission = await tx.applicationSubmission.update({
      where: { id: submission.id },
      data: {
        status: "ACCEPTED",
        decidedAt: new Date(),
        decidedById: params.adminUser.id,
        decisionNotes: params.decisionNotes?.trim() || null,
      },
    });

    if (submission.user.role !== "ADMIN") {
      await tx.user.update({
        where: { id: submission.userId },
        data: {
          role: targetUserRole,
        },
      });

      await tx.moderationAction.create({
        data: {
          actorId: params.adminUser.id,
          type: ModerationActionType.USER_ROLE_UPDATED,
          targetType: "User",
          targetId: submission.userId,
          summary: `${params.adminUser.displayName} granted ${submission.user.displayName} the ${targetUserRole} role via Staff Application acceptance.`,
          metadata: {
            previousRole: submission.user.role,
            nextRole: targetUserRole,
            openingId: submission.openingId,
            submissionId: submission.id,
          },
        },
      });
    }

    // Create UserNotification inside transaction
    await tx.userNotification.create({
      data: {
        userId: submission.userId,
        title: "Application Accepted!",
        message: `Congratulations! Your application for "${submission.opening.title}" has been accepted, and you have been granted the ${targetUserRole} role.`,
        link: "/applications/mine",
        type: "ROLE_CHANGE",
      },
    });

    // Enqueue DiscordSyncJob inside transaction
    await tx.discordSyncJob.create({
      data: {
        userId: submission.userId,
        action: "ADD_ROLE",
        roleKey: submission.opening.role.toLowerCase(),
        payload: JSON.stringify({ reason: "Staff application accepted" }),
        status: "PENDING",
        attempts: 0,
        nextAttemptAt: new Date(),
      },
    });

    return { submission: updatedSubmission, roleGranted: targetUserRole };
  } else {
    // REJECTED
    const updatedSubmission = await tx.applicationSubmission.update({
      where: { id: submission.id },
      data: {
        status: "REJECTED",
        decidedAt: new Date(),
        decidedById: params.adminUser.id,
        decisionNotes: params.decisionNotes?.trim() || null,
      },
    });

    await tx.userNotification.create({
      data: {
        userId: submission.userId,
        title: "Application Status Update",
        message: `Your application for "${submission.opening.title}" has been reviewed. Thank you for your interest and time.`,
        link: "/applications/mine",
        type: "APPLICATION",
      },
    });

    return { submission: updatedSubmission, roleGranted: null };
  }
}

export async function decideApplicationAction(params: {
  submissionId: string;
  decision: "ACCEPTED" | "REJECTED";
  decisionNotes?: string;
  ignorePositionLimit?: boolean;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !canManageApplications(user.role, user.playerName)) {
    return { success: false, error: "Administrator authorization required." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      return executeApplicationDecision(tx, {
        submissionId: params.submissionId,
        decision: params.decision,
        adminUser: {
          id: user.id,
          displayName: user.displayName,
          role: user.role as Role,
          playerName: user.playerName,
        },
        decisionNotes: params.decisionNotes,
        ignorePositionLimit: params.ignorePositionLimit,
      });
    });

    revalidatePath(`/admin/applications/${result.submission.openingId}`);
    revalidatePath(`/admin/applications/${result.submission.openingId}/submissions/${result.submission.id}`);
    revalidatePath("/applications/mine");

    return {
      success: true,
      message: `Application ${params.decision.toLowerCase()}.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: message,
    };
  }
}

// ==========================================
// BETA FEEDBACK ACTIONS
// ==========================================

export async function submitBetaFeedbackAction(params: {
  type: BetaFeedbackType;
  title: string;
  description: string;
  pageUrl?: string;
  browserInfo?: string;
}): Promise<ActionResult<{ feedbackId: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  if (!isBetaTester(user.role)) {
    return { success: false, error: "Only Beta Testers and Staff can submit beta feedback." };
  }

  const cleanTitle = params.title.trim();
  const cleanDesc = params.description.trim();

  if (!cleanTitle || cleanTitle.length < 5) {
    return { success: false, error: "Title must be at least 5 characters." };
  }

  if (!cleanDesc || cleanDesc.length < 15) {
    return { success: false, error: "Description must be at least 15 characters." };
  }

  const feedback = await prisma.betaFeedback.create({
    data: {
      userId: user.id,
      type: params.type,
      title: cleanTitle,
      description: cleanDesc,
      pageUrl: params.pageUrl?.trim() || null,
      browserInfo: params.browserInfo?.trim() || null,
      status: "NEW",
    },
  });

  revalidatePath("/beta/feedback");

  return {
    success: true,
    message: "Feedback submitted. Thank you for helping improve Nerfed Demonlist!",
    data: { feedbackId: feedback.id },
  };
}

export async function updateBetaFeedbackStatusAction(params: {
  feedbackId: string;
  status: BetaFeedbackStatus;
  adminNotes?: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !canManageApplications(user.role, user.playerName)) {
    return { success: false, error: "Administrator authorization required." };
  }

  const feedback = await prisma.betaFeedback.update({
    where: { id: params.feedbackId },
    data: {
      status: params.status,
      adminNotes: params.adminNotes?.trim() || undefined,
    },
    include: { user: true },
  });

  // Notify feedback author
  await createUserNotification({
    userId: feedback.userId,
    title: "Beta Feedback Update",
    message: `Your beta feedback "${feedback.title.slice(0, 30)}..." status has been updated to ${params.status}.`,
    link: "/beta/feedback",
    type: "BETA",
  });

  revalidatePath("/beta/feedback");
  revalidatePath("/admin/beta-feedback");

  return { success: true, message: `Feedback status updated to ${params.status}.` };
}
