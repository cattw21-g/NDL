import nodemailer from "nodemailer";

export type VerificationEmail = {
  to: string;
  verificationUrl: string;
  code: string;
  expiresAt: Date;
};

export type PasswordResetEmail = {
  to: string;
  resetUrl: string;
  code: string;
  expiresAt: Date;
};

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  from: string;
  replyTo?: string;
  disableTrackingHint: boolean;
  auth?: {
    user: string;
    pass: string;
  };
};

type EnvMap = Record<string, string | undefined>;
type SmtpTransportConfig = Pick<SmtpConfig, "host" | "port" | "secure" | "auth">;
export type TransportFactory = (options: SmtpTransportConfig) => {
  sendMail: (message: TransactionalMailMessage) => Promise<unknown>;
};
type Logger = Pick<Console, "log">;

export type TransactionalMailMessage = {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
  headers?: Record<string, string>;
};
export type VerificationMailMessage = TransactionalMailMessage;

function readSmtpConfig(env: EnvMap): SmtpConfig | null {
  const host = env.SMTP_HOST?.trim();
  const portValue = env.SMTP_PORT?.trim();
  const from = env.SMTP_FROM?.trim();
  const replyTo = env.SMTP_REPLY_TO?.trim();
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASSWORD?.trim();
  const secure = env.SMTP_SECURE === "true";
  const disableTrackingHint = env.SMTP_DISABLE_TRACKING_HINT === "true";

  if (!host && !user && !pass) {
    return null;
  }

  if (!host || !portValue || !from) {
    throw new Error("SMTP_HOST, SMTP_PORT, and SMTP_FROM are required together.");
  }

  if ((user && !pass) || (!user && pass)) {
    throw new Error("SMTP_USER and SMTP_PASSWORD must be provided together.");
  }

  const port = Number(portValue);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("SMTP_PORT must be a positive integer.");
  }

  return {
    host,
    port,
    secure,
    from,
    replyTo: replyTo || undefined,
    disableTrackingHint,
    auth: user && pass ? { user, pass } : undefined,
  };
}

export async function sendVerificationEmail(
  email: VerificationEmail,
  env: EnvMap = process.env,
  options: {
    createTransport?: TransportFactory;
    logger?: Logger;
  } = {},
) {
  const config = readSmtpConfig(env);
  const logger = options.logger ?? console;

  if (!config) {
    if (env.NODE_ENV === "production") {
      throw new Error(
        "SMTP configuration is required in production to send verification email.",
      );
    }

    logger.log("NDL email verification link:");
    logger.log(email.verificationUrl);
    logger.log(`NDL email verification code: ${email.code}`);
    logger.log(`Verification expires at: ${email.expiresAt.toISOString()}`);
    return "console" as const;
  }

  const message: Omit<TransactionalMailMessage, "from"> = {
    to: email.to,
    subject: "Verify your Nerfed Demonlist account",
    text: verificationEmailText(email),
    html: verificationEmailHtml(email, env),
  };

  await sendViaSmtp(config, message, options.createTransport);

  return "smtp" as const;
}

export async function sendPasswordResetEmail(
  email: PasswordResetEmail,
  env: EnvMap = process.env,
  options: {
    createTransport?: TransportFactory;
    logger?: Logger;
  } = {},
) {
  const config = readSmtpConfig(env);
  const logger = options.logger ?? console;

  if (!config) {
    if (env.NODE_ENV === "production") {
      throw new Error(
        "SMTP configuration is required in production to send password reset email.",
      );
    }

    logger.log("NDL password reset link:");
    logger.log(email.resetUrl);
    logger.log(`NDL password reset code: ${email.code}`);
    logger.log(`Password reset expires at: ${email.expiresAt.toISOString()}`);
    return "console" as const;
  }

  const message: Omit<TransactionalMailMessage, "from"> = {
    to: email.to,
    subject: "Reset your Nerfed Demonlist password",
    text: passwordResetEmailText(email),
    html: passwordResetEmailHtml(email, env),
  };

  await sendViaSmtp(config, message, options.createTransport);

  return "smtp" as const;
}

export function verificationEmailText(email: VerificationEmail) {
  return [
    "Nerfed Demonlist",
    "",
    "Verify your account to submit records and manage your NDL activity.",
    "",
    `Verify your account: ${email.verificationUrl}`,
    "",
    `Fallback code: ${email.code}`,
    `This code expires at ${formatExpiry(email.expiresAt)}.`,
    "",
    "If you did not create this account, ignore this email.",
  ].join("\n");
}

