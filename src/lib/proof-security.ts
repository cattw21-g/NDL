/**
 * Automated Proof Security & Anti-Cheat Analyzer.
 * Validates submission links, blocks deceptive URL shorteners, and checks physics parameters.
 */

const BLOCKED_SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "is.gd",
  "buff.ly",
  "ow.ly",
  "adf.ly",
  "bit.do",
  "cutt.ly",
  "shorturl.at",
  "v.gd",
  "linktr.ee",
]);

const ALLOWED_PROOF_DOMAINS = [
  "youtube.com",
  "youtu.be",
  "twitch.tv",
  "medal.tv",
  "tiktok.com",
  "bilibili.com",
  "streamable.com",
  "drive.google.com",
  "mega.nz",
  "dropbox.com",
  "mediafire.com",
];

export type ProofUrlValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * Validates a video or proof URL against malicious redirectors, URL shorteners,
 * and unsupported/suspicious hosting platforms.
 */
export function validateProofUrl(rawUrl: string | null | undefined): ProofUrlValidationResult {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, reason: "A video proof link is required." };
  }

  const trimmed = rawUrl.trim();

  // Local uploads are safe
  if (trimmed.startsWith("/uploads/")) {
    return { valid: true };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, reason: "Please provide a valid URL." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, reason: "Proof links must use HTTP or HTTPS protocols." };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");

  // 1. Block deceptive URL shorteners that obscure proof destinations
  if (BLOCKED_SHORTENERS.has(hostname) || Array.from(BLOCKED_SHORTENERS).some((s) => hostname.endsWith(`.${s}`))) {
    return {
      valid: false,
      reason:
        "URL shorteners (e.g. bit.ly, tinyurl) are prohibited. Please submit the direct video link (YouTube, Twitch, Medal.tv, TikTok, etc.).",
    };
  }

  // 2. Block direct IP addresses or non-standard ports
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || (parsed.port && !["80", "443"].includes(parsed.port))) {
    return {
      valid: false,
      reason: "Proof links with raw IP addresses or non-standard ports are prohibited.",
    };
  }

  // 3. Check against recognized platform whitelist
  const isAllowedHost = ALLOWED_PROOF_DOMAINS.some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`),
  );

  if (!isAllowedHost) {
    return {
      valid: false,
      reason: `Unsupported proof host (${hostname}). Please submit proof from YouTube, Twitch, Medal.tv, TikTok, Bilibili, Streamable, or Google Drive / Mega for raw footage.`,
    };
  }

  return { valid: true };
}

export type PhysicsValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * Validates reported game physics parameters for Geometry Dash 2.2 runs.
 */
export function validatePhysicsParameters(params: {
  fps: number;
  progress?: number;
}): PhysicsValidationResult {
  if (!Number.isInteger(params.fps) || params.fps < 30 || params.fps > 1000) {
    return {
      valid: false,
      reason: "FPS must be a valid whole number between 30 and 1000.",
    };
  }

  const progress = params.progress ?? 100;
  if (!Number.isInteger(progress) || progress < 30 || progress > 100) {
    return {
      valid: false,
      reason: "Progress must be a valid whole number between 30% and 100%.",
    };
  }

  return { valid: true };
}
