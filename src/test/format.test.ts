import { describe, expect, it } from "vitest";

import { formatDateInputValue } from "../lib/format";

describe("date input formatting", () => {
  it("returns an empty date input value for missing or invalid dates", () => {
    expect(formatDateInputValue(null)).toBe("");
    expect(formatDateInputValue(undefined)).toBe("");
    expect(formatDateInputValue("")).toBe("");
    expect(formatDateInputValue("not-a-date")).toBe("");
    expect(formatDateInputValue(new Date("not-a-date"))).toBe("");
  });

  it("formats valid dates for HTML date inputs", () => {
    expect(formatDateInputValue(new Date("2026-05-31T12:00:00.000Z"))).toBe(
      "2026-05-31",
    );
    expect(formatDateInputValue("2026-05-01T00:00:00.000Z")).toBe(
      "2026-05-01",
    );
  });
});
