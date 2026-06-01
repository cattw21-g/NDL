import { headers } from "next/headers";

import type { PrismaClient } from "../generated/prisma/client";

export type RateLimitAction =
  | "login"
  | "register"
  | "verification-resend"
  | "password-reset-request"
  | "password-reset-attempt"
  | "record-submission"
  | "level-suggestion";

export type RateLimitDecision =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number; message: string };

type RateLimitClient = Pick<PrismaClient, "rateLimitAttempt">;

const rules: Record<RateLimitAction, { limit: number; windowMs: number }> = {
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  register: { limit: 3, windowMs: 60 * 60 * 1000 },
  "verification-resend": { limit: 1, windowMs: 60 * 1000 },
  "password-reset-request": { limit: 3, windowMs: 60 * 60 * 1000 },
  "password-reset-attempt": { limit: 8, windowMs: 15 * 60 * 1000 },
  "record-submission": { limit: 8, windowMs: 60 * 60 * 1000 },
  "level-suggestion": { limit: 5, windowMs: 24 * 60 * 60 * 1000 },
};

export async function requestRateLimitKey(fallback = "anonymous") {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headerStore.get("x-real-ip")?.trim();

  return `ip:${forwardedFor || realIp || fallback}`;
}

export function userRateLimitKey(userId: string) {
  return `user:${userId}`;
}

export function emailRateLimitKey(email: string) {
  return `email:${email.trim().toLowerCase()}`;
}

export async function checkRateLimit(
  client: RateLimitClient,
  action: RateLimitAction,
  key: string,
  now = new Date(),
): Promise<RateLimitDecision> {
  const rule = rules[action];
  const windowStart = new Date(now.getTime() - rule.windowMs);

  await client.rateLimitAttempt.deleteMany({
    where: {
      occurredAt: {
        lt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      },
    },
  });

  const count = await client.rateLimitAttempt.count({
    where: {
      action,
      key,
      occurredAt: {
        gte: windowStart,
      },
    },
  });

  if (count >= rule.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(rule.windowMs / 1000),
      message: "Too many attempts. Wait a bit and try again.",
    };
  }

  await client.rateLimitAttempt.create({
    data: {
      action,
      key,
      occurredAt: now,
    },
  });

  return { allowed: true };
}
