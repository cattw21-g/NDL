import { describe, expect, it } from "vitest";

import {
  COUNTRIES,
  getAllCountries,
  getCountryMeta,
} from "../lib/countries";

describe("country metadata and representation", () => {
  it("resolves valid country codes correctly", () => {
    const pl = getCountryMeta("PL");
    expect(pl).toBeDefined();
    expect(pl?.name).toBe("Poland");
    expect(pl?.flag).toBe("🇵🇱");
    expect(pl?.continent).toBe("Europe");

    const us = getCountryMeta("US");
    expect(us).toBeDefined();
    expect(us?.name).toBe("United States");
    expect(us?.flag).toBe("🇺🇸");
    expect(us?.continent).toBe("North America");
  });

  it("handles case-insensitive and trimmed country codes", () => {
    const de = getCountryMeta("  de  ");
    expect(de?.name).toBe("Germany");
    expect(de?.flag).toBe("🇩🇪");
  });

  it("returns null for null or empty country codes", () => {
    expect(getCountryMeta(null)).toBeNull();
    expect(getCountryMeta(undefined)).toBeNull();
    expect(getCountryMeta("")).toBeNull();
  });

  it("falls back to generic globe for unrecognized codes", () => {
    const unknown = getCountryMeta("XYZ");
    expect(unknown?.code).toBe("XYZ");
    expect(unknown?.flag).toBe("🌐");
  });

  it("lists all supported countries sorted alphabetically", () => {
    const all = getAllCountries();
    expect(all.length).toBeGreaterThanOrEqual(40);
    for (let i = 0; i < all.length - 1; i++) {
      expect(all[i].name.localeCompare(all[i + 1].name)).toBeLessThanOrEqual(0);
    }
  });

  it("contains major gaming regions across all continents", () => {
    const continents = new Set(Object.values(COUNTRIES).map((c) => c.continent));
    expect(continents.has("Europe")).toBe(true);
    expect(continents.has("North America")).toBe(true);
    expect(continents.has("South America")).toBe(true);
    expect(continents.has("Asia")).toBe(true);
    expect(continents.has("Oceania")).toBe(true);
    expect(continents.has("Africa")).toBe(true);
  });
});
