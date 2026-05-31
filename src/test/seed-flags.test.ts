import { describe, expect, it } from "vitest";

import { demoSeedEnabled, demoSeedResetEnabled } from "../lib/seed-flags";

describe("seed flags", () => {
  it("keeps demo seeding disabled by default", () => {
    expect(demoSeedEnabled({})).toBe(false);
    expect(demoSeedResetEnabled({})).toBe(false);
  });

  it("enables demo seeding only through ENABLE_DEMO_SEED", () => {
    expect(demoSeedEnabled({ ENABLE_DEMO_SEED: "true" })).toBe(true);
    expect(demoSeedResetEnabled({ NDL_SEED_RESET: "true" })).toBe(true);
  });

  it("does not let the deprecated NDL_SEED_DEMO flag create demo data", () => {
    expect(() =>
      demoSeedEnabled({
        NDL_SEED_DEMO: "true",
      }),
    ).toThrow("ENABLE_DEMO_SEED=true is required");
  });
});
