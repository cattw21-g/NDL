-- AlterTable
ALTER TABLE "RecordSubmission" ADD COLUMN     "cheatIndicatorVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "clickAudioIncluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cpsCounterVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fpsOverlayVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gameAudioIncluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "inputDevice" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "microphoneModel" TEXT,
ADD COLUMN     "proofNotes" TEXT,
ADD COLUMN     "rawFootageIncluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "separateMicClickTrack" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_userId_expiresAt_idx" ON "EmailVerificationToken"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_email_expiresAt_idx" ON "EmailVerificationToken"("email", "expiresAt");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_usedAt_idx" ON "EmailVerificationToken"("usedAt");

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
