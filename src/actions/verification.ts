"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import {
  resendVerificationForEmail,
  verifyEmailCode,
} from "@/lib/email-verification";
import { EMAIL_RESEND_COOLDOWN_SECONDS } from "@/lib/email-cooldown";
import {
  checkRateLimit,
  emailRateLimitKey,
} from "@/lib/rate-limit";
import {
  formDataToObject,
  resendVerificationSchema,
  verifyEmailCodeSchema,
} from "@/lib/validation";

function verificationPath(
  params: Record<string, string | number | boolean | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  return `/verify-email?${searchParams.toString()}`;
}

export async function verifyEmailCodeAction(formData: FormData) {
  const parsed = verifyEmailCodeSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect(verificationPath({ status: "invalid-code" }));
  }

  const result = await verifyEmailCode(
    prisma,
    parsed.data.email,
    parsed.data.code,
  );

  if (result.status === "verified") {
    redirect(verificationPath({ email: result.email, status: "verified" }));
  }

  redirect(
    verificationPath({
      email: parsed.data.email,
      status: result.status,
    }),
  );
}

export async function resendVerificationAction(formData: FormData) {
  const parsed = resendVerificationSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect(verificationPath({ status: "invalid-email" }));
  }

  const rateLimit = await checkRateLimit(
    prisma,
    "verification-resend",
    emailRateLimitKey(parsed.data.email),
  );

  if (!rateLimit.allowed) {
    redirect(
      verificationPath({
        email: parsed.data.email,
        status: "resend-rate-limited",
        cooldown: rateLimit.retryAfterSeconds,
      }),
    );
  }

  const result = await resendVerificationForEmail(
    prisma,
    parsed.data.email,
  ).catch((error) => {
      logVerificationEmailError("verification_email_resend_failed", error, {
        email: parsed.data.email,
      });
      return null;
    });

  if (!result) {
    redirect(
      verificationPath({
        email: parsed.data.email,
        status: "resend-email-failed",
      }),
    );
  }

  redirect(
    verificationPath({
      email: result.email,
      status: "sent",
      cooldown: EMAIL_RESEND_COOLDOWN_SECONDS,
    }),
  );
}

function logVerificationEmailError(
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
