import { randomInt, createHmac } from "node:crypto";
import { requireSessionSecret } from "@/lib/production-env";

export const BETA_ACCESS_COOKIE = "ndl_beta_access";

// Unambiguous alphanumeric characters (excluding 0, O, 1, I, L)
const SAFE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/**
 * Generates a cryptographically random, unambiguous 1-time Beta Invite Key.
 * Format: NDL-XXXX-YYYY (e.g. NDL-8F3K-9W2M)
 */
export function generateSecureBetaKey(): string {
  const segment1 = Array.from({ length: 4 }, () =>
    SAFE_CHARS.charAt(randomInt(SAFE_CHARS.length)),
  ).join("");

  const segment2 = Array.from({ length: 4 }, () =>
    SAFE_CHARS.charAt(randomInt(SAFE_CHARS.length)),
  ).join("");

  return `NDL-${segment1}-${segment2}`;
}

/**
 * Normalizes user-entered keys (uppercases, strips whitespace, standardizes hyphens).
 */
export function normalizeBetaKey(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, "");
  // Allow entering without NDL- prefix (e.g., "8F3K9W2M" -> "NDL-8F3K-9W2M")
  if (/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/.test(cleaned)) {
    return `NDL-${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
  }
  // Allow entering without hyphens (e.g., "NDL8F3K9W2M" -> "NDL-8F3K-9W2M")
  if (/^NDL[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/.test(cleaned)) {
    return `NDL-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
  }
  return cleaned;
}

/**
 * Validates if a string adheres to the standard NDL beta key format.
 */
export function isValidBetaKeyFormat(key: string): boolean {
  return /^NDL-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/.test(
    key,
  );
}

/**
 * Creates an HMAC signed session token that unlocks the Beta Website for a browser.
 */
export function createBetaAccessToken(): string {
  const secret = requireSessionSecret(process.env);
  return createHmac("sha256", secret).update("ndl_beta_preview_unlocked").digest("hex");
}

/**
 * Validates whether an incoming cookie matches the signed Beta Access Token.
 */
export function isBetaAccessTokenValid(token?: string | null): boolean {
  if (!token) return false;
  return token === createBetaAccessToken();
}
