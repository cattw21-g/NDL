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
import { isBotSubmission } from "@/lib/honeypot";
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
    authError("login", "Enter your email or username and password.");
  }

  try {
    const identifier = parsed.data.identifier;
    const rateLimit = await checkRateLimit(
      prisma,
      "login",
      emailRateLimitKey(identifier),
    );

    if (!rateLimit.allowed) {
      authError("login", rateLimit.message);
    }

    const user = identifier.includes("@")
      ? await prisma.user.findUnique({
          where: { email: identifier.toLowerCase() },
        })
      : (await prisma.user.findUnique({
          where: { playerName: identifier },
        })) ??
        (await prisma.user.findFirst({
          where: { playerName: { equals: identifier, mode: "insensitive" } },
        }));

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
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_")
    ) {
      throw error;
    }
    console.error("Login action encountered an error:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("quota") ||
      message.includes("53000") ||
      message.includes("connect") ||
      message.includes("timeout") ||
      message.includes("ECONNREFUSED")
    ) {
      authError(
        "login",
        "The database is temporarily offline or undergoing maintenance. Please try again soon.",
      );
    }
    authError("login", "Unable to log in at this time. Please try again.");
  }

  redirect("/submissions");
}

export async function registerAction(
  _previousState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  // Anti-Bot Honeypot Defense: Silently absorb automated spam
  if (isBotSubmission(formData)) {
    return {
      ok: true,
      summary: "Registration received.",
      formErrors: [],
      fieldErrors: {},
      values: _previousState.values,
    };
  }

  const parsed = validateRegisterFormSubmission(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  try {
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
        countryCode: parsed.data.countryCode,
      }),
    });

    return sendVerificationOrRedirect(user, {
      success: "registered-sent",
      failure: "registered-email-failed",
    });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_")
    ) {
      throw error;
    }
    console.error("Register action encountered an error:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("quota") ||
      message.includes("53000") ||
      message.includes("connect") ||
      message.includes("timeout") ||
      message.includes("ECONNREFUSED")
    ) {
      return createRegisterFormErrorState(parsed.values, {
        formErrors: [
          "The database is temporarily offline or undergoing maintenance. Please try again soon.",
        ],
      });
    }
    return createRegisterFormErrorState(parsed.values, {
      formErrors: ["Unable to complete registration at this time. Please try again."],
    });
  }
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
