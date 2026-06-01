"use server";

import { prisma } from "@/lib/db";
import {
  createForgotPasswordErrorState,
  createForgotPasswordSuccessState,
  createResetPasswordErrorState,
  createResetPasswordSuccessState,
  type ForgotPasswordFormState,
  type ResetPasswordFormState,
  validateForgotPasswordFormSubmission,
  validateResetPasswordFormSubmission,
} from "@/lib/password-reset-form-state";
import {
  requestPasswordResetForEmail,
  resetPasswordWithCode,
} from "@/lib/password-reset";
import {
  checkRateLimit,
  emailRateLimitKey,
} from "@/lib/rate-limit";

export async function requestPasswordResetAction(
  _previousState: ForgotPasswordFormState,
  formData: FormData,
): Promise<ForgotPasswordFormState> {
  const parsed = validateForgotPasswordFormSubmission(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  const rateLimit = await checkRateLimit(
    prisma,
    "password-reset-request",
    emailRateLimitKey(parsed.data.email),
  );

  if (!rateLimit.allowed) {
    return createForgotPasswordErrorState(parsed.values, {
      formErrors: [rateLimit.message],
    });
  }

  await requestPasswordResetForEmail(prisma, parsed.data.email).catch((error) => {
    logPasswordResetError("password_reset_email_send_failed", error, {
      email: parsed.data.email,
    });
    return null;
  });

  return createForgotPasswordSuccessState(parsed.values);
}

export async function resetPasswordAction(
  _previousState: ResetPasswordFormState,
  formData: FormData,
): Promise<ResetPasswordFormState> {
  const parsed = validateResetPasswordFormSubmission(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  const rateLimit = await checkRateLimit(
    prisma,
    "password-reset-attempt",
    emailRateLimitKey(parsed.data.email),
  );

  if (!rateLimit.allowed) {
    return createResetPasswordErrorState(parsed.values, {
      formErrors: [rateLimit.message],
    });
  }

  const result = await resetPasswordWithCode(prisma, {
    email: parsed.data.email,
    code: parsed.data.code,
    password: parsed.data.password,
    token: parsed.data.token,
  }).catch((error) => {
    logPasswordResetError("password_reset_failed", error, {
      email: parsed.data.email,
    });
    return null;
  });

  if (!result) {
    return createResetPasswordErrorState(parsed.values, {
      formErrors: [
        "NDL could not reset the password. Try again later or contact staff.",
      ],
    });
  }

  if (result.status === "reset") {
    return createResetPasswordSuccessState({
      email: result.email,
    });
  }

  return createResetPasswordErrorState(parsed.values, {
    formErrors: [
      result.status === "expired"
        ? "That reset code has expired. Request a new one."
        : "That reset code is invalid or has already been used.",
    ],
  });
}

function logPasswordResetError(
  event: string,
  error: unknown,
  context: {
    email: string;
  },
) {
  const emailDomain = context.email.split("@")[1] ?? "unknown";
  console.error(event, {
    event,
    emailDomain,
    errorName: error instanceof Error ? error.name : typeof error,
    errorMessage: error instanceof Error ? error.message : String(error),
  });
}
