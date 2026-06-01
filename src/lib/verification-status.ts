export type VerificationStatusTone = "amber" | "cyan" | "emerald" | "red";

export type VerificationStatusMessage = {
  key: string;
  tone: VerificationStatusTone;
  message: string;
  cooldownMessage?: string;
  cooldownSeconds?: number;
  showLoginLink?: boolean;
  showRegisterLink?: boolean;
};

type SearchParams = Record<string, string | string[] | undefined>;
const verificationSentGuidance =
  "Check your email for a verification link and six-digit code. If you do not see it, check your spam or junk folder.";

const statusMessages: Record<string, VerificationStatusMessage> = {
  "registered-sent": {
    key: "registered-sent",
    tone: "cyan",
    message: `Account created. ${verificationSentGuidance}`,
  },
  "registered-email-failed": {
    key: "registered-email-failed",
    tone: "amber",
    message:
      "Account created, but NDL could not send the verification email. Use the resend button or contact staff.",
  },
  "verification-required": {
    key: "verification-required",
    tone: "amber",
    message: "Verification is required before you can log in or submit records.",
  },
  "verification-required-sent": {
    key: "verification-required-sent",
    tone: "amber",
    message: `Verification is required before you can log in. ${verificationSentGuidance}`,
  },
  "verification-required-email-failed": {
    key: "verification-required-email-failed",
    tone: "amber",
    message:
      "Verification is required before you can log in, but NDL could not send a new verification email. Use the resend button or contact staff.",
  },
  sent: {
    key: "sent",
    tone: "cyan",
    message:
      "If an account exists and still needs verification, we sent a verification email. If you do not see it, check your spam or junk folder. If you do not have an account,",
    cooldownMessage: "You can request another email in 80 seconds.",
    cooldownSeconds: 80,
    showRegisterLink: true,
  },
  "resend-email-failed": {
    key: "resend-email-failed",
    tone: "red",
    message:
      "NDL could not send the verification email. Try again later or contact staff.",
  },
  "resend-rate-limited": {
    key: "resend-rate-limited",
    tone: "amber",
    message: "Please wait 80 seconds before requesting another email.",
    cooldownSeconds: 80,
  },
  verified: {
    key: "verified",
    tone: "emerald",
    message: "Email verified successfully. You can now log in.",
    showLoginLink: true,
  },
  expired: {
    key: "expired",
    tone: "red",
    message: "That verification link or code has expired. Request a new one.",
  },
  invalid: {
    key: "invalid",
    tone: "red",
    message: "That verification link is invalid or has already been used.",
  },
  "invalid-code": {
    key: "invalid-code",
    tone: "red",
    message: "Enter the six digit code from your verification email.",
  },
  "invalid-email": {
    key: "invalid-email",
    tone: "red",
    message: "Enter a valid email address.",
  },
};

export function verificationStatusFromParams(
  params: SearchParams,
): VerificationStatusMessage | null {
  const status = stringParam(params.status);

  if (status && statusMessages[status]) {
    return statusMessages[status];
  }

  if (truthyParam(params.verified)) {
    return statusMessages.verified;
  }

  const error = stringParam(params.error);

  if (error === "email" && truthyParam(params.registered)) {
    return statusMessages["registered-email-failed"];
  }

  if (error && statusMessages[error]) {
    return statusMessages[error];
  }

  if (truthyParam(params.registered)) {
    return statusMessages["registered-sent"];
  }

  if (truthyParam(params.required)) {
    return truthyParam(params.sent)
      ? statusMessages["verification-required-sent"]
      : statusMessages["verification-required"];
  }

  if (truthyParam(params.sent)) {
    return statusMessages.sent;
  }

  return null;
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function truthyParam(value: string | string[] | undefined) {
  const param = stringParam(value);
  return param === "" || param === "1" || param === "true";
}
