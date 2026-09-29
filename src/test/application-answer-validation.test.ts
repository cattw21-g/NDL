import { describe, expect, it } from "vitest";
import { hasApplicationAnswer } from "@/lib/application-answer-validation";

describe("application answer validation", () => {
  it("accepts non-empty text and choice arrays", () => {
    expect(hasApplicationAnswer("  answered  ")).toBe(true);
    expect(hasApplicationAnswer(["Chrome", "Firefox"])).toBe(true);
    expect(hasApplicationAnswer("Yes")).toBe(true);
    expect(hasApplicationAnswer(false)).toBe(true);
  });

  it("rejects empty answers", () => {
    expect(hasApplicationAnswer("   ")).toBe(false);
    expect(hasApplicationAnswer([])).toBe(false);
    expect(hasApplicationAnswer(undefined)).toBe(false);
    expect(hasApplicationAnswer(null)).toBe(false);
  });
});
