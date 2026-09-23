import { describe, expect, it } from "vitest";

import { redactSensitiveData, sanitizeString } from "../lib/logger";

describe("logger redaction and sanitization", () => {
  it("scrubs PostgreSQL connection strings containing passwords", () => {
    const raw = "Error connecting to postgresql://admin:SuperSecretPassword123@neon-db-cluster.us-east-1.aws.neon.tech/ndldb?sslmode=require";
    const sanitized = sanitizeString(raw);
    expect(sanitized).toBe("Error connecting to postgresql://admin:[REDACTED]@neon-db-cluster.us-east-1.aws.neon.tech/ndldb?sslmode=require");
    expect(sanitized).not.toContain("SuperSecretPassword123");
  });

  it("scrubs standard postgres connection strings", () => {
    const raw = "postgres://ndl_user:MySecretPassword@127.0.0.1:5432/ndl";
    const sanitized = sanitizeString(raw);
    expect(sanitized).toBe("postgres://ndl_user:[REDACTED]@127.0.0.1:5432/ndl");
    expect(sanitized).not.toContain("MySecretPassword");
  });

  it("scrubs sensitive query parameters in URLs", () => {
    const url = "https://discord.com/api/oauth2/token?code=12345&token=discord_secret_token_abc&other=value";
    const sanitized = sanitizeString(url);
    expect(sanitized).toContain("token=[REDACTED]");
    expect(sanitized).not.toContain("discord_secret_token_abc");
  });

  it("redacts case-variant sensitive keys in objects", () => {
    const payload = {
      AUTHORIZATION: "Bearer secret-jwt-payload-xyz",
      apiKey: "xyz-123",
      user_password_hash: "$2a$12$abcdefg",
      nested: {
        SECRET_TOKEN: "sensitive-session",
        normalField: "public-value",
      },
    };

    const redacted = redactSensitiveData(payload);
    expect(redacted.AUTHORIZATION).toBe("[REDACTED]");
    expect(redacted.apiKey).toBe("[REDACTED]");
    expect(redacted.user_password_hash).toBe("[REDACTED]");
    expect(redacted.nested.SECRET_TOKEN).toBe("[REDACTED]");
    expect(redacted.nested.normalField).toBe("public-value");
  });

  it("handles Headers instances properly", () => {
    const headers = new Headers();
    headers.set("Authorization", "Bearer topsecret-token");
    headers.set("Content-Type", "application/json");
    headers.set("X-Custom-Secret", "private-token");

    const redacted = redactSensitiveData(headers as unknown as Record<string, string>);
    expect(redacted["authorization"]).toBe("[REDACTED]");
    expect(redacted["content-type"]).toBe("application/json");
    expect(redacted["x-custom-secret"]).toBe("[REDACTED]");
  });

  it("handles Maps properly", () => {
    const map = new Map<string, string>();
    map.set("session_token", "abc-987");
    map.set("userId", "user-123");

    const redacted = redactSensitiveData(map as unknown as Record<string, string>);
    expect(redacted["session_token"]).toBe("[REDACTED]");
    expect(redacted["userId"]).toBe("user-123");
  });

  it("recursively sanitizes strings nested inside arrays and objects", () => {
    const data = {
      logs: [
        "DB failure: postgres://root:rootpass@localhost:5432/test",
        { query: "SELECT 1", meta: "key=topsecret" },
      ],
    };

    const redacted = redactSensitiveData(data);
    expect(redacted.logs[0]).toBe("DB failure: postgres://root:[REDACTED]@localhost:5432/test");
    expect((redacted.logs[1] as { meta: string }).meta).toBe("key=[REDACTED]");
  });
});
