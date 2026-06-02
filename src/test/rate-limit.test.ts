import { describe, expect, it } from "vitest";

import {
  checkRateLimit,
  emailRateLimitKey,
  userRateLimitKey,
} from "../lib/rate-limit";
import { EMAIL_RESEND_COOLDOWN_MESSAGE } from "../lib/email-cooldown";

type Attempt = {
  action: string;
  key: string;
  occurredAt: Date;
};

function createClient(attempts: Attempt[] = []) {
  return {
    rateLimitAttempt: {
      deleteMany: async () => ({ count: 0 }),
      count: async (args: {
        where: {
          action: string;
          key: string;
          occurredAt: { gt?: Date; gte?: Date };
        };
      }) =>
        attempts.filter(
          (attempt) =>
            attempt.action === args.where.action &&
            attempt.key === args.where.key &&
            attempt.occurredAt >
              (args.where.occurredAt.gt ?? args.where.occurredAt.gte!),
        ).length,
      create: async (args: { data: Attempt }) => {
        attempts.push(args.data);
        return args.data;
      },
    },
  } as unknown as Parameters<typeof checkRateLimit>[0];
}

describe("rate limiting", () => {
  it("creates attempts while under the action limit", async () => {
    const attempts: Attempt[] = [];
    const result = await checkRateLimit(
      createClient(attempts),
      "record-submission",
      userRateLimitKey("player-1"),
      new Date("2026-05-31T00:00:00.000Z"),
    );

    expect(result.allowed).toBe(true);
    expect(attempts).toHaveLength(1);
  });

  it("blocks login attempts after the configured window limit", async () => {
    const attempts = Array.from({ length: 10 }, () => ({
      action: "login",
      key: emailRateLimitKey("player@example.com"),
      occurredAt: new Date("2026-05-31T00:00:00.000Z"),
    }));
    const result = await checkRateLimit(
      createClient(attempts),
      "login",
      emailRateLimitKey("player@example.com"),
      new Date("2026-05-31T00:05:00.000Z"),
    );

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.message).toContain("Too many attempts");
    }
  });

  it("allows the first verification resend and blocks a second within 80 seconds", async () => {
    const attempts: Attempt[] = [];
    const client = createClient(attempts);
    const key = emailRateLimitKey("player@example.com");
    const first = await checkRateLimit(
      client,
      "verification-resend",
      key,
      new Date("2026-05-31T00:00:00.000Z"),
    );
    const second = await checkRateLimit(
      client,
      "verification-resend",
      key,
      new Date("2026-05-31T00:01:19.000Z"),
    );

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
    if (!second.allowed) {
      expect(second.retryAfterSeconds).toBe(80);
      expect(second.message).toBe(EMAIL_RESEND_COOLDOWN_MESSAGE);
    }
  });

  it("allows verification resend after 80 seconds", async () => {
    const attempts: Attempt[] = [];
    const client = createClient(attempts);
    const key = emailRateLimitKey("player@example.com");
    await checkRateLimit(
      client,
      "verification-resend",
      key,
      new Date("2026-05-31T00:00:00.000Z"),
    );

    const result = await checkRateLimit(
      client,
      "verification-resend",
      key,
      new Date("2026-05-31T00:01:20.000Z"),
    );

    expect(result.allowed).toBe(true);
  });

  it("uses the same 80-second cooldown for password reset email requests", async () => {
    const attempts: Attempt[] = [];
    const client = createClient(attempts);
    const key = emailRateLimitKey("player@example.com");
    const first = await checkRateLimit(
      client,
      "password-reset-request",
      key,
      new Date("2026-05-31T00:00:00.000Z"),
    );
    const second = await checkRateLimit(
      client,
      "password-reset-request",
      key,
      new Date("2026-05-31T00:01:19.000Z"),
    );
    const third = await checkRateLimit(
      client,
      "password-reset-request",
      key,
      new Date("2026-05-31T00:01:20.000Z"),
    );

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
    if (!second.allowed) {
      expect(second.message).toBe(EMAIL_RESEND_COOLDOWN_MESSAGE);
    }
    expect(third.allowed).toBe(true);
  });

  it("blocks repeated password reset attempts", async () => {
    const attempts = Array.from({ length: 8 }, () => ({
      action: "password-reset-attempt",
      key: emailRateLimitKey("player@example.com"),
      occurredAt: new Date("2026-05-31T00:00:00.000Z"),
    }));
    const result = await checkRateLimit(
      createClient(attempts),
      "password-reset-attempt",
      emailRateLimitKey("player@example.com"),
      new Date("2026-05-31T00:10:00.000Z"),
    );

    expect(result.allowed).toBe(false);
  });

  it("rate-limits public and staff API buckets separately", async () => {
    const publicAttempts = Array.from({ length: 60 }, () => ({
      action: "public-api",
      key: "ip:127.0.0.1",
      occurredAt: new Date("2026-05-31T00:00:00.000Z"),
    }));
    const staffAttempts = Array.from({ length: 120 }, () => ({
      action: "bot-staff-api",
      key: "ip:127.0.0.1",
      occurredAt: new Date("2026-05-31T00:00:00.000Z"),
    }));
    const publicResult = await checkRateLimit(
      createClient(publicAttempts),
      "public-api",
      "ip:127.0.0.1",
      new Date("2026-05-31T00:00:30.000Z"),
    );
    const staffResult = await checkRateLimit(
      createClient(staffAttempts),
      "bot-staff-api",
      "ip:127.0.0.1",
      new Date("2026-05-31T00:00:30.000Z"),
    );

    expect(publicResult.allowed).toBe(false);
    expect(staffResult.allowed).toBe(false);
    if (!publicResult.allowed && !staffResult.allowed) {
      expect(publicResult.message).toContain("API requests");
      expect(staffResult.message).toContain("bot API requests");
    }
  });
});
