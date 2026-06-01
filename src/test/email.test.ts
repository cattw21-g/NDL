import { describe, expect, it, vi } from "vitest";

import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  type TransportFactory,
} from "../lib/email";

const verificationEmail = {
  to: "player@example.com",
  verificationUrl: "https://ndl.example/verify-email/confirm?token=abc",
  code: "123456",
  expiresAt: new Date("2026-05-30T01:00:00.000Z"),
};

const passwordResetEmail = {
  to: "player@example.com",
  resetUrl: "https://ndl.example/reset-password?email=player%40example.com&token=abc",
  code: "654321",
  expiresAt: new Date("2026-05-30T00:15:00.000Z"),
};

describe("verification email delivery", () => {
  it("sends through configured SMTP transport", async () => {
    const sent: unknown[] = [];
    let transportOptions: unknown;
    const createTransport: TransportFactory = (options) => {
      transportOptions = options;
      return {
        sendMail: async (message) => {
          sent.push(message);
          return {
            messageId: "message-1",
          };
        },
      };
    };

    const delivery = await sendVerificationEmail(
      verificationEmail,
      {
        NODE_ENV: "production",
        SMTP_HOST: "smtp-relay.brevo.com",
        SMTP_PORT: "587",
        SMTP_USER: "smtp-user",
        SMTP_PASSWORD: "smtp-password",
        SMTP_FROM: "NDL <no-reply@example.com>",
        SMTP_REPLY_TO: "staff@example.com",
        SMTP_SECURE: "false",
        SMTP_DISABLE_TRACKING_HINT: "true",
      },
      {
        createTransport,
      },
    );

    expect(delivery).toBe("smtp");
    expect(transportOptions).toEqual({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: "smtp-user",
        pass: "smtp-password",
      },
    });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      from: "NDL <no-reply@example.com>",
      to: "player@example.com",
      replyTo: "staff@example.com",
      subject: "Verify your Nerfed Demonlist account",
      headers: {
        "X-Disable-Tracking": "true",
      },
    });
    const message = sent[0] as {
      text: string;
      html: string;
    };
    expect(message.text).toContain("Nerfed Demonlist");
    expect(message.text).toContain(verificationEmail.verificationUrl);
    expect(message.text).toContain(verificationEmail.code);
    expect(message.text).toContain("If you did not create this account");
    expect(message.html).toContain("<html>");
    expect(message.html).toContain("Verify account");
    expect(message.html).toContain(verificationEmail.code);
    expect(message.html.match(/https:\/\/ndl\.example/g)).toHaveLength(1);
  });

  it("logs verification link and code in development when SMTP is absent", async () => {
    const logger = {
      log: vi.fn(),
    };

    const delivery = await sendVerificationEmail(
      verificationEmail,
      {
        NODE_ENV: "development",
        SMTP_PORT: "587",
        SMTP_FROM: "NDL <no-reply@example.com>",
      },
      {
        logger,
      },
    );

    expect(delivery).toBe("console");
    expect(logger.log).toHaveBeenCalledWith("NDL email verification link:");
    expect(logger.log).toHaveBeenCalledWith(verificationEmail.verificationUrl);
    expect(logger.log).toHaveBeenCalledWith(
      `NDL email verification code: ${verificationEmail.code}`,
    );
  });

  it("returns a clear production error when SMTP is absent", async () => {
    await expect(
      sendVerificationEmail(verificationEmail, {
        NODE_ENV: "production",
      }),
    ).rejects.toThrow(
      "SMTP configuration is required in production to send verification email.",
    );
  });

  it("omits Reply-To when SMTP_REPLY_TO is not configured", async () => {
    let sent: unknown;
    const createTransport: TransportFactory = () => ({
      sendMail: async (message) => {
        sent = message;
        return {};
      },
    });

    await sendVerificationEmail(
      verificationEmail,
      {
        NODE_ENV: "production",
        SMTP_HOST: "smtp-relay.brevo.com",
        SMTP_PORT: "587",
        SMTP_FROM: "Nerfed Demonlist <noreply@nerfeddemonlist.net>",
        SMTP_SECURE: "false",
      },
      {
        createTransport,
      },
    );

    expect(sent).not.toHaveProperty("replyTo");
  });
});

describe("password reset email delivery", () => {
  it("sends a clean reset email with one APP_URL-based link and code", async () => {
    let sent: unknown;
    const createTransport: TransportFactory = () => ({
      sendMail: async (message) => {
        sent = message;
        return {};
      },
    });

    const delivery = await sendPasswordResetEmail(
      passwordResetEmail,
      {
        NODE_ENV: "production",
        SMTP_HOST: "smtp-relay.brevo.com",
        SMTP_PORT: "587",
        SMTP_FROM: "Nerfed Demonlist <noreply@nerfeddemonlist.net>",
        SMTP_SECURE: "false",
      },
      {
        createTransport,
      },
    );

    expect(delivery).toBe("smtp");
    expect(sent).toMatchObject({
      from: "Nerfed Demonlist <noreply@nerfeddemonlist.net>",
      to: "player@example.com",
      subject: "Reset your Nerfed Demonlist password",
    });

    const message = sent as {
      text: string;
      html: string;
    };

    expect(message.text).toContain(passwordResetEmail.resetUrl);
    expect(message.text).toContain(passwordResetEmail.code);
    expect(message.text).toContain("If you did not request this");
    expect(message.html).toContain("Reset password");
    expect(message.html).toContain(passwordResetEmail.code);
    expect(message.html.match(/https:\/\/ndl\.example/g)).toHaveLength(1);
  });

  it("logs reset link and code in development when SMTP is absent", async () => {
    const logger = {
      log: vi.fn(),
    };

    const delivery = await sendPasswordResetEmail(
      passwordResetEmail,
      {
        NODE_ENV: "development",
      },
      {
        logger,
      },
    );

    expect(delivery).toBe("console");
    expect(logger.log).toHaveBeenCalledWith("NDL password reset link:");
    expect(logger.log).toHaveBeenCalledWith(passwordResetEmail.resetUrl);
    expect(logger.log).toHaveBeenCalledWith(
      `NDL password reset code: ${passwordResetEmail.code}`,
    );
  });
});
