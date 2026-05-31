CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "Role" AS ENUM ('ADMIN', 'MODERATOR', 'PLAYER');
CREATE TYPE "LevelStatus" AS ENUM ('RANKED', 'LEGACY', 'PENDING', 'REJECTED', 'REMOVED');
CREATE TYPE "DifficultyCategory" AS ENUM ('ENTRY', 'ADVANCED', 'EXTREME', 'MYTHIC', 'ASCENT');
CREATE TYPE "RecordStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'NEEDS_CHANGES');
CREATE TYPE "ModerationActionType" AS ENUM (
  'SUBMISSION_CREATED',
  'SUBMISSION_ACCEPTED',
  'SUBMISSION_REJECTED',
  'SUBMISSION_NEEDS_CHANGES',
  'LEVEL_CREATED',
  'LEVEL_UPDATED',
  'USER_ROLE_UPDATED',
  'RULES_UPDATED',
  'CHANGELOG_CREATED'
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "playerName" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'PLAYER',
  "bio" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Level" (
  "id" TEXT NOT NULL,
  "rank" INTEGER,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "gdLevelId" TEXT NOT NULL,
  "publisher" TEXT NOT NULL,
  "nerfCreator" TEXT NOT NULL,
  "verifier" TEXT NOT NULL,
  "thumbnailUrl" TEXT NOT NULL,
  "showcaseUrl" TEXT NOT NULL,
  "placementDate" TIMESTAMP(3),
  "status" "LevelStatus" NOT NULL DEFAULT 'PENDING',
  "difficulty" "DifficultyCategory" NOT NULL,
  "points" INTEGER NOT NULL DEFAULT 0,
  "description" TEXT NOT NULL,
  "versionNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecordSubmission" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "levelId" TEXT NOT NULL,
  "videoUrl" TEXT NOT NULL,
  "rawFootageUrl" TEXT,
  "proofImageUrl" TEXT,
  "fps" INTEGER NOT NULL,
  "cbfUsed" BOOLEAN NOT NULL DEFAULT false,
  "clickAudioNotes" TEXT NOT NULL,
  "deviceNotes" TEXT NOT NULL,
  "comments" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'PENDING',
  "moderatorNotes" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "reviewerId" TEXT,
  CONSTRAINT "RecordSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Record" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "levelId" TEXT NOT NULL,
  "submissionId" TEXT,
  "videoUrl" TEXT NOT NULL,
  "rawFootageUrl" TEXT,
  "fps" INTEGER NOT NULL,
  "cbfUsed" BOOLEAN NOT NULL DEFAULT false,
  "pointsAwarded" INTEGER NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ModerationAction" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "type" "ModerationActionType" NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LevelHistory" (
  "id" TEXT NOT NULL,
  "levelId" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "notes" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LevelHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChangelogPost" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "authorId" TEXT,
  CONSTRAINT "ChangelogPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RulesDocument" (
  "id" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RulesDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_playerName_key" ON "User"("playerName");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE UNIQUE INDEX "Level_rank_key" ON "Level"("rank");
CREATE UNIQUE INDEX "Level_slug_key" ON "Level"("slug");
CREATE INDEX "Level_status_rank_idx" ON "Level"("status", "rank");
CREATE INDEX "Level_difficulty_idx" ON "Level"("difficulty");
CREATE INDEX "RecordSubmission_status_submittedAt_idx" ON "RecordSubmission"("status", "submittedAt");
CREATE INDEX "RecordSubmission_playerId_idx" ON "RecordSubmission"("playerId");
CREATE INDEX "RecordSubmission_levelId_idx" ON "RecordSubmission"("levelId");
CREATE UNIQUE INDEX "Record_submissionId_key" ON "Record"("submissionId");
CREATE INDEX "Record_playerId_idx" ON "Record"("playerId");
CREATE INDEX "Record_levelId_idx" ON "Record"("levelId");
CREATE INDEX "Record_acceptedAt_idx" ON "Record"("acceptedAt");
CREATE INDEX "ModerationAction_actorId_idx" ON "ModerationAction"("actorId");
CREATE INDEX "ModerationAction_targetType_targetId_idx" ON "ModerationAction"("targetType", "targetId");
CREATE INDEX "ModerationAction_type_createdAt_idx" ON "ModerationAction"("type", "createdAt");
CREATE INDEX "LevelHistory_levelId_createdAt_idx" ON "LevelHistory"("levelId", "createdAt");
CREATE UNIQUE INDEX "ChangelogPost_slug_key" ON "ChangelogPost"("slug");
CREATE INDEX "ChangelogPost_publishedAt_idx" ON "ChangelogPost"("publishedAt");
CREATE INDEX "RulesDocument_isActive_idx" ON "RulesDocument"("isActive");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecordSubmission" ADD CONSTRAINT "RecordSubmission_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecordSubmission" ADD CONSTRAINT "RecordSubmission_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecordSubmission" ADD CONSTRAINT "RecordSubmission_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Record" ADD CONSTRAINT "Record_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Record" ADD CONSTRAINT "Record_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Record" ADD CONSTRAINT "Record_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "RecordSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LevelHistory" ADD CONSTRAINT "LevelHistory_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LevelHistory" ADD CONSTRAINT "LevelHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChangelogPost" ADD CONSTRAINT "ChangelogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
