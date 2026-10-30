import { isAdminRole, isBetaTester } from "@/lib/permissions";

/**
 * Checks whether the site is in Closed Beta mode.
 * When enabled via CLOSED_BETA_MODE=true or NEXT_PUBLIC_CLOSED_BETA_MODE=true,
 * public access to the list, records, and leaderboards is gated behind
 * authorized Beta Tester and Staff accounts.
 */
export function isClosedBetaActive(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const val = env.CLOSED_BETA_MODE ?? env.NEXT_PUBLIC_CLOSED_BETA_MODE;
  return val === "true" || val === "1";
}

/**
 * Checks whether a given user role and identity is authorized to access
 * the website during Closed Beta.
 */
export function isAllowedInClosedBeta(
  role?: string | null,
  playerName?: string | null,
): boolean {
  if (isAdminRole(role, playerName)) {
    return true;
  }
  return isBetaTester(role);
}

const EXEMPT_PREFIXES = [
  "/login",
  "/register",
  "/verify-email",
  "/reset-password",
  "/forgot-password",
  "/applications/beta-tester",
  "/api/auth",
  "/api/applications",
  "/_next",
  "/favicon.ico",
  "/icon.png",
  "/logo.png",
  "/og-image.png",
  "/robots.txt",
  "/sitemap.xml",
];

/**
 * Determines if a given request path is publicly accessible during Closed Beta.
 */
export function isClosedBetaExemptPath(pathname: string): boolean {
  const clean = pathname.split("?")[0].toLowerCase();
  return EXEMPT_PREFIXES.some((prefix) =>
    clean === prefix || clean.startsWith(`${prefix}/`) || clean.endsWith(prefix),
  );
}
