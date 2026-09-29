import { describe, expect, it } from "vitest";

import { createGoogleSignupToken, readGoogleSignupToken } from "../lib/google-signup";
import { playerNameSchema } from "../lib/validation";

const env = { NODE_ENV: "test", SESSION_SECRET: "test-google-signup-secret-32-characters" };
const now = Date.UTC(2026, 8, 29, 12, 0, 0);

describe("Google first-time setup", () => {
  it("accepts a verified short-lived signup token", () => {
    const token = createGoogleSignupToken("Player@Example.com", now, env);
    expect(readGoogleSignupToken(token, now + 60_000, env)?.email).toBe("player@example.com");
    expect(readGoogleSignupToken(token, now + 601_000, env)).toBeNull();
    expect(readGoogleSignupToken(`${token}tampered`, now + 60_000, env)).toBeNull();
  });

  it("binds an existing account setup token to its user ID", () => {
    const token = createGoogleSignupToken("player@example.com", now, env, "existing-id");
    expect(readGoogleSignupToken(token, now + 1000, env)?.existingUserId).toBe("existing-id");
  });

  it("uses the same username rules as normal registration", () => {
    expect(playerNameSchema.safeParse("Chosen_Name").success).toBe(true);
    expect(playerNameSchema.safeParse("person@example.com").success).toBe(false);
    expect(playerNameSchema.safeParse(" ").success).toBe(false);
  });
});
