import { describe, expect, it } from "vitest";

import {
  demoModeEnabled,
  publicChangelogWhere,
  publicLevelWhere,
  publicRecordWhere,
  publicUserWhere,
} from "../lib/demo-visibility";

describe("demo visibility", () => {
  it("hides demo-looking public data unless demo mode is explicitly enabled", () => {
    expect(demoModeEnabled({})).toBe(false);
    expect(demoModeEnabled({ ENABLE_DEMO_SEED: "true" })).toBe(true);

    expect(publicLevelWhere({ status: "RANKED" })).toMatchObject({
      AND: expect.arrayContaining([
        { status: "RANKED" },
        { isDemo: false },
        { name: { not: { startsWith: "[DEMO]" } } },
        { thumbnailUrl: { not: { startsWith: "/demo-thumbnails" } } },
      ]),
    });

    expect(publicUserWhere()).toMatchObject({
      AND: expect.arrayContaining([
        { isDemo: false },
        { email: { not: { endsWith: "@ndl.local" } } },
      ]),
    });

    expect(publicRecordWhere()).toMatchObject({
      AND: expect.arrayContaining([
        { isDemo: false },
        { videoUrl: { not: { contains: "example.com" } } },
      ]),
    });

    expect(publicChangelogWhere()).toMatchObject({
      AND: expect.arrayContaining([{ isDemo: false }]),
    });
  });

  it("does not alter public filters in explicit demo mode", () => {
    const where = { status: "RANKED" } as const;

    expect(publicLevelWhere(where, { ENABLE_DEMO_SEED: "true" })).toBe(where);
  });
});
