import { prisma } from "@/lib/db";

let isEnsured = false;

export async function ensureBetaKeysSchema() {
  if (isEnsured) return;

  try {
    // 1. Ensure table exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "BetaInviteKey" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "key" TEXT NOT NULL,
        "createdById" TEXT NOT NULL,
        "redeemedById" TEXT,
        "redeemedAt" TIMESTAMP(3),
        "redeemedIp" TEXT,
        "isRevoked" BOOLEAN NOT NULL DEFAULT false,
        "notes" TEXT,
        "expiresAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Ensure indexes
    const indexes = [
      'CREATE UNIQUE INDEX IF NOT EXISTS "BetaInviteKey_key_key" ON "BetaInviteKey"("key")',
      'CREATE UNIQUE INDEX IF NOT EXISTS "BetaInviteKey_redeemedById_key" ON "BetaInviteKey"("redeemedById")',
      'CREATE INDEX IF NOT EXISTS "BetaInviteKey_key_idx" ON "BetaInviteKey"("key")',
      'CREATE INDEX IF NOT EXISTS "BetaInviteKey_redeemedById_idx" ON "BetaInviteKey"("redeemedById")',
      'CREATE INDEX IF NOT EXISTS "BetaInviteKey_createdById_idx" ON "BetaInviteKey"("createdById")',
      'CREATE INDEX IF NOT EXISTS "BetaInviteKey_isRevoked_idx" ON "BetaInviteKey"("isRevoked")',
    ];

    for (const idx of indexes) {
      try {
        await prisma.$executeRawUnsafe(idx);
      } catch {
        // Ignore if index already exists
      }
    }

    isEnsured = true;
  } catch (error) {
    console.warn("Notice while ensuring BetaInviteKey schema:", error);
    isEnsured = true;
  }
}
