-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'LIST_MODERATOR';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'LIST_REVIEWER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'BETA_TESTER';

-- CreateEnum
CREATE TYPE "ApplicationRole" AS ENUM ('LIST_REVIEWER', 'LIST_MODERATOR', 'BETA_TESTER');
CREATE TYPE "ApplicationOpeningStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED');
CREATE TYPE "ApplicationQuestionType" AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'YES_NO');
CREATE TYPE "ApplicationSubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'WITHDRAWN', 'SHORTLISTED', 'ACCEPTED', 'REJECTED');
CREATE TYPE "BetaFeedbackType" AS ENUM ('BUG', 'UI_UX', 'PERFORMANCE', 'SUGGESTION', 'OTHER');
CREATE TYPE "BetaFeedbackStatus" AS ENUM ('NEW', 'REVIEWING', 'FIXED', 'WONT_FIX');

-- CreateTable
CREATE TABLE "ApplicationOpening" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "role" "ApplicationRole" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ApplicationOpeningStatus" NOT NULL DEFAULT 'DRAFT',
    "openAt" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "maxPositions" INTEGER,
    "requirements" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationOpening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationQuestion" (
    "id" TEXT NOT NULL,
    "openingId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "description" TEXT,
    "type" "ApplicationQuestionType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "options" TEXT,
    "placeholder" TEXT,
    "minLength" INTEGER,
    "maxLength" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationSubmission" (
    "id" TEXT NOT NULL,
    "openingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ApplicationSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "answers" TEXT NOT NULL DEFAULT '{}',
    "questionSnapshot" TEXT,
    "submittedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    "decisionNotes" TEXT,
    "rating" INTEGER,
    "rubricScores" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationNote" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscordSyncJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "roleKey" TEXT NOT NULL,
    "payload" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordSyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetaFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BetaFeedbackType" NOT NULL,
    "status" "BetaFeedbackStatus" NOT NULL DEFAULT 'NEW',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pageUrl" TEXT,
    "browserInfo" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BetaFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationOpening_slug_key" ON "ApplicationOpening"("slug");
CREATE INDEX "ApplicationOpening_slug_idx" ON "ApplicationOpening"("slug");
CREATE INDEX "ApplicationOpening_status_idx" ON "ApplicationOpening"("status");
CREATE INDEX "ApplicationOpening_role_idx" ON "ApplicationOpening"("role");

-- CreateIndex
CREATE INDEX "ApplicationQuestion_openingId_order_idx" ON "ApplicationQuestion"("openingId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationSubmission_openingId_userId_key" ON "ApplicationSubmission"("openingId", "userId");
CREATE INDEX "ApplicationSubmission_openingId_status_idx" ON "ApplicationSubmission"("openingId", "status");
CREATE INDEX "ApplicationSubmission_userId_status_idx" ON "ApplicationSubmission"("userId", "status");

-- CreateIndex
CREATE INDEX "ApplicationNote_submissionId_createdAt_idx" ON "ApplicationNote"("submissionId", "createdAt");

-- CreateIndex
CREATE INDEX "UserNotification_userId_read_createdAt_idx" ON "UserNotification"("userId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "DiscordSyncJob_status_nextAttemptAt_idx" ON "DiscordSyncJob"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "BetaFeedback_status_createdAt_idx" ON "BetaFeedback"("status", "createdAt");
CREATE INDEX "BetaFeedback_userId_createdAt_idx" ON "BetaFeedback"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ApplicationOpening" ADD CONSTRAINT "ApplicationOpening_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationQuestion" ADD CONSTRAINT "ApplicationQuestion_openingId_fkey" FOREIGN KEY ("openingId") REFERENCES "ApplicationOpening"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationSubmission" ADD CONSTRAINT "ApplicationSubmission_openingId_fkey" FOREIGN KEY ("openingId") REFERENCES "ApplicationOpening"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationSubmission" ADD CONSTRAINT "ApplicationSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationSubmission" ADD CONSTRAINT "ApplicationSubmission_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationNote" ADD CONSTRAINT "ApplicationNote_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ApplicationSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationNote" ADD CONSTRAINT "ApplicationNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetaFeedback" ADD CONSTRAINT "BetaFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
