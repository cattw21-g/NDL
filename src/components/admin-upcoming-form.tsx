"use client";

import { upload } from "@vercel/blob/client";
import {
  type FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ImagePlus, Plus, UploadCloud } from "lucide-react";

import { addUpcomingLevelAction, updateUpcomingThumbnailAction } from "@/actions/upcoming";
import { SafeThumbnail } from "@/components/safe-thumbnail";
import { inputClass } from "@/components/ui";
import {
  blobThumbnailPathname,
  validateThumbnailUploadCandidate,
} from "@/lib/thumbnail-upload";
import type { ImageUploadProvider } from "@/lib/upload-storage";

export function AdminUpcomingLevelForm({
  imageUploadProvider,
  maxImageMb,
}: {
  imageUploadProvider: ImageUploadProvider;
  maxImageMb: number;
}) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailUrlInputRef = useRef<HTMLInputElement>(null);
  const skipBlobUploadRef = useRef(false);

  const [levelName, setLevelName] = useState("");
  const [thumbnailUrlValue, setThumbnailUrlValue] = useState("");
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
        blobThumbnailPathname(levelName || thumbnailUrlValue || file.name, file),
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
      action={addUpcomingLevelAction}
      onSubmit={handleSubmit}
      noValidate
      aria-busy={blobUploading}
      className="mt-4 grid gap-5"
    >
      {clientError ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-200"
        >
          {clientError}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Left Column: Metadata Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
              Level Name (Nerfed Name) *
            </span>
            <input
              name="name"
              placeholder="e.g. Nerfed Slaughterhouse"
              required
              value={levelName}
              onChange={(e) => setLevelName(e.target.value)}
              className={`${inputClass} mt-1 w-full font-black`}
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
              Original Demon Name *
            </span>
            <input
              name="originalName"
              placeholder="e.g. Slaughterhouse"
              required
              className={`${inputClass} mt-1 w-full`}
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
              GD Level ID
            </span>
            <input
              name="gdLevelId"
              placeholder="e.g. 102938475"
              className={`${inputClass} mt-1 w-full font-mono`}
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
              Verifier (Leave empty for Waiting Levels)
            </span>
            <input
              name="verifier"
              placeholder="Leave empty or enter player name"
              className={`${inputClass} mt-1 w-full`}
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
              Nerf Creator *
            </span>
            <input
              name="nerfCreator"
              placeholder="Creator name"
              required
              className={`${inputClass} mt-1 w-full`}
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
              Difficulty Tier
            </span>
            <select
              name="difficulty"
              defaultValue="EXTREME"
              className={`${inputClass} mt-1 w-full font-semibold`}
            >
              <option value="EXTREME">Extreme Nerfed</option>
              <option value="MYTHIC">Mythic Nerfed</option>
              <option value="ADVANCED">Advanced Nerfed</option>
              <option value="ENTRY">Entry Nerfed</option>
              <option value="ASCENT">Ascent Nerfed</option>
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
              Showcase / Verification Video URL (Medal / TikTok / YouTube)
            </span>
            <input
              name="showcaseUrl"
              placeholder="https://youtu.be/... or medal.tv/..."
              className={`${inputClass} mt-1 w-full`}
            />
          </label>
        </div>

        {/* Right Column: Image / Thumbnail Upload & Preview System */}
        <div className="flex flex-col justify-between rounded-md border border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
                Level Thumbnail Image
              </span>
              <span className="text-[11px] font-bold text-cyan-700 dark:text-cyan-400">
                Max {maxImageMb} MB
              </span>
            </div>

            {/* Thumbnail Preview Screen */}
            <div className="relative aspect-video w-full overflow-hidden rounded-md border border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-900">
              <SafeThumbnail
                src={previewSrc}
                alt="Level thumbnail preview"
                className="h-full w-full object-cover"
                allowObjectUrl={Boolean(uploadedPreview)}
              />
              {!previewSrc ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-4 text-center text-xs font-bold text-slate-500">
                  <ImagePlus className="h-6 w-6 text-slate-400" />
                  <span>No custom image selected yet (Default fallback will be used)</span>
                </div>
              ) : null}
            </div>

            {/* File Upload Input */}
            <div className="mt-3">
              <label
                htmlFor={`${formId}-file`}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-400 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-cyan-600 hover:bg-cyan-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950/40"
              >
                <UploadCloud className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <span>
                  {uploadedPreview ? uploadedPreview.name : "Upload Image File (PNG, JPG, WebP)"}
                </span>
              </label>
              <input
                id={`${formId}-file`}
                ref={fileInputRef}
                name="thumbnailFile"
                type="file"
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                className="sr-only"
                onChange={(e) => {
                  setClientError(null);
                  const file = e.target.files?.[0] ?? null;
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
            </div>

            {/* Image URL fallback */}
            <div className="mt-3">
              <span className="text-[11px] font-bold text-slate-500">
                Or enter an Image URL:
              </span>
              <input
                ref={thumbnailUrlInputRef}
                name="thumbnailUrl"
                type="url"
                value={thumbnailUrlValue}
                onChange={(e) => setThumbnailUrlValue(e.target.value)}
                placeholder="https://.../thumbnail.png"
                className={`${inputClass} mt-1 w-full text-xs`}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-4 pt-3">
            <button
              type="submit"
              disabled={blobUploading}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 text-sm font-black text-white shadow transition hover:bg-cyan-800 disabled:opacity-50 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
            >
              <Plus className="h-4 w-4" />
              {blobUploading ? "Uploading Image..." : "Add Level to Upcoming Queue"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export function UpcomingThumbnailInlineEditor({
  levelId,
  levelName,
  currentThumbnailUrl,
  imageUploadProvider,
  maxImageMb,
}: {
  levelId: string;
  levelName: string;
  currentThumbnailUrl: string;
  imageUploadProvider: ImageUploadProvider;
  maxImageMb: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(currentThumbnailUrl);
  const [uploading, setUploading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFileUpload(file: File) {
    setClientError(null);
    const maxBytes = maxImageMb * 1024 * 1024;
    const error = validateThumbnailUploadCandidate(file, maxBytes);
    if (error) {
      setClientError(error);
      return;
    }

    try {
      setUploading(true);
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      const blob = await upload(
        blobThumbnailPathname(levelName || file.name, file),
        file,
        {
          access: "public",
          handleUploadUrl: "/api/admin/blob-thumbnail-upload",
          contentType: file.type,
          multipart: file.size > 4 * 1024 * 1024,
        },
      );

      setThumbnailUrl(blob.url);
      setPreview(null);
    } catch (err) {
      console.error("Upload error", err);
      setClientError("Failed to upload image. Please try an image URL.");
    } finally {
      setUploading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-7 items-center gap-1 rounded border border-slate-300 bg-white px-2 text-[11px] font-bold text-slate-700 transition hover:border-cyan-500 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-cyan-300"
      >
        <ImagePlus className="h-3 w-3" />
        Edit Image
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-md border border-cyan-500/40 bg-cyan-50/50 p-3 dark:border-cyan-500/30 dark:bg-cyan-950/30">
      <div className="flex items-center justify-between gap-2 pb-2">
        <span className="text-xs font-black text-cyan-950 dark:text-cyan-100">
          Update Thumbnail for {levelName}
        </span>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setPreview(null);
          }}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          Cancel
        </button>
      </div>

      {clientError ? (
        <p className="mb-2 text-xs font-bold text-red-600 dark:text-red-400">
          {clientError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950">
          <SafeThumbnail
            src={preview ?? thumbnailUrl}
            alt={levelName}
            className="h-full w-full object-cover"
            allowObjectUrl={Boolean(preview)}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {imageUploadProvider !== "disabled" ? (
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm border border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <UploadCloud className="h-3.5 w-3.5 text-cyan-600" />
              <span>{uploading ? "Uploading..." : "Upload New File"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </label>
          ) : null}

          <form action={updateUpcomingThumbnailAction} className="flex items-center gap-1.5">
            <input type="hidden" name="levelId" value={levelId} />
            <input
              name="thumbnailUrl"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="Or paste image URL..."
              className={`${inputClass} text-xs flex-1`}
            />
            <button
              type="submit"
              disabled={uploading}
              className="inline-flex min-h-8 items-center rounded bg-cyan-700 px-3 text-xs font-black text-white hover:bg-cyan-800 dark:bg-cyan-500 dark:text-slate-950"
            >
              Save
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
