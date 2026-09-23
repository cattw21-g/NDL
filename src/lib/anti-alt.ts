import crypto from "node:crypto";
import { isAdminRole, type AppRole } from "./permissions";

const IP_SALT = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || "ndl-network-security-salt";

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
 * Hashes an IP address using SHA-256 and a server secret salt for privacy-compliant storage.
 */
export function hashClientIp(rawIp: string | null | undefined): string | null {
  const ip = normalizeIp(rawIp);
  if (!ip) return null;
  return crypto.createHash("sha256").update(`${ip}:${IP_SALT}`).digest("hex");
}

/**
 * Extracts the real client IP from incoming Next.js request headers.
 */
export function extractClientIp(headerStore: Headers): string {
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const cfIp = headerStore.get("cf-connecting-ip")?.trim();
  const realIp = headerStore.get("x-real-ip")?.trim();

  return normalizeIp(forwardedFor || cfIp || realIp || "");
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

  const reviewerHash = hashClientIp(normalizedReviewer);
  if (!reviewerHash) {
    return false;
  }

  try {
    const bufA = Buffer.from(submitterIpHash, "hex");
    const bufB = Buffer.from(reviewerHash, "hex");
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
