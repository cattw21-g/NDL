import { describe, expect, it } from "vitest";

import { getLevelTier } from "@/lib/points";
import { submissionSchema } from "@/lib/validation";

describe("Minimum Progress Requirements (Pointercrate Parity & 30% Floor)", () => {
  describe("submissionSchema validation", () => {
    const baseValid = {
      levelId: "level-123",
      videoUrl: "https://youtube.com/watch?v=abcdefghijk",
      fps: "240",
      inputDevice: "Razer Viper 8K",
    };

    it("rejects progress below 30%", () => {
      for (const p of [0, 1, 15, 29]) {
        const res = submissionSchema.safeParse({
          ...baseValid,
          progress: String(p),
        });
        expect(res.success).toBe(false);
        if (!res.success) {
          expect(res.error.flatten().fieldErrors.progress).toContain(
            "Progress must be at least 30% (or 100% for full completions).",
          );
        }
      }
    });

    it("accepts progress from 30% up to 100%", () => {
      for (const p of [30, 45, 50, 68, 99, 100]) {
        const res = submissionSchema.safeParse({
          ...baseValid,
          progress: String(p),
        });
        expect(res.success).toBe(true);
      }
    });

    it("rejects progress exceeding 100%", () => {
      const res = submissionSchema.safeParse({
        ...baseValid,
        progress: "101",
      });
      expect(res.success).toBe(false);
    });

    it("defaults to 100% if progress omitted", () => {
      const res = submissionSchema.safeParse(baseValid);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.progress).toBe(100);
      }
    });
  });

  describe("Tier-based Progress Rules (Pointercrate Parity)", () => {
    it("identifies Main List levels (#1 - #75)", () => {
      expect(getLevelTier(1, "RANKED")).toBe("MAIN");
      expect(getLevelTier(50, "RANKED")).toBe("MAIN");
      expect(getLevelTier(75, "RANKED")).toBe("MAIN");
    });

    it("identifies Extended List levels (#76 - #150)", () => {
      expect(getLevelTier(76, "RANKED")).toBe("EXTENDED");
      expect(getLevelTier(100, "RANKED")).toBe("EXTENDED");
      expect(getLevelTier(150, "RANKED")).toBe("EXTENDED");
    });

    it("identifies Legacy levels (> #150 or LEGACY status)", () => {
      expect(getLevelTier(151, "RANKED")).toBe("LEGACY");
      expect(getLevelTier(1, "LEGACY")).toBe("LEGACY");
      expect(getLevelTier(null, "LEGACY")).toBe("LEGACY");
    });

    it("simulates Main List requirement check (req >= 50% default)", () => {
      const level = {
        name: "Nerfed Slaughterhouse",
        rank: 1,
        status: "RANKED" as const,
        minimumProgress: 50,
      };

      const tier = getLevelTier(level.rank, level.status);
      expect(tier).toBe("MAIN");

      // Runs at or above requirement are allowed
      expect(50 >= level.minimumProgress).toBe(true);
      expect(75 >= level.minimumProgress).toBe(true);
      expect(100 >= level.minimumProgress).toBe(true);

      // Runs below requirement are rejected
      expect(49 >= level.minimumProgress).toBe(false);
      expect(35 >= level.minimumProgress).toBe(false);
    });

    it("simulates Extended List requirement check (completions only)", () => {
      const level = {
        name: "Nerfed Tartarus",
        rank: 80,
        status: "RANKED" as const,
        minimumProgress: 50,
      };

      const tier = getLevelTier(level.rank, level.status);
      expect(tier).toBe("EXTENDED");

      // In Extended list, progress < 100 must be rejected
      const isAllowed = (progress: number) => {
        if (progress === 100) return true;
        if (tier !== "MAIN") return false;
        return progress >= (level.minimumProgress ?? 50);
      };

      expect(isAllowed(100)).toBe(true);
      expect(isAllowed(75)).toBe(false);
      expect(isAllowed(50)).toBe(false);
    });
  });
});
