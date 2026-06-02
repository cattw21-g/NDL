import type { BotConfig } from "./config.js";

export type NdlApiEnvelope<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        retryAfterSeconds?: number;
      };
    };

export type NdlLevel = {
  id: string;
  slug: string;
  rank: number | null;
  name: string;
  originalName: string;
  gdLevelId: string;
  publisher: string;
  nerfCreator: string;
  verifier: string;
  thumbnailUrl: string;
  showcaseUrl: string;
  placementDate: string | null;
  status: string;
  difficulty: string;
  points: number;
  description: string;
  versionNotes: string | null;
  recordCount: number;
};

export type NdlPlayer = {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  createdAt: string;
};

export type NdlLeaderboardRow = {
  rank: number | null;
  handle: string;
  displayName: string;
  points: number;
  records: number;
  lastRecordAt: string | null;
};

export type NdlRecord = {
  id: string;
  player: NdlPlayer;
  level: NdlLevel;
  videoUrl: string;
  fps: number;
  cbfUsed: boolean;
  pointsAwarded: number;
  acceptedAt: string;
};

export type NdlRules = {
  id: string;
  version: string;
  content: string;
  publishedAt: string;
};

export type StaffRecordSubmission = {
  id: string;
  status: string;
  player: StaffUser;
  level: NdlLevel;
  videoUrl: string;
  rawFootageUrl: string | null;
  proofImageUrl: string | null;
  fps: number;
  cbfUsed: boolean;
  clickAudioIncluded: boolean;
  separateMicClickTrack: boolean;
  gameAudioIncluded: boolean;
  rawFootageIncluded: boolean;
  fpsOverlayVisible: boolean;
  cpsCounterVisible: boolean;
  cheatIndicatorVisible: boolean;
  microphoneModel: string | null;
  inputDevice: string;
  proofNotes: string | null;
  comments: string | null;
  moderatorNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewer: StaffUser | null;
};

export type StaffLevelSuggestion = {
  id: string;
  name: string;
  originalName: string;
  gdLevelId: string;
  publisher: string;
  nerfCreator: string;
  verifier: string;
  showcaseUrl: string;
  thumbnailUrl: string | null;
  versionNotes: string | null;
  compatibilityNotes: string;
  status: string;
  moderatorNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  submitter: StaffUser;
  reviewer: StaffUser | null;
  createdLevel: { id: string; slug: string; name: string } | null;
};

export type StaffUser = {
  id: string;
  handle: string;
  displayName: string;
};

export type AuditEntry = {
  id: string;
  actor: {
    id: string | null;
    handle: string;
    displayName: string;
    role: string;
  };
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  before: unknown;
  after: unknown;
  note: string | null;
  createdAt: string;
};

export type StaffStats = {
  pendingRecords: number;
  pendingSuggestions: number;
  rankedLevels: number;
  users: number;
  acceptedRecords: number;
  moderationActions24h: number;
  auditEvents24h: number;
  generatedAt: string;
};

export type NdlApiClient = ReturnType<typeof createNdlApiClient>;
type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export class NdlApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "NdlApiError";
  }
}

