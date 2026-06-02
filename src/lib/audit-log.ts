import { createHmac } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import { requireSessionSecret, type EnvMap } from "@/lib/production-env";

const REDACTED = "[redacted]";

const sensitiveKeys = new Set([
  "passwordhash",
  "tokenhash",
  "codehash",
  "session",
  "sessions",
  "emailverificationtoken",
  "emailverificationtokens",
  "passwordresettoken",
  "passwordresettokens",
  "rawfootageurl",
  "proofimageurl",
]);

export type AuditActor = {
  id?: string | null;
  playerName?: string | null;
  displayName?: string | null;
  role?: string | null;
};

export type AuditRequestMetadata = {
  ipHash?: string | null;
  userAgentHash?: string | null;
};

export type AuditLogInput = {
  actor?: AuditActor | null;
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  before?: unknown;
  after?: unknown;
  note?: string | null;
  request?: AuditRequestMetadata | null;
};

type AuditLogCreateData = {
  actorUserId: string | null;
  actorHandle: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  beforeJson?: Prisma.InputJsonValue;
  afterJson?: Prisma.InputJsonValue;
  note?: string | null;
  ipHash?: string | null;
  userAgentHash?: string | null;
};

export type AuditLogClient = {
  adminAuditLog: {
    create(args: { data: AuditLogCreateData }): Promise<unknown>;
  };
};

export async function writeAuditLog(
  db: AuditLogClient,
  input: AuditLogInput,
) {
  await db.adminAuditLog.create({
    data: buildAuditCreateData(input),
  });
}

export async function safeWriteAuditLog(
  db: AuditLogClient,
  input: AuditLogInput,
) {
  try {
    await writeAuditLog(db, input);
  } catch (error) {
    console.error("Admin audit log write failed", {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      error,
    });
  }
}

export function buildAuditCreateData(input: AuditLogInput): AuditLogCreateData {
  const actor = snapshotActor(input.actor);
  const beforeJson = toAuditJson(input.before);
  const afterJson = toAuditJson(input.after);

  return {
    actorUserId: actor.actorUserId,
    actorHandle: actor.actorHandle,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    entityLabel: input.entityLabel,
    ...(beforeJson === undefined ? {} : { beforeJson }),
    ...(afterJson === undefined ? {} : { afterJson }),
    ...(input.note ? { note: input.note } : {}),
    ...(input.request?.ipHash ? { ipHash: input.request.ipHash } : {}),
    ...(input.request?.userAgentHash
      ? { userAgentHash: input.request.userAgentHash }
      : {}),
  };
}

export function snapshotActor(actor?: AuditActor | null) {
  return {
    actorUserId: actor?.id ?? null,
    actorHandle: actor?.playerName ?? "system",
    actorName: actor?.displayName ?? actor?.playerName ?? "System",
    actorRole: actor?.role ?? "SYSTEM",
  };
}

export function hashAuditMetadataValue(
  value: string | null | undefined,
  env: EnvMap = process.env,
) {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  return createHmac("sha256", requireSessionSecret(env))
    .update(normalized)
    .digest("hex");
}

export function buildAuditRequestMetadata(
  input: {
    ip?: string | null;
    userAgent?: string | null;
  },
  env: EnvMap = process.env,
): AuditRequestMetadata {
  return {
    ipHash: hashAuditMetadataValue(input.ip, env),
    userAgentHash: hashAuditMetadataValue(input.userAgent, env),
  };
}

export function redactAuditValue(value: unknown): unknown {
  return normalizeAuditValue(value, new WeakSet());
}

function toAuditJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  return redactAuditValue(value) as Prisma.InputJsonValue;
}

function normalizeAuditValue(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeAuditValue(item, seen));
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[circular]";
    }

    seen.add(value);

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [
          key,
          isSensitiveAuditKey(key)
            ? REDACTED
            : normalizeAuditValue(entryValue, seen),
        ]),
    );
  }

  return String(value);
}

function isSensitiveAuditKey(key: string) {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");

  return (
    sensitiveKeys.has(normalized) ||
    normalized.includes("password") ||
    normalized.includes("secret") ||
    normalized.endsWith("token") ||
    normalized.endsWith("tokens") ||
    normalized.endsWith("codehash")
  );
}
