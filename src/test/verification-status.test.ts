import { describe, expect, it } from "vitest";

import { verificationStatusFromParams } from "../lib/verification-status";

describe("verification status messages", () => {
  it("shows one success message after successful registration", () => {
    const status = verificationStatusFromParams({
      status: "registered-sent",
    });

    expect(status).toMatchObject({
      tone: "cyan",
      message:
        "Account created. Check your email for a verification link and six-digit code. If you do not see it, check your spam or junk folder.",
    });
    expect(status?.message.match(/check your email/gi)).toHaveLength(1);
    expect(status?.message.match(/spam or junk/gi)).toHaveLength(1);
  });

  it("shows one warning when account creation succeeds but email sending fails", () => {
    const status = verificationStatusFromParams({
      status: "registered-email-failed",
    });

    expect(status).toMatchObject({
      tone: "amber",
      message:
        "Account created, but NDL could not send the verification email. Use the resend button or contact staff.",
    });
  });

  it("does not duplicate check-email banners for legacy mixed params", () => {
    const status = verificationStatusFromParams({
      registered: "1",
      sent: "1",
      error: "email",
    });

    expect(status?.key).toBe("registered-email-failed");
    expect(status?.message).not.toBe(
      "Account created. Check your email for a verification link and six-digit code. If you do not see it, check your spam or junk folder.",
    );
  });

  it("shows spam-folder guidance after resend success", () => {
    const status = verificationStatusFromParams({
      status: "sent",
    });

    expect(status).toMatchObject({
      tone: "cyan",
      message:
        "Verification sent. Check your email for a verification link and six-digit code. If you do not see it, check your spam or junk folder.",
    });
  });

  it("shows resend cooldown as a single warning state", () => {
    const status = verificationStatusFromParams({
      status: "resend-rate-limited",
    });

    expect(status).toMatchObject({
      tone: "amber",
      message: "Please wait 80 seconds before requesting another email.",
    });
  });
});
