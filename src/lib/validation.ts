import { z } from "zod";

import { isValidPublicUploadMediaPath, isValidThumbnailSource } from "./media";

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

const proofResourceUrl = z
  .string()
  .trim()
  .refine(
    (value) => isHttpUrl(value) || isValidPublicUploadMediaPath(value),
    "Use a valid http/https link or local upload path.",
  );

const requiredText = (message: string, max: number) =>
  z.string({ error: message }).trim().min(1, message).max(max);
const requiredHttpUrl = (message: string) =>
  z
    .string({ error: message })
    .trim()
    .min(1, message)
    .refine((value) => {
      try {
        const protocol = new URL(value).protocol;
        return protocol === "http:" || protocol === "https:";
      } catch {
        return false;
      }
    }, message);
const thumbnailMessage =
  "Thumbnail must be a valid http/https image URL or a local public path like /thumbnails/example.png.";
const rankMessage = "Rank must be a positive whole number.";

const optionalProofResourceUrl = z.preprocess(
  emptyToUndefined,
  proofResourceUrl.optional(),
);
const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());
const checkboxBoolean = z.preprocess(
  (value) =>
    value === true ||
    value === "true" ||
    value === "on" ||
    value === "1",
  z.boolean(),
);

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

export const registerSchema = z
  .object({
    email: z.email().trim().toLowerCase(),
    playerName: z
      .string()
      .trim()
      .min(2)
      .max(32)
      .regex(/^[a-zA-Z0-9_-]+$/, "Use letters, numbers, underscores, or dashes."),
    password: z.string().min(10).max(128),
    confirmPassword: z
      .string({ error: "Confirm password is required." })
      .min(1, "Confirm password is required.")
      .max(128),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export const submissionSchema = z
  .object({
    levelId: z.string().min(1),
    videoUrl: proofResourceUrl,
    rawFootageUrl: optionalProofResourceUrl,
    proofImageUrl: optionalProofResourceUrl,
    fps: z.coerce.number().int().min(30).max(10000),
    cbfUsed: checkboxBoolean,
    clickAudioIncluded: checkboxBoolean,
    separateMicClickTrack: checkboxBoolean,
    gameAudioIncluded: checkboxBoolean,
    rawFootageIncluded: checkboxBoolean,
    fpsOverlayVisible: checkboxBoolean,
    cpsCounterVisible: checkboxBoolean,
    cheatIndicatorVisible: checkboxBoolean,
    microphoneModel: optionalText(120),
    inputDevice: z.string().trim().min(2).max(160),
    proofNotes: optionalText(1000),
    comments: optionalText(1000),
  })
  .superRefine((value, context) => {
    if (value.rawFootageIncluded && !value.rawFootageUrl) {
      context.addIssue({
        code: "custom",
        path: ["rawFootageUrl"],
        message: "Provide a raw footage link when raw footage is included.",
      });
    }

    if (value.rawFootageUrl && !value.rawFootageIncluded) {
      context.addIssue({
        code: "custom",
        path: ["rawFootageIncluded"],
        message: "Mark raw footage as included when a raw footage link is provided.",
      });
    }
  });

export const reviewSchema = z.object({
  submissionId: z.string().min(1),
  status: z.enum(["ACCEPTED", "REJECTED", "NEEDS_CHANGES"]),
  moderatorNotes: z.string().trim().min(3).max(1000),
});

export const levelSuggestionSchema = z.object({
  name: requiredText("Level name is required.", 120),
  originalName: requiredText("Original level is required.", 120),
  gdLevelId: z
    .string({ error: "GD level ID must contain only numbers." })
    .trim()
    .regex(/^\d+$/, "GD level ID must contain only numbers.")
    .max(32, "GD level ID must contain only numbers."),
  publisher: requiredText("Publisher/host is required.", 80),
  nerfCreator: requiredText("Nerf creator is required.", 80),
  verifier: requiredText("Verifier is required.", 80),
  showcaseUrl: requiredHttpUrl("Showcase must be a valid http/https URL."),
  versionNotes: optionalText(1000),
  compatibilityNotes: requiredText(
    "Explain how the nerf preserves original route/timing compatibility.",
    1500,
  ),
});

export const levelSuggestionReviewSchema = z.object({
  suggestionId: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED", "NEEDS_CHANGES"]),
  moderatorNotes: z.string().trim().min(3).max(1000),
});

export const levelSuggestionConvertSchema = z.object({
  suggestionId: z.string().min(1),
});

export const levelSchema = z.object({
  id: z.preprocess(emptyToUndefined, z.string().optional()),
  sourceSuggestionId: z.preprocess(emptyToUndefined, z.string().optional()),
  name: requiredText("Level name is required.", 120),
  originalName: requiredText("Original level is required.", 120),
  gdLevelId: z
    .string({ error: "GD level ID must contain only numbers." })
    .trim()
    .regex(/^\d+$/, "GD level ID must contain only numbers.")
    .max(32, "GD level ID must contain only numbers."),
  publisher: requiredText("Publisher/host is required.", 80),
  nerfCreator: requiredText("Nerf creator is required.", 80),
  verifier: requiredText("Verifier is required.", 80),
  thumbnailUrl: z
    .string({ error: thumbnailMessage })
    .trim()
    .min(1, thumbnailMessage)
    .refine(isValidThumbnailSource, thumbnailMessage),
  showcaseUrl: requiredHttpUrl("Showcase must be a valid http/https URL."),
  placementDate: z.preprocess(
    emptyToUndefined,
    z.coerce.date().optional(),
  ),
  rank: z.preprocess(
    (value) => {
      const trimmed = emptyToUndefined(value);
      if (typeof trimmed === "string" && /^\d+$/.test(trimmed)) {
        return Number(trimmed);
      }
      return trimmed;
    },
    z
      .number({ error: rankMessage })
      .int(rankMessage)
      .min(1, rankMessage)
      .max(500, rankMessage)
      .optional(),
  ),
  status: z.enum(
    ["RANKED", "LEGACY", "PENDING", "REJECTED", "REMOVED"],
    "Choose a valid status.",
  ),
  difficulty: z.enum(
    ["ENTRY", "ADVANCED", "EXTREME", "MYTHIC", "ASCENT"],
    "Choose a valid difficulty/category.",
  ),
  description: z.string().trim().min(10).max(2000),
  versionNotes: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(1000).optional(),
  ),
});

export const userRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "MODERATOR", "PLAYER"]),
});

export const rulesSchema = z.object({
  version: z.string().trim().min(1).max(40),
  content: z.string().trim().min(50).max(12000),
});

export const changelogSchema = z.object({
  title: z.string().trim().min(3).max(120),
  content: z.string().trim().min(20).max(6000),
});

export const verifyEmailCodeSchema = z.object({
  email: z.email().trim().toLowerCase(),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the six digit code."),
});

export const resendVerificationSchema = z.object({
  email: z.email().trim().toLowerCase(),
});

export function formDataToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function isHttpUrl(value: string) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}
