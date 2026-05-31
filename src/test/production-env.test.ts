import { describe, expect, it } from "vitest";

import {
  assertProductionEnv,
  isStrongSessionSecret,
  productionLocalUploadsDisabledReason,
  requireDatabaseUrl,
  requireSessionSecret,
} from "../lib/production-env";

const strongSecret = "0123456789abcdefghijklmnopqrstuvwxyzABCDEF";

describe("production environment safety", () => {
  it("requires DATABASE_URL clearly when missing", () => {
    expect(() => requireDatabaseUrl({}, "test database access")).toThrow(
      "DATABASE_URL is required to test database access.",
    );
  });

  it("requires a strong SESSION_SECRET in production", () => {
    expect(() =>
      requireSessionSecret({
        NODE_ENV: "production",
      }),
    ).toThrow("SESSION_SECRET must be set");

    expect(() =>
      requireSessionSecret({
        NODE_ENV: "production",
        SESSION_SECRET: "change-me-change-me-change-me-change-me",
      }),
    ).toThrow("SESSION_SECRET must be a strong random value");

    expect(
      requireSessionSecret({
        NODE_ENV: "production",
        SESSION_SECRET: strongSecret,
      }),
    ).toBe(strongSecret);
  });

  it("keeps local development working without SESSION_SECRET", () => {
    expect(requireSessionSecret({ NODE_ENV: "development" })).toContain(
      "development",
    );
  });

  it("collects production configuration errors", () => {
    expect(() =>
      assertProductionEnv({
        NODE_ENV: "production",
        DATABASE_URL: "",
        SESSION_SECRET: "short",
      }),
    ).toThrow("Production configuration error");

    expect(() =>
      assertProductionEnv({
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://example",
        SESSION_SECRET: strongSecret,
      }),
    ).not.toThrow();
  });

  it("documents local upload fail-closed behavior for production", () => {
    expect(
      productionLocalUploadsDisabledReason({
        NODE_ENV: "production",
        UPLOAD_MODE: "local",
      }),
    ).toContain("UPLOAD_MODE=local is disabled in production");

    expect(
      productionLocalUploadsDisabledReason({
        NODE_ENV: "production",
        UPLOAD_MODE: "local",
        ALLOW_LOCAL_UPLOADS_IN_PRODUCTION: "true",
      }),
    ).toBeNull();
  });

  it("rejects obvious weak session secret values", () => {
    expect(isStrongSessionSecret("a".repeat(40))).toBe(false);
    expect(isStrongSessionSecret("replace-with-a-real-session-secret")).toBe(
      false,
    );
    expect(isStrongSessionSecret(strongSecret)).toBe(true);
  });
});
