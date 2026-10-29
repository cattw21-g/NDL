import { prisma } from "@/lib/db";

let isEnsured = false;

export async function ensureFrameCounterSchema() {
  if (isEnsured) return;

  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Level" ADD COLUMN IF NOT EXISTS "frameWindowCounterUrl" TEXT',
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "LevelSuggestion" ADD COLUMN IF NOT EXISTS "frameWindowCounterRequested" BOOLEAN NOT NULL DEFAULT false',
    );
    isEnsured = true;
  } catch (error) {
    console.warn("Notice while ensuring frame counter schema:", error);
    // Even if DDL errors (e.g. read-only or lock timeout), don't block the caller
    isEnsured = true;
  }
}
