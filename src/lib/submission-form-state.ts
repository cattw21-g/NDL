import type { z } from "zod";

import { formDataToObject, submissionSchema } from "./validation";

export const SUBMISSION_FORM_SUMMARY = "Fix the highlighted fields below.";

export const submissionFormFields = [
  "levelId",
  "videoUrl",
  "rawFootageUrl",
  "proofImageUrl",
  "completionVideoFile",
  "rawFootageFile",
  "proofImageFile",
  "fps",
  "cbfUsed",
  "clickAudioIncluded",
  "separateMicClickTrack",
  "gameAudioIncluded",
  "rawFootageIncluded",
  "fpsOverlayVisible",
  "cpsCounterVisible",
  "cheatIndicatorVisible",
  "microphoneModel",
  "inputDevice",
  "proofNotes",
  "comments",
] as const;

export type SubmissionFormField = (typeof submissionFormFields)[number];
export type SubmissionFormValues = Record<SubmissionFormField, string>;
export type SubmissionFormFieldErrors = Partial<
  Record<SubmissionFormField, string[]>
>;

export type SubmissionFormState = {
  ok: boolean;
  values: SubmissionFormValues;
  fieldErrors: SubmissionFormFieldErrors;
  formErrors: string[];
  summary: string | null;
};

export type SubmissionFormValidationResult =
  | {
      success: true;
      data: z.infer<typeof submissionSchema>;
      values: SubmissionFormValues;
    }
  | {
      success: false;
      state: SubmissionFormState;
    };

export const emptySubmissionFormValues: SubmissionFormValues = {
  levelId: "",
  videoUrl: "",
  rawFootageUrl: "",
  proofImageUrl: "",
  completionVideoFile: "",
  rawFootageFile: "",
  proofImageFile: "",
  fps: "",
  cbfUsed: "",
  clickAudioIncluded: "",
  separateMicClickTrack: "",
  gameAudioIncluded: "",
  rawFootageIncluded: "",
  fpsOverlayVisible: "",
  cpsCounterVisible: "",
  cheatIndicatorVisible: "",
  microphoneModel: "",
  inputDevice: "",
  proofNotes: "",
  comments: "",
};

export function createSubmissionFormState(
  values: Partial<SubmissionFormValues> = {},
): SubmissionFormState {
  return {
    ok: true,
    values: {
      ...emptySubmissionFormValues,
      ...values,
    },
    fieldErrors: {},
    formErrors: [],
    summary: null,
  };
}

export function valuesFromSubmissionFormData(
  formData: FormData,
): SubmissionFormValues {
  const values = { ...emptySubmissionFormValues };

  for (const field of submissionFormFields) {
    const value = formData.get(field);
    values[field] = typeof value === "string" ? value : "";
  }

  return values;
}

export function submissionObjectFromFormData(formData: FormData) {
  const object = formDataToObject(formData);

  if (isNonEmptyFormFile(formData.get("completionVideoFile"))) {
    object.videoUrl = "/uploads/completion-videos/pending.mp4";
  }

  if (isNonEmptyFormFile(formData.get("rawFootageFile"))) {
    object.rawFootageUrl = "/uploads/raw-footage/pending.mp4";
    object.rawFootageIncluded = "true";
  }

  if (isNonEmptyFormFile(formData.get("proofImageFile"))) {
    object.proofImageUrl = "/uploads/proof-images/pending.png";
  }

  return object;
}

export function validateSubmissionFormSubmission(
  formData: FormData,
): SubmissionFormValidationResult {
  const values = valuesFromSubmissionFormData(formData);
  const parsed = submissionSchema.safeParse(submissionObjectFromFormData(formData));

  if (parsed.success) {
    return {
      success: true,
      data: parsed.data,
      values,
    };
  }

  return {
    success: false,
    state: createSubmissionFormErrorState(values, {
      fieldErrors: submissionFieldErrorsFromZod(parsed.error),
      formErrors: parsed.error.issues
        .filter((issue) => issue.path.length === 0)
        .map((issue) => issue.message),
    }),
  };
}

export function createSubmissionFormErrorState(
  values: SubmissionFormValues,
  errors: {
    fieldErrors?: SubmissionFormFieldErrors;
    formErrors?: string[];
  },
): SubmissionFormState {
  return {
    ok: false,
    values,
    fieldErrors: errors.fieldErrors ?? {},
    formErrors: errors.formErrors ?? [],
    summary: SUBMISSION_FORM_SUMMARY,
  };
}

export function submissionFieldErrorsFromZod(
  error: z.ZodError,
): SubmissionFormFieldErrors {
  const fieldErrors: SubmissionFormFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (!isSubmissionFormField(field)) {
      continue;
    }

    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
  }

  return fieldErrors;
}

function isNonEmptyFormFile(value: unknown): value is File {
  return (
    typeof File !== "undefined" &&
    value instanceof File &&
    value.size > 0
  );
}

function isSubmissionFormField(value: unknown): value is SubmissionFormField {
  return (
    typeof value === "string" &&
    (submissionFormFields as readonly string[]).includes(value)
  );
}
