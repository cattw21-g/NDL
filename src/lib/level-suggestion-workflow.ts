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
