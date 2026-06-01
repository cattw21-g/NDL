"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerAction } from "@/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import {
  cx,
  FieldLabel,
  inputClass,
  SectionPanel,
} from "@/components/ui";
import {
  createRegisterFormState,
  type RegisterFormField,
} from "@/lib/register-form-state";

const invalidClass =
  "border-red-500 focus:border-red-600 focus:ring-red-200 dark:border-red-400 dark:focus:border-red-300 dark:focus:ring-red-500/30";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    createRegisterFormState(),
  );
  const values = state.values;

  return (
    <form action={formAction} aria-busy={pending}>
      <SectionPanel className="space-y-4 p-5">
        {state.summary ? (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-700 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-200"
          >
            <p className="font-black">{state.summary}</p>
            {state.formErrors.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {state.formErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        <TextInput
          name="email"
          label="Email"
          type="email"
          defaultValue={values.email}
          errors={state.fieldErrors.email}
        />
        <TextInput
          name="playerName"
          label="Handle"
          defaultValue={values.playerName}
          errors={state.fieldErrors.playerName}
        />
        <TextInput
          name="password"
          label="Password"
          type="password"
          minLength={10}
          defaultValue={values.password}
          errors={state.fieldErrors.password}
        />
        <TextInput
          name="confirmPassword"
          label="Confirm password"
          type="password"
          minLength={10}
          defaultValue={values.confirmPassword}
          errors={state.fieldErrors.confirmPassword}
        />
        <SubmitButton className="w-full">Register</SubmitButton>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          We will send a verification link before submissions unlock.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-black text-cyan-800 dark:text-cyan-300"
          >
            Login
          </Link>
        </p>
      </SectionPanel>
    </form>
  );
}

function TextInput({
  name,
  label,
  type = "text",
  minLength,
  defaultValue,
  errors,
}: {
  name: RegisterFormField;
  label: string;
  type?: string;
  minLength?: number;
  defaultValue: string;
  errors?: string[];
}) {
  const hasErrors = Boolean(errors?.length);
  const errorId = `${name}-error`;

  return (
    <FieldLabel label={label}>
      <input
        name={name}
        type={type}
        minLength={minLength}
        defaultValue={defaultValue}
        required
        aria-invalid={hasErrors}
        aria-describedby={hasErrors ? errorId : undefined}
        className={cx(inputClass, hasErrors && invalidClass)}
      />
      <FieldErrors id={errorId} errors={errors} />
    </FieldLabel>
  );
}

function FieldErrors({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return (
    <ul id={id} className="space-y-1 text-xs font-bold text-red-600 dark:text-red-300">
      {errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}
