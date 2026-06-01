import { describe, expect, it, vi } from "vitest";

import {
  createEmailVerification,
  resendVerificationForEmail,
  type EmailVerificationClient,
  verifyEmailCode,
} from "../lib/email-verification";
import { buildRegistrationCreateData } from "../lib/registration";

type FakeUser = {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
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

function looseArgs(args: unknown) {
  return args as {
    where?: Record<string, unknown>;
    data?: Record<string, unknown>;
  };
}

function createFakeVerificationClient(users: FakeUser[]) {
  const tokens: FakeToken[] = [];
  let tokenIndex = 0;

  const client = {
    emailVerificationToken: {
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
          id: `token-${++tokenIndex}`,
          usedAt: null,
          createdAt: new Date("2026-05-30T00:00:00.000Z"),
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
        return (
          users.find((user) => user.email === input.where?.email) ?? null
        );
      },
      update: async (args: unknown) => {
        const input = looseArgs(args);
        const user = users.find((item) => item.id === input.where?.id);

        if (!user) {
          throw new Error("Missing fake user.");
        }

        user.emailVerifiedAt = input.data?.emailVerifiedAt as Date;
        return user;
      },
    },
  };

  return {
    client: client as unknown as EmailVerificationClient,
    tokens,
  };
}

describe("email verification", () => {
  it("builds registration data as unverified and creates a verification token", async () => {
    const registration = await buildRegistrationCreateData(
      {
        email: "player@example.com",
        playerName: "player",
        displayName: "Player",
        password: "VeryLongPass123!",
      },
      async () => "hashed-password",
    );
    const user: FakeUser = {
      id: "user-1",
      email: registration.email,
      emailVerifiedAt: registration.emailVerifiedAt,
    };
    const { client, tokens } = createFakeVerificationClient([user]);

    const verification = await createEmailVerification(
      client,
      user,
      new Date("2026-05-30T00:00:00.000Z"),
      { APP_URL: "https://ndl.example", NEXT_PUBLIC_SITE_URL: "http://localhost:3000" },
    );

    expect(registration.emailVerifiedAt).toBeNull();
    expect(tokens).toHaveLength(1);
    expect(verification.verificationUrl).toContain(
      "https://ndl.example/verify-email/confirm",
    );
    expect(verification.code).toMatch(/^\d{6}$/);
    expect(verification.expiresAt.toISOString()).toBe(
      "2026-05-30T01:00:00.000Z",
    );
  });

  it("verifies a valid code and marks the token as used", async () => {
    const user: FakeUser = {
      id: "user-1",
      email: "player@example.com",
      emailVerifiedAt: null,
    };
    const { client, tokens } = createFakeVerificationClient([user]);
    const verification = await createEmailVerification(
      client,
      user,
      new Date("2026-05-30T00:00:00.000Z"),
    );

    const result = await verifyEmailCode(
      client,
      user.email,
      verification.code,
      new Date("2026-05-30T00:05:00.000Z"),
    );

    expect(result.status).toBe("verified");
    expect(user.emailVerifiedAt?.toISOString()).toBe(
      "2026-05-30T00:05:00.000Z",
    );
    expect(tokens[0].usedAt?.toISOString()).toBe(
      "2026-05-30T00:05:00.000Z",
    );
  });

  it("returns the same safe resend result for unknown emails without sending", async () => {
    const { client, tokens } = createFakeVerificationClient([]);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await resendVerificationForEmail(
      client,
      "missing@example.com",
      { NODE_ENV: "development" },
      new Date("2026-05-30T00:00:00.000Z"),
    );

    expect(result).toEqual({
      status: "sent",
      email: "missing@example.com",
    });
    expect(tokens).toHaveLength(0);
    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it("returns the same safe resend result for known unverified emails after sending", async () => {
    const user: FakeUser = {
      id: "user-1",
      email: "player@example.com",
      emailVerifiedAt: null,
    };
    const { client, tokens } = createFakeVerificationClient([user]);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await resendVerificationForEmail(
      client,
      user.email,
      { NODE_ENV: "development" },
      new Date("2026-05-30T00:00:00.000Z"),
    );

    expect(result).toEqual({
      status: "sent",
      email: user.email,
    });
    expect(tokens).toHaveLength(1);
    expect(logSpy).toHaveBeenCalledWith("NDL email verification link:");
    logSpy.mockRestore();
  });

  it("returns the same safe resend result for already verified emails without sending", async () => {
    const user: FakeUser = {
      id: "user-1",
      email: "player@example.com",
      emailVerifiedAt: new Date("2026-05-30T00:00:00.000Z"),
    };
    const { client, tokens } = createFakeVerificationClient([user]);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await resendVerificationForEmail(
      client,
      user.email,
      { NODE_ENV: "development" },
      new Date("2026-05-30T00:00:00.000Z"),
    );

    expect(result).toEqual({
      status: "sent",
      email: user.email,
    });
    expect(tokens).toHaveLength(0);
    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
