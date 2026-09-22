import type { PrismaClient } from "@/generated/prisma/client";

export type MaintenanceResult = {
  ok: boolean;
  deletedSessions: number;
  deletedResetTokens: number;
  deletedVerificationTokens: number;
  deletedRateLimitAttempts: number;
  durationMs: number;
  error?: string;
};

/**
 * Prunes expired sessions from the database.
 */
export async function cleanExpiredSessions(
  prisma: Pick<PrismaClient, "session">,
  now = new Date(),
): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: { lt: now },
    },
  });
  return result.count;
}

/**
 * Prunes expired and consumed password reset and email verification tokens.
 */
export async function cleanExpiredTokens(
  prisma: Pick<PrismaClient, "passwordResetToken" | "emailVerificationToken">,
  now = new Date(),
): Promise<{ resetTokens: number; verificationTokens: number }> {
  const [resets, verifications] = await Promise.all([
    prisma.passwordResetToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }],
      },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }],
      },
    }),
  ]);

  return {
    resetTokens: resets.count,
    verificationTokens: verifications.count,
  };
}

/**
 * Prunes rate-limit attempt logs older than 48 hours to prevent unbounded table growth.
 */
export async function cleanOldRateLimitAttempts(
  prisma: Pick<PrismaClient, "rateLimitAttempt">,
  maxAgeHours = 48,
): Promise<number> {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
  const result = await prisma.rateLimitAttempt.deleteMany({
    where: {
      occurredAt: { lt: cutoff },
    },
  });
  return result.count;
}

/**
 * Executes a full database hygiene routine in the background.
 */
export async function runDatabaseMaintenance(
  prisma: Pick<
    PrismaClient,
    "session" | "passwordResetToken" | "emailVerificationToken" | "rateLimitAttempt"
  >,
): Promise<MaintenanceResult> {
  const startTime = Date.now();

  try {
    const now = new Date();
    const [deletedSessions, tokenResults, deletedRateLimitAttempts] =
      await Promise.all([
        cleanExpiredSessions(prisma, now),
        cleanExpiredTokens(prisma, now),
        cleanOldRateLimitAttempts(prisma, 48),
      ]);

    return {
      ok: true,
      deletedSessions,
      deletedResetTokens: tokenResults.resetTokens,
      deletedVerificationTokens: tokenResults.verificationTokens,
      deletedRateLimitAttempts,
      durationMs: Date.now() - startTime,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      deletedSessions: 0,
      deletedResetTokens: 0,
      deletedVerificationTokens: 0,
      deletedRateLimitAttempts: 0,
      durationMs: Date.now() - startTime,
      error: message,
    };
  }
}
