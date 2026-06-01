import { describe, expect, it } from "vitest";

import { verifyPassword } from "../lib/password-hashing";
import {
  createPasswordReset,
  hashPasswordResetSecret,
  type PasswordResetClient,
  requestPasswordResetForEmail,
  resetPasswordWithCode,
} from "../lib/password-reset";

type FakeUser = {
  id: string;
  email: string;
  passwordHash: string;
};

type FakeToken = {
  id: string;
  userId: string;
  email: string;
  tokenHash: string;
  codeHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

type FakeSession = {
  id: string;
  userId: string;
};

function looseArgs(args: unknown) {
  return args as {
    where?: Record<string, unknown>;
    data?: Record<string, unknown>;
    include?: Record<string, unknown>;
    orderBy?: Record<string, unknown>;
  };
}

function createFakePasswordResetClient(
  users: FakeUser[],
  sessions: FakeSession[] = [],
) {
  const tokens: FakeToken[] = [];
  let tokenIndex = 0;

  const client = {
    passwordResetToken: {
      updateMany: async (args: unknown) => {
        const input = looseArgs(args);
        let count = 0;

        for (const token of tokens) {
          const where = input.where ?? {};
          const expiresAt = where.expiresAt as { gt?: Date } | undefined;
          const matchesUser = !where.userId || token.userId === where.userId;
          const matchesId = !where.id || token.id === where.id;
          const matchesUsedAt =
            where.usedAt !== null || token.usedAt === null;
          const matchesExpiry =
            !expiresAt?.gt || token.expiresAt > expiresAt.gt;

          if (matchesUser && matchesId && matchesUsedAt && matchesExpiry) {
            token.usedAt = input.data?.usedAt as Date;
            count += 1;
          }
        }

        return { count };
      },
      create: async (args: unknown) => {
        const input = looseArgs(args);
        const data = input.data as Omit<FakeToken, "id" | "createdAt" | "usedAt">;
        const token = {
          ...data,
          id: `reset-token-${++tokenIndex}`,
          usedAt: null,
          createdAt: new Date("2026-06-01T00:00:00.000Z"),
        };
        tokens.push(token);
        return token;
      },
      findUnique: async (args: unknown) => {
        const input = looseArgs(args);
        const token = tokens.find(
          (item) => item.tokenHash === input.where?.tokenHash,
        );
        const user = users.find((item) => item.id === token?.userId);
        return token && user ? { ...token, user } : null;
      },
      findFirst: async (args: unknown) => {
        const input = looseArgs(args);
        const token = tokens.find(
          (item) =>
            item.email === input.where?.email &&
            item.codeHash === input.where?.codeHash &&
            item.usedAt === null,
        );
        const user = users.find((item) => item.id === token?.userId);
        return token && user ? { ...token, user } : null;
      },
    },
    user: {
      findUnique: async (args: unknown) => {
        const input = looseArgs(args);
        return users.find((user) => user.email === input.where?.email) ?? null;
      },
      update: async (args: unknown) => {
        const input = looseArgs(args);
        const user = users.find((item) => item.id === input.where?.id);

        if (!user) {
          throw new Error("Missing fake user.");
        }

        user.passwordHash = input.data?.passwordHash as string;
        return user;
      },
    },
    session: {
      deleteMany: async (args: unknown) => {
        const input = looseArgs(args);
        const before = sessions.length;

        for (let index = sessions.length - 1; index >= 0; index -= 1) {
          if (sessions[index].userId === input.where?.userId) {
            sessions.splice(index, 1);
          }
        }

        return { count: before - sessions.length };
      },
    },
  };

  return {
    client: client as unknown as PasswordResetClient,
    tokens,
    sessions,
  };
}

describe("password reset", () => {
  it("creates a hashed reset token and code with an APP_URL link", async () => {
    const user: FakeUser = {
      id: "user-1",
      email: "player@example.com",
      passwordHash: "old-hash",
    };
    const { client, tokens } = createFakePasswordResetClient([user]);

    const reset = await createPasswordReset(
      client,
      user,
      new Date("2026-06-01T00:00:00.000Z"),
      { APP_URL: "https://nerfeddemonlist.net" },
    );

    expect(tokens).toHaveLength(1);
    expect(tokens[0].tokenHash).not.toBe(reset.token);
    expect(tokens[0].tokenHash).toBe(hashPasswordResetSecret(reset.token));
    expect(tokens[0].codeHash).not.toBe(reset.code);
    expect(tokens[0].codeHash).toBe(hashPasswordResetSecret(reset.code));
    expect(reset.code).toMatch(/^\d{6}$/);
    expect(reset.resetUrl).toContain("https://nerfeddemonlist.net/reset-password");
    expect(reset.resetUrl).toContain("token=");
    expect(reset.expiresAt.toISOString()).toBe("2026-06-01T00:15:00.000Z");
  });

  it("does not reveal missing accounts during reset requests", async () => {
    const { client, tokens } = createFakePasswordResetClient([]);
    let sendCount = 0;

    const result = await requestPasswordResetForEmail(
      client,
      "missing@example.com",
      {},
      new Date("2026-06-01T00:00:00.000Z"),
      async () => {
        sendCount += 1;
        return "smtp" as const;
      },
    );

    expect(result.status).toBe("sent");
    expect(tokens).toHaveLength(0);
    expect(sendCount).toBe(0);
  });

  it("rejects a wrong reset code", async () => {
    const user: FakeUser = {
      id: "user-1",
      email: "player@example.com",
      passwordHash: "old-hash",
    };
    const { client } = createFakePasswordResetClient([user]);
    const reset = await createPasswordReset(
      client,
      user,
      new Date("2026-06-01T00:00:00.000Z"),
    );

    const result = await resetPasswordWithCode(
      client,
      {
        email: user.email,
        token: reset.token,
        code: "000000",
        password: "NewLongPass123!",
      },
      new Date("2026-06-01T00:05:00.000Z"),
      async () => "new-hash",
    );

    expect(result.status).toBe("invalid");
    expect(user.passwordHash).toBe("old-hash");
  });

  it("rejects an expired reset code", async () => {
    const user: FakeUser = {
      id: "user-1",
      email: "player@example.com",
      passwordHash: "old-hash",
    };
    const { client } = createFakePasswordResetClient([user]);
    const reset = await createPasswordReset(
      client,
      user,
      new Date("2026-06-01T00:00:00.000Z"),
    );

    const result = await resetPasswordWithCode(
      client,
      {
        email: user.email,
        token: reset.token,
        code: reset.code,
        password: "NewLongPass123!",
      },
      new Date("2026-06-01T00:16:00.000Z"),
      async () => "new-hash",
    );

    expect(result.status).toBe("expired");
    expect(user.passwordHash).toBe("old-hash");
  });

  it("resets the password once and invalidates active sessions", async () => {
    const user: FakeUser = {
      id: "user-1",
      email: "player@example.com",
      passwordHash: "old-hash",
    };
    const sessions = [
      { id: "session-1", userId: user.id },
      { id: "session-2", userId: user.id },
    ];
    const { client, tokens } = createFakePasswordResetClient([user], sessions);
    const reset = await createPasswordReset(
      client,
      user,
      new Date("2026-06-01T00:00:00.000Z"),
    );

    const result = await resetPasswordWithCode(
      client,
      {
        email: user.email,
        token: reset.token,
        code: reset.code,
        password: "NewLongPass123!",
      },
      new Date("2026-06-01T00:05:00.000Z"),
    );
    const secondResult = await resetPasswordWithCode(
      client,
      {
        email: user.email,
        token: reset.token,
        code: reset.code,
        password: "AnotherLongPass123!",
      },
      new Date("2026-06-01T00:06:00.000Z"),
    );

    expect(result.status).toBe("reset");
    expect(secondResult.status).toBe("invalid");
    expect(tokens[0].usedAt?.toISOString()).toBe("2026-06-01T00:05:00.000Z");
    expect(sessions).toHaveLength(0);
    await expect(verifyPassword("OldLongPass123!", user.passwordHash)).resolves.toBe(
      false,
    );
    await expect(verifyPassword("NewLongPass123!", user.passwordHash)).resolves.toBe(
      true,
    );
  });
});
