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
  status: {
    success: string;
    failure: string;
  },
): Promise<never> {
  try {
    await sendVerificationForUser(prisma, user);
  } catch (error) {
    logVerificationEmailError("verification_email_send_failed", error, {
      userId: user.id,
      email: user.email,
    });
    verificationRedirect(user.email, { status: status.failure });
  }

  verificationRedirect(user.email, { status: status.success });
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
    await sendVerificationOrRedirect(user, {
      success: "verification-required-sent",
      failure: "verification-required-email-failed",
    });
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
      formErrors: ["That email or username is already in use."],
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

  return sendVerificationOrRedirect(user, {
    success: "registered-sent",
    failure: "registered-email-failed",
  });
}

export async function logoutAction() {
  await destroyCurrentSession();
  redirect("/");
}

function logVerificationEmailError(
  event: string,
  error: unknown,
  context: {
    userId?: string;
    email: string;
  },
) {
  const emailDomain = context.email.split("@")[1] ?? "unknown";
  console.error(event, {
    event,
    userId: context.userId,
    emailDomain,
    errorName: error instanceof Error ? error.name : typeof error,
    errorMessage: error instanceof Error ? error.message : String(error),
  });
}
