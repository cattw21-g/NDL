export type EnvMap = Record<string, string | undefined>;

const DEV_SESSION_SECRET = "ndl-development-session-secret-do-not-use-in-production";
const MIN_SESSION_SECRET_LENGTH = 32;

const weakSessionSecretPatterns = [
  /change[-_\s]?me/i,
  /replace/i,
  /development/i,
  /password/i,
  /secret123/i,
  /your[-_\s]?secret/i,
];

export function isProduction(env: EnvMap = process.env) {
  return env.NODE_ENV === "production";
}

export function requireDatabaseUrl(
  env: EnvMap = process.env,
  purpose = "create the Prisma client",
) {
  const databaseUrl = env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(`DATABASE_URL is required to ${purpose}.`);
  }

  return databaseUrl;
}

export function isStrongSessionSecret(value: string | undefined) {
  const secret = value?.trim() ?? "";

  if (secret.length < MIN_SESSION_SECRET_LENGTH) {
    return false;
  }

  if (weakSessionSecretPatterns.some((pattern) => pattern.test(secret))) {
    return false;
  }

  return !/^(.)\1+$/.test(secret);
}

export function requireSessionSecret(env: EnvMap = process.env) {
  const secret = env.SESSION_SECRET?.trim();

  if (!isProduction(env)) {
    return secret || DEV_SESSION_SECRET;
  }

  if (!secret) {
    throw new Error(
      "SESSION_SECRET must be set to a strong random value of at least 32 characters in production.",
    );
  }

  if (!isStrongSessionSecret(secret)) {
    throw new Error(
      "SESSION_SECRET must be a strong random value of at least 32 characters in production.",
    );
  }

  return secret;
}

export function productionEnvErrors(env: EnvMap = process.env) {
  if (!isProduction(env)) {
    return [];
  }

  const errors: string[] = [];

  if (!env.DATABASE_URL?.trim()) {
    errors.push("DATABASE_URL is required in production.");
  }

  if (!isStrongSessionSecret(env.SESSION_SECRET)) {
    errors.push(
      "SESSION_SECRET must be a strong random value of at least 32 characters in production.",
    );
  }

  return errors;
}

export function assertProductionEnv(env: EnvMap = process.env) {
  const errors = productionEnvErrors(env);

  if (errors.length > 0) {
    throw new Error(`Production configuration error:\n- ${errors.join("\n- ")}`);
  }
}

export function allowLocalUploadsInProduction(env: EnvMap = process.env) {
  return env.ALLOW_LOCAL_UPLOADS_IN_PRODUCTION === "true";
}

export function productionLocalUploadsDisabledReason(
  env: EnvMap = process.env,
) {
  const uploadMode = env.UPLOAD_MODE?.trim().toLowerCase();

  if (
    isProduction(env) &&
    uploadMode === "local" &&
    !allowLocalUploadsInProduction(env)
  ) {
    return "UPLOAD_MODE=local is disabled in production unless ALLOW_LOCAL_UPLOADS_IN_PRODUCTION=true. Use UPLOAD_MODE=disabled on Vercel.";
  }

  return null;
}
