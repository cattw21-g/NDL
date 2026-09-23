type LogLevel = "info" | "warn" | "error" | "security";

const SENSITIVE_KEYS = new Set([
  "password",
  "pass",
  "token",
  "secret",
  "authorization",
  "cookie",
  "session",
  "sessionid",
  "apikey",
  "clientip",
  "ip",
  "x-forwarded-for",
  "x-real-ip",
  "cf-connecting-ip",
  "bearer",
]);

/**
 * Recursively deep-redacts sensitive fields from objects or metadata.
 */
export function redactSensitiveData<T>(input: T, depth = 0): T {
  if (depth > 5 || input === null || typeof input !== "object") {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactSensitiveData(item, depth + 1)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes("token") || lowerKey.includes("password") || lowerKey.includes("secret")) {
      result[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      result[key] = redactSensitiveData(value, depth + 1);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

export type StructuredLogEntry = {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
};

function formatLog(entry: StructuredLogEntry): void {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    const line = JSON.stringify(entry);
    if (entry.level === "error" || entry.level === "security") {
      process.stderr.write(line + "\n");
    } else {
      process.stdout.write(line + "\n");
    }
  } else {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
    const details = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
    const errDetails = entry.error ? `\nError: ${entry.error.message}` : "";
    if (entry.level === "error" || entry.level === "security") {
      console.error(`${prefix} ${entry.message}${details}${errDetails}`);
    } else if (entry.level === "warn") {
      console.warn(`${prefix} ${entry.message}${details}`);
    } else {
      console.log(`${prefix} ${entry.message}${details}`);
    }
  }
}

export const logger = {
  info(category: string, message: string, context?: Record<string, unknown>) {
    formatLog({
      timestamp: new Date().toISOString(),
      level: "info",
      category,
      message,
      context: context ? redactSensitiveData(context) : undefined,
    });
  },

  warn(category: string, message: string, context?: Record<string, unknown>) {
    formatLog({
      timestamp: new Date().toISOString(),
      level: "warn",
      category,
      message,
      context: context ? redactSensitiveData(context) : undefined,
    });
  },

  error(category: string, message: string, error?: unknown, context?: Record<string, unknown>) {
    const errorObj =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
          }
        : error
          ? { message: String(error) }
          : undefined;

    formatLog({
      timestamp: new Date().toISOString(),
      level: "error",
      category,
      message,
      error: errorObj,
      context: context ? redactSensitiveData(context) : undefined,
    });
  },

  security(
    action: string,
    actor: { id?: string; playerName?: string; role?: string },
    target: { type?: string; id?: string; label?: string },
    result: "SUCCESS" | "DENIED" | "FAILED",
    details?: Record<string, unknown>,
  ) {
    formatLog({
      timestamp: new Date().toISOString(),
      level: "security",
      category: "SECURITY_AUDIT",
      message: `${actor.playerName ?? "anonymous"} (${actor.role ?? "GUEST"}) performed ${action} on ${target.type ?? "resource"}:${target.id ?? "unknown"} -> ${result}`,
      context: redactSensitiveData({
        action,
        actor,
        target,
        result,
        ...details,
      }),
    });
  },
};
