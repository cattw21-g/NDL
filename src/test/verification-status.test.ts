import { describe, expect, it } from "vitest";

import { verificationStatusFromParams } from "../lib/verification-status";

describe("verification status messages", () => {
  it("shows one success message after successful registration", () => {
    const status = verificationStatusFromParams({
      status: "registered-sent",
    });

    expect(status).toMatchObject({
      tone: "cyan",
      message: "Account created. Check your email for a verification link.",
    });
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
      "Account created. Check your email for a verification link.",
    );
  });

  it("shows resend cooldown as a single warning state", () => {
    const status = verificationStatusFromParams({
      status: "resend-rate-limited",
    });

    expect(status).toMatchObject({
      tone: "amber",
      message: "Wait a bit before requesting another verification email.",
    });
  });
});
