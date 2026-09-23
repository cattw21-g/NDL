import { describe, expect, it } from "vitest";

import {
  checkRateLimit,
  emailRateLimitKey,
  userRateLimitKey,
} from "../lib/rate-limit";
import { EMAIL_RESEND_COOLDOWN_MESSAGE } from "../lib/email-cooldown";

type Attempt = {
  id?: string;
  action: string;
  key: string;
  occurredAt: Date;
};

let attemptIdCounter = 0;

function createClient(attempts: Attempt[] = []) {
  return {
    rateLimitAttempt: {
      deleteMany: async (args?: {
        where?: {
          id?: string;
          action?: string;
          key?: string;
          occurredAt?: Date | { lte?: Date };
        };
      }) => {
        let removed = 0;
        if (args?.where) {
          const { id, action, key, occurredAt } = args.where;
          for (let i = attempts.length - 1; i >= 0; i--) {
            const a = attempts[i];
            const matchId = !id || a.id === id;
            const matchAction = !action || a.action === action;
            const matchKey = !key || a.key === key;
            const matchTime =
              !occurredAt ||
              (occurredAt instanceof Date
                ? a.occurredAt.getTime() === occurredAt.getTime()
                : !occurredAt.lte || a.occurredAt <= occurredAt.lte);
            if (matchId && matchAction && matchKey && matchTime) {
              attempts.splice(i, 1);
              removed++;
            }
          }
        } else {
          removed = attempts.length;
          attempts.length = 0;
        }
        return { count: removed };
      },
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
        const item = {
          ...args.data,
          id: args.data.id ?? `att-${++attemptIdCounter}`,
        };
        attempts.push(item);
        return item;
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

  it("rate-limits moderator review actions to prevent compromised account spam", async () => {
    const modAttempts = Array.from({ length: 60 }, () => ({
      action: "moderation-review",
      key: userRateLimitKey("mod-123"),
      occurredAt: new Date("2026-05-31T00:00:00.000Z"),
    }));
    const result = await checkRateLimit(
      createClient(modAttempts),
      "moderation-review",
      userRateLimitKey("mod-123"),
      new Date("2026-05-31T00:00:30.000Z"),
    );

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.message).toContain("Moderation review rate limit");
    }
  });

  it("rate-limits profile updates to prevent spam updates", async () => {
    const attempts = Array.from({ length: 15 }, () => ({
      action: "profile-update",
      key: userRateLimitKey("player-123"),
      occurredAt: new Date("2026-05-31T00:00:00.000Z"),
    }));
    const result = await checkRateLimit(
      createClient(attempts),
      "profile-update",
      userRateLimitKey("player-123"),
      new Date("2026-05-31T00:02:00.000Z"),
    );

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.message).toContain("Too many profile updates");
    }
  });

  it("prevents race condition when concurrent requests arrive near the limit", async () => {
    // 14 attempts exist, limit is 15 (profile-update)
    const attempts = Array.from({ length: 14 }, () => ({
      action: "profile-update",
      key: userRateLimitKey("player-race"),
      occurredAt: new Date("2026-05-31T00:00:00.000Z"),
    }));
    const client = createClient(attempts);

    // Two requests arrive simultaneously
    const [reqA, reqB] = await Promise.all([
      checkRateLimit(
        client,
        "profile-update",
        userRateLimitKey("player-race"),
        new Date("2026-05-31T00:01:00.000Z"),
      ),
      checkRateLimit(
        client,
        "profile-update",
        userRateLimitKey("player-race"),
        new Date("2026-05-31T00:01:00.000Z"),
      ),
    ]);

    const allowedCount = [reqA, reqB].filter((r) => r.allowed).length;
    const blockedCount = [reqA, reqB].filter((r) => !r.allowed).length;

    // Both cannot succeed to exceed the limit
    expect(allowedCount).toBeLessThanOrEqual(1);
    expect(blockedCount).toBeGreaterThanOrEqual(1);
  });

  it("safely enforces limit when 50 simultaneous requests hit the same key", async () => {
    const sharedAttempts: Attempt[] = [];
    const client = createClient(sharedAttempts);
    const key = userRateLimitKey("heavy-concurrency-user");
    const now = new Date("2026-05-31T12:00:00.000Z");

    // Launch 50 truly simultaneous requests for profile-update (limit = 15)
    const decisions = await Promise.all(
      Array.from({ length: 50 }, () =>
        checkRateLimit(client, "profile-update", key, now),
      ),
    );

    const allowed = decisions.filter((d) => d.allowed);
    const rejected = decisions.filter((d) => !d.allowed);

    expect(allowed.length).toBe(15);
    expect(rejected.length).toBe(35);

    // Persisted state in database should contain exactly 15 records (clean pruning of rejects)
    const remaining = sharedAttempts.filter(
      (a) => a.action === "profile-update" && a.key === key,
    );
    expect(remaining.length).toBe(15);
  });

  it("enforces identical limits across multiple distributed server instances", async () => {
    // Shared database state accessible across multiple serverless/server instances
    const sharedDb: Attempt[] = [];

    // Simulate 5 independent server instances
    const serverInstances = Array.from({ length: 5 }, () => createClient(sharedDb));
    const key = userRateLimitKey("distributed-player");
    const now = new Date("2026-05-31T12:00:00.000Z");

    // Each instance receives 5 concurrent requests (25 total) for record-submission (limit = 8)
    const requests = serverInstances.flatMap((instance) =>
      Array.from({ length: 5 }, () =>
        checkRateLimit(instance, "record-submission", key, now),
      ),
    );

    const results = await Promise.all(requests);
    const allowed = results.filter((r) => r.allowed);
    const rejected = results.filter((r) => !r.allowed);

    expect(allowed.length).toBe(8);
    expect(rejected.length).toBe(17);

    const remaining = sharedDb.filter(
      (a) => a.action === "record-submission" && a.key === key,
    );
    expect(remaining.length).toBe(8);
  });
});
