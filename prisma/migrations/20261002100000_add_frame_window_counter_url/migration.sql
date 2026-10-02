ALTER TABLE "Level" ADD COLUMN IF NOT EXISTS "frameWindowCounterUrl" TEXT;

ALTER TABLE "LevelSuggestion" ADD COLUMN IF NOT EXISTS "frameWindowCounterRequested" BOOLEAN NOT NULL DEFAULT false;
