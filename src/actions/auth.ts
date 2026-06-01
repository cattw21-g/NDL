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
import {
  createRegisterFormErrorState,
  type RegisterFormState,
  validateRegisterFormSubmission,
} from "@/lib/register-form-state";
import { buildRegistrationCreateData } from "@/lib/registration";
import { formDataToObject, loginSchema } from "@/lib/validation";

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
): Promise<never> {
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

export async function registerAction(
  _previousState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const parsed = validateRegisterFormSubmission(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  const rateLimit = await checkRateLimit(
    prisma,
    "register",
    emailRateLimitKey(parsed.data.email),
  );

  if (!rateLimit.allowed) {
    return createRegisterFormErrorState(parsed.values, {
      formErrors: [rateLimit.message],
    });
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
    return createRegisterFormErrorState(parsed.values, {
      formErrors: ["That email or handle is already in use."],
    });
  }

  const user = await prisma.user.create({
    data: await buildRegistrationCreateData({
      email: parsed.data.email,
      playerName: parsed.data.playerName,
      displayName: parsed.data.playerName,
      password: parsed.data.password,
    }),
  });

  return sendVerificationOrRedirect(user, { registered: 1 });
}

export async function logoutAction() {
  await destroyCurrentSession();
  redirect("/");
}
