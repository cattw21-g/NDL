import type { Prisma } from "@/generated/prisma/client";
import { calculateCurrentLevelPoints, calculateLeaderboard } from "@/lib/points";

export type ApiLevel = ReturnType<typeof serializePublicLevel>;
export type ApiRecord = ReturnType<typeof serializePublicRecord>;
export type ApiPlayer = ReturnType<typeof serializePublicPlayer>;

type PublicLevelInput = {
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
  placementDate: Date | null;
  status: "RANKED" | "LEGACY" | "PENDING" | "REJECTED" | "REMOVED";
  difficulty: string;
  description: string;
  versionNotes: string | null;
  _count?: {
    records?: number;
  };
};

type PublicPlayerInput = {
  id: string;
  playerName: string;
  displayName: string;
  bio: string | null;
  createdAt: Date;
};

type PublicRecordInput = {
  id: string;
  videoUrl: string;
  fps: number;
  cbfUsed: boolean;
  acceptedAt: Date;
  player: PublicPlayerInput;
  level: PublicLevelInput;
};

type StaffRecordSubmissionInput = {
  id: string;
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
  status: string;
  moderatorNotes: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  player: Pick<PublicPlayerInput, "id" | "playerName" | "displayName">;
  level: PublicLevelInput;
  reviewer: Pick<PublicPlayerInput, "id" | "playerName" | "displayName"> | null;
};

type StaffLevelSuggestionInput = {
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
  submittedAt: Date;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  submitter: Pick<PublicPlayerInput, "id" | "playerName" | "displayName">;
  reviewer: Pick<PublicPlayerInput, "id" | "playerName" | "displayName"> | null;
  createdLevel: { id: string; slug: string; name: string } | null;
};

type ChangelogPostInput = {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  isPinned: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
  author?: Pick<PublicPlayerInput, "playerName" | "displayName"> | null;
};

export function serializePublicLevel(level: PublicLevelInput) {
  return {
    id: level.id,
    slug: level.slug,
    rank: level.rank,
    name: level.name,
    originalName: level.originalName,
    gdLevelId: level.gdLevelId,
    publisher: level.publisher,
    nerfCreator: level.nerfCreator,
    verifier: level.verifier,
    thumbnailUrl: level.thumbnailUrl,
    showcaseUrl: level.showcaseUrl,
    placementDate: isoDate(level.placementDate),
    status: level.status,
    difficulty: level.difficulty,
    points: calculateCurrentLevelPoints(level),
    description: level.description,
    versionNotes: level.versionNotes,
    recordCount: level._count?.records ?? 0,
  };
}

export function serializePublicPlayer(player: PublicPlayerInput) {
  return {
    id: player.id,
    handle: player.playerName,
    displayName: player.displayName,
    bio: player.bio,
    createdAt: player.createdAt.toISOString(),
  };
}

export function serializePublicRecord(record: PublicRecordInput) {
  return {
    id: record.id,
    player: serializePublicPlayer(record.player),
    level: serializePublicLevel(record.level),
    videoUrl: record.videoUrl,
    fps: record.fps,
    cbfUsed: record.cbfUsed,
    pointsAwarded: calculateCurrentLevelPoints(record.level),
    acceptedAt: record.acceptedAt.toISOString(),
  };
}

export function serializePublicLeaderboard(records: PublicRecordInput[]) {
  const rows = calculateLeaderboard(
    records.map((record) => ({
      playerId: record.player.id,
      playerName: record.player.playerName,
      displayName: record.player.displayName,
      levelId: record.level.id,
      pointsAwarded: calculateCurrentLevelPoints(record.level),
      acceptedAt: record.acceptedAt,
    })),
  );

  return rows.map((row, index) => ({
    rank: index + 1,
    handle: row.playerName,
    displayName: row.displayName,
    points: row.points,
    records: row.records,
    lastRecordAt: row.lastRecordAt.toISOString(),
  }));
}

export function serializeChangelogPost(post: ChangelogPostInput) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    category: post.category,
    summary: post.summary,
    content: post.content,
    isPinned: post.isPinned,
    publishedAt: isoDate(post.publishedAt),
    updatedAt: post.updatedAt.toISOString(),
    author: post.author
      ? {
          handle: post.author.playerName,
          displayName: post.author.displayName,
        }
      : null,
  };
}

