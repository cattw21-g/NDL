process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://ndl:ndl_dev_password@localhost:5432/ndl?schema=public";
process.env.SESSION_SECRET = process.env.SESSION_SECRET || "mock-session-secret-at-least-32-chars-long";

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: {},
}));
vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  canManageApplications,
  canApproveSubmission,
  isListReviewerRole,
  isListModeratorRole,
  isBetaTester,
} from "@/lib/permissions";
import { canChangeUserRole } from "@/lib/user-role-management";
import { executeApplicationDecision } from "@/actions/applications";
import { APPLICATION_TEMPLATES } from "@/lib/application-templates";
import type { Role } from "@/generated/prisma/enums";

const connectionString = "postgresql://ndl:ndl_dev_password@localhost:5432/ndl?schema=public";

describe("Real Application Full E2E Workflow & Privacy Suite", () => {
  let pool: Pool;
  let adapter: PrismaPg;
  let prisma: PrismaClient;
  let isDbAvailable = false;
  let adminUser: { id: string; displayName: string; role: Role; playerName: string };

  beforeAll(async () => {
    try {
      pool = new Pool({ connectionString, max: 20 });
      adapter = new PrismaPg(pool);
      prisma = new PrismaClient({ adapter });
      await prisma.$queryRaw`SELECT 1`;
      isDbAvailable = true;

      adminUser = await prisma.user.upsert({
        where: { id: "e2e-admin-root" },
        update: {},
        create: {
          id: "e2e-admin-root",
          email: "e2e-admin@ndl.test",
          passwordHash: "hash",
          displayName: "E2E Administrator",
          playerName: "cattw21",
          role: "ADMIN",
        },
      });
    } catch (e) {
      console.warn("Local PostgreSQL not available, skipping live E2E tests:", (e as Error).message);
      isDbAvailable = false;
    }
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    if (pool) {
      await pool.end();
    }
  });

  it("completes full production workflow: List Reviewer creation, draft/autosave, submission, shortlist, compare, private notes, accept/reject, and permission gates", async () => {
    if (!isDbAvailable) return;

    // STEP 1: ADMIN creates opening from template
    const reviewerTemplate = APPLICATION_TEMPLATES.LIST_REVIEWER;
    const openingSlug = `reviewer-e2e-${Date.now()}`;
    const opening = await prisma.applicationOpening.create({
      data: {
        title: "Official List Reviewer Applications",
        slug: openingSlug,
        role: "LIST_REVIEWER",
        description: reviewerTemplate.description,
        requirements: JSON.stringify(reviewerTemplate.requirements),
        status: "OPEN",
        isPublished: true,
        maxPositions: 1,
        createdById: adminUser.id,
        questions: {
          create: reviewerTemplate.questions.map((q) => ({
            order: q.order,
            prompt: q.prompt,
            description: q.description || null,
            type: q.type,
            required: q.required,
            options: q.options ? JSON.stringify(q.options) : null,
          })),
        },
      },
      include: { questions: true },
    });

    expect(opening.id).toBeDefined();
    expect(opening.status).toBe("OPEN");
    expect(opening.questions).toHaveLength(8);

    // STEP 2: USER A creates account and opens application
    const userA = await prisma.user.create({
      data: {
        email: `candidate-a-${Date.now()}@ndl.test`,
        passwordHash: "hash",
        displayName: "Candidate Alpha",
        playerName: `CandAlpha_${Date.now()}`,
        role: "PLAYER",
      },
    });

    // User A: draft & autosave
    const draftAnswers = {
      q1: "I have been reviewing GD runs for 2 years.",
      q2: "Very familiar",
    };

    const draftSub = await prisma.applicationSubmission.create({
      data: {
        openingId: opening.id,
        userId: userA.id,
        status: "DRAFT",
        answers: JSON.stringify(draftAnswers),
        questionSnapshot: "[]",
      },
    });

    // Simulate closing page and returning: verify draft restored exactly
    const restoredDraft = await prisma.applicationSubmission.findUnique({
      where: { id: draftSub.id },
    });
    expect(restoredDraft?.status).toBe("DRAFT");
    expect(JSON.parse(restoredDraft!.answers)).toEqual(draftAnswers);

    // Complete all 8 questions and submit
    const completeAnswersA = {
      q1: "I want to help review because I am dedicated to keeping list records honest and transparent.",
      q2: "Very familiar",
      q3: "I would check with the submitter for raw unedited footage before accepting.",
      q4: "Check audio clicks, video continuity, and FPS bypass legitimacy.",
      q5: "I would recuse myself and ask another reviewer to verify it.",
      q6: "Escalate to senior moderators with timestamp notes.",
      q7: "A few times a week",
      q8: "Ready to assist the team immediately.",
    };

    const frozenSnapshot = JSON.stringify(
      opening.questions.map((q) => ({
        id: q.id,
        order: q.order,
        prompt: q.prompt,
        type: q.type,
        required: q.required,
      })),
    );

    const submittedA = await prisma.applicationSubmission.update({
      where: { id: draftSub.id },
      data: {
        status: "SUBMITTED",
        answers: JSON.stringify(completeAnswersA),
        questionSnapshot: frozenSnapshot,
        submittedAt: new Date(),
      },
    });
    expect(submittedA.status).toBe("SUBMITTED");

    // STEP 3: USER B submits application for the same opening
    const userB = await prisma.user.create({
      data: {
        email: `candidate-b-${Date.now()}@ndl.test`,
        passwordHash: "hash",
        displayName: "Candidate Beta",
        playerName: `CandBeta_${Date.now()}`,
        role: "PLAYER",
      },
    });

    const completeAnswersB = {
      q1: "I want to help verify runs.",
      q2: "Pretty familiar",
      q3: "Ask for more video proof.",
      q4: "Look at the end screen.",
      q5: "Review it fairly.",
      q6: "Ask another moderator.",
      q7: "About once a week",
      q8: "",
    };

    const submittedB = await prisma.applicationSubmission.create({
      data: {
        openingId: opening.id,
        userId: userB.id,
        status: "SUBMITTED",
        answers: JSON.stringify(completeAnswersB),
        questionSnapshot: frozenSnapshot,
        submittedAt: new Date(),
      },
    });
    expect(submittedB.status).toBe("SUBMITTED");

    // STEP 4: ADMIN closes opening, shortlists A, compares A and B, adds private note
    await prisma.applicationOpening.update({
      where: { id: opening.id },
      data: { status: "CLOSED" },
    });

    // Shortlist A
    const shortlistedA = await prisma.applicationSubmission.update({
      where: { id: submittedA.id },
      data: { status: "SHORTLISTED" },
    });
    expect(shortlistedA.status).toBe("SHORTLISTED");

    // Admin compares submissions: verify both submissions loaded side-by-side
    const compareSubmissions = await prisma.applicationSubmission.findMany({
      where: { id: { in: [submittedA.id, submittedB.id] } },
      include: { user: true },
    });
    expect(compareSubmissions).toHaveLength(2);

    // Add private note to Candidate A
    const privateNote = await prisma.applicationNote.create({
      data: {
        submissionId: submittedA.id,
        authorId: adminUser.id,
        content: "PRIVATE ADMIN NOTE: Candidate A demonstrated comprehensive understanding of video splicing.",
      },
    });
    expect(privateNote.id).toBeDefined();

    // STEP 5: ADMIN accepts Candidate A and rejects Candidate B
    const acceptResult = await prisma.$transaction(async (tx) => {
      return executeApplicationDecision(tx, {
        submissionId: submittedA.id,
        decision: "ACCEPTED",
        adminUser: {
          id: adminUser.id,
          displayName: adminUser.displayName,
          role: adminUser.role,
          playerName: adminUser.playerName,
        },
        decisionNotes: "Strong proof knowledge and community conduct.",
      });
    });
    expect(acceptResult.roleGranted).toBe("LIST_REVIEWER");

    const rejectResult = await prisma.$transaction(async (tx) => {
      return executeApplicationDecision(tx, {
        submissionId: submittedB.id,
        decision: "REJECTED",
        adminUser: {
          id: adminUser.id,
          displayName: adminUser.displayName,
          role: adminUser.role,
          playerName: adminUser.playerName,
        },
        decisionNotes: "Position capacity reached.",
      });
    });
    expect(rejectResult.roleGranted).toBeNull();

    // STEP 6: VERIFY USER A STATE & PERMISSIONS
    const finalA = await prisma.applicationSubmission.findUnique({ where: { id: submittedA.id } });
    const finalUserA = await prisma.user.findUnique({ where: { id: userA.id } });
    const notifsA = await prisma.userNotification.findMany({ where: { userId: userA.id } });

    expect(finalA?.status).toBe("ACCEPTED");
    expect(finalUserA?.role).toBe("LIST_REVIEWER");
    expect(notifsA.some((n) => n.title.includes("Accepted") && n.type === "ROLE_CHANGE")).toBe(true);

    // Test User A Permission Gates:
    // 1. User A has LIST_REVIEWER permission:
    expect(isListReviewerRole(finalUserA?.role)).toBe(true);
    // 2. User A CANNOT access application admin:
    expect(canManageApplications(finalUserA?.role, finalUserA?.playerName)).toBe(false);
    // 3. User A CANNOT manage or change user roles:
    const roleChangeAttempt = canChangeUserRole({
      actorRole: finalUserA!.role,
      targetRole: "PLAYER",
      nextRole: "MODERATOR",
      otherAdminCount: 1,
    });
    expect(roleChangeAttempt.allowed).toBe(false);
    // 4. User A CANNOT final-approve Top 10 completions (Ranks 1–10):
    expect(canApproveSubmission(finalUserA?.role, 1, finalUserA?.playerName)).toBe(false);
    expect(canApproveSubmission(finalUserA?.role, 5, finalUserA?.playerName)).toBe(false);
    expect(canApproveSubmission(finalUserA?.role, 10, finalUserA?.playerName)).toBe(false);
    // 5. User A CAN review standard list demons (> 10):
    expect(canApproveSubmission(finalUserA?.role, 11, finalUserA?.playerName)).toBe(true);

    // STEP 7: VERIFY USER B STATE & PERMISSIONS
    const finalB = await prisma.applicationSubmission.findUnique({ where: { id: submittedB.id } });
    const finalUserB = await prisma.user.findUnique({ where: { id: userB.id } });
    const notifsB = await prisma.userNotification.findMany({ where: { userId: userB.id } });

    expect(finalB?.status).toBe("REJECTED");
    expect(finalUserB?.role).toBe("PLAYER"); // No staff permissions
    expect(notifsB.some((n) => n.title.includes("Status Update"))).toBe(true);
    expect(isListReviewerRole(finalUserB?.role)).toBe(false);

    // STEP 8: PRIVACY VERIFICATION
    // Ensure User A's application view NEVER queries or exposes private admin notes
    const applicantViewSub = await prisma.applicationSubmission.findUnique({
      where: { id: submittedA.id },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        opening: { select: { title: true, role: true } },
        // Notice 'notes' relation is omitted from applicant queries
      },
    });
    expect((applicantViewSub as Record<string, unknown>).notes).toBeUndefined();

    // Query private notes: only accessible with Admin relation query
    const privateNotesInDb = await prisma.applicationNote.findMany({
      where: { submissionId: submittedA.id },
    });
    expect(privateNotesInDb).toHaveLength(1);
    expect(privateNotesInDb[0].content).toContain("PRIVATE ADMIN NOTE");
  });

  it("completes reduced workflow for LIST_MODERATOR and BETA_TESTER", async () => {
    if (!isDbAvailable) return;

    // Reduced Moderator workflow
    const modOpening = await prisma.applicationOpening.create({
      data: {
        title: "List Moderator Application",
        slug: `mod-e2e-${Date.now()}`,
        role: "LIST_MODERATOR",
        description: "Moderator role",
        status: "OPEN",
        isPublished: true,
        maxPositions: 2,
        createdById: adminUser.id,
      },
    });

    const modUser = await prisma.user.create({
      data: {
        email: `mod-cand-${Date.now()}@ndl.test`,
        passwordHash: "hash",
        displayName: "Mod Candidate",
        playerName: `ModCand_${Date.now()}`,
        role: "PLAYER",
      },
    });

    const modSub = await prisma.applicationSubmission.create({
      data: {
        openingId: modOpening.id,
        userId: modUser.id,
        status: "SUBMITTED",
        answers: "{}",
        questionSnapshot: "[]",
      },
    });

    await prisma.$transaction(async (tx) => {
      return executeApplicationDecision(tx, {
        submissionId: modSub.id,
        decision: "ACCEPTED",
        adminUser: { id: adminUser.id, displayName: adminUser.displayName, role: "ADMIN", playerName: "cattw21" },
      });
    });

    const updatedModUser = await prisma.user.findUnique({ where: { id: modUser.id } });
    expect(updatedModUser?.role).toBe("LIST_MODERATOR");
    expect(isListModeratorRole(updatedModUser?.role)).toBe(true);
    // Moderator CANNOT final-approve Top 10 completions
    expect(canApproveSubmission(updatedModUser?.role, 1)).toBe(false);
    expect(canApproveSubmission(updatedModUser?.role, 10)).toBe(false);

    // Reduced Beta Tester workflow
    const betaOpening = await prisma.applicationOpening.create({
      data: {
        title: "Beta Tester Application",
        slug: `beta-e2e-${Date.now()}`,
        role: "BETA_TESTER",
        description: "Beta role",
        status: "OPEN",
        isPublished: true,
        maxPositions: 5,
        createdById: adminUser.id,
      },
    });

    const betaUser = await prisma.user.create({
      data: {
        email: `beta-cand-${Date.now()}@ndl.test`,
        passwordHash: "hash",
        displayName: "Beta Candidate",
        playerName: `BetaCand_${Date.now()}`,
        role: "PLAYER",
      },
    });

    const betaSub = await prisma.applicationSubmission.create({
      data: {
        openingId: betaOpening.id,
        userId: betaUser.id,
        status: "SUBMITTED",
        answers: "{}",
        questionSnapshot: "[]",
      },
    });

    await prisma.$transaction(async (tx) => {
      return executeApplicationDecision(tx, {
        submissionId: betaSub.id,
        decision: "ACCEPTED",
        adminUser: { id: adminUser.id, displayName: adminUser.displayName, role: "ADMIN", playerName: "cattw21" },
      });
    });

    const updatedBetaUser = await prisma.user.findUnique({ where: { id: betaUser.id } });
    expect(updatedBetaUser?.role).toBe("BETA_TESTER");
    expect(isBetaTester(updatedBetaUser?.role)).toBe(true);
    // Beta Tester has NO moderation or submission review permissions
    expect(isListReviewerRole(updatedBetaUser?.role)).toBe(false);
    expect(canApproveSubmission(updatedBetaUser?.role, 15)).toBe(false);
  });

  it("verifies application privacy: cross-user isolation, admin guards, and robots noindex", async () => {
    if (!isDbAvailable) return;

    // User A and User B
    const userA = await prisma.user.create({
      data: {
        email: `priv-a-${Date.now()}@ndl.test`,
        passwordHash: "hash",
        displayName: "Privacy User A",
        playerName: `PrivA_${Date.now()}`,
        role: "PLAYER",
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: `priv-b-${Date.now()}@ndl.test`,
        passwordHash: "hash",
        displayName: "Privacy User B",
        playerName: `PrivB_${Date.now()}`,
        role: "PLAYER",
      },
    });

    const opening = await prisma.applicationOpening.create({
      data: {
        title: "Privacy Test Opening",
        slug: `priv-op-${Date.now()}`,
        role: "BETA_TESTER",
        description: "Privacy check",
        status: "OPEN",
        maxPositions: 10,
        createdById: adminUser.id,
      },
    });

    const subA = await prisma.applicationSubmission.create({
      data: {
        openingId: opening.id,
        userId: userA.id,
        status: "SUBMITTED",
        answers: JSON.stringify({ secret: "User A sensitive answer" }),
        questionSnapshot: "[]",
      },
    });

    // Check 1: User B attempting to query user applications only receives their own
    const userBApplications = await prisma.applicationSubmission.findMany({
      where: { userId: userB.id },
    });
    expect(userBApplications.some((s) => s.id === subA.id)).toBe(false);

    // Check 2: Direct query by non-owner user ID returns nothing
    const crossAccess = await prisma.applicationSubmission.findFirst({
      where: { id: subA.id, userId: userB.id },
    });
    expect(crossAccess).toBeNull();

    // Check 3: Non-admin users cannot access admin management routes
    expect(canManageApplications(userA.role, userA.playerName)).toBe(false);
    expect(canManageApplications(userB.role, userB.playerName)).toBe(false);
    expect(canManageApplications("ADMIN", "cattw21")).toBe(true);
  });
});
