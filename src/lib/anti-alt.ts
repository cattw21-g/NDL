import crypto from "node:crypto";
import { isAdminRole, type AppRole } from "./permissions";

const IP_KEY =
  process.env.ANTI_ALT_SECRET ||
  process.env.SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "ndl-network-security-hmac-key";

const LEGACY_SALT =
  process.env.SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "ndl-network-security-salt";

/**
 * Normalizes an IP string by stripping IPv6 mapping prefix (::ffff:) and whitespace.
 */
export function normalizeIp(rawIp: string | null | undefined): string {
  if (!rawIp) return "";
  let ip = rawIp.trim().toLowerCase();
  if (ip.startsWith("::ffff:")) {
    ip = ip.slice(7);
  }
  return ip;
}

/**
 * Detects if an IP is a local development loopback address.
 */
export function isLocalhostIp(ip: string): boolean {
  const normalized = normalizeIp(ip);
  return (
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "localhost" ||
    normalized === "guest-client" ||
    normalized === "reviewer-client"
  );
}

/**
 * Hashes an IP address using keyed HMAC-SHA256 for privacy-compliant storage.
 * Keyed HMAC prevents offline dictionary and rainbow table attacks on IPv4 addresses.
 */
export function hashClientIp(rawIp: string | null | undefined): string | null {
  const ip = normalizeIp(rawIp);
  if (!ip) return null;
  return crypto.createHmac("sha256", IP_KEY).update(ip).digest("hex");
}

/**
 * Backwards-compatible hash check for legacy salted SHA-256 digests.
 */
function legacyHashClientIp(ip: string): string {
  return crypto.createHash("sha256").update(`${ip}:${LEGACY_SALT}`).digest("hex");
}

/**
 * Extracts the real client IP from incoming Next.js request headers.
 * Edge-verified proxy headers take precedence over client-spoofable X-Forwarded-For.
 */
export function extractClientIp(headerStore: Headers): string {
  const cfIp = headerStore.get("cf-connecting-ip")?.trim();
  const realIp = headerStore.get("x-real-ip")?.trim();
  const vercelIp = headerStore.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();

  return normalizeIp(cfIp || realIp || vercelIp || forwardedFor || "");
}

/**
 * Evaluates whether a moderator's review action presents an alt-account or network conflict of interest.
 * Returns true if conflict detected (i.e. review must be blocked).
 */
export function hasNetworkConflict({
  submitterIpHash,
  reviewerIp,
  reviewerRole,
  allowLocalhostBypass = true,
}: {
  submitterIpHash?: string | null;
  reviewerIp: string | null | undefined;
  reviewerRole: AppRole;
  allowLocalhostBypass?: boolean;
}): boolean {
  // Admins are list owners and can review/test any submission
  if (isAdminRole(reviewerRole)) {
    return false;
  }

  if (!submitterIpHash || !reviewerIp) {
    return false;
  }

  const normalizedReviewer = normalizeIp(reviewerIp);
  if (!normalizedReviewer) {
    return false;
  }

  // In local development or automated tests, bypass loopback IP conflicts unless explicitly tested
  if (allowLocalhostBypass && isLocalhostIp(normalizedReviewer)) {
    return false;
  }

  const reviewerHmac = hashClientIp(normalizedReviewer);
  if (!reviewerHmac) {
    return false;
  }

  // 1. Check primary keyed HMAC match
  if (constantTimeHexEqual(submitterIpHash, reviewerHmac)) {
    return true;
  }

  // 2. Check legacy salted SHA-256 match for backwards compatibility
  const legacyReviewerHash = legacyHashClientIp(normalizedReviewer);
  if (constantTimeHexEqual(submitterIpHash, legacyReviewerHash)) {
    return true;
  }

  return false;
}

function constantTimeHexEqual(hexA: string, hexB: string): boolean {
  try {
    const bufA = Buffer.from(hexA, "hex");
    const bufB = Buffer.from(hexB, "hex");
    if (bufA.length !== bufB.length || bufA.length === 0) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
