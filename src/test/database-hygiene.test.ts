import { describe, expect, it } from "vitest";
import {
  cleanExpiredSessions,
  cleanExpiredTokens,
  cleanOldRateLimitAttempts,
  runDatabaseMaintenance,
} from "@/lib/database-hygiene";

describe("Database Hygiene & Self-Cleaning Maintenance", () => {
  it("prunes expired sessions", async () => {
    let deleted = false;
    const mockPrisma = {
      session: {
        deleteMany: async (args: { where: { expiresAt: { lt: Date } } }) => {
          deleted = true;
          return { count: 3 };
        },
      },
    };

    const count = await cleanExpiredSessions(mockPrisma as any);
    expect(deleted).toBe(true);
    expect(count).toBe(3);
  });

  it("prunes expired and consumed tokens", async () => {
    const mockPrisma = {
      passwordResetToken: {
        deleteMany: async () => ({ count: 2 }),
      },
      emailVerificationToken: {
        deleteMany: async () => ({ count: 5 }),
      },
    };

    const result = await cleanExpiredTokens(mockPrisma as any);
    expect(result.resetTokens).toBe(2);
    expect(result.verificationTokens).toBe(5);
  });

  it("prunes old rate limit attempts", async () => {
    let cutoffUsed: Date | null = null;
    const mockPrisma = {
      rateLimitAttempt: {
        deleteMany: async (args: { where: { occurredAt: { lt: Date } } }) => {
          cutoffUsed = args.where.occurredAt.lt;
          return { count: 12 };
        },
      },
    };

    const count = await cleanOldRateLimitAttempts(mockPrisma as any, 48);
    expect(count).toBe(12);
    expect(cutoffUsed).toBeInstanceOf(Date);
  });

  it("executes full database maintenance routine successfully", async () => {
    const mockPrisma = {
      session: {
        deleteMany: async () => ({ count: 1 }),
      },
      passwordResetToken: {
        deleteMany: async () => ({ count: 2 }),
      },
      emailVerificationToken: {
        deleteMany: async () => ({ count: 3 }),
      },
      rateLimitAttempt: {
        deleteMany: async () => ({ count: 4 }),
      },
    };

    const summary = await runDatabaseMaintenance(mockPrisma as any);
    expect(summary.ok).toBe(true);
    expect(summary.deletedSessions).toBe(1);
    expect(summary.deletedResetTokens).toBe(2);
    expect(summary.deletedVerificationTokens).toBe(3);
    expect(summary.deletedRateLimitAttempts).toBe(4);
    expect(summary.durationMs).toBeGreaterThanOrEqual(0);
  });
});
