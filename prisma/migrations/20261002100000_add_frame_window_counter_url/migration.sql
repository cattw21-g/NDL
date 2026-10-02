ALTER TABLE "Level" ADD COLUMN "frameWindowCounterUrl" TEXT;

ALTER TABLE "LevelSuggestion" ADD COLUMN "frameWindowCounterRequested" BOOLEAN NOT NULL DEFAULT false;
