import {
  LevelSuggestionStatus,
  LevelStatus,
  ModerationActionType,
} from "../generated/prisma/enums";

export type LevelSuggestionStatusValue =
  (typeof LevelSuggestionStatus)[keyof typeof LevelSuggestionStatus];

export type LevelSuggestionReviewInput = {
  status: "APPROVED" | "REJECTED" | "NEEDS_CHANGES";
  moderatorNotes: string;
};

export type ConversionGateSuggestion = {
  status: string;
  createdLevelId: string | null;
} | null;

export type LevelSuggestionConversionErrorCode =
  | "forbidden"
  | "missing"
  | "transition";

export class LevelSuggestionConversionError extends Error {
  code: LevelSuggestionConversionErrorCode;

  constructor(code: LevelSuggestionConversionErrorCode, message: string) {
    super(message);
    this.name = "LevelSuggestionConversionError";
    this.code = code;
  }
}

export function canSeeLevelSuggestion(
  viewer: { id: string; role: string } | null,
  suggestion: { submitterId: string },
) {
  return (
    viewer?.id === suggestion.submitterId ||
    viewer?.role === "ADMIN" ||
    viewer?.role === "MODERATOR"
  );
}

export function moderationActionForSuggestionStatus(
  status: LevelSuggestionReviewInput["status"],
) {
  if (status === LevelSuggestionStatus.APPROVED) {
    return ModerationActionType.LEVEL_SUGGESTION_APPROVED;
  }

  if (status === LevelSuggestionStatus.REJECTED) {
    return ModerationActionType.LEVEL_SUGGESTION_REJECTED;
  }

  return ModerationActionType.LEVEL_SUGGESTION_NEEDS_CHANGES;
}

export function levelSuggestionConversionGate(
  actorRole: string,
  suggestion: ConversionGateSuggestion,
) {
  if (actorRole !== "ADMIN") {
    return {
      allowed: false as const,
      code: "forbidden" as const,
      message: "Only admins can convert approved level suggestions.",
    };
  }

  if (!suggestion) {
    return {
      allowed: false as const,
      code: "missing" as const,
      message: "The requested level suggestion was not found.",
    };
  }

  if (
    suggestion.status !== LevelSuggestionStatus.APPROVED ||
    suggestion.createdLevelId
  ) {
    return {
      allowed: false as const,
      code: "transition" as const,
      message:
        "Only approved, unconverted level suggestions can become levels.",
    };
  }

  return {
    allowed: true as const,
  };
}

export function assertCanConvertLevelSuggestion(
  actorRole: string,
  suggestion: ConversionGateSuggestion,
) {
  const gate = levelSuggestionConversionGate(actorRole, suggestion);

  if (!gate.allowed) {
    throw new LevelSuggestionConversionError(gate.code, gate.message);
  }
}

export function levelStatusForConversion(
  status: "PENDING" | "RANKED" | "LEGACY",
) {
  if (status === "RANKED") {
    return LevelStatus.RANKED;
  }

  if (status === "LEGACY") {
    return LevelStatus.LEGACY;
  }

  return LevelStatus.PENDING;
}
