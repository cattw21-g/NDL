import { createHash, randomBytes, randomInt } from "node:crypto";

import type { PrismaClient } from "../generated/prisma/client";
import { sendPasswordResetEmail } from "./email";
import { hashPassword } from "./password-hashing";

export const PASSWORD_RESET_EXPIRY_MINUTES = 15;

type EnvMap = Record<string, string | undefined>;

type PasswordResetUser = {
  id: string;
  email: string;
};

type PasswordResetRecord = {
  id: string;
  userId: string;
  email: string;
  codeHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  user: PasswordResetUser;
};

export type PasswordResetClient = Pick<
  PrismaClient,
  "passwordResetToken" | "user" | "session"
>;

export type PasswordResetCreateResult = {
  token: string;
  code: string;
  expiresAt: Date;
  resetUrl: string;
};

export type PasswordResetResult =
  | { status: "reset"; email: string }
  | { status: "invalid" | "expired" };

type PasswordResetSender = typeof sendPasswordResetEmail;

export function hashPasswordResetSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function buildPasswordResetUrl(
  token: string,
  email: string,
  env: EnvMap = process.env,
) {
  const baseUrl =
    env.APP_URL?.trim() ||
    env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "http://localhost:3000";
  const url = new URL("/reset-password", baseUrl);
  url.searchParams.set("email", email);
  url.searchParams.set("token", token);
  return url.toString();
}

export async function createPasswordReset(
  client: PasswordResetClient,
  user: PasswordResetUser,
  now = new Date(),
  env: EnvMap = process.env,
): Promise<PasswordResetCreateResult> {
  const token = randomBytes(32).toString("hex");
  const code = randomInt(100000, 1000000).toString();
  const expiresAt = new Date(
    now.getTime() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000,
  );
  const email = user.email.toLowerCase();

  await client.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: {
        gt: now,
      },
    },
    data: {
      usedAt: now,
    },
  });

  await client.passwordResetToken.create({
    data: {
      userId: user.id,
      email,
      tokenHash: hashPasswordResetSecret(token),
      codeHash: hashPasswordResetSecret(code),
      expiresAt,
    },
  });

  return {
    token,
    code,
    expiresAt,
    resetUrl: buildPasswordResetUrl(token, email, env),
  };
}

export async function requestPasswordResetForEmail(
  client: PasswordResetClient,
  email: string,
  env: EnvMap = process.env,
  now = new Date(),
  sendEmail: PasswordResetSender = sendPasswordResetEmail,
) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await client.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (!user) {
    return { status: "sent" as const, email: normalizedEmail };
  }

  const reset = await createPasswordReset(client, user, now, env);
  const delivery = await sendEmail(
    {
      to: user.email,
      resetUrl: reset.resetUrl,
      code: reset.code,
      expiresAt: reset.expiresAt,
    },
    env,
  );

  return {
    status: "sent" as const,
    email: normalizedEmail,
    delivery,
  };
}

export async function resetPasswordWithCode(
  client: PasswordResetClient,
  input: {
    email: string;
    code: string;
    password: string;
    token?: string;
  },
  now = new Date(),
  passwordHasher: (password: string) => Promise<string> = hashPassword,
): Promise<PasswordResetResult> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedCode = input.code.trim();

  if (!/^\d{6}$/.test(normalizedCode)) {
    return { status: "invalid" };
  }

  const codeHash = hashPasswordResetSecret(normalizedCode);
  const record = await findResetRecord(client, {
    email: normalizedEmail,
    codeHash,
    token: input.token,
  });

  if (!record || record.usedAt || record.email !== normalizedEmail) {
    return { status: "invalid" };
  }

  if (record.codeHash !== codeHash) {
    return { status: "invalid" };
  }

  if (record.expiresAt <= now) {
    return { status: "expired" };
  }

  const consumed = await client.passwordResetToken.updateMany({
    where: {
      id: record.id,
      usedAt: null,
      expiresAt: {
        gt: now,
      },
    },
    data: {
      usedAt: now,
    },
  });

  if (consumed.count !== 1) {
    return { status: "invalid" };
  }

  await client.user.update({
    where: {
      id: record.userId,
    },
    data: {
      passwordHash: await passwordHasher(input.password),
    },
  });

  await client.passwordResetToken.updateMany({
    where: {
      userId: record.userId,
      usedAt: null,
    },
    data: {
      usedAt: now,
    },
  });

  await client.session.deleteMany({
    where: {
      userId: record.userId,
    },
  });

  return {
    status: "reset",
    email: record.user.email,
  };
}

async function findResetRecord(
  client: PasswordResetClient,
  input: {
    email: string;
    codeHash: string;
    token?: string;
  },
): Promise<PasswordResetRecord | null> {
  const token = input.token?.trim();

  if (token) {
    const record = await client.passwordResetToken.findUnique({
      where: {
        tokenHash: hashPasswordResetSecret(token),
      },
      include: {
        user: true,
      },
    });

    return record as PasswordResetRecord | null;
  }

  const record = await client.passwordResetToken.findFirst({
    where: {
      email: input.email,
      codeHash: input.codeHash,
      usedAt: null,
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return record as PasswordResetRecord | null;
}
