CREATE TYPE "ChangelogCategory" AS ENUM (
    'ANNOUNCEMENT',
    'RANKING_UPDATE',
    'RULE_UPDATE',
    'SITE_UPDATE',
    'MODERATION_NOTE',
    'OTHER'
);

ALTER TABLE "ChangelogPost"
    ADD COLUMN "category" "ChangelogCategory" NOT NULL DEFAULT 'SITE_UPDATE',
    ADD COLUMN "summary" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "archivedAt" TIMESTAMP(3);

UPDATE "ChangelogPost"
SET "summary" = LEFT("content", 220)
WHERE "summary" = '';

ALTER TABLE "ChangelogPost" ALTER COLUMN "publishedAt" DROP DEFAULT;
ALTER TABLE "ChangelogPost" ALTER COLUMN "publishedAt" DROP NOT NULL;

CREATE INDEX "ChangelogPost_isPublished_archivedAt_isPinned_publishedAt_idx" ON "ChangelogPost"("isPublished", "archivedAt", "isPinned", "publishedAt");
CREATE INDEX "ChangelogPost_category_publishedAt_idx" ON "ChangelogPost"("category", "publishedAt");
CREATE INDEX "ChangelogPost_isDemo_isPublished_idx" ON "ChangelogPost"("isDemo", "isPublished");
