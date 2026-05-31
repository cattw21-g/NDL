-- CreateEnum
CREATE TYPE "LevelSuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_CHANGES');

-- AlterEnum
ALTER TYPE "ModerationActionType" ADD VALUE 'LEVEL_SUGGESTION_CREATED';
ALTER TYPE "ModerationActionType" ADD VALUE 'LEVEL_SUGGESTION_APPROVED';
ALTER TYPE "ModerationActionType" ADD VALUE 'LEVEL_SUGGESTION_REJECTED';
ALTER TYPE "ModerationActionType" ADD VALUE 'LEVEL_SUGGESTION_NEEDS_CHANGES';
ALTER TYPE "ModerationActionType" ADD VALUE 'LEVEL_SUGGESTION_CONVERTED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Level" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RecordSubmission" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Record" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ChangelogPost" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LevelSuggestion" (
    "id" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "createdLevelId" TEXT,
    "name" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "gdLevelId" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "nerfCreator" TEXT NOT NULL,
    "verifier" TEXT NOT NULL,
    "showcaseUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "versionNotes" TEXT,
    "compatibilityNotes" TEXT NOT NULL,
    "status" "LevelSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "moderatorNotes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LevelSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitAttempt" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LevelSuggestion_createdLevelId_key" ON "LevelSuggestion"("createdLevelId");

-- CreateIndex
CREATE INDEX "User_isDemo_idx" ON "User"("isDemo");

-- CreateIndex
CREATE INDEX "Level_isDemo_idx" ON "Level"("isDemo");

-- CreateIndex
CREATE INDEX "RecordSubmission_isDemo_idx" ON "RecordSubmission"("isDemo");

-- CreateIndex
CREATE INDEX "Record_isDemo_idx" ON "Record"("isDemo");

-- CreateIndex
CREATE INDEX "LevelSuggestion_status_submittedAt_idx" ON "LevelSuggestion"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "LevelSuggestion_submitterId_idx" ON "LevelSuggestion"("submitterId");

-- CreateIndex
CREATE INDEX "LevelSuggestion_reviewerId_idx" ON "LevelSuggestion"("reviewerId");

-- CreateIndex
CREATE INDEX "LevelSuggestion_createdLevelId_idx" ON "LevelSuggestion"("createdLevelId");

-- CreateIndex
CREATE INDEX "LevelSuggestion_isDemo_idx" ON "LevelSuggestion"("isDemo");

-- CreateIndex
CREATE INDEX "RateLimitAttempt_action_key_occurredAt_idx" ON "RateLimitAttempt"("action", "key", "occurredAt");

-- CreateIndex
CREATE INDEX "RateLimitAttempt_occurredAt_idx" ON "RateLimitAttempt"("occurredAt");

-- CreateIndex
CREATE INDEX "ChangelogPost_isDemo_idx" ON "ChangelogPost"("isDemo");

-- AddForeignKey
ALTER TABLE "LevelSuggestion" ADD CONSTRAINT "LevelSuggestion_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelSuggestion" ADD CONSTRAINT "LevelSuggestion_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelSuggestion" ADD CONSTRAINT "LevelSuggestion_createdLevelId_fkey" FOREIGN KEY ("createdLevelId") REFERENCES "Level"("id") ON DELETE SET NULL ON UPDATE CASCADE;
