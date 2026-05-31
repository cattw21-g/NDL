import { describe, expect, it } from "vitest";

import { LevelStatus, ModerationActionType } from "../generated/prisma/enums";
import {
  canSeeLevelSuggestion,
  levelSuggestionConversionGate,
  levelStatusForConversion,
  moderationActionForSuggestionStatus,
} from "../lib/level-suggestion-workflow";
import { validateLevelSuggestionFormSubmission } from "../lib/level-suggestion-form-state";

function suggestionFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const values = {
    name: "Abyssal Mercy",
    originalName: "Abyss of Darkness",
    gdLevelId: "123456789",
    publisher: "NDL Host",
    nerfCreator: "Nerf Team",
    verifier: "Verifier",
    showcaseUrl: "https://example.com/showcase",
    versionNotes: "Stable public version.",
    compatibilityNotes:
      "Preserves route, click timing, speed, portals, gamemode order, and progression.",
    ...overrides,
  };

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

describe("level suggestion workflow", () => {
  it("validates a complete level suggestion", () => {
    const result = validateLevelSuggestionFormSubmission(suggestionFormData());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Abyssal Mercy");
      expect(result.data.gdLevelId).toBe("123456789");
    }
  });

  it("maps suggestion validation failures to fields and preserves values", () => {
    const result = validateLevelSuggestionFormSubmission(
      suggestionFormData({
        name: "",
        gdLevelId: "abc",
        showcaseUrl: "example.com/showcase",
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.state.summary).toBe("Fix the highlighted fields below.");
      expect(result.state.values.gdLevelId).toBe("abc");
      expect(result.state.fieldErrors.name).toContain("Level name is required.");
      expect(result.state.fieldErrors.gdLevelId).toContain(
        "GD level ID must contain only numbers.",
      );
      expect(result.state.fieldErrors.showcaseUrl).toContain(
        "Showcase must be a valid http/https URL.",
      );
    }
  });

  it("maps suggestion decisions to moderation actions", () => {
    expect(moderationActionForSuggestionStatus("APPROVED")).toBe(
      ModerationActionType.LEVEL_SUGGESTION_APPROVED,
    );
    expect(moderationActionForSuggestionStatus("REJECTED")).toBe(
      ModerationActionType.LEVEL_SUGGESTION_REJECTED,
    );
    expect(moderationActionForSuggestionStatus("NEEDS_CHANGES")).toBe(
      ModerationActionType.LEVEL_SUGGESTION_NEEDS_CHANGES,
    );
  });

  it("keeps suggestion visibility private to submitter and staff", () => {
    const suggestion = { submitterId: "player-1" };

    expect(canSeeLevelSuggestion(null, suggestion)).toBe(false);
    expect(
      canSeeLevelSuggestion({ id: "player-1", role: "PLAYER" }, suggestion),
    ).toBe(true);
    expect(
      canSeeLevelSuggestion({ id: "player-2", role: "PLAYER" }, suggestion),
    ).toBe(false);
    expect(
      canSeeLevelSuggestion({ id: "mod-1", role: "MODERATOR" }, suggestion),
    ).toBe(true);
  });

  it("defaults conversion to pending unless admin selects a ranked status", () => {
    expect(levelStatusForConversion("PENDING")).toBe(LevelStatus.PENDING);
    expect(levelStatusForConversion("RANKED")).toBe(LevelStatus.RANKED);
    expect(levelStatusForConversion("LEGACY")).toBe(LevelStatus.LEGACY);
  });

  it("allows only admins to convert approved unconverted suggestions", () => {
    expect(
      levelSuggestionConversionGate("ADMIN", {
        status: "APPROVED",
        createdLevelId: null,
      }).allowed,
    ).toBe(true);

    expect(
      levelSuggestionConversionGate("MODERATOR", {
        status: "APPROVED",
        createdLevelId: null,
      }),
    ).toMatchObject({ allowed: false, code: "forbidden" });

    expect(
      levelSuggestionConversionGate("PLAYER", {
        status: "APPROVED",
        createdLevelId: null,
      }),
    ).toMatchObject({ allowed: false, code: "forbidden" });
  });

  it("blocks non-approved and already converted suggestions", () => {
    for (const status of ["PENDING", "REJECTED", "NEEDS_CHANGES", "CONVERTED"]) {
      expect(
        levelSuggestionConversionGate("ADMIN", {
          status,
          createdLevelId: null,
        }),
      ).toMatchObject({ allowed: false, code: "transition" });
    }

    expect(
      levelSuggestionConversionGate("ADMIN", {
        status: "APPROVED",
        createdLevelId: "level-1",
      }),
    ).toMatchObject({ allowed: false, code: "transition" });
  });
});
