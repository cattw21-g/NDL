import { describe, expect, it } from "vitest";

import {
  levelMutationErrorState,
  validateLevelFormSubmission,
} from "../lib/level-form-state";
import {
  validateRegisterFormSubmission,
} from "../lib/register-form-state";
import { levelSchema, registerSchema, submissionSchema } from "../lib/validation";

describe("registration validation", () => {
  const validRegistration = {
    email: "player@example.com",
    playerName: "Player_One",
    password: "VeryLongPass123!",
    confirmPassword: "VeryLongPass123!",
  };

  it("accepts matching password confirmation", () => {
    expect(registerSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("rejects non-matching password confirmation with the requested message", () => {
    const parsed = registerSchema.safeParse({
      ...validRegistration,
      confirmPassword: "DifferentPass123!",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.confirmPassword).toContain(
        "Passwords do not match.",
      );
    }
  });

  it("requires password confirmation", () => {
    const parsed = registerSchema.safeParse({
      email: validRegistration.email,
      playerName: validRegistration.playerName,
      password: validRegistration.password,
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.confirmPassword?.length).toBeGreaterThan(0);
    }
  });

  it("keeps the existing password minimum validation", () => {
    const parsed = registerSchema.safeParse({
      ...validRegistration,
      password: "short",
      confirmPassword: "short",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.password?.length).toBeGreaterThan(0);
    }
  });

  it("maps confirmation errors to form state and clears password values", () => {
    const formData = new FormData();
    formData.set("email", validRegistration.email);
    formData.set("playerName", validRegistration.playerName);
    formData.set("password", validRegistration.password);
    formData.set("confirmPassword", "DifferentPass123!");

    const result = validateRegisterFormSubmission(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.state.summary).toBe("Fix the highlighted fields below.");
      expect(result.state.fieldErrors.confirmPassword).toContain(
        "Passwords do not match.",
      );
      expect(result.state.values.email).toBe(validRegistration.email);
      expect(result.state.values.playerName).toBe(validRegistration.playerName);
      expect(result.state.values.password).toBe("");
      expect(result.state.values.confirmPassword).toBe("");
    }
  });
});

describe("submission validation", () => {
  it("accepts http and https proof links", () => {
    const parsed = submissionSchema.safeParse({
      levelId: "level",
      videoUrl: "https://example.com/video",
      rawFootageUrl: "http://example.com/raw",
      fps: "240",
      cbfUsed: "true",
      clickAudioIncluded: "true",
      separateMicClickTrack: "true",
      gameAudioIncluded: "true",
      rawFootageIncluded: "true",
      fpsOverlayVisible: "true",
      cpsCounterVisible: "true",
      cheatIndicatorVisible: "true",
      microphoneModel: "USB mic",
      inputDevice: "Keyboard space key",
      proofNotes: "Clicks are audible in the microphone track.",
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts local upload paths for submitted proof media", () => {
    const parsed = submissionSchema.safeParse({
      levelId: "level",
      videoUrl: "/uploads/completion-videos/run.mp4",
      rawFootageUrl: "/uploads/raw-footage/raw.mp4",
      proofImageUrl: "/uploads/proof-images/proof.webp",
      fps: "240",
      rawFootageIncluded: "true",
      inputDevice: "Keyboard space key",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects non-http URLs", () => {
    const parsed = submissionSchema.safeParse({
      levelId: "level",
      videoUrl: "javascript:alert(1)",
      fps: "240",
      inputDevice: "Keyboard space key",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects inconsistent raw footage proof state", () => {
    const parsed = submissionSchema.safeParse({
      levelId: "level",
      videoUrl: "https://example.com/video",
      rawFootageUrl: "https://example.com/raw",
      fps: "240",
      inputDevice: "Keyboard space key",
    });

    expect(parsed.success).toBe(false);
  });
});

const validLevel = {
  sourceSuggestionId: "",
  name: "Demo Level",
  originalName: "Original Demo",
  gdLevelId: "123456",
  publisher: "Demo host",
  nerfCreator: "Demo nerfer",
  verifier: "Demo verifier",
  thumbnailUrl: "https://i.imgur.com/example.png",
  showcaseUrl: "https://example.com/showcase",
  placementDate: "",
  rank: "1",
  status: "RANKED",
  difficulty: "EXTREME",
  description: "A valid level description for validation tests.",
  versionNotes: "",
};

function levelFormData(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

function invalidLevelState(overrides: Record<string, string>) {
  const result = validateLevelFormSubmission(
    levelFormData({
      ...validLevel,
      ...overrides,
    }),
  );

  if (result.success) {
    throw new Error("Expected invalid level form state.");
  }

  return result.state;
}

describe("admin level validation", () => {
  it("maps required text field errors to the correct fields", () => {
    const state = invalidLevelState({
      name: "",
      originalName: "",
      publisher: "",
      nerfCreator: "",
      verifier: "",
    });

    expect(state.summary).toBe("Fix the highlighted fields below.");
    expect(state.fieldErrors.name).toContain("Level name is required.");
    expect(state.fieldErrors.originalName).toContain(
      "Original level is required.",
    );
    expect(state.fieldErrors.publisher).toContain("Publisher/host is required.");
    expect(state.fieldErrors.nerfCreator).toContain(
      "Nerf creator is required.",
    );
    expect(state.fieldErrors.verifier).toContain("Verifier is required.");
  });

  it("rejects non-numeric GD level IDs with the requested message", () => {
    const state = invalidLevelState({
      gdLevelId: "abc123",
    });

    expect(state.fieldErrors.gdLevelId).toContain(
      "GD level ID must contain only numbers.",
    );
  });

  it("rejects invalid ranks with the requested message", () => {
    for (const rank of ["0", "-1", "1.5", "abc"]) {
      const state = invalidLevelState({ rank });
      expect(state.fieldErrors.rank).toContain(
        "Rank must be a positive whole number.",
      );
    }
  });

  it("accepts valid local and remote thumbnail image paths", () => {
    expect(
      levelSchema.safeParse({
        ...validLevel,
        thumbnailUrl: "/thumbnails/example.png",
      }).success,
    ).toBe(true);
    expect(
      levelSchema.safeParse({
        ...validLevel,
        thumbnailUrl: "https://i.imgur.com/example.webp",
      }).success,
    ).toBe(true);
    expect(
      levelSchema.safeParse({
        ...validLevel,
        thumbnailUrl: "https://placehold.co/320x180.png",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid thumbnail inputs with the requested message", () => {
    for (const thumbnailUrl of [
      "",
      "C:\\Users\\cat97\\thumbnail.png",
      "https://www.google.com/search?tbm=isch&q=level",
      "https://example.com/not-an-image",
    ]) {
      const state = invalidLevelState({ thumbnailUrl });
      expect(state.fieldErrors.thumbnailUrl).toContain(
        "Thumbnail must be a valid http/https image URL or a local public path like /thumbnails/example.png.",
      );
    }
  });

  it("rejects invalid showcase URLs with the requested message", () => {
    const state = invalidLevelState({
      showcaseUrl: "example.com/showcase",
    });

    expect(state.fieldErrors.showcaseUrl).toContain(
      "Showcase must be a valid http/https URL.",
    );
  });

  it("rejects invalid status and difficulty/category values", () => {
    const statusState = invalidLevelState({
      status: "BAD",
    });
    const difficultyState = invalidLevelState({
      difficulty: "BAD",
    });

    expect(statusState.fieldErrors.status).toContain("Choose a valid status.");
    expect(difficultyState.fieldErrors.difficulty).toContain(
      "Choose a valid difficulty/category.",
    );
  });

  it("preserves submitted values after validation fails", () => {
    const state = invalidLevelState({
      name: "Submitted Name",
      gdLevelId: "abc",
      rank: "12",
    });

    expect(state.values.name).toBe("Submitted Name");
    expect(state.values.gdLevelId).toBe("abc");
    expect(state.values.rank).toBe("12");
  });

  it("returns rank service errors as field-level form state", () => {
    const state = levelMutationErrorState(
      {
        ...validLevel,
        id: "",
        thumbnailFile: "",
      },
      "rank-required",
    );

    expect(state.summary).toBe("Fix the highlighted fields below.");
    expect(state.fieldErrors.rank).toContain(
      "Rank must be a positive whole number.",
    );
  });

  it("does not reject an occupied-looking valid rank during validation", () => {
    const result = validateLevelFormSubmission(
      levelFormData({
        ...validLevel,
        rank: "1",
      }),
    );

    expect(result.success).toBe(true);
  });
});
