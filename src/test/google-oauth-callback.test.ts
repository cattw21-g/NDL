import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, update, createSession, hasCompletedGoogleUsernameSetup } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  createSession: vi.fn(),
  hasCompletedGoogleUsernameSetup: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique, update } } }));
vi.mock("@/lib/auth", () => ({ createSession }));
vi.mock("@/lib/google-username-setup", () => ({ hasCompletedGoogleUsernameSetup }));

import { GET } from "../app/api/auth/google/callback/route";

function callbackRequest(state = "expected-state") {
  return new NextRequest(`https://www.nerfeddemonlist.net/api/auth/google/callback?code=google-code&state=${state}`, {
    headers: { cookie: "ndl_google_oauth_state=expected-state" },
  });
}

describe("Google OAuth callback", () => {
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
    process.env.SESSION_SECRET = "test-google-oauth-secret-at-least-32-chars";
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "access-token" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ email: "new@example.com", verified_email: true }) }));
    findUnique.mockReset();
    update.mockReset();
    createSession.mockReset();
    hasCompletedGoogleUsernameSetup.mockReset().mockResolvedValue(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects a mismatched OAuth state before contacting Google", async () => {
    const response = await GET(callbackRequest("wrong-state"));
    expect(response.headers.get("location")).toContain("/login?error=");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sends a new Google user to username setup without creating an account", async () => {
    findUnique.mockResolvedValue(null);
    const response = await GET(callbackRequest());
    expect(response.headers.get("location")).toBe("https://www.nerfeddemonlist.net/complete-google-signup");
    expect(response.headers.get("set-cookie")).toContain("ndl_google_setup=");
    expect(createSession).not.toHaveBeenCalled();
  });

  it("offers existing Google sign-ins one-time username setup", async () => {
    findUnique.mockResolvedValue({ id: "existing-user", playerName: "chosen-name", emailVerifiedAt: new Date() });
    const response = await GET(callbackRequest());
    expect(createSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("https://www.nerfeddemonlist.net/complete-google-signup");
  });

  it("signs in an existing user after username setup is complete", async () => {
    findUnique.mockResolvedValue({ id: "existing-user", playerName: "chosen-name", emailVerifiedAt: new Date() });
    hasCompletedGoogleUsernameSetup.mockResolvedValue(true);
    const response = await GET(callbackRequest());
    expect(createSession).toHaveBeenCalledWith("existing-user");
    expect(response.headers.get("location")).toBe("https://www.nerfeddemonlist.net/players/chosen-name");
  });
});
