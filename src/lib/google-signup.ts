import { createHmac, timingSafeEqual } from "node:crypto";

import { requireSessionSecret, type EnvMap } from "./production-env";

export const GOOGLE_OAUTH_STATE_COOKIE = "ndl_google_oauth_state";
export const GOOGLE_SETUP_COOKIE = "ndl_google_setup";
export const GOOGLE_SETUP_TTL_SECONDS = 10 * 60;

type PendingGoogleSignup = {
  email: string;
  expiresAt: number;
  existingUserId?: string;
};

function signature(payload: string, env: EnvMap) {
  return createHmac("sha256", requireSessionSecret(env))
    .update(`google-signup:${payload}`)
    .digest("base64url");
}

export function createGoogleSignupToken(
  email: string,
  now = Date.now(),
  env: EnvMap = process.env,
  existingUserId?: string,
) {
  const payload = Buffer.from(JSON.stringify({
    email: email.toLowerCase().trim(),
    expiresAt: now + GOOGLE_SETUP_TTL_SECONDS * 1000,
    ...(existingUserId ? { existingUserId } : {}),
  } satisfies PendingGoogleSignup)).toString("base64url");
  return `${payload}.${signature(payload, env)}`;
}

export function readGoogleSignupToken(
  token: string | undefined,
  now = Date.now(),
  env: EnvMap = process.env,
): PendingGoogleSignup | null {
  if (!token || token.length > 2048) return null;
  const [payload, providedSignature, extra] = token.split(".");
  if (!payload || !providedSignature || extra) return null;

  const expected = Buffer.from(signature(payload, env));
  const provided = Buffer.from(providedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const value: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!value || typeof value !== "object") return null;
    const pending = value as Partial<PendingGoogleSignup>;
    if (
      typeof pending.email !== "string" ||
      pending.email.length > 254 ||
      !pending.email.includes("@") ||
      typeof pending.expiresAt !== "number" ||
      pending.expiresAt <= now ||
      pending.expiresAt > now + GOOGLE_SETUP_TTL_SECONDS * 1000
      || (pending.existingUserId !== undefined && (typeof pending.existingUserId !== "string" || !pending.existingUserId))
    ) return null;
    return { email: pending.email, expiresAt: pending.expiresAt, existingUserId: pending.existingUserId };
  } catch {
    return null;
  }
}
