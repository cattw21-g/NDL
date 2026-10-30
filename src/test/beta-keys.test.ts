import { describe, expect, it } from "vitest";
import {
  generateSecureBetaKey,
  normalizeBetaKey,
  isValidBetaKeyFormat,
} from "@/lib/beta-keys";

describe("Beta Invite Key Security & Parsing", () => {
  describe("generateSecureBetaKey", () => {
    it("generates keys matching the expected NDL-XXXX-YYYY format", () => {
      for (let i = 0; i < 20; i++) {
        const key = generateSecureBetaKey();
        expect(key).toMatch(/^NDL-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);
        expect(isValidBetaKeyFormat(key)).toBe(true);
      }
    });

    it("never includes ambiguous characters (0, O, 1, I, L) in the generated segments", () => {
      for (let i = 0; i < 50; i++) {
        const key = generateSecureBetaKey();
        const segments = key.slice(4); // exclude 'NDL-' prefix
        expect(segments).not.toMatch(/[01OILoil]/);
      }
    });
  });

  describe("normalizeBetaKey", () => {
    it("converts lowercase to uppercase", () => {
      expect(normalizeBetaKey("ndl-8f3k-9w2m")).toBe("NDL-8F3K-9W2M");
    });

    it("trims surrounding whitespace", () => {
      expect(normalizeBetaKey("   NDL-8F3K-9W2M   ")).toBe("NDL-8F3K-9W2M");
    });

    it("handles key entered without hyphens", () => {
      expect(normalizeBetaKey("NDL8F3K9W2M")).toBe("NDL-8F3K-9W2M");
    });

    it("handles raw 8-character string without NDL prefix", () => {
      expect(normalizeBetaKey("8F3K9W2M")).toBe("NDL-8F3K-9W2M");
    });
  });

  describe("isValidBetaKeyFormat", () => {
    it("validates correct format keys", () => {
      expect(isValidBetaKeyFormat("NDL-8F3K-9W2M")).toBe(true);
      expect(isValidBetaKeyFormat("NDL-2222-3333")).toBe(true);
    });

    it("rejects invalid keys", () => {
      expect(isValidBetaKeyFormat("")).toBe(false);
      expect(isValidBetaKeyFormat("NDL-SHORT")).toBe(false);
      expect(isValidBetaKeyFormat("NDL-8F3K-9W2MO")).toBe(false); // contains 'O'
      expect(isValidBetaKeyFormat("NDL-8F30-9W2M")).toBe(false); // contains '0'
      expect(isValidBetaKeyFormat("INVALID-KEY-FORMAT")).toBe(false);
    });
  });
});
