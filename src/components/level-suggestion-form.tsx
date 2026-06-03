"use client";

import { upload } from "@vercel/blob/client";
import {
  type FormEvent,
  type RefObject,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";

import { submitLevelSuggestionAction } from "@/actions/level-suggestions";
import { SafeThumbnail } from "@/components/safe-thumbnail";
import { SubmitButton } from "@/components/submit-button";
import {
  cx,
  FieldLabel,
  FormSection,
  inputClass,
  SectionPanel,
  textareaClass,
} from "@/components/ui";
import { fieldHelp } from "@/lib/field-help";
import {
  createLevelSuggestionFormState,
  type LevelSuggestionField,
} from "@/lib/level-suggestion-form-state";
import {
  suggestionBlobThumbnailPathname,
  validateThumbnailUploadCandidate,
} from "@/lib/thumbnail-upload";
import type { ImageUploadProvider } from "@/lib/upload-storage";

const invalidClass =
  "border-red-500 focus:border-red-600 focus:ring-red-200 dark:border-red-400 dark:focus:border-red-300 dark:focus:ring-red-500/30";

export function LevelSuggestionForm({
  imageUploadProvider,
  maxImageMb,
}: {
  imageUploadProvider: ImageUploadProvider;
  maxImageMb: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailUrlInputRef = useRef<HTMLInputElement>(null);
  const skipBlobUploadRef = useRef(false);
  const [state, formAction, pending] = useActionState(
    submitLevelSuggestionAction,
    createLevelSuggestionFormState(),
  );
  const [clientError, setClientError] = useState<string | null>(null);
  const [blobUploading, setBlobUploading] = useState(false);
  const [thumbnailFileError, setThumbnailFileError] = useState<string | null>(
    null,
  );
  const values = state.values;
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState(
    values.thumbnailUrl,
  );
  const uploadsAvailable = imageUploadProvider !== "disabled";
  const thumbnailFileErrors = thumbnailFileError
    ? [thumbnailFileError]
    : state.fieldErrors.thumbnailFile;

  useEffect(() => {
    return () => {
      if (thumbnailPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnailPreviewUrl);
      }
    };
  }, [thumbnailPreviewUrl]);

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
    setThumbnailFileError(null);

    const maxBytes = maxImageMb * 1024 * 1024;
    const validationError = validateThumbnailUploadCandidate(file, maxBytes);

    if (validationError) {
      setClientError("Fix the highlighted fields below.");
      setThumbnailFileError(validationError);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const nameHint =
      formData.get("name")?.toString() ||
      formData.get("thumbnailUrl")?.toString() ||
      file.name;

    try {
      setBlobUploading(true);
      const blob = await upload(suggestionBlobThumbnailPathname(nameHint, file), file, {
        access: "public",
        handleUploadUrl: "/api/suggestions/blob-thumbnail-upload",
        contentType: file.type,
        multipart: file.size > 4 * 1024 * 1024,
      });

      if (thumbnailUrlInputRef.current) {
        thumbnailUrlInputRef.current.value = blob.url;
      }

      setThumbnailPreviewUrl(blob.url);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      skipBlobUploadRef.current = true;
      formRef.current?.requestSubmit();
    } catch (error) {
      console.error("Suggestion thumbnail upload failed.", error);
      setClientError("Fix the highlighted fields below.");
      setThumbnailFileError(
        "Thumbnail upload failed. Try again or use an image URL.",
      );
    } finally {
      setBlobUploading(false);
    }
  }

  function handleThumbnailFileChange(file: File | null) {
    setThumbnailFileError(null);

    if (!file) {
      setThumbnailPreviewUrl(thumbnailUrlInputRef.current?.value ?? "");
      return;
    }

    const maxBytes = maxImageMb * 1024 * 1024;
    const validationError = validateThumbnailUploadCandidate(file, maxBytes);

    if (validationError) {
      setThumbnailFileError(validationError);
      setThumbnailPreviewUrl(thumbnailUrlInputRef.current?.value ?? "");
      return;
    }

    setThumbnailPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      aria-busy={pending || blobUploading}
      className="grid min-w-0 gap-4"
    >
      {state.summary || clientError ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-200"
        >
          <p className="font-black">{state.summary ?? clientError}</p>
          {state.formErrors.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {state.formErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <SectionPanel className="grid gap-4 p-4">
        <FormSection
          title="Level identity"
          description="Use the accepted or intended public names and credits. Staff can request changes before approval."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <TextInput
              name="name"
              label="Level name"
              placeholder="Nerfed Bloodbath"
              defaultValue={values.name}
              errors={state.fieldErrors.name}
            />
            <TextInput
              name="originalName"
              label="Original level"
              help={fieldHelp.originalName}
              placeholder="Bloodbath"
              defaultValue={values.originalName}
              errors={state.fieldErrors.originalName}
            />
            <TextInput
              name="gdLevelId"
              label="GD level ID"
              placeholder="12345678"
              defaultValue={values.gdLevelId}
              errors={state.fieldErrors.gdLevelId}
            />
            <TextInput
              name="publisher"
              label="Publisher/host"
              help={fieldHelp.publisher}
              placeholder="Riot"
              defaultValue={values.publisher}
              errors={state.fieldErrors.publisher}
            />
            <TextInput
              name="nerfCreator"
              label="Nerf creator"
              help={fieldHelp.nerfCreator}
              placeholder="Creator handle"
              defaultValue={values.nerfCreator}
              errors={state.fieldErrors.nerfCreator}
            />
            <TextInput
              name="verifier"
              label="Verifier"
              help={fieldHelp.verifier}
              placeholder="Verifier handle"
              defaultValue={values.verifier}
              errors={state.fieldErrors.verifier}
            />
          </div>
        </FormSection>

        <FormSection
          title="Media and version"
          description="Showcase links must be full http/https URLs."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              name="showcaseUrl"
              label="Showcase link"
              help={fieldHelp.showcaseUrl}
              type="url"
              placeholder="https://youtu.be/..."
              defaultValue={values.showcaseUrl}
              errors={state.fieldErrors.showcaseUrl}
            />
            <TextArea
              name="versionNotes"
              label="Version notes"
              help={fieldHelp.versionNotes}
              defaultValue={values.versionNotes}
              errors={state.fieldErrors.versionNotes}
            />
          </div>
        </FormSection>

        <FormSection
          title="Optional thumbnail"
          description="Upload or link a proposed thumbnail. Staff may replace it during review."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {uploadsAvailable ? (
              <FileInput
                inputRef={fileInputRef}
                name="thumbnailFile"
                label="Thumbnail upload"
                help={fieldHelp.thumbnailFile}
                hint={
                  imageUploadProvider === "blob"
                    ? `Optional PNG, JPG, or WebP up to ${maxImageMb} MB. Uploads go to Vercel Blob and win over the URL.`
                    : `Optional PNG, JPG, or WebP up to ${maxImageMb} MB. Upload wins over the URL.`
                }
                errors={thumbnailFileErrors}
                onChange={handleThumbnailFileChange}
              />
            ) : (
              <p className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                Uploads are unavailable right now. You can paste a direct image
                URL instead.
              </p>
            )}
            <TextInput
              name="thumbnailUrl"
              label="Thumbnail URL (optional)"
              help="Optional direct image URL. Staff can add or replace it during review."
              type="url"
              required={false}
              placeholder="https://example.com/thumbnail.webp"
              inputRef={thumbnailUrlInputRef}
              defaultValue={values.thumbnailUrl}
              errors={state.fieldErrors.thumbnailUrl}
              onChange={(value) => setThumbnailPreviewUrl(value)}
            />
          </div>
          {thumbnailPreviewUrl ? (
            <div className="mt-4 grid gap-2">
              <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                Proposed preview
              </p>
              <div className="aspect-video w-full max-w-xl overflow-hidden rounded-md border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950/60">
                <SafeThumbnail
                  src={thumbnailPreviewUrl}
                  alt="Suggested thumbnail preview"
                  allowObjectUrl={thumbnailPreviewUrl.startsWith("blob:")}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          ) : null}
        </FormSection>

        <FormSection
          title="Compatibility notes"
          description="Explain how this nerf preserves the original route, click timing, speed, portals, gamemode order, and progression."
        >
          <TextArea
            name="compatibilityNotes"
            label="Macro/replay compatibility notes"
            help={fieldHelp.compatibilityNotes}
            defaultValue={values.compatibilityNotes}
            errors={state.fieldErrors.compatibilityNotes}
          />
        </FormSection>

        <div className="flex flex-col gap-3 border-t border-slate-300 pt-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            Approved suggestions are reviewed by staff before they become NDL
            levels.
          </p>
          <SubmitButton>
            {blobUploading ? "Uploading thumbnail..." : "Submit level suggestion"}
          </SubmitButton>
        </div>
      </SectionPanel>
    </form>
  );
}

function TextInput({
  name,
  label,
  type = "text",
  required = true,
  inputRef,
  defaultValue,
  errors,
  help,
  placeholder,
  onChange,
}: {
  name: LevelSuggestionField;
  label: string;
  type?: string;
  required?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  defaultValue: string;
  errors?: string[];
  help?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}) {
  const hasErrors = Boolean(errors?.length);

  return (
    <FieldLabel label={labelWithRequired(label, required)} help={help}>
      <input
        ref={inputRef}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={hasErrors}
        onChange={(event) => onChange?.(event.currentTarget.value)}
        className={cx(inputClass, "w-full min-w-0", hasErrors && invalidClass)}
      />
      <FieldErrors errors={errors} />
    </FieldLabel>
  );
}

function FileInput({
  inputRef,
  name,
  label,
  hint,
  errors,
  help,
  onChange,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  name: LevelSuggestionField;
  label: string;
  hint: string;
  errors?: string[];
  help?: string;
  onChange?: (file: File | null) => void;
}) {
  const hasErrors = Boolean(errors?.length);

  return (
    <FieldLabel label={label} help={help}>
      <input
        ref={inputRef}
        name={name}
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        aria-invalid={hasErrors}
        onChange={(event) => onChange?.(event.currentTarget.files?.[0] ?? null)}
        className={cx(
          inputClass,
          "w-full min-w-0 max-w-full text-xs file:mr-3 file:max-w-[9rem] file:truncate file:rounded file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-white dark:file:bg-cyan-300 dark:file:text-slate-950",
          hasErrors && invalidClass,
        )}
      />
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {hint}
      </span>
      <FieldErrors errors={errors} />
    </FieldLabel>
  );
}

function TextArea({
  name,
  label,
  defaultValue,
  errors,
  help,
}: {
  name: LevelSuggestionField;
  label: string;
  defaultValue: string;
  errors?: string[];
  help?: string;
}) {
  const hasErrors = Boolean(errors?.length);

  return (
    <FieldLabel label={labelWithRequired(label)} help={help}>
      <textarea
        name={name}
        rows={4}
        defaultValue={defaultValue}
        aria-invalid={hasErrors}
        className={cx(textareaClass, "w-full min-w-0", hasErrors && invalidClass)}
      />
      <FieldErrors errors={errors} />
    </FieldLabel>
  );
}

function labelWithRequired(label: string, required = true) {
  return required ? `${label} (required)` : label;
}

function FieldErrors({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return (
    <span className="text-sm font-bold text-red-700 dark:text-red-300">
      {errors[0]}
    </span>
  );
}
