import { describe, expect, it } from "vitest";

import {
  checkRateLimit,
  emailRateLimitKey,
  userRateLimitKey,
} from "../lib/rate-limit";

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
          occurredAt: { gte: Date };
        };
      }) =>
        attempts.filter(
          (attempt) =>
            attempt.action === args.where.action &&
            attempt.key === args.where.key &&
            attempt.occurredAt >= args.where.occurredAt.gte,
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
});
