import { timingSafeEqual } from "node:crypto";

import { apiRateLimited, apiUnauthorized } from "@/lib/api-response";
import {
  checkRateLimit,
  requestRateLimitKey,
  type RateLimitAction,
} from "@/lib/rate-limit";

export async function enforceApiRateLimit(action: RateLimitAction) {
  const { prisma } = await import("@/lib/db");
  const key = await requestRateLimitKey();
  const decision = await checkRateLimit(prisma, action, key);

  if (!decision.allowed) {
    return apiRateLimited(decision.message, decision.retryAfterSeconds);
  }

  return null;
}

export async function requireBotApiSecret(request: Request) {
  const rateLimitResponse = await enforceApiRateLimit("bot-staff-api");

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const configuredSecret = process.env.BOT_API_SECRET?.trim();

  if (!configuredSecret) {
    return apiUnauthorized("Bot API is not configured.");
  }

  const authorization = request.headers.get("authorization")?.trim() ?? "";

  if (!isValidBotAuthorization(authorization, configuredSecret)) {
    return apiUnauthorized("Invalid bot API token.");
  }

  return null;
}

export function isValidBotAuthorization(
  authorization: string | null | undefined,
  configuredSecret: string | null | undefined,
) {
  const secret = configuredSecret?.trim();
  const [scheme, token] = authorization?.trim().split(/\s+/, 2) ?? [];

  return Boolean(
    secret &&
      scheme === "Bearer" &&
      token &&
      constantTimeEqual(token, secret),
  );
}

function constantTimeEqual(input: string, expected: string) {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);

  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, expectedBuffer);
}
