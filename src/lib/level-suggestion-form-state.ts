import type { z } from "zod";

import { formDataToObject, levelSuggestionSchema } from "./validation";

export const levelSuggestionFields = [
  "name",
  "originalName",
  "gdLevelId",
  "publisher",
  "nerfCreator",
  "verifier",
  "showcaseUrl",
  "thumbnailFile",
  "versionNotes",
  "compatibilityNotes",
] as const;

export type LevelSuggestionField = (typeof levelSuggestionFields)[number];
export type LevelSuggestionValues = Record<LevelSuggestionField, string>;

export type LevelSuggestionFormState = {
  ok: boolean;
  summary: string | null;
  values: LevelSuggestionValues;
  fieldErrors: Partial<Record<LevelSuggestionField, string[]>>;
  formErrors: string[];
};

const emptyValues = {
  name: "",
  originalName: "",
  gdLevelId: "",
  publisher: "",
  nerfCreator: "",
  verifier: "",
  showcaseUrl: "",
  thumbnailFile: "",
  versionNotes: "",
  compatibilityNotes: "",
} satisfies LevelSuggestionValues;

export function createLevelSuggestionFormState(
  values: Partial<LevelSuggestionValues> = {},
): LevelSuggestionFormState {
  return {
    ok: false,
    summary: null,
    values: {
      ...emptyValues,
      ...values,
    },
    fieldErrors: {},
    formErrors: [],
  };
}

export function createLevelSuggestionFormErrorState(
  values: LevelSuggestionValues,
  errors: {
    fieldErrors?: Partial<Record<LevelSuggestionField, string[]>>;
    formErrors?: string[];
  },
): LevelSuggestionFormState {
  return {
    ok: false,
    summary: "Fix the highlighted fields below.",
    values,
    fieldErrors: errors.fieldErrors ?? {},
    formErrors: errors.formErrors ?? [],
  };
}

export function validateLevelSuggestionFormSubmission(formData: FormData):
  | {
      success: true;
      data: z.infer<typeof levelSuggestionSchema>;
      values: LevelSuggestionValues;
    }
  | {
      success: false;
      state: LevelSuggestionFormState;
      values: LevelSuggestionValues;
    } {
  const object = formDataToObject(formData);
  const values = levelSuggestionValuesFromObject(object);
  const parsed = levelSuggestionSchema.safeParse(object);

  if (parsed.success) {
    return {
      success: true,
      data: parsed.data,
      values,
    };
  }

  const flattened = parsed.error.flatten();
  return {
    success: false,
    values,
    state: createLevelSuggestionFormErrorState(values, {
      fieldErrors: flattened.fieldErrors as Partial<
        Record<LevelSuggestionField, string[]>
      >,
      formErrors: flattened.formErrors,
    }),
  };
}

function levelSuggestionValuesFromObject(
  object: Record<string, FormDataEntryValue>,
) {
  return Object.fromEntries(
    levelSuggestionFields.map((field) => [
      field,
      typeof object[field] === "string" ? object[field] : "",
    ]),
  ) as LevelSuggestionValues;
}