export function createNdlApiClient(
  config: Pick<BotConfig, "ndlPublicApiBase" | "ndlBotApiSecret">,
  fetchImpl: FetchLike = fetch,
) {
  const publicBase = config.ndlPublicApiBase.replace(/\/+$/, "");

  return {
    getTopLevels(limit = 10) {
      return request<{ levels: NdlLevel[]; limit: number }>(
        publicBase,
        "/api/public/levels",
        { limit },
        fetchImpl,
      );
    },
    getLevel(slug: string) {
      return request<{ level: NdlLevel; records: NdlRecord[] }>(
        publicBase,
        `/api/public/levels/${encodeURIComponent(slug)}`,
        undefined,
        fetchImpl,
      );
    },
    search(query: string, limit = 10) {
      return request<{ query: string; levels: NdlLevel[]; players: NdlPlayer[]; limit: number }>(
        publicBase,
        "/api/public/search",
        { q: query, limit },
        fetchImpl,
      );
    },
    getPlayer(handle: string) {
      return request<{ player: NdlPlayer; summary: NdlLeaderboardRow }>(
        publicBase,
        `/api/public/players/${encodeURIComponent(handle)}`,
        undefined,
        fetchImpl,
      );
    },
    getPlayerRecords(handle: string, limit = 25) {
      return request<{ records: NdlRecord[]; limit: number }>(
        publicBase,
        `/api/public/players/${encodeURIComponent(handle)}/records`,
        { limit },
        fetchImpl,
      );
    },
    getRecentRecords(limit = 10) {
      return request<{ records: NdlRecord[]; limit: number }>(
        publicBase,
        "/api/public/recent-records",
        { limit },
        fetchImpl,
      );
    },
    getRules() {
      return request<{ rules: NdlRules }>(
        publicBase,
        "/api/public/rules",
        undefined,
        fetchImpl,
      );
    },
    getPendingRecords(limit = 10) {
      return staffRequest<{ submissions: StaffRecordSubmission[]; limit: number }>(
        publicBase,
        "/api/bot/staff/pending-records",
        { limit },
        config.ndlBotApiSecret,
        fetchImpl,
      );
    },
    getPendingSuggestions(limit = 10) {
      return staffRequest<{ suggestions: StaffLevelSuggestion[]; limit: number }>(
        publicBase,
        "/api/bot/staff/pending-suggestions",
        { limit },
        config.ndlBotApiSecret,
        fetchImpl,
      );
    },
    getSubmission(id: string) {
      return staffRequest<{ submission: StaffRecordSubmission }>(
        publicBase,
        `/api/bot/staff/record-submissions/${encodeURIComponent(id)}`,
        undefined,
        config.ndlBotApiSecret,
        fetchImpl,
      );
    },
    getSuggestion(id: string) {
      return staffRequest<{ suggestion: StaffLevelSuggestion }>(
        publicBase,
        `/api/bot/staff/level-suggestions/${encodeURIComponent(id)}`,
        undefined,
        config.ndlBotApiSecret,
        fetchImpl,
      );
    },
    getAudit(query = "", limit = 10) {
      return staffRequest<{ query: string; entries: AuditEntry[]; limit: number }>(
        publicBase,
        "/api/bot/staff/audit",
        { q: query, limit },
        config.ndlBotApiSecret,
        fetchImpl,
      );
    },
    getStats() {
      return staffRequest<{ stats: StaffStats }>(
        publicBase,
        "/api/bot/staff/stats",
        undefined,
        config.ndlBotApiSecret,
        fetchImpl,
      );
    },
  };
}

async function staffRequest<T>(
  baseUrl: string,
  path: string,
  searchParams: Record<string, string | number> | undefined,
  secret: string | null,
  fetchImpl: FetchLike,
) {
  if (!secret) {
    throw new NdlApiError(
      "staff_not_configured",
      0,
      "Staff bot API is not configured.",
    );
  }

  return request<T>(baseUrl, path, searchParams, fetchImpl, {
    Authorization: `Bearer ${secret}`,
  });
}

async function request<T>(
  baseUrl: string,
  path: string,
  searchParams: Record<string, string | number> | undefined,
  fetchImpl: FetchLike,
  headers?: Record<string, string>,
) {
  const url = buildApiUrl(baseUrl, path, searchParams);

  let response: Response;

  try {
    response = await fetchImpl(url, {
      headers: {
        Accept: "application/json",
        ...headers,
      },
    });
  } catch (error) {
    throw new NdlApiError(
      "api_unavailable",
      0,
      error instanceof Error ? error.message : "NDL API is unavailable.",
    );
  }

  let envelope: NdlApiEnvelope<T>;

  try {
    envelope = (await response.json()) as NdlApiEnvelope<T>;
  } catch {
    throw new NdlApiError(
      "malformed_response",
      response.status,
      "NDL API returned an unreadable response.",
    );
  }

  if (!isNdlEnvelope(envelope)) {
    throw new NdlApiError(
      "malformed_response",
      response.status,
      "NDL API returned an unexpected response.",
    );
  }

  if (!envelope.ok) {
    throw new NdlApiError(
      envelope.error.code,
      response.status,
      envelope.error.message,
      envelope.error.retryAfterSeconds,
    );
  }

  return envelope.data;
}

function buildApiUrl(
  baseUrl: string,
  path: string,
  searchParams?: Record<string, string | number>,
) {
  const url = new URL(path, `${baseUrl}/`);

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

function isNdlEnvelope<T>(value: unknown): value is NdlApiEnvelope<T> {
  if (!value || typeof value !== "object" || !("ok" in value)) {
    return false;
  }

  const envelope = value as { ok: unknown; data?: unknown; error?: unknown };

  return (
    (envelope.ok === true && "data" in envelope) ||
    (envelope.ok === false &&
      Boolean(envelope.error) &&
      typeof envelope.error === "object")
  );
}
