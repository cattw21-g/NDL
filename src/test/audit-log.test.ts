import { describe, expect, it, vi } from "vitest";

import {
  buildAuditCreateData,
  buildAuditRequestMetadata,
  redactAuditValue,
  safeWriteAuditLog,
  snapshotActor,
} from "../lib/audit-log";

function asRecord(value: unknown) {
  return value as Record<string, unknown>;
}

describe("admin audit logging", () => {
  it("snapshots actor identity without needing a live user relation", () => {
    expect(
      snapshotActor({
        id: "user-1",
        playerName: "admin",
        displayName: "Admin",
        role: "ADMIN",
      }),
    ).toEqual({
      actorUserId: "user-1",
      actorHandle: "admin",
      actorName: "Admin",
      actorRole: "ADMIN",
    });

    expect(snapshotActor(null)).toEqual({
      actorUserId: null,
      actorHandle: "system",
      actorName: "System",
      actorRole: "SYSTEM",
    });
  });

  it("redacts sensitive before and after fields recursively", () => {
    const redacted = asRecord(
      redactAuditValue({
        id: "user-1",
        passwordHash: "secret-password-hash",
        sessions: [{ tokenHash: "session-token" }],
        emailVerificationTokens: [{ codeHash: "123456" }],
        nested: {
          rawFootageUrl: "https://example.com/private-raw.mp4",
          proofImageUrl: "https://example.com/private-proof.png",
          visible: "safe",
        },
      }),
    );
    const nested = asRecord(redacted.nested);

    expect(redacted.passwordHash).toBe("[redacted]");
    expect(redacted.sessions).toBe("[redacted]");
    expect(redacted.emailVerificationTokens).toBe("[redacted]");
    expect(nested.rawFootageUrl).toBe("[redacted]");
    expect(nested.proofImageUrl).toBe("[redacted]");
    expect(nested.visible).toBe("safe");
  });

  it("builds sanitized create data and hashes request metadata", () => {
    const request = buildAuditRequestMetadata(
      {
        ip: "203.0.113.7",
        userAgent: "Example Browser",
      },
      {
        NODE_ENV: "production",
        SESSION_SECRET: "X4q9Lw7R2p8Zc5Vm1B0nY6Ts3GhK2DaQ",
      },
    );
    const data = buildAuditCreateData({
      actor: {
        id: "admin-1",
        playerName: "admin",
        displayName: "Admin",
        role: "ADMIN",
      },
      action: "LEVEL_UPDATED",
      entityType: "Level",
      entityId: "level-1",
      entityLabel: "Abyssal Mercy",
      before: {
        rank: 2,
        passwordHash: "secret",
      },
      after: {
        rank: 1,
      },
      note: "Rank changed.",
      request,
    });
    const before = asRecord(data.beforeJson);

    expect(data.actorUserId).toBe("admin-1");
    expect(data.action).toBe("LEVEL_UPDATED");
    expect(before.passwordHash).toBe("[redacted]");
    expect(data.ipHash).toHaveLength(64);
    expect(data.userAgentHash).toHaveLength(64);
    expect(data.ipHash).not.toContain("203.0.113.7");
  });

  it("does not throw primary flow errors when safe logging fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const db = {
      adminAuditLog: {
        create: async () => {
          throw new Error("audit unavailable");
        },
      },
    };

    await expect(
      safeWriteAuditLog(db, {
        action: "LEVEL_UPDATED",
        entityType: "Level",
        entityId: "level-1",
        entityLabel: "Abyssal Mercy",
      }),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Admin audit log write failed",
      expect.objectContaining({
        action: "LEVEL_UPDATED",
        entityType: "Level",
        entityId: "level-1",
      }),
    );
    consoleSpy.mockRestore();
  });
});
