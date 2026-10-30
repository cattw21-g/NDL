import { describe, expect, it } from "vitest";
import {
  isClosedBetaActive,
  isBetaSiteHost,
  isAllowedInClosedBeta,
  isClosedBetaExemptPath,
} from "@/lib/closed-beta";

describe("Closed Beta Guardrails", () => {
  describe("isClosedBetaActive", () => {
    it("returns false by default when env vars are not set", () => {
      expect(isClosedBetaActive({})).toBe(false);
    });

    it("returns true when CLOSED_BETA_MODE=true", () => {
      expect(isClosedBetaActive({ CLOSED_BETA_MODE: "true" })).toBe(true);
    });

    it("returns true when NEXT_PUBLIC_CLOSED_BETA_MODE=true", () => {
      expect(isClosedBetaActive({ NEXT_PUBLIC_CLOSED_BETA_MODE: "true" })).toBe(true);
    });

    it("returns true when CLOSED_BETA_MODE=1", () => {
      expect(isClosedBetaActive({ CLOSED_BETA_MODE: "1" })).toBe(true);
    });

    it("returns false when CLOSED_BETA_MODE=false", () => {
      expect(isClosedBetaActive({ CLOSED_BETA_MODE: "false" })).toBe(false);
    });
  });

  describe("isBetaSiteHost", () => {
    it("identifies beta domain hosts", () => {
      expect(isBetaSiteHost("nerfeddemonlist-beta.vercel.app", {})).toBe(true);
      expect(isBetaSiteHost("beta.nerfeddemonlist.net", {})).toBe(true);
      expect(isBetaSiteHost("nerfeddemonlist-git-beta-ndl.vercel.app", {})).toBe(true);
      expect(isBetaSiteHost("localhost:3000", { CLOSED_BETA_MODE: "true" })).toBe(true);
    });

    it("identifies official non-beta domain hosts", () => {
      expect(isBetaSiteHost("nerfeddemonlist.net", {})).toBe(false);
      expect(isBetaSiteHost("www.nerfeddemonlist.net", {})).toBe(false);
      expect(isBetaSiteHost("nerfeddemonlist.vercel.app", {})).toBe(false);
      expect(isBetaSiteHost(null, {})).toBe(false);
      expect(isBetaSiteHost(undefined, {})).toBe(false);
    });
  });

  describe("isAllowedInClosedBeta", () => {
    it("permits ADMIN role", () => {
      expect(isAllowedInClosedBeta("ADMIN")).toBe(true);
    });

    it("permits owner username override", () => {
      expect(isAllowedInClosedBeta("PLAYER", "cattw21")).toBe(true);
      expect(isAllowedInClosedBeta("PLAYER", "ndl_admin")).toBe(true);
    });

    it("permits MODERATOR and LIST_MODERATOR roles", () => {
      expect(isAllowedInClosedBeta("MODERATOR")).toBe(true);
      expect(isAllowedInClosedBeta("LIST_MODERATOR")).toBe(true);
    });

    it("permits LIST_REVIEWER role", () => {
      expect(isAllowedInClosedBeta("LIST_REVIEWER")).toBe(true);
    });

    it("permits BETA_TESTER role", () => {
      expect(isAllowedInClosedBeta("BETA_TESTER")).toBe(true);
    });

    it("denies regular PLAYER without beta status", () => {
      expect(isAllowedInClosedBeta("PLAYER")).toBe(false);
      expect(isAllowedInClosedBeta("PLAYER", "regular_player")).toBe(false);
    });

    it("denies null/undefined/empty role", () => {
      expect(isAllowedInClosedBeta(null)).toBe(false);
      expect(isAllowedInClosedBeta(undefined)).toBe(false);
      expect(isAllowedInClosedBeta("")).toBe(false);
    });
  });

  describe("isClosedBetaExemptPath", () => {
    it("allows authentication and recovery paths", () => {
      expect(isClosedBetaExemptPath("/login")).toBe(true);
      expect(isClosedBetaExemptPath("/login?redirect=/")).toBe(true);
      expect(isClosedBetaExemptPath("/register")).toBe(true);
      expect(isClosedBetaExemptPath("/verify-email")).toBe(true);
      expect(isClosedBetaExemptPath("/verify-email/xyz")).toBe(true);
      expect(isClosedBetaExemptPath("/reset-password")).toBe(true);
      expect(isClosedBetaExemptPath("/forgot-password")).toBe(true);
      expect(isClosedBetaExemptPath("/api/auth/me")).toBe(true);
      expect(isClosedBetaExemptPath("/api/auth/callback/discord")).toBe(true);
    });

    it("allows static assets", () => {
      expect(isClosedBetaExemptPath("/favicon.ico")).toBe(true);
      expect(isClosedBetaExemptPath("/logo.png")).toBe(true);
      expect(isClosedBetaExemptPath("/_next/static/css/app.css")).toBe(true);
    });

    it("blocks general content paths during closed beta until key is entered", () => {
      expect(isClosedBetaExemptPath("/")).toBe(false);
      expect(isClosedBetaExemptPath("/applications/beta-tester")).toBe(false);
      expect(isClosedBetaExemptPath("/levels/bloodbath-nerfed")).toBe(false);
      expect(isClosedBetaExemptPath("/players/cattw21")).toBe(false);
      expect(isClosedBetaExemptPath("/submit")).toBe(false);
      expect(isClosedBetaExemptPath("/suggest-level")).toBe(false);
      expect(isClosedBetaExemptPath("/stats")).toBe(false);
      expect(isClosedBetaExemptPath("/upcoming")).toBe(false);
      expect(isClosedBetaExemptPath("/countries")).toBe(false);
    });
  });
});
