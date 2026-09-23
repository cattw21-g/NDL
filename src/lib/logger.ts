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
 * Scrubs connection strings and sensitive URI query parameters from plain text.
 */
export function sanitizeString(val: string): string {
  return val
    .replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/gi, "$1[REDACTED]$3")
    .replace(/((?:token|key|secret|password|auth|bearer)=)([^& \t\r\n"']+)/gi, "$1[REDACTED]");
}

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (SENSITIVE_KEYS.has(lower)) return true;
  return (
    lower.includes("password") ||
    lower.includes("token") ||
    lower.includes("secret") ||
    lower.includes("auth") ||
    lower.includes("cookie") ||
    lower.includes("credential") ||
    lower.includes("apikey") ||
    lower.includes("api_key")
  );
}

/**
 * Recursively deep-redacts sensitive fields from objects, maps, headers, or metadata.
 */
export function redactSensitiveData<T>(input: T, depth = 0): T {
  if (depth > 5 || input === null || input === undefined) {
    return input;
  }

  if (typeof input === "string") {
    return sanitizeString(input) as unknown as T;
  }

  if (typeof input !== "object") {
    return input;
  }

  if (typeof Headers !== "undefined" && input instanceof Headers) {
    const obj: Record<string, string> = {};
    input.forEach((val, k) => {
      obj[k] = val;
    });
    return redactSensitiveData(obj, depth) as unknown as T;
  }

  if (input instanceof Map) {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of input.entries()) {
      obj[String(k)] = v;
    }
    return redactSensitiveData(obj, depth) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactSensitiveData(item, depth + 1)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (isSensitiveKey(key)) {
      result[key] = "[REDACTED]";
    } else if (typeof value === "string") {
      result[key] = sanitizeString(value);
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
      message: sanitizeString(message),
      context: context ? redactSensitiveData(context) : undefined,
    });
  },

  warn(category: string, message: string, context?: Record<string, unknown>) {
    formatLog({
      timestamp: new Date().toISOString(),
      level: "warn",
      category,
      message: sanitizeString(message),
      context: context ? redactSensitiveData(context) : undefined,
    });
  },

  error(category: string, message: string, error?: unknown, context?: Record<string, unknown>) {
    const sanitizedMsg = sanitizeString(message);
    const errorObj =
      error instanceof Error
        ? {
            name: error.name,
            message: sanitizeString(error.message),
            stack: error.stack ? sanitizeString(error.stack) : undefined,
          }
        : error
          ? { message: sanitizeString(String(error)) }
          : undefined;

    formatLog({
      timestamp: new Date().toISOString(),
      level: "error",
      category,
      message: sanitizedMsg,
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
      message: sanitizeString(`${actor.playerName ?? "anonymous"} (${actor.role ?? "GUEST"}) performed ${action} on ${target.type ?? "resource"}:${target.id ?? "unknown"} -> ${result}`),
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
