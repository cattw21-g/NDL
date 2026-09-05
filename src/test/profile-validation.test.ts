import { describe, expect, it } from "vitest";

import {
  COUNTRIES,
  getAllCountries,
  getCountryMeta,
} from "../lib/countries";
import { registerSchema } from "../lib/validation";
import { buildRegistrationCreateData } from "../lib/registration";

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

  it("parses countryCode in registration validation", () => {
    const result = registerSchema.safeParse({
      email: "newplayer@example.com",
      playerName: "NewPlayer",
      countryCode: "pl",
      password: "password12345",
      confirmPassword: "password12345",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.countryCode).toBe("PL");
    }
  });

  it("handles optional or omitted countryCode in registration", () => {
    const result = registerSchema.safeParse({
      email: "newplayer2@example.com",
      playerName: "NewPlayer2",
      password: "password12345",
      confirmPassword: "password12345",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.countryCode).toBeNull();
    }
  });

  it("builds registration create data with countryCode", async () => {
    const data = await buildRegistrationCreateData({
      email: "player@example.com",
      playerName: "PlayerOne",
      displayName: "PlayerOne",
      password: "password12345",
      countryCode: "US",
    });
    expect(data.countryCode).toBe("US");
    expect(data.playerName).toBe("PlayerOne");
  });
});
