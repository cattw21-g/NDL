import type { z } from "zod";

import { levelSchema, formDataToObject } from "./validation";

export const LEVEL_FORM_SUMMARY = "Fix the highlighted fields below.";

export const levelFormFields = [
  "id",
  "name",
  "originalName",
  "gdLevelId",
  "publisher",
  "nerfCreator",
  "verifier",
  "thumbnailFile",
  "thumbnailUrl",
  "showcaseUrl",
  "placementDate",
  "rank",
  "status",
  "difficulty",
  "description",
  "versionNotes",
] as const;

export type LevelFormField = (typeof levelFormFields)[number];
export type LevelFormValues = Record<LevelFormField, string>;
export type LevelFormFieldErrors = Partial<Record<LevelFormField, string[]>>;

export type LevelFormState = {
  ok: boolean;
  values: LevelFormValues;
  fieldErrors: LevelFormFieldErrors;
  formErrors: string[];
  summary: string | null;
};

export type LevelFormValidationResult =
  | {
      success: true;
      data: z.infer<typeof levelSchema>;
      values: LevelFormValues;
    }
  | {
      success: false;
      state: LevelFormState;
    };

export const emptyLevelFormValues: LevelFormValues = {
  id: "",
  name: "",
  originalName: "",
  gdLevelId: "",
  publisher: "",
  nerfCreator: "",
  verifier: "",
  thumbnailFile: "",
  thumbnailUrl: "/demo-thumbnails/level-1.svg",
  showcaseUrl: "",
  placementDate: "",
  rank: "",
  status: "PENDING",
  difficulty: "EXTREME",
  description: "",
  versionNotes: "",
};

export function createLevelFormState(
  values: Partial<LevelFormValues> = {},
): LevelFormState {
  return {
    ok: true,
    values: {
      ...emptyLevelFormValues,
      ...values,
    },
    fieldErrors: {},
    formErrors: [],
    summary: null,
  };
}

export function valuesFromFormData(formData: FormData): LevelFormValues {
  const values = { ...emptyLevelFormValues };

  for (const field of levelFormFields) {
    const value = formData.get(field);
    values[field] = typeof value === "string" ? value : "";
  }

  return values;
}

export function validateLevelFormSubmission(
  formData: FormData,
): LevelFormValidationResult {
  const values = valuesFromFormData(formData);
  const object = formDataToObject(formData);

  if (hasUsableFormFile(formData.get("thumbnailFile"))) {
    object.thumbnailUrl = "/demo-thumbnails/level-1.svg";
  }

  const parsed = levelSchema.safeParse(object);

  if (parsed.success) {
    return {
      success: true,
      data: parsed.data,
      values,
    };
  }

  return {
    success: false,
    state: createLevelFormErrorState(values, {
      fieldErrors: fieldErrorsFromZod(parsed.error),
      formErrors: parsed.error.issues
        .filter((issue) => issue.path.length === 0)
        .map((issue) => issue.message),
    }),
  };
}

function hasUsableFormFile(value: unknown) {
  return (
    typeof File !== "undefined" &&
    value instanceof File &&
    value.size > 0
  );
}

export function createLevelFormErrorState(
  values: LevelFormValues,
  errors: {
    fieldErrors?: LevelFormFieldErrors;
    formErrors?: string[];
  },
): LevelFormState {
  return {
    ok: false,
    values,
    fieldErrors: errors.fieldErrors ?? {},
    formErrors: errors.formErrors ?? [],
    summary: LEVEL_FORM_SUMMARY,
  };
}

export function fieldErrorsFromZod(error: z.ZodError): LevelFormFieldErrors {
  const fieldErrors: LevelFormFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (!isLevelFormField(field)) {
      continue;
    }

    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
  }

  return fieldErrors;
}

export function levelMutationErrorState(
  values: LevelFormValues,
  error: string,
): LevelFormState {
  if (error === "rank-required") {
    return createLevelFormErrorState(values, {
      fieldErrors: {
        rank: ["Rank must be a positive whole number."],
      },
    });
  }

  if (error === "missing") {
    return createLevelFormErrorState(values, {
      formErrors: ["The requested level was not found."],
    });
  }

  return createLevelFormErrorState(values, {
    formErrors: ["That level could not be saved. Refresh and try again."],
  });
}

function isLevelFormField(value: unknown): value is LevelFormField {
  return (
    typeof value === "string" &&
    (levelFormFields as readonly string[]).includes(value)
  );
}
