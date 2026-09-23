import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  extractClientIp,
  hasNetworkConflict,
  hashClientIp,
  isLocalhostIp,
  normalizeIp,
} from "../lib/anti-alt";

describe("Anti-Alt IP Security & Network Conflict Detection", () => {
  it("normalizes IP addresses correctly", () => {
    expect(normalizeIp("  192.168.1.1  ")).toBe("192.168.1.1");
    expect(normalizeIp("::ffff:192.168.1.1")).toBe("192.168.1.1");
    expect(normalizeIp("192.168.1.1:8080")).toBe("192.168.1.1");
    expect(normalizeIp("::ffff:192.168.1.1:8080")).toBe("192.168.1.1");
    expect(normalizeIp("")).toBe("");
    expect(normalizeIp(null)).toBe("");
  });

  it("identifies localhost loopback IPs", () => {
    expect(isLocalhostIp("127.0.0.1")).toBe(true);
    expect(isLocalhostIp("::1")).toBe(true);
    expect(isLocalhostIp("localhost")).toBe(true);
    expect(isLocalhostIp("guest-client")).toBe(true);
    expect(isLocalhostIp("203.0.113.195")).toBe(false);
  });

  it("produces consistent salted SHA-256 hashes", () => {
    const hash1 = hashClientIp("203.0.113.50");
    const hash2 = hashClientIp("203.0.113.50");
    const hash3 = hashClientIp("203.0.113.51");

    expect(hash1).toBeTruthy();
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hashClientIp("")).toBeNull();
    expect(hashClientIp(null)).toBeNull();
  });

  it("extracts client IP from various headers", () => {
    const headers1 = new Headers({
      "x-forwarded-for": "198.51.100.42, 10.0.0.1",
    });
    expect(extractClientIp(headers1)).toBe("198.51.100.42");

    const headers2 = new Headers({
      "cf-connecting-ip": "198.51.100.99",
    });
    expect(extractClientIp(headers2)).toBe("198.51.100.99");

    const headers3 = new Headers({
      "x-real-ip": "198.51.100.88",
    });
    expect(extractClientIp(headers3)).toBe("198.51.100.88");

    // Prioritizes cf-connecting-ip and x-real-ip over spoofed x-forwarded-for
    const spoofedHeaders = new Headers({
      "x-forwarded-for": "1.2.3.4",
      "cf-connecting-ip": "203.0.113.77",
    });
    expect(extractClientIp(spoofedHeaders)).toBe("203.0.113.77");

    // Prioritizes x-vercel-forwarded-for over all other headers
    const vercelHeaders = new Headers({
      "x-forwarded-for": "1.2.3.4",
      "cf-connecting-ip": "203.0.113.77",
      "x-vercel-forwarded-for": "198.51.100.111, 10.0.0.1",
    });
    expect(extractClientIp(vercelHeaders)).toBe("198.51.100.111");
  });

  it("detects network conflict when moderator and submitter share the same public IP", () => {
    const submitterIp = "198.51.100.123";
    const submitterIpHash = hashClientIp(submitterIp);

    // Matching IP for a MODERATOR -> Conflict detected
    const conflict = hasNetworkConflict({
      submitterIpHash,
      reviewerIp: "198.51.100.123",
      reviewerRole: "MODERATOR",
      allowLocalhostBypass: false,
    });
    expect(conflict).toBe(true);

    // Different IP for a MODERATOR -> No conflict
    const noConflict = hasNetworkConflict({
      submitterIpHash,
      reviewerIp: "198.51.100.124",
      reviewerRole: "MODERATOR",
      allowLocalhostBypass: false,
    });
    expect(noConflict).toBe(false);
  });

  it("exempts ADMIN role from network conflicts", () => {
    const submitterIp = "198.51.100.123";
    const submitterIpHash = hashClientIp(submitterIp);

    // Even with matching IP, ADMIN is exempt
    const conflict = hasNetworkConflict({
      submitterIpHash,
      reviewerIp: "198.51.100.123",
      reviewerRole: "ADMIN",
      allowLocalhostBypass: false,
    });
    expect(conflict).toBe(false);
  });

  it("bypasses loopback/localhost IPs in development mode", () => {
    const localhostHash = hashClientIp("127.0.0.1");

    const conflict = hasNetworkConflict({
      submitterIpHash: localhostHash,
      reviewerIp: "127.0.0.1",
      reviewerRole: "MODERATOR",
      allowLocalhostBypass: true,
    });
    expect(conflict).toBe(false);
  });

  it("safely recognizes legacy salted SHA-256 hashes for backwards compatibility", () => {
    // Generate a legacy salted hash
    const legacySalt = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || "ndl-network-security-salt";
    const legacyHash = crypto.createHash("sha256").update(`198.51.100.200:${legacySalt}`).digest("hex");

    const conflict = hasNetworkConflict({
      submitterIpHash: legacyHash,
      reviewerIp: "198.51.100.200",
      reviewerRole: "MODERATOR",
      allowLocalhostBypass: false,
    });
    expect(conflict).toBe(true);
  });

  it("throws an explicit configuration error in production when secrets are missing", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalAntiAlt = process.env.ANTI_ALT_SECRET;
    const originalSession = process.env.SESSION_SECRET;
    const originalNextAuth = process.env.NEXTAUTH_SECRET;

    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      delete process.env.ANTI_ALT_SECRET;
      delete process.env.SESSION_SECRET;
      delete process.env.NEXTAUTH_SECRET;

      expect(() => hashClientIp("198.51.100.50")).toThrow(
        "ANTI_ALT_SECRET or SESSION_SECRET must be configured in production environment.",
      );
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
      process.env.ANTI_ALT_SECRET = originalAntiAlt;
      process.env.SESSION_SECRET = originalSession;
      process.env.NEXTAUTH_SECRET = originalNextAuth;
    }
  });
});

