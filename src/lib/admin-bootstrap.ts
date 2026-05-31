import { hash } from "bcryptjs";

import { Role, type PrismaClient } from "../generated/prisma/client";

const ADMIN_ENV_KEYS = [
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "ADMIN_HANDLE",
  "ADMIN_NAME",
  "NDL_ADMIN_EMAIL",
  "NDL_ADMIN_PASSWORD",
  "NDL_ADMIN_PLAYER_NAME",
  "NDL_ADMIN_DISPLAY_NAME",
] as const;

export type AdminBootstrapInput = {
  email: string;
  password: string;
  playerName: string;
  displayName: string;
};

export type AdminBootstrapClient = Pick<PrismaClient, "user">;

type EnvMap = Record<string, string | undefined>;

function envValue(env: EnvMap, ...names: string[]) {
  for (const name of names) {
    const value = env[name]?.trim();

    if (value) {
      return value;
    }
  }

  return undefined;
}

export function resolveAdminBootstrapInput(
  env: EnvMap = process.env,
) {
  const hasAdminEnv = ADMIN_ENV_KEYS.some((key) => Boolean(env[key]?.trim()));

  if (!hasAdminEnv) {
    return null;
  }

  const email = envValue(env, "ADMIN_EMAIL", "NDL_ADMIN_EMAIL")?.toLowerCase();
  const password = envValue(env, "ADMIN_PASSWORD", "NDL_ADMIN_PASSWORD");
  const adminName = envValue(env, "ADMIN_NAME", "NDL_ADMIN_DISPLAY_NAME");
  const playerName = envValue(env, "ADMIN_HANDLE", "NDL_ADMIN_PLAYER_NAME");
  const displayName = adminName ?? playerName ?? "NDL Admin";

  if (!email || !password || !playerName) {
    throw new Error(
      "ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_HANDLE are required when admin bootstrap environment variables are set.",
    );
  }

  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }

  if (!playerName || playerName.length < 2 || playerName.length > 32) {
    throw new Error("ADMIN_HANDLE must be between 2 and 32 characters.");
  }

  return {
    email,
    password,
    playerName,
    displayName,
  } satisfies AdminBootstrapInput;
}

export async function upsertAdminFromEnv(
  client: AdminBootstrapClient,
  env: EnvMap = process.env,
  verifiedAt = new Date(),
) {
  const input = resolveAdminBootstrapInput(env);

  if (!input) {
    return null;
  }

  const existingName = await client.user.findUnique({
    where: {
      playerName: input.playerName,
    },
  });

  if (existingName && existingName.email !== input.email) {
    throw new Error(
      `Player name ${input.playerName} is already used by another account.`,
    );
  }

  const passwordHash = await hash(input.password, 12);

  return client.user.upsert({
    where: {
      email: input.email,
    },
    update: {
      playerName: input.playerName,
      displayName: input.displayName,
      passwordHash,
      role: Role.ADMIN,
      emailVerifiedAt: verifiedAt,
    },
    create: {
      email: input.email,
      playerName: input.playerName,
      displayName: input.displayName,
      passwordHash,
      role: Role.ADMIN,
      emailVerifiedAt: verifiedAt,
    },
  });
}
