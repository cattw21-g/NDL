import { isAdminRole, isBetaTester } from "@/lib/permissions";

/**
 * Checks whether the site is in Closed Beta mode based on environment variables.
 */
export function isClosedBetaActive(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const val = env.CLOSED_BETA_MODE ?? env.NEXT_PUBLIC_CLOSED_BETA_MODE;
  return val === "true" || val === "1";
}

/**
 * Determines whether the current request is targeting the dedicated Beta / Preview site
 * (e.g. nerfeddemonlist-beta.vercel.app, beta.nerfeddemonlist.net) or has closed beta active.
 * On the official live website (nerfeddemonlist.net), this returns false so regular users
 * see the 100% clean, standard site with zero beta lock or testing UI.
 */
export function isBetaSiteHost(
  host?: string | null,
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (isClosedBetaActive(env)) {
    return true;
  }
  if (!host) return false;
  const clean = host.toLowerCase().split(":")[0];
  return clean.includes("beta") || clean.includes("-git-beta");
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
  "/api/auth",
  "/_next",
  "/favicon.ico",
  "/icon.png",
  "/logo.png",
  "/og-image.png",
  "/robots.txt",
  "/sitemap.xml",
];

/**
 * Determines if a given request path is accessible without a key during beta (e.g. login for admin).
 */
export function isClosedBetaExemptPath(pathname: string): boolean {
  const clean = pathname.split("?")[0].toLowerCase();
  return EXEMPT_PREFIXES.some((prefix) =>
    clean === prefix || clean.startsWith(`${prefix}/`) || clean.endsWith(prefix),
  );
}
