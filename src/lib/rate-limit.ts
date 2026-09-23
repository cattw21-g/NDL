import crypto from "node:crypto";
import { headers } from "next/headers";

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

export type RateLimitClient = {
  rateLimitAttempt: {
    count(args: {
      where: {
        action: string;
        key: string;
        occurredAt: { gt?: Date; gte?: Date };
      };
    }): Promise<number>;
    create(args: {
      data: { action: string; key: string; occurredAt: Date };
    }): Promise<unknown>;
    deleteMany?(args: {
      where?: {
        id?: string;
        action?: string;
        key?: string;
        occurredAt?: Date | { lte?: Date };
      };
    }): Promise<{ count: number }>;
  };
  $transaction?: unknown;
  $executeRaw?: unknown;
};

const inProcessKeyLocks = new Map<string, Promise<unknown>>();

export function getActiveMutexCount(): number {
  return inProcessKeyLocks.size;
}

export function resetMutexStateForTest(): void {
  inProcessKeyLocks.clear();
}

export function deriveAdvisoryLockId(mutexKey: string): bigint {
  const hash = crypto.createHash("sha256").update(mutexKey).digest();
  return hash.readBigInt64BE(0);
}

async function withKeyMutex<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const currentLock = inProcessKeyLocks.get(key) ?? Promise.resolve();

  let releaseCurrent: () => void = () => {};
  const nextLock = new Promise<void>((resolve) => {
    releaseCurrent = resolve;
  });

  inProcessKeyLocks.set(key, nextLock);

  try {
    await currentLock.catch(() => {});
    return await fn();
  } finally {
    if (inProcessKeyLocks.get(key) === nextLock) {
      inProcessKeyLocks.delete(key);
    }
    releaseCurrent();
  }
}

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
  const mutexKey = `${action}:${key}`;

  return withKeyMutex(mutexKey, async () => {
    const execute = async (tx: RateLimitClient): Promise<RateLimitDecision> => {
      // In PostgreSQL, pg_advisory_xact_lock enforces cross-process mutual exclusion
      // across multiple Vercel serverless lambdas sharing the database
      if (typeof tx.$executeRaw === "function") {
        try {
          const lockId = deriveAdvisoryLockId(mutexKey);
          const rawQuery = tx.$executeRaw as (
            query: TemplateStringsArray,
            ...values: unknown[]
          ) => Promise<unknown>;
          await rawQuery`SET LOCAL lock_timeout = '2000ms';`;
          await rawQuery`SELECT pg_advisory_xact_lock(${lockId});`;
        } catch {
          // ignore if raw query unsupported or mocked
        }
      }

      const count = await tx.rateLimitAttempt.count({
        where: {
          action,
          key,
          occurredAt: {
            gt: windowStart,
          },
        },
      });

      if (count >= rule.limit) {
        return {
          allowed: false,
          retryAfterSeconds: Math.ceil(rule.windowMs / 1000),
          message: rule.message ?? "Too many attempts. Wait a bit and try again.",
        };
      }

      await tx.rateLimitAttempt.create({
        data: {
          action,
          key,
          occurredAt: now,
        },
      });

      return { allowed: true };
    };

    if (typeof client.$transaction === "function") {
      const runner = client.$transaction as <T>(
        fn: (tx: RateLimitClient) => Promise<T>,
      ) => Promise<T>;
      return runner(execute);
    }

    return execute(client);
  });
}
