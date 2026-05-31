import { compare } from "bcryptjs";
import { describe, expect, it } from "vitest";

import { Role, type PrismaClient } from "../generated/prisma/client";
import {
  resolveAdminBootstrapInput,
  upsertAdminFromEnv,
} from "../lib/admin-bootstrap";

type FakeUser = {
  email: string;
  playerName: string;
  displayName: string;
  passwordHash: string;
  role: Role;
  emailVerifiedAt: Date | null;
};

function looseArgs(args: unknown) {
  return args as {
    where: Record<string, string>;
    update: FakeUser;
    create: FakeUser;
  };
}

function createFakeAdminClient() {
  const users: FakeUser[] = [];
  const client = {
    user: {
      findUnique: async (args: unknown) => {
        const input = looseArgs(args);
        return (
          users.find((user) => user.playerName === input.where.playerName) ??
          users.find((user) => user.email === input.where.email) ??
          null
        );
      },
      upsert: async (args: unknown) => {
        const input = looseArgs(args);
        const existing = users.find(
          (user) => user.email === input.where.email,
        );

        if (existing) {
          Object.assign(existing, input.update);
          return existing;
        }

        users.push(input.create);
        return input.create;
      },
    },
  };

  return {
    client: client as unknown as Pick<PrismaClient, "user">,
    users,
  };
}

describe("admin bootstrap", () => {
  it("creates a verified admin from ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_HANDLE", async () => {
    const verifiedAt = new Date("2026-05-30T00:00:00.000Z");
    const { client, users } = createFakeAdminClient();
    const admin = await upsertAdminFromEnv(
      client,
      {
        ADMIN_EMAIL: "admin@example.com",
        ADMIN_PASSWORD: "StrongAdminPass123!",
        ADMIN_HANDLE: "ndl_admin",
        ADMIN_NAME: "NDL Admin",
      },
      verifiedAt,
    );

    expect(admin?.role).toBe(Role.ADMIN);
    expect(admin?.email).toBe("admin@example.com");
    expect(admin?.playerName).toBe("ndl_admin");
    expect(users[0].emailVerifiedAt).toBe(verifiedAt);
    expect(users[0].passwordHash).not.toBe("StrongAdminPass123!");
    await expect(
      compare("StrongAdminPass123!", users[0].passwordHash),
    ).resolves.toBe(true);
  });

  it("requires an explicit admin handle when admin env is present", () => {
    expect(() =>
      resolveAdminBootstrapInput({
        ADMIN_EMAIL: "admin@example.com",
        ADMIN_PASSWORD: "StrongAdminPass123!",
      }),
    ).toThrow("ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_HANDLE are required");
  });
});
