import nodemailer from "nodemailer";

export type VerificationEmail = {
  to: string;
  verificationUrl: string;
  code: string;
  expiresAt: Date;
};

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  from: string;
  auth?: {
    user: string;
    pass: string;
  };
};

type EnvMap = Record<string, string | undefined>;
type SmtpTransportConfig = Omit<SmtpConfig, "from">;
export type TransportFactory = (options: SmtpTransportConfig) => {
  sendMail: (message: {
    from: string;
    to: string;
    subject: string;
    text: string;
  }) => Promise<unknown>;
};
type Logger = Pick<Console, "log">;

function readSmtpConfig(env: EnvMap): SmtpConfig | null {
  const host = env.SMTP_HOST?.trim();
  const portValue = env.SMTP_PORT?.trim();
  const from = env.SMTP_FROM?.trim();
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASSWORD?.trim();
  const secure = env.SMTP_SECURE === "true";

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

  const createTransport: TransportFactory =
    options.createTransport ??
    ((transportOptions) => nodemailer.createTransport(transportOptions));
  const transporter = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  await transporter.sendMail({
    from: config.from,
    to: email.to,
    subject: "Verify your NDL account",
    text: [
      "Verify your NDL account to submit records.",
      "",
      `Verification link: ${email.verificationUrl}`,
      `Verification code: ${email.code}`,
      `Expires: ${email.expiresAt.toISOString()}`,
      "",
      "If you did not create an NDL account, ignore this message.",
    ].join("\n"),
  });

  return "smtp" as const;
}
