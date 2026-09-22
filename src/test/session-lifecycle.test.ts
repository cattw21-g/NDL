import { beforeAll, describe, expect, it } from "vitest";

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
});
