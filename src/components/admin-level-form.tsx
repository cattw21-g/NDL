"use client";

import { upload } from "@vercel/blob/client";
import {
  type ChangeEvent,
  type FormEvent,
  type RefObject,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { createLevelAction, updateLevelAction } from "@/actions/admin";
import { SafeThumbnail } from "@/components/safe-thumbnail";
import { SubmitButton } from "@/components/submit-button";
import {
  cx,
  FieldLabel,
  FormSection,
  inputClass,
  textareaClass,
} from "@/components/ui";
import { fieldHelp } from "@/lib/field-help";
import {
  createLevelFormState,
  type LevelFormField,
  type LevelFormValues,
} from "@/lib/level-form-state";
import {
  blobThumbnailPathname,
  validateThumbnailUploadCandidate,
} from "@/lib/thumbnail-upload";
import type { ImageUploadProvider } from "@/lib/upload-storage";

const statuses = ["RANKED", "LEGACY", "PENDING", "REJECTED", "REMOVED"];
const invalidClass =
  "border-red-500 focus:border-red-600 focus:ring-red-200 dark:border-red-400 dark:focus:border-red-300 dark:focus:ring-red-500/30";

export function AdminLevelForm({
  mode,
  initialValues,
  imageUploadProvider,
  maxImageMb,
}: {
  mode: "create" | "edit";
  initialValues?: Partial<LevelFormValues>;
  imageUploadProvider: ImageUploadProvider;
  maxImageMb: number;
}) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailUrlInputRef = useRef<HTMLInputElement>(null);
  const skipBlobUploadRef = useRef(false);
  const action = mode === "edit" ? updateLevelAction : createLevelAction;
  const [state, formAction, pending] = useActionState(
    action,
    createLevelFormState(initialValues),
  );
  const values = state.values;
  const [thumbnailUrlValue, setThumbnailUrlValue] = useState(values.thumbnailUrl);
  const [clientError, setClientError] = useState<string | null>(null);
  const [blobUploading, setBlobUploading] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const previewSrc = uploadedPreview?.url ?? thumbnailUrlValue;

  useEffect(() => {
    return () => {
      if (uploadedPreview?.url) {
        URL.revokeObjectURL(uploadedPreview.url);
      }
    };
  }, [uploadedPreview]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (imageUploadProvider !== "blob" || skipBlobUploadRef.current) {
      skipBlobUploadRef.current = false;
      return;
    }

    const file = fileInputRef.current?.files?.[0] ?? null;

    if (!file) {
      return;
    }

    event.preventDefault();
    setClientError(null);

    const maxBytes = maxImageMb * 1024 * 1024;
    const validationError = validateThumbnailUploadCandidate(file, maxBytes);

    if (validationError) {
      setClientError(validationError);
      return;
    }

    try {
      setBlobUploading(true);
      const blob = await upload(
        blobThumbnailPathname(values.name || thumbnailUrlValue || file.name, file),
        file,
        {
          access: "public",
          handleUploadUrl: "/api/admin/blob-thumbnail-upload",
          contentType: file.type,
          multipart: file.size > 4 * 1024 * 1024,
        },
      );

      setThumbnailUrlValue(blob.url);
      if (thumbnailUrlInputRef.current) {
        thumbnailUrlInputRef.current.value = blob.url;
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setUploadedPreview(null);
      skipBlobUploadRef.current = true;
      formRef.current?.requestSubmit();
    } catch (error) {
      console.error("Blob thumbnail upload failed.", error);
      setClientError("Thumbnail upload failed. Try again or use an image URL.");
    } finally {
      setBlobUploading(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      aria-busy={pending || blobUploading}
      className="mt-4 grid gap-4"
    >
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {values.sourceSuggestionId ? (
        <input
          type="hidden"
          name="sourceSuggestionId"
          value={values.sourceSuggestionId}
        />
      ) : null}
      <input type="hidden" name="difficulty" value={values.difficulty || "EXTREME"} />
      {state.summary || clientError ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-200"
        >
          <p className="font-black">
            {state.summary ?? "Fix the highlighted fields below."}
          </p>
          {clientError ? <p className="mt-2">{clientError}</p> : null}
          {state.formErrors.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {state.formErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <FormSection title="Identity">
        <div className="grid gap-4 md:grid-cols-3">
          <Field
            formId={formId}
            name="name"
            label="Level name"
            defaultValue={values.name}
            errors={state.fieldErrors.name}
          />
          <Field
            formId={formId}
            name="originalName"
            label="Original level"
            help={fieldHelp.originalName}
            defaultValue={values.originalName}
            errors={state.fieldErrors.originalName}
          />
          <Field
            formId={formId}
            name="gdLevelId"
            label="GD level ID"
            defaultValue={values.gdLevelId}
            errors={state.fieldErrors.gdLevelId}
          />
          <Field
            formId={formId}
            name="publisher"
            label="Publisher/host"
            help={fieldHelp.publisher}
            defaultValue={values.publisher}
            errors={state.fieldErrors.publisher}
          />
          <Field
            formId={formId}
            name="nerfCreator"
            label="Nerf creator"
            help={fieldHelp.nerfCreator}
            defaultValue={values.nerfCreator}
            errors={state.fieldErrors.nerfCreator}
          />
          <Field
            formId={formId}
            name="verifier"
            label="Verifier"
            help={fieldHelp.verifier}
            defaultValue={values.verifier}
            errors={state.fieldErrors.verifier}
          />
        </div>
      </FormSection>

      <FormSection title="Ranking and media">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:row-span-2">
            <span className="mb-2 block text-xs font-black uppercase text-slate-500 dark:text-slate-400">
              Thumbnail preview
            </span>
            <div className="aspect-video overflow-hidden rounded-md border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950">
              <SafeThumbnail
                src={previewSrc}
                alt="Level thumbnail preview"
                className="h-full w-full object-cover"
                allowObjectUrl={Boolean(uploadedPreview)}
              />
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
              {uploadedPreview
                ? `${uploadedPreview.name} is previewing locally and will replace the URL on submit.`
                : "Upload wins over the URL. Use PNG, JPG, or WebP."}
            </p>
          </div>
          <FileField
            inputRef={fileInputRef}
            formId={formId}
            name="thumbnailFile"
            label="Upload thumbnail"
            help={fieldHelp.thumbnailFile}
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            errors={state.fieldErrors.thumbnailFile}
            disabled={imageUploadProvider === "disabled"}
            provider={imageUploadProvider}
            maxImageMb={maxImageMb}
            onFileChange={(file) => {
              setClientError(null);
              setUploadedPreview(
                file
                  ? {
                      url: URL.createObjectURL(file),
                      name: file.name,
                    }
                  : null,
              );
            }}
          />
          <details
            open={imageUploadProvider === "disabled"}
            className="rounded-md border border-slate-300 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60 md:col-span-2"
          >
            <summary className="cursor-pointer text-sm font-black text-slate-800 dark:text-slate-200">
              Advanced: use image URL instead
            </summary>
            <div className="mt-3">
              <Field
                formId={formId}
                name="thumbnailUrl"
                label="Thumbnail URL"
                help={fieldHelp.thumbnailUrl}
                defaultValue={values.thumbnailUrl}
                value={thumbnailUrlValue}
                inputRef={thumbnailUrlInputRef}
                onValueChange={setThumbnailUrlValue}
                errors={state.fieldErrors.thumbnailUrl}
              />
            </div>
          </details>
          <Field
            formId={formId}
            name="showcaseUrl"
            label="Showcase URL"
            help={fieldHelp.showcaseUrl}
            defaultValue={values.showcaseUrl}
            errors={state.fieldErrors.showcaseUrl}
          />
          <Field
            formId={formId}
            name="placementDate"
            label="Placement date"
            type="date"
            defaultValue={values.placementDate}
            errors={state.fieldErrors.placementDate}
          />
          <Field
            formId={formId}
            name="rank"
            label="Rank"
            help={fieldHelp.rank}
            type="number"
            defaultValue={values.rank}
            errors={state.fieldErrors.rank}
          />
          <SelectField
            formId={formId}
            name="status"
            label="Status"
            help={fieldHelp.status}
            defaultValue={values.status}
            options={statuses}
            errors={state.fieldErrors.status}
          />
        </div>
      </FormSection>

      <FormSection
        title="List copy"
        description="Use description/version notes to document eligibility exceptions. Original replay/macro compatibility is a structural nerf check only; it never permits player record submissions with macros or replay bots."
      >
        <TextArea
          formId={formId}
          name="description"
          label="Description"
          defaultValue={values.description}
          rows={4}
          errors={state.fieldErrors.description}
        />
        <TextArea
          formId={formId}
          name="versionNotes"
          label="Version notes"
          help={fieldHelp.versionNotes}
          defaultValue={values.versionNotes}
          rows={3}
          placeholder="Document route fidelity, matching FPS/CBF or physics assumptions, and any approved exception such as bugfixes, impossible original transitions, or necessary 2.2 compatibility changes."
          errors={state.fieldErrors.versionNotes}
        />
      </FormSection>

      <SubmitButton>
        {blobUploading
          ? "Uploading thumbnail..."
          : mode === "edit"
            ? "Update level"
            : "Create level"}
      </SubmitButton>
    </form>
  );
}

function Field({
  formId,
  name,
  label,
  type = "text",
  defaultValue,
  value,
  inputRef,
  onValueChange,
  errors,
  help,
}: {
  formId: string;
  name: LevelFormField;
  label: string;
  type?: string;
  defaultValue: string;
  value?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  onValueChange?: (value: string) => void;
  errors?: string[];
  help?: string;
}) {
  const errorId = `${formId}-${name}-error`;
  const hasErrors = Boolean(errors?.length);

  return (
    <FieldLabel label={label} help={help}>
      <input
        ref={inputRef}
        name={name}
        type={type}
        {...(value === undefined
          ? { defaultValue }
          : {
              value,
              onChange: (event: ChangeEvent<HTMLInputElement>) =>
                onValueChange?.(event.currentTarget.value),
            })}
        aria-invalid={hasErrors}
        aria-describedby={hasErrors ? errorId : undefined}
        className={cx(inputClass, hasErrors && invalidClass)}
      />
      <FieldErrors id={errorId} errors={errors} />
    </FieldLabel>
  );
}

function FileField({
  inputRef,
  formId,
  name,
  label,
  help,
  accept,
  errors,
  disabled,
  provider,
  maxImageMb,
  onFileChange,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  formId: string;
  name: LevelFormField;
  label: string;
  help?: string;
  accept: string;
  errors?: string[];
  disabled: boolean;
  provider: ImageUploadProvider;
  maxImageMb: number;
  onFileChange?: (file: File | null) => void;
}) {
  const errorId = `${formId}-${name}-error`;
  const hasErrors = Boolean(errors?.length);

  const disabledMessage =
    "Production uploads are disabled. Use an image URL or configure Vercel Blob.";
  const enabledHint =
    provider === "blob"
      ? `Drop or choose a PNG, JPG, or WebP up to ${maxImageMb} MB. Uploads go to Vercel Blob and the URL is saved on submit.`
      : `Drop or choose a PNG, JPG, or WebP up to ${maxImageMb} MB. Upload wins over the URL on submit.`;

  function applyFile(file: File | null) {
    if (!inputRef.current || !file) {
      onFileChange?.(file);
      return;
    }

    const transfer = new DataTransfer();
    transfer.items.add(file);
    inputRef.current.files = transfer.files;
    onFileChange?.(file);
  }

  return (
    <FieldLabel label={label} help={help}>
      <div
        onDragOver={(event) => {
          if (!disabled) {
            event.preventDefault();
          }
        }}
        onDrop={(event) => {
          if (disabled) {
            return;
          }

          event.preventDefault();
          applyFile(event.dataTransfer.files?.[0] ?? null);
        }}
        className={cx(
          "rounded-md border border-dashed border-slate-400 bg-white p-3 transition dark:border-slate-600 dark:bg-slate-950",
          !disabled &&
            "hover:border-cyan-500 focus-within:border-cyan-700 focus-within:ring-2 focus-within:ring-cyan-200 dark:focus-within:border-cyan-400 dark:focus-within:ring-cyan-500/30",
          disabled && "opacity-80",
          hasErrors && invalidClass,
        )}
      >
        <input
          ref={inputRef}
          name={name}
          type="file"
          accept={accept}
          disabled={disabled}
          aria-invalid={hasErrors}
          aria-describedby={hasErrors ? errorId : undefined}
          className={cx(
            inputClass,
            "w-full min-w-0 max-w-full text-xs file:mr-3 file:max-w-[9rem] file:truncate file:rounded file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:file:bg-cyan-300 dark:file:text-slate-950",
          )}
          onChange={(event) =>
            onFileChange?.(event.currentTarget.files?.[0] ?? null)
          }
        />
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
          {disabled ? disabledMessage : enabledHint}
        </p>
      </div>
      <FieldErrors id={errorId} errors={errors} />
    </FieldLabel>
  );
}

function SelectField({
  formId,
  name,
  label,
  help,
  defaultValue,
  options,
  errors,
}: {
  formId: string;
  name: LevelFormField;
  label: string;
  help?: string;
  defaultValue: string;
  options: string[];
  errors?: string[];
}) {
  const errorId = `${formId}-${name}-error`;
  const hasErrors = Boolean(errors?.length);

  return (
    <FieldLabel label={label} help={help}>
      <select
        name={name}
        defaultValue={defaultValue}
        aria-invalid={hasErrors}
        aria-describedby={hasErrors ? errorId : undefined}
        className={cx(inputClass, hasErrors && invalidClass)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <FieldErrors id={errorId} errors={errors} />
    </FieldLabel>
  );
}

function TextArea({
  formId,
  name,
  label,
  help,
  defaultValue,
  rows,
  placeholder,
  errors,
}: {
  formId: string;
  name: LevelFormField;
  label: string;
  help?: string;
  defaultValue: string;
  rows: number;
  placeholder?: string;
  errors?: string[];
}) {
  const errorId = `${formId}-${name}-error`;
  const hasErrors = Boolean(errors?.length);

  return (
    <FieldLabel label={label} help={help}>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={hasErrors}
        aria-describedby={hasErrors ? errorId : undefined}
        className={cx(textareaClass, hasErrors && invalidClass)}
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
    <span id={id} className="text-sm font-bold text-red-700 dark:text-red-300">
      {errors[0]}
    </span>
  );
}
