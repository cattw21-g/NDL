"use server";

import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GOOGLE_SETUP_COOKIE, readGoogleSignupToken } from "@/lib/google-signup";
import { markGoogleUsernameSetupComplete } from "@/lib/google-username-setup";
import { hashPassword } from "@/lib/password-hashing";
import { playerNameSchema } from "@/lib/validation";

function setupError(message: string): never {
  redirect(`/complete-google-signup?error=${encodeURIComponent(message)}`);
}

export async function completeGoogleSignupAction(formData: FormData) {
  const cookieStore = await cookies();
  const pending = readGoogleSignupToken(cookieStore.get(GOOGLE_SETUP_COOKIE)?.value);
  if (!pending) {
    redirect("/login?error=Google%20setup%20expired.%20Please%20sign%20in%20again.");
  }

  const parsed = playerNameSchema.safeParse(formData.get("playerName"));
  if (!parsed.success) {
    setupError("Choose a username of 2–32 letters, numbers, underscores, or dashes.");
  }

  const playerName = parsed.data;
  let user = await prisma.user.findUnique({ where: { email: pending.email } });
  if (pending.existingUserId && (!user || user.id !== pending.existingUserId)) {
    setupError("This account changed during setup. Please sign in with Google again.");
  }
  if (user && !pending.existingUserId) {
    setupError("This account already exists. Please sign in with Google again.");
  }

  if (user) {
    const taken = await prisma.user.findFirst({
      where: { playerName: { equals: playerName, mode: "insensitive" }, id: { not: user.id } },
      select: { id: true },
    });
    if (taken) setupError("That username is already taken. Please choose another.");

    try {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          playerName,
          displayName: user.displayName === user.playerName ? playerName : user.displayName,
          emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        },
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        setupError("That username is already taken. Please choose another.");
      }
      throw error;
    }
  } else {
    const taken = await prisma.user.findFirst({
      where: { playerName: { equals: playerName, mode: "insensitive" } },
      select: { id: true },
    });
    if (taken) setupError("That username is already taken. Please choose another.");

    try {
      user = await prisma.user.create({
        data: {
          email: pending.email,
          emailVerifiedAt: new Date(),
          playerName,
          displayName: playerName,
          passwordHash: await hashPassword(randomBytes(32).toString("hex")),
        },
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        setupError("That username or email is already in use. Please try signing in again or choose another username.");
      }
      throw error;
    }
  }

  await markGoogleUsernameSetupComplete(user.id);
  await createSession(user.id);
  cookieStore.delete(GOOGLE_SETUP_COOKIE);
  redirect(`/players/${user.playerName}`);
}
