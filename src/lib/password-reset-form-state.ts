import type { z } from "zod";

import {
  formDataToObject,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "./validation";

export const PASSWORD_RESET_FORM_SUMMARY = "Fix the highlighted fields below.";
export const PASSWORD_RESET_GENERIC_SUCCESS =
  "If an account exists for that email, a reset code has been sent. If you do not see it, check your spam or junk folder.";

export const forgotPasswordFields = ["email"] as const;
export const resetPasswordFields = [
  "email",
  "token",
  "code",
  "password",
  "confirmPassword",
] as const;

export type ForgotPasswordField = (typeof forgotPasswordFields)[number];
export type ResetPasswordField = (typeof resetPasswordFields)[number];
export type ForgotPasswordValues = Record<ForgotPasswordField, string>;
export type ResetPasswordValues = Record<ResetPasswordField, string>;
export type ForgotPasswordFieldErrors = Partial<
  Record<ForgotPasswordField, string[]>
>;
export type ResetPasswordFieldErrors = Partial<
  Record<ResetPasswordField, string[]>
>;

export type ForgotPasswordFormState = {
  ok: boolean;
  values: ForgotPasswordValues;
  fieldErrors: ForgotPasswordFieldErrors;
  formErrors: string[];
  summary: string | null;
  successMessage: string | null;
};

export type ResetPasswordFormState = {
  ok: boolean;
  values: ResetPasswordValues;
  fieldErrors: ResetPasswordFieldErrors;
  formErrors: string[];
  summary: string | null;
  successMessage: string | null;
};

export type ForgotPasswordValidationResult =
  | {
      success: true;
      data: z.infer<typeof requestPasswordResetSchema>;
      values: ForgotPasswordValues;
    }
  | {
      success: false;
      state: ForgotPasswordFormState;
    };

export type ResetPasswordValidationResult =
  | {
      success: true;
      data: z.infer<typeof resetPasswordSchema>;
      values: ResetPasswordValues;
    }
  | {
      success: false;
      state: ResetPasswordFormState;
    };

export const emptyForgotPasswordValues: ForgotPasswordValues = {
  email: "",
};

export const emptyResetPasswordValues: ResetPasswordValues = {
  email: "",
  token: "",
  code: "",
  password: "",
  confirmPassword: "",
};

export function createForgotPasswordFormState(
  values: Partial<ForgotPasswordValues> = {},
): ForgotPasswordFormState {
  return {
    ok: true,
    values: {
      ...emptyForgotPasswordValues,
      ...values,
    },
    fieldErrors: {},
    formErrors: [],
    summary: null,
    successMessage: null,
  };
}

export function createForgotPasswordSuccessState(
  values: Partial<ForgotPasswordValues> = {},
): ForgotPasswordFormState {
  return {
    ...createForgotPasswordFormState(values),
    successMessage: PASSWORD_RESET_GENERIC_SUCCESS,
  };
}

export function createForgotPasswordErrorState(
  values: ForgotPasswordValues,
  errors: {
    fieldErrors?: ForgotPasswordFieldErrors;
    formErrors?: string[];
  },
): ForgotPasswordFormState {
  return {
    ok: false,
    values,
    fieldErrors: errors.fieldErrors ?? {},
    formErrors: errors.formErrors ?? [],
    summary: PASSWORD_RESET_FORM_SUMMARY,
    successMessage: null,
  };
}

export function createResetPasswordFormState(
  values: Partial<ResetPasswordValues> = {},
): ResetPasswordFormState {
  return {
    ok: true,
    values: {
      ...emptyResetPasswordValues,
      ...withoutResetPasswordValues(values),
    },
    fieldErrors: {},
    formErrors: [],
    summary: null,
    successMessage: null,
  };
}

export function createResetPasswordSuccessState(
  values: Partial<ResetPasswordValues> = {},
): ResetPasswordFormState {
  return {
    ...createResetPasswordFormState(values),
    successMessage:
      "Your password has been reset. You can now log in with the new password.",
  };
}

export function createResetPasswordErrorState(
  values: ResetPasswordValues,
  errors: {
    fieldErrors?: ResetPasswordFieldErrors;
    formErrors?: string[];
  },
): ResetPasswordFormState {
  return {
    ok: false,
    values: withoutResetPasswordValues(values),
    fieldErrors: errors.fieldErrors ?? {},
    formErrors: errors.formErrors ?? [],
    summary: PASSWORD_RESET_FORM_SUMMARY,
    successMessage: null,
  };
}

export function validateForgotPasswordFormSubmission(
  formData: FormData,
): ForgotPasswordValidationResult {
  const values = valuesFromForgotPasswordFormData(formData);
  const parsed = requestPasswordResetSchema.safeParse(formDataToObject(formData));

  if (parsed.success) {
    return {
      success: true,
      data: parsed.data,
      values,
    };
  }

  return {
    success: false,
    state: createForgotPasswordErrorState(values, {
      fieldErrors: forgotPasswordFieldErrorsFromZod(parsed.error),
      formErrors: parsed.error.issues
        .filter((issue) => issue.path.length === 0)
        .map((issue) => issue.message),
    }),
  };
}

export function validateResetPasswordFormSubmission(
  formData: FormData,
): ResetPasswordValidationResult {
  const values = valuesFromResetPasswordFormData(formData);
  const parsed = resetPasswordSchema.safeParse(formDataToObject(formData));

  if (parsed.success) {
    return {
      success: true,
      data: parsed.data,
      values,
    };
  }

  return {
    success: false,
    state: createResetPasswordErrorState(values, {
      fieldErrors: resetPasswordFieldErrorsFromZod(parsed.error),
      formErrors: parsed.error.issues
        .filter((issue) => issue.path.length === 0)
        .map((issue) => issue.message),
    }),
  };
}

function valuesFromForgotPasswordFormData(formData: FormData) {
  const values = { ...emptyForgotPasswordValues };

  for (const field of forgotPasswordFields) {
    const value = formData.get(field);
    values[field] = typeof value === "string" ? value : "";
  }

  return values;
}

function valuesFromResetPasswordFormData(formData: FormData) {
  const values = { ...emptyResetPasswordValues };

  for (const field of resetPasswordFields) {
    const value = formData.get(field);
    values[field] = typeof value === "string" ? value : "";
  }

  return values;
}

function forgotPasswordFieldErrorsFromZod(
  error: z.ZodError,
): ForgotPasswordFieldErrors {
  const fieldErrors: ForgotPasswordFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (field === "email") {
      fieldErrors.email = [...(fieldErrors.email ?? []), issue.message];
    }
  }

  return fieldErrors;
}

function resetPasswordFieldErrorsFromZod(
  error: z.ZodError,
): ResetPasswordFieldErrors {
  const fieldErrors: ResetPasswordFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (!isResetPasswordField(field)) {
      continue;
    }

    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
  }

  return fieldErrors;
}

function withoutResetPasswordValues(
  values: Partial<ResetPasswordValues>,
): ResetPasswordValues {
  return {
    email: values.email ?? "",
    token: values.token ?? "",
    code: values.code ?? "",
    password: "",
    confirmPassword: "",
  };
}

function isResetPasswordField(value: unknown): value is ResetPasswordField {
  return (
    typeof value === "string" &&
    (resetPasswordFields as readonly string[]).includes(value)
  );
}
