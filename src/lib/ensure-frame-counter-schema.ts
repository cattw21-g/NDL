import { prisma } from "@/lib/db";

export async function ensureFrameCounterSchema() {
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "Level" ADD COLUMN IF NOT EXISTS "frameWindowCounterUrl" TEXT',
  );
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "LevelSuggestion" ADD COLUMN IF NOT EXISTS "frameWindowCounterRequested" BOOLEAN NOT NULL DEFAULT false',
  );
}
