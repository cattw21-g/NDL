-- CreateTable
CREATE TABLE IF NOT EXISTS "BetaInviteKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "redeemedById" TEXT,
    "redeemedAt" TIMESTAMP(3),
    "redeemedIp" TEXT,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BetaInviteKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BetaInviteKey_key_key" ON "BetaInviteKey"("key");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BetaInviteKey_redeemedById_key" ON "BetaInviteKey"("redeemedById");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BetaInviteKey_key_idx" ON "BetaInviteKey"("key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BetaInviteKey_redeemedById_idx" ON "BetaInviteKey"("redeemedById");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BetaInviteKey_createdById_idx" ON "BetaInviteKey"("createdById");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BetaInviteKey_isRevoked_idx" ON "BetaInviteKey"("isRevoked");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "BetaInviteKey" ADD CONSTRAINT "BetaInviteKey_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "BetaInviteKey" ADD CONSTRAINT "BetaInviteKey_redeemedById_fkey" FOREIGN KEY ("redeemedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
