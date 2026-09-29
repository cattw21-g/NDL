import { describe, expect, it } from "vitest";

process.env.DATABASE_URL = "postgresql://mock:mock@localhost:5432/mock";
process.env.SESSION_SECRET = "mock-session-secret-at-least-32-chars-long";

describe("Session Lifecycle & Revocation Security", () => {
  it("exports revokeAllUserSessions and revokeOtherUserSessions functions", async () => {
    const { revokeAllUserSessions, revokeOtherUserSessions } = await import("@/lib/auth");
    expect(typeof revokeAllUserSessions).toBe("function");
    expect(typeof revokeOtherUserSessions).toBe("function");
  });

  it("handles empty or falsy userId gracefully without throwing", async () => {
    const { revokeAllUserSessions, revokeOtherUserSessions } = await import("@/lib/auth");
    await expect(revokeAllUserSessions("")).resolves.not.toThrow();
    await expect(revokeOtherUserSessions("")).resolves.not.toThrow();
  });

  it("handles database outage during session operations without throwing unhandled exceptions", async () => {
    const { revokeAllUserSessions, revokeOtherUserSessions, destroyCurrentSession } = await import("@/lib/auth");
    await expect(revokeAllUserSessions("user-123")).resolves.not.toThrow();
    await expect(revokeOtherUserSessions("user-123", "tok-abc")).resolves.not.toThrow();
  });
});
