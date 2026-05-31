import { createHash, randomBytes, randomInt } from "node:crypto";

import type { PrismaClient } from "../generated/prisma/client";
import { sendVerificationEmail } from "./email";

export const EMAIL_VERIFICATION_EXPIRY_MINUTES = 60;

type VerificationUser = {
  id: string;
  email: string;
  emailVerifiedAt?: Date | null;
};

type VerificationRecord = {
  id: string;
  userId: string;
  email: string;
  expiresAt: Date;
  usedAt: Date | null;
  user: VerificationUser;
};

export type EmailVerificationClient = Pick<
  PrismaClient,
  "emailVerificationToken" | "user"
>;

export type VerificationCreateResult = {
  token: string;
  code: string;
  expiresAt: Date;
  verificationUrl: string;
};

type EnvMap = Record<string, string | undefined>;

export type VerifyEmailResult =
  | { status: "verified"; email: string }
  | { status: "invalid" | "expired" };

function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function createVerificationCode() {
  return randomInt(100000, 1000000).toString();
}

function buildVerificationUrl(
  token: string,
  env: EnvMap = process.env,
) {
  const baseUrl =
    env.APP_URL?.trim() ||
    env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "http://localhost:3000";
  const url = new URL("/verify-email/confirm", baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

export async function createEmailVerification(
  client: EmailVerificationClient,
  user: VerificationUser,
  now = new Date(),
  env: EnvMap = process.env,
): Promise<VerificationCreateResult> {
  const token = randomBytes(32).toString("hex");
  const code = createVerificationCode();
  const expiresAt = new Date(
    now.getTime() + EMAIL_VERIFICATION_EXPIRY_MINUTES * 60 * 1000,
  );

  await client.emailVerificationToken.updateMany({
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

  await client.emailVerificationToken.create({
    data: {
      userId: user.id,
      email: user.email.toLowerCase(),
      tokenHash: hashSecret(token),
      codeHash: hashSecret(code),
      expiresAt,
    },
  });

  return {
    token,
    code,
    expiresAt,
    verificationUrl: buildVerificationUrl(token, env),
  };
}

export async function sendVerificationForUser(
  client: EmailVerificationClient,
  user: VerificationUser,
  env: EnvMap = process.env,
  now = new Date(),
) {
  const verification = await createEmailVerification(client, user, now, env);
  const delivery = await sendVerificationEmail(
    {
      to: user.email,
      verificationUrl: verification.verificationUrl,
      code: verification.code,
      expiresAt: verification.expiresAt,
    },
    env,
  );

  return {
    ...verification,
    delivery,
  };
}

async function consumeVerificationRecord(
  client: EmailVerificationClient,
  record: VerificationRecord | null,
  now: Date,
): Promise<VerifyEmailResult> {
  if (!record || record.usedAt) {
    return { status: "invalid" };
  }

  if (record.expiresAt <= now) {
    return { status: "expired" };
  }

  const consumed = await client.emailVerificationToken.updateMany({
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

  const user = await client.user.update({
    where: {
      id: record.userId,
    },
    data: {
      emailVerifiedAt: now,
    },
  });

  return {
    status: "verified",
    email: user.email,
  };
}

export async function verifyEmailToken(
  client: EmailVerificationClient,
  token: string,
  now = new Date(),
) {
  const tokenHash = hashSecret(token.trim());
  const record = await client.emailVerificationToken.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: true,
    },
  });

  return consumeVerificationRecord(client, record, now);
}

export async function verifyEmailCode(
  client: EmailVerificationClient,
  email: string,
  code: string,
  now = new Date(),
) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.trim();

  if (!/^\d{6}$/.test(normalizedCode)) {
    return { status: "invalid" } satisfies VerifyEmailResult;
  }

  const record = await client.emailVerificationToken.findFirst({
    where: {
      email: normalizedEmail,
      codeHash: hashSecret(normalizedCode),
      usedAt: null,
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return consumeVerificationRecord(client, record, now);
}

export async function resendVerificationForEmail(
  client: EmailVerificationClient,
  email: string,
  env: EnvMap = process.env,
  now = new Date(),
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

  if (user.emailVerifiedAt) {
    return { status: "already-verified" as const, email: normalizedEmail };
  }

  await sendVerificationForUser(client, user, env, now);
  return { status: "sent" as const, email: normalizedEmail };
}
