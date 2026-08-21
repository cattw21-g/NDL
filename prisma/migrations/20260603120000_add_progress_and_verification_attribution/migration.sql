-- AlterTable
ALTER TABLE "Level" ADD COLUMN "verifierUserId" TEXT;
ALTER TABLE "Level" ADD COLUMN "verificationVideoUrl" TEXT;
CREATE INDEX "Level_verifierUserId_idx" ON "Level"("verifierUserId");
ALTER TABLE "Level" ADD CONSTRAINT "Level_verifierUserId_fkey" FOREIGN KEY ("verifierUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "RecordSubmission" ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 100;
CREATE INDEX "RecordSubmission_progress_idx" ON "RecordSubmission"("progress");

-- AlterTable
ALTER TABLE "Record" ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "Record" ADD COLUMN "isVerifier" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "Record_progress_idx" ON "Record"("progress");
CREATE INDEX "Record_isVerifier_idx" ON "Record"("isVerifier");

-- AlterTable
ALTER TABLE "LevelSuggestion" ADD COLUMN "verifierPlayerName" TEXT;
ALTER TABLE "LevelSuggestion" ADD COLUMN "verificationVideoUrl" TEXT NOT NULL DEFAULT '';
