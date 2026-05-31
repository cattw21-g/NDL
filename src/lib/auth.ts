import { compare, hash } from "bcryptjs";
import { randomBytes, createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Role } from "@/generated/prisma/enums";
import { isVerifiedAccount } from "@/lib/account-state";
import { prisma } from "@/lib/db";
import { isAdminRole, isModeratorRole } from "@/lib/permissions";
import { requireSessionSecret, type EnvMap } from "@/lib/production-env";

const SESSION_DAYS = 30;
const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "ndl_session";

export async function hashPassword(password: string) {
  return hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export function hashSessionToken(token: string, env: EnvMap = process.env) {
  return createHmac("sha256", requireSessionSecret(env))
    .update(token)
    .digest("hex");
}

function hashToken(token: string) {
  return hashSessionToken(token);
}

export async function createSession(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      emailVerifiedAt: true,
    },
  });

  if (!user || !isVerifiedAccount(user)) {
    throw new Error("Email verification is required before creating a session.");
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: {
        tokenHash: hashToken(token),
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

async function getSessionUser({ includeUnverified = false } = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashToken(token),
    },
    include: {
      user: true,
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  if (!includeUnverified && !isVerifiedAccount(session.user)) {
    return null;
  }

  return session.user;
}

export async function getCurrentUser() {
  return getSessionUser();
}

export async function requireUser() {
  const user = await getSessionUser({ includeUnverified: true });

  if (!user) {
    redirect("/login");
  }

  if (!isVerifiedAccount(user)) {
    await destroyCurrentSession();
    redirect(`/verify-email?email=${encodeURIComponent(user.email)}&required=1`);
  }

  return user;
}

export async function requireModerator() {
  const user = await requireUser();

  if (!isModeratorRole(user.role)) {
    redirect("/");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (!isAdminRole(user.role)) {
    redirect("/");
  }

  return user;
}

export { Role };
