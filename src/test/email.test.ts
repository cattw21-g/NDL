import { describe, expect, it, vi } from "vitest";

import {
  sendVerificationEmail,
  type TransportFactory,
} from "../lib/email";

const verificationEmail = {
  to: "player@example.com",
  verificationUrl: "https://ndl.example/verify-email/confirm?token=abc",
  code: "123456",
  expiresAt: new Date("2026-05-30T01:00:00.000Z"),
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
        SMTP_SECURE: "false",
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
      subject: "Verify your NDL account",
    });
    expect(JSON.stringify(sent[0])).toContain(verificationEmail.verificationUrl);
    expect(JSON.stringify(sent[0])).toContain(verificationEmail.code);
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
});
