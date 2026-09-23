import { headers } from "next/headers";

import type { PrismaClient } from "../generated/prisma/client";
import { extractClientIp } from "./anti-alt";
import {
  EMAIL_RESEND_COOLDOWN_MESSAGE,
  EMAIL_RESEND_COOLDOWN_SECONDS,
} from "./email-cooldown";

export type RateLimitAction =
  | "login"
  | "register"
  | "verification-resend"
  | "password-reset-request"
  | "password-reset-attempt"
  | "record-submission"
  | "level-suggestion"
  | "moderation-review"
  | "moderation-suggestion-review"
  | "profile-update"
  | "public-api"
  | "bot-staff-api";

export type RateLimitDecision =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number; message: string };

type RateLimitClient = Pick<PrismaClient, "rateLimitAttempt">;

const rules: Record<
  RateLimitAction,
  { limit: number; windowMs: number; message?: string }
> = {
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  register: { limit: 3, windowMs: 60 * 60 * 1000 },
  "verification-resend": {
    limit: 1,
    windowMs: EMAIL_RESEND_COOLDOWN_SECONDS * 1000,
    message: EMAIL_RESEND_COOLDOWN_MESSAGE,
  },
  "password-reset-request": {
    limit: 1,
    windowMs: EMAIL_RESEND_COOLDOWN_SECONDS * 1000,
    message: EMAIL_RESEND_COOLDOWN_MESSAGE,
  },
  "password-reset-attempt": { limit: 8, windowMs: 15 * 60 * 1000 },
  "record-submission": { limit: 8, windowMs: 60 * 60 * 1000 },
  "level-suggestion": { limit: 5, windowMs: 24 * 60 * 60 * 1000 },
  "moderation-review": {
    limit: 20,
    windowMs: 60 * 1000,
    message: "Moderation review rate limit reached. Please pause a moment before reviewing further.",
  },
  "moderation-suggestion-review": {
    limit: 20,
    windowMs: 60 * 1000,
    message: "Moderation suggestion review rate limit reached. Please pause a moment before reviewing further.",
  },
  "profile-update": {
    limit: 15,
    windowMs: 5 * 60 * 1000,
    message: "Too many profile updates. Please wait a few minutes before trying again.",
  },
  "public-api": {
    limit: 60,
    windowMs: 60 * 1000,
    message: "Too many API requests. Wait a bit and try again.",
  },
  "bot-staff-api": {
    limit: 120,
    windowMs: 60 * 1000,
    message: "Too many bot API requests. Wait a bit and try again.",
  },
};

export async function requestRateLimitKey(fallback = "anonymous") {
  const headerStore = await headers();
  const ip = extractClientIp(headerStore);

  return `ip:${ip || fallback}`;
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

  // Request hot path is zero-write for pruning (handled by cron).
  // Atomic insert-first pattern prevents concurrent race condition where simultaneous
  // requests both read count < limit and both proceed past the limit.
  await client.rateLimitAttempt.create({
    data: {
      action,
      key,
      occurredAt: now,
    },
  });

  const count = await client.rateLimitAttempt.count({
    where: {
      action,
      key,
      occurredAt: {
        gt: windowStart,
      },
    },
  });

  if (count > rule.limit) {
    try {
      await client.rateLimitAttempt.deleteMany({
        where: {
          action,
          key,
          occurredAt: now,
        },
      });
    } catch {
      // gracefully ignore cleanup failure
    }

    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(rule.windowMs / 1000),
      message: rule.message ?? "Too many attempts. Wait a bit and try again.",
    };
  }

  return { allowed: true };
}
