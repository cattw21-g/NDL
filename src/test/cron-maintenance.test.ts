import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../app/api/cron/maintenance/route";

vi.mock("@/lib/db", () => ({
  prisma: {
    session: { deleteMany: vi.fn().mockResolvedValue({ count: 5 }) },
    passwordResetToken: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
    emailVerificationToken: { deleteMany: vi.fn().mockResolvedValue({ count: 3 }) },
    rateLimitAttempt: { deleteMany: vi.fn().mockResolvedValue({ count: 12 }) },
    recordSubmission: {
      findMany: vi.fn().mockResolvedValue([{ id: "sub-1" }]),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  },
}));

describe("/api/cron/maintenance endpoint", () => {
  it("rejects unauthenticated requests with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/cron/maintenance", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Unauthorized");
  });

  it("authorizes requests with valid CRON_SECRET bearer token", async () => {
    const originalEnv = { ...process.env };
    process.env.CRON_SECRET = "super-secret-cron-token-xyz";

    try {
      const req = new NextRequest("http://localhost:3000/api/cron/maintenance", {
        method: "POST",
        headers: {
          Authorization: "Bearer super-secret-cron-token-xyz",
        },
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.actor).toBe("service-token");
      expect(data.maintenance.deletedSessions).toBe(5);
      expect(data.maintenance.deletedResetTokens).toBe(2);
      expect(data.maintenance.deletedVerificationTokens).toBe(3);
      expect(data.maintenance.deletedRateLimitAttempts).toBe(12);
      expect(data.maintenance.autoExpiredSubmissions).toBe(1);
    } finally {
      process.env = originalEnv;
    }
  });

  it("authorizes GET requests with x-cron-secret header", async () => {
    const originalEnv = { ...process.env };
    process.env.CRON_SECRET = "custom-header-cron-token";

    try {
      const req = new NextRequest("http://localhost:3000/api/cron/maintenance", {
        method: "GET",
        headers: {
          "x-cron-secret": "custom-header-cron-token",
        },
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.actor).toBe("service-token");
    } finally {
      process.env = originalEnv;
    }
  });
});
