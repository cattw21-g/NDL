import type { z } from "zod";

import { formDataToObject, registerSchema } from "./validation";

export const REGISTER_FORM_SUMMARY = "Fix the highlighted fields below.";

export const registerFormFields = [
  "email",
  "playerName",
  "password",
  "confirmPassword",
] as const;

export type RegisterFormField = (typeof registerFormFields)[number];
export type RegisterFormValues = Record<RegisterFormField, string>;
export type RegisterFormFieldErrors = Partial<
  Record<RegisterFormField, string[]>
>;

export type RegisterFormState = {
  ok: boolean;
  values: RegisterFormValues;
  fieldErrors: RegisterFormFieldErrors;
  formErrors: string[];
  summary: string | null;
};

export type RegisterFormValidationResult =
  | {
      success: true;
      data: z.infer<typeof registerSchema>;
      values: RegisterFormValues;
    }
  | {
      success: false;
      state: RegisterFormState;
    };

export const emptyRegisterFormValues: RegisterFormValues = {
  email: "",
  playerName: "",
  password: "",
  confirmPassword: "",
};

export function createRegisterFormState(
  values: Partial<RegisterFormValues> = {},
): RegisterFormState {
  return {
    ok: true,
    values: {
      ...emptyRegisterFormValues,
      ...withoutPasswordValues(values),
    },
    fieldErrors: {},
    formErrors: [],
    summary: null,
  };
}

export function valuesFromRegisterFormData(formData: FormData) {
  const values = { ...emptyRegisterFormValues };

  for (const field of registerFormFields) {
    const value = formData.get(field);
    values[field] = typeof value === "string" ? value : "";
  }

  return values;
}

export function validateRegisterFormSubmission(
  formData: FormData,
): RegisterFormValidationResult {
  const values = valuesFromRegisterFormData(formData);
  const parsed = registerSchema.safeParse(formDataToObject(formData));

  if (parsed.success) {
    return {
      success: true,
      data: parsed.data,
      values,
    };
  }

  return {
    success: false,
    state: createRegisterFormErrorState(values, {
      fieldErrors: registerFieldErrorsFromZod(parsed.error),
      formErrors: parsed.error.issues
        .filter((issue) => issue.path.length === 0)
        .map((issue) => issue.message),
    }),
  };
}

export function createRegisterFormErrorState(
  values: RegisterFormValues,
  errors: {
    fieldErrors?: RegisterFormFieldErrors;
    formErrors?: string[];
  },
): RegisterFormState {
  return {
    ok: false,
    values: withoutPasswordValues(values),
    fieldErrors: errors.fieldErrors ?? {},
    formErrors: errors.formErrors ?? [],
    summary: REGISTER_FORM_SUMMARY,
  };
}

export function registerFieldErrorsFromZod(
  error: z.ZodError,
): RegisterFormFieldErrors {
  const fieldErrors: RegisterFormFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (!isRegisterFormField(field)) {
      continue;
    }

    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
  }

  return fieldErrors;
}

function withoutPasswordValues(
  values: Partial<RegisterFormValues>,
): RegisterFormValues {
  return {
    email: values.email ?? "",
    playerName: values.playerName ?? "",
    password: "",
    confirmPassword: "",
  };
}

function isRegisterFormField(value: unknown): value is RegisterFormField {
  return (
    typeof value === "string" &&
    (registerFormFields as readonly string[]).includes(value)
  );
}
