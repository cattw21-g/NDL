"use server";

import { redirect } from "next/navigation";

import {
  createSession,
  destroyCurrentSession,
  verifyPassword,
} from "@/lib/auth";
import { isVerifiedAccount } from "@/lib/account-state";
import { prisma } from "@/lib/db";
import { sendVerificationForUser } from "@/lib/email-verification";
import {
  checkRateLimit,
  emailRateLimitKey,
} from "@/lib/rate-limit";
import { buildRegistrationCreateData } from "@/lib/registration";
import { formDataToObject, loginSchema, registerSchema } from "@/lib/validation";

function authError(path: "login" | "register", message: string): never {
  redirect(`/${path}?error=${encodeURIComponent(message)}`);
}

function verificationRedirect(
  email: string,
  params: Record<string, string | number | boolean> = {},
): never {
  const searchParams = new URLSearchParams({
    email,
  });

  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value));
  }

  redirect(`/verify-email?${searchParams.toString()}`);
}

async function sendVerificationOrRedirect(
  user: { id: string; email: string },
  params: Record<string, string | number | boolean>,
) {
  try {
    await sendVerificationForUser(prisma, user);
  } catch (error) {
    console.error("Failed to send verification email.", error);
    verificationRedirect(user.email, { ...params, error: "email" });
  }

  verificationRedirect(user.email, { ...params, sent: 1 });
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    authError("login", "Enter a valid email and password.");
  }

  const rateLimit = await checkRateLimit(
    prisma,
    "login",
    emailRateLimitKey(parsed.data.email),
  );

  if (!rateLimit.allowed) {
    authError("login", rateLimit.message);
  }

  const user = await prisma.user.findUnique({
    where: {
      email: parsed.data.email,
    },
  });

  if (!user) {
    authError("login", "No account was found for those credentials.");
  }

  const validPassword = await verifyPassword(
    parsed.data.password,
    user.passwordHash,
  );

  if (!validPassword) {
    authError("login", "No account was found for those credentials.");
  }

  if (!isVerifiedAccount(user)) {
    await sendVerificationOrRedirect(user, { required: 1 });
  }

  await createSession(user.id);
  redirect("/submissions");
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    authError("register", "Check the account fields and try again.");
  }

  const rateLimit = await checkRateLimit(
    prisma,
    "register",
    emailRateLimitKey(parsed.data.email),
  );

  if (!rateLimit.allowed) {
    authError("register", rateLimit.message);
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: parsed.data.email },
        { playerName: parsed.data.playerName },
      ],
    },
  });

  if (existing) {
    authError("register", "That email or player name is already in use.");
  }

  const user = await prisma.user.create({
    data: await buildRegistrationCreateData(parsed.data),
  });

  await sendVerificationOrRedirect(user, { registered: 1 });
}

export async function logoutAction() {
  await destroyCurrentSession();
  redirect("/");
}
