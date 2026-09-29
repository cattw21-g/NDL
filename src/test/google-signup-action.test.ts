import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, findFirst, create, update, createSession, deleteCookie, markGoogleUsernameSetupComplete, readGoogleSignupToken } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  createSession: vi.fn(),
  deleteCookie: vi.fn(),
  markGoogleUsernameSetupComplete: vi.fn(),
  readGoogleSignupToken: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique, findFirst, create, update } } }));
vi.mock("@/lib/auth", () => ({ createSession }));
vi.mock("@/lib/google-username-setup", () => ({ markGoogleUsernameSetupComplete }));
vi.mock("@/lib/password-hashing", () => ({ hashPassword: async () => "random-hash" }));
vi.mock("next/headers", () => ({ cookies: async () => ({
  get: () => ({ value: "signed-token" }),
  delete: deleteCookie,
}) }));
vi.mock("@/lib/google-signup", () => ({
  GOOGLE_SETUP_COOKIE: "ndl_google_setup",
  readGoogleSignupToken,
}));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));

import { completeGoogleSignupAction } from "../actions/google-signup";

describe("complete Google signup", () => {
  beforeEach(() => {
    findUnique.mockReset().mockResolvedValue(null);
    findFirst.mockReset().mockResolvedValue(null);
    create.mockReset().mockImplementation(async ({ data }) => ({ id: "new-user", ...data }));
    createSession.mockReset().mockResolvedValue(undefined);
    update.mockReset().mockImplementation(async ({ data }) => ({ id: "existing-user", email: "google@example.com", playerName: data.playerName, displayName: data.displayName, emailVerifiedAt: data.emailVerifiedAt }));
    markGoogleUsernameSetupComplete.mockReset().mockResolvedValue(undefined);
    readGoogleSignupToken.mockReset().mockReturnValue({ email: "google@example.com", expiresAt: Date.now() + 60_000 });
    deleteCookie.mockReset();
  });

  it("creates the account with the chosen username, not the email handle", async () => {
    const form = new FormData();
    form.set("playerName", "MyChosenName");
    await expect(completeGoogleSignupAction(form)).rejects.toThrow("redirect:/players/MyChosenName");
    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({
      email: "google@example.com",
      playerName: "MyChosenName",
      displayName: "MyChosenName",
    }) });
    expect(createSession).toHaveBeenCalledWith("new-user");
    expect(markGoogleUsernameSetupComplete).toHaveBeenCalledWith("new-user");
    expect(deleteCookie).toHaveBeenCalledWith("ndl_google_setup");
  });

  it("lets an existing Google user choose a username without deleting their account", async () => {
    readGoogleSignupToken.mockReturnValue({ email: "google@example.com", existingUserId: "existing-user", expiresAt: Date.now() + 60_000 });
    findUnique.mockResolvedValue({ id: "existing-user", email: "google@example.com", playerName: "old-name", displayName: "old-name", emailVerifiedAt: new Date() });
    const form = new FormData();
    form.set("playerName", "chosen-name");
    await expect(completeGoogleSignupAction(form)).rejects.toThrow("redirect:/players/chosen-name");
    expect(update).toHaveBeenCalledWith({ where: { id: "existing-user" }, data: expect.objectContaining({ playerName: "chosen-name", displayName: "chosen-name" }) });
    expect(create).not.toHaveBeenCalled();
    expect(markGoogleUsernameSetupComplete).toHaveBeenCalledWith("existing-user");
  });

  it("rejects a taken username without creating an account", async () => {
    findFirst.mockResolvedValue({ id: "existing-user" });
    const form = new FormData();
    form.set("playerName", "TakenName");
    await expect(completeGoogleSignupAction(form)).rejects.toThrow("redirect:/complete-google-signup?error=");
    expect(create).not.toHaveBeenCalled();
  });
});
