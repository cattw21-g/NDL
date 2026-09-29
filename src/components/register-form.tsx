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
import { getAllCountries } from "@/lib/countries";

const invalidClass =
  "border-red-500 focus:border-red-600 focus:ring-red-200 dark:border-red-400 dark:focus:border-red-300 dark:focus:ring-red-500/30";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    createRegisterFormState(),
  );
  const values = state.values;
  const allCountries = getAllCountries();

  return (
    <form action={formAction} aria-busy={pending}>
      {/* Invisible Anti-Bot Honeypot */}
      <div style={{ display: "none" }} aria-hidden="true" tabIndex={-1}>
        <input
          type="text"
          name="website_url_hp"
          autoComplete="off"
          tabIndex={-1}
        />
      </div>
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
          label="Username"
          defaultValue={values.playerName}
          errors={state.fieldErrors.playerName}
        />
        <FieldLabel label="Select your country you represent (Optional)">
          <select
            name="countryCode"
            defaultValue={values.countryCode}
            className={cx(
              inputClass,
              state.fieldErrors.countryCode?.length ? invalidClass : "",
            )}
          >
            <option value="">🌐 None / Worldwide / Hidden</option>
            {allCountries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.continent})
              </option>
            ))}
          </select>
        </FieldLabel>
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

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300 dark:border-slate-700" />
          </div>
          <span className="relative bg-white px-2 text-xs font-bold uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            Or
          </span>
        </div>

        <a
          href="/api/auth/google"
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 shadow-sm"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          Continue with Google
        </a>

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