export function serializeStaffRecordSubmission(
  submission: StaffRecordSubmissionInput,
) {
  return {
    id: submission.id,
    status: submission.status,
    player: serializeStaffUser(submission.player),
    level: serializePublicLevel(submission.level),
    videoUrl: submission.videoUrl,
    rawFootageUrl: submission.rawFootageUrl,
    proofImageUrl: submission.proofImageUrl,
    fps: submission.fps,
    cbfUsed: submission.cbfUsed,
    clickAudioIncluded: submission.clickAudioIncluded,
    separateMicClickTrack: submission.separateMicClickTrack,
    gameAudioIncluded: submission.gameAudioIncluded,
    rawFootageIncluded: submission.rawFootageIncluded,
    fpsOverlayVisible: submission.fpsOverlayVisible,
    cpsCounterVisible: submission.cpsCounterVisible,
    cheatIndicatorVisible: submission.cheatIndicatorVisible,
    microphoneModel: submission.microphoneModel,
    inputDevice: submission.inputDevice,
    proofNotes: submission.proofNotes,
    comments: submission.comments,
    moderatorNotes: submission.moderatorNotes,
    submittedAt: submission.submittedAt.toISOString(),
    reviewedAt: isoDate(submission.reviewedAt),
    reviewer: submission.reviewer
      ? serializeStaffUser(submission.reviewer)
      : null,
  };
}

export function serializeStaffLevelSuggestion(
  suggestion: StaffLevelSuggestionInput,
) {
  return {
    id: suggestion.id,
    name: suggestion.name,
    originalName: suggestion.originalName,
    gdLevelId: suggestion.gdLevelId,
    publisher: suggestion.publisher,
    nerfCreator: suggestion.nerfCreator,
    verifier: suggestion.verifier,
    showcaseUrl: suggestion.showcaseUrl,
    thumbnailUrl: suggestion.thumbnailUrl,
    versionNotes: suggestion.versionNotes,
    compatibilityNotes: suggestion.compatibilityNotes,
    status: suggestion.status,
    moderatorNotes: suggestion.moderatorNotes,
    submittedAt: suggestion.submittedAt.toISOString(),
    reviewedAt: isoDate(suggestion.reviewedAt),
    createdAt: suggestion.createdAt.toISOString(),
    updatedAt: suggestion.updatedAt.toISOString(),
    submitter: serializeStaffUser(suggestion.submitter),
    reviewer: suggestion.reviewer
      ? serializeStaffUser(suggestion.reviewer)
      : null,
    createdLevel: suggestion.createdLevel
      ? {
          id: suggestion.createdLevel.id,
          slug: suggestion.createdLevel.slug,
          name: suggestion.createdLevel.name,
        }
      : null,
  };
}

export function serializeAuditLogEntry(entry: {
  id: string;
  actorUserId: string | null;
  actorHandle: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  beforeJson: Prisma.JsonValue | null;
  afterJson: Prisma.JsonValue | null;
  note: string | null;
  createdAt: Date;
}) {
  return {
    id: entry.id,
    actor: {
      id: entry.actorUserId,
      handle: entry.actorHandle,
      displayName: entry.actorName,
      role: entry.actorRole,
    },
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    entityLabel: entry.entityLabel,
    before: redactApiValue(entry.beforeJson),
    after: redactApiValue(entry.afterJson),
    note: entry.note,
    createdAt: entry.createdAt.toISOString(),
  };
}

function serializeStaffUser(
  user: Pick<PublicPlayerInput, "id" | "playerName" | "displayName">,
) {
  return {
    id: user.id,
    handle: user.playerName,
    displayName: user.displayName,
  };
}

function isoDate(date: Date | null | undefined) {
  return date ? date.toISOString() : null;
}

export function redactApiValue(value: unknown): unknown {
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

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactApiValue(item));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [
          key,
          isSensitiveApiKey(key) ? "[redacted]" : redactApiValue(entryValue),
        ]),
    );
  }

  return String(value);
}

function isSensitiveApiKey(key: string) {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");

  return (
    normalized === "email" ||
    normalized.includes("password") ||
    normalized.includes("secret") ||
    normalized.includes("databaseurl") ||
    normalized.includes("smtp") ||
    normalized.includes("session") ||
    normalized.includes("token") ||
    normalized.includes("codehash")
  );
}
