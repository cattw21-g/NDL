import { describe, expect, it } from "vitest";

import { parseUpcomingProgress } from "@/lib/upcoming-progress";
import { isAdminRole } from "@/lib/permissions";

describe("upcoming progress parser", () => {
  it("parses progress from versionNotes bracket tag", () => {
    expect(parseUpcomingProgress("Verified up to drop [Progress: 68%]", 50)).toBe(68);
    expect(parseUpcomingProgress("[Progress: 100%]", 50)).toBe(100);
    expect(parseUpcomingProgress("[Progress: 0%]", 50)).toBe(0);
  });

  it("parses progress from loose progress string in notes", () => {
    expect(parseUpcomingProgress("Progress: 45%", 50)).toBe(45);
  });

  it("falls back to custom minimumProgress if no tag in versionNotes", () => {
    expect(parseUpcomingProgress("Some regular note", 65)).toBe(65);
    expect(parseUpcomingProgress(null, 72)).toBe(72);
  });

  it("defaults to 0 if minimumProgress is the default 50 and no tag in notes", () => {
    expect(parseUpcomingProgress("No progress set yet", 50)).toBe(0);
    expect(parseUpcomingProgress(null, 50)).toBe(0);
    expect(parseUpcomingProgress(null, null)).toBe(0);
  });

  it("confirms cattw21 has admin permissions for upcoming management", () => {
    expect(isAdminRole("PLAYER", "cattw21")).toBe(true);
    expect(isAdminRole("PLAYER", "Cattw21")).toBe(true);
    expect(isAdminRole("ADMIN", "random_user")).toBe(true);
    expect(isAdminRole("PLAYER", "random_user")).toBe(false);
  });
});
