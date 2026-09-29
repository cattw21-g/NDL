import { randomBytes, createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Role } from "@/generated/prisma/enums";
import { isVerifiedAccount } from "@/lib/account-state";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password-hashing";
import { isAdminRole, isModeratorRole } from "@/lib/permissions";
import { requireSessionSecret, type EnvMap } from "@/lib/production-env";

const SESSION_DAYS = 30;
const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "ndl_session";

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

export async function isCurrentSessionRecent(maxAgeMs = 15 * 60 * 1000) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { createdAt: true, expiresAt: true },
  });
  const now = Date.now();
  return Boolean(
    session &&
    session.expiresAt.getTime() > now &&
    session.createdAt.getTime() <= now &&
    now - session.createdAt.getTime() <= maxAgeMs,
  );
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    try {
      await prisma.session.deleteMany({
        where: {
          tokenHash: hashToken(token),
        },
      });
    } catch (error) {
      console.warn("Could not delete session from database (database offline or quota exceeded):", error);
    }
  }

  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Revokes all active database sessions for a user (e.g. on password reset, account suspension, or role demotion).
 */
export async function revokeAllUserSessions(userId: string) {
  if (!userId) return;
  try {
    await prisma.session.deleteMany({
      where: {
        userId,
      },
    });
  } catch (error) {
    console.warn("Could not revoke all user sessions from database:", error);
  }
}

/**
 * Revokes all other sessions for a user, keeping only their current active session.
 */
export async function revokeOtherUserSessions(userId: string, currentToken?: string) {
  if (!userId) return;
  if (!currentToken) {
    await revokeAllUserSessions(userId);
    return;
  }
  const currentHash = hashToken(currentToken);
  try {
    await prisma.session.deleteMany({
      where: {
        userId,
        tokenHash: { not: currentHash },
      },
    });
  } catch (error) {
    console.warn("Could not revoke other user sessions from database:", error);
  }
}

async function getSessionUser({ includeUnverified = false } = {}) {
  try {
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
        try {
          await prisma.session.delete({ where: { id: session.id } });
        } catch {
          // Ignore cleanup error if database is offline or read-only
        }
      }
      return null;
    }

    if (!includeUnverified && !isVerifiedAccount(session.user)) {
      return null;
    }

    return session.user;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      ((error as { digest: string }).digest.startsWith("NEXT_") ||
        (error as { digest: string }).digest === "DYNAMIC_SERVER_USAGE")
    ) {
      throw error;
    }
    console.warn("Could not retrieve session user (database offline or quota exceeded):", error);
    return null;
  }
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

  if (!isAdminRole(user.role, user.playerName)) {
    redirect("/");
  }

  return user;
}

export { hashPassword, Role, verifyPassword };
