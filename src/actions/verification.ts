"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import {
  resendVerificationForEmail,
  verifyEmailCode,
} from "@/lib/email-verification";
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
    redirect(verificationPath({ error: "invalid-code" }));
  }

  const result = await verifyEmailCode(
    prisma,
    parsed.data.email,
    parsed.data.code,
  );

  if (result.status === "verified") {
    redirect(verificationPath({ email: result.email, verified: 1 }));
  }

  redirect(
    verificationPath({
      email: parsed.data.email,
      error: result.status,
    }),
  );
}

export async function resendVerificationAction(formData: FormData) {
  const parsed = resendVerificationSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect(verificationPath({ error: "invalid-email" }));
  }

  const result = await resendVerificationForEmail(
    prisma,
    parsed.data.email,
  ).catch((error) => {
      console.error("Failed to resend verification email.", error);
      return null;
    });

  if (!result) {
    redirect(verificationPath({ email: parsed.data.email, error: "email" }));
  }

  if (result.status === "already-verified") {
    redirect(verificationPath({ email: result.email, verified: 1 }));
  }

  redirect(verificationPath({ email: result.email, sent: 1 }));
}