export function verificationEmailHtml(
  email: VerificationEmail,
  env: EnvMap = process.env,
) {
  const url = escapeHtml(email.verificationUrl);
  const code = escapeHtml(email.code);
  const expiry = escapeHtml(formatExpiry(email.expiresAt));
  const logo = emailLogoHtml(env);

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      ${logo}
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;color:#0f172a;">Nerfed Demonlist</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">Verify your account to submit records and manage your NDL activity.</p>
      <p style="margin:0 0 24px;">
        <a href="${url}" style="display:inline-block;border-radius:6px;background:#0e7490;color:#ffffff;font-size:14px;font-weight:700;line-height:1;text-decoration:none;padding:12px 16px;">Verify account</a>
      </p>
      <p style="margin:0 0 8px;font-size:14px;line-height:1.6;">Fallback code:</p>
      <p style="margin:0 0 20px;font-size:24px;font-weight:800;letter-spacing:4px;color:#0f172a;">${code}</p>
      <p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#475569;">This code expires at ${expiry}.</p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#475569;">If you did not create this account, ignore this email.</p>
    </div>
  </body>
</html>`;
}

export function passwordResetEmailText(email: PasswordResetEmail) {
  return [
    "Nerfed Demonlist",
    "",
    "Use this password reset link and code to choose a new password for your NDL account.",
    "",
    `Reset your password: ${email.resetUrl}`,
    "",
    `Fallback code: ${email.code}`,
    `This code expires at ${formatExpiry(email.expiresAt)}.`,
    "",
    "If you did not request this, ignore this email.",
  ].join("\n");
}

export function passwordResetEmailHtml(
  email: PasswordResetEmail,
  env: EnvMap = process.env,
) {
  const url = escapeHtml(email.resetUrl);
  const code = escapeHtml(email.code);
  const expiry = escapeHtml(formatExpiry(email.expiresAt));
  const logo = emailLogoHtml(env);

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      ${logo}
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;color:#0f172a;">Nerfed Demonlist</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">Use this password reset link and code to choose a new password for your NDL account.</p>
      <p style="margin:0 0 24px;">
        <a href="${url}" style="display:inline-block;border-radius:6px;background:#0e7490;color:#ffffff;font-size:14px;font-weight:700;line-height:1;text-decoration:none;padding:12px 16px;">Reset password</a>
      </p>
      <p style="margin:0 0 8px;font-size:14px;line-height:1.6;">Fallback code:</p>
      <p style="margin:0 0 20px;font-size:24px;font-weight:800;letter-spacing:4px;color:#0f172a;">${code}</p>
      <p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#475569;">This code expires at ${expiry}.</p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#475569;">If you did not request this, ignore this email.</p>
    </div>
  </body>
</html>`;
}

async function sendViaSmtp(
  config: SmtpConfig,
  message: Omit<TransactionalMailMessage, "from">,
  createTransport?: TransportFactory,
) {
  const transportFactory: TransportFactory =
    createTransport ??
    ((transportOptions) => nodemailer.createTransport(transportOptions));
  const transporter = transportFactory({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  const mailMessage: TransactionalMailMessage = {
    from: config.from,
    ...message,
  };

  if (config.replyTo) {
    mailMessage.replyTo = config.replyTo;
  }

  if (config.disableTrackingHint) {
    mailMessage.headers = {
      "X-Disable-Tracking": "true",
    };
  }

  await transporter.sendMail(mailMessage);
}

function formatExpiry(date: Date) {
  return date.toISOString().replace(".000Z", "Z");
}

function emailLogoHtml(env: EnvMap) {
  const logoUrl = buildEmailLogoUrl(env);

  if (!logoUrl) {
    return "";
  }

  return `<img src="${escapeHtml(logoUrl)}" width="48" height="48" alt="Nerfed Demonlist" style="display:block;width:48px;height:48px;border-radius:8px;margin:0 0 16px;" />`;
}

function buildEmailLogoUrl(env: EnvMap) {
  const appUrl = env.APP_URL?.trim();

  if (!appUrl) {
    return null;
  }

  try {
    return new URL("/icon.png", appUrl).toString();
  } catch {
    return null;
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
