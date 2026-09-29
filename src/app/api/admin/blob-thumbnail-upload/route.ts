import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";
import { put as putBlob } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/permissions";
import {
  blobReadWriteToken,
  imageUploadProvider,
  maxImageUploadBytes,
} from "@/lib/upload-storage";
import {
  isValidBlobThumbnailPathname,
  blobThumbnailPathname,
  validateThumbnailUploadCandidate,
  thumbnailUploadContentTypes,
} from "@/lib/thumbnail-upload";

export const dynamic = "force-dynamic";

function thumbnailUploadFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (/suspended|inactive|usage threshold/i.test(message)) {
    return NextResponse.json(
      {
        error:
          "Image storage is currently unavailable because the Vercel Blob store is suspended. Reactivate the store in Vercel or use an image URL.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { error: "Thumbnail upload failed. Try again or use an image URL." },
    { status: 400 },
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!isAdminRole(user.role)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const token = blobReadWriteToken();

  if (imageUploadProvider() !== "blob" || !token) {
    return NextResponse.json(
      {
        error:
          "Production uploads are disabled. Use an image URL or configure Vercel Blob.",
      },
      { status: 400 },
    );
  }

  if (request.headers.get("content-type")?.startsWith("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const file = formData.get("file");
      const nameHint = String(formData.get("nameHint") || "thumbnail").trim();

      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
      }

      const validationError = validateThumbnailUploadCandidate(file, maxImageUploadBytes());
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const blob = await putBlob(
        blobThumbnailPathname(nameHint || file.name, file),
        file,
        {
          access: "public",
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
          contentType: file.type || undefined,
          token,
        },
      );

      return NextResponse.json({ blob });
    } catch (error) {
      console.error("Direct thumbnail upload failed.", error);
      return thumbnailUploadFailure(error);
    }
  }

  let body: HandleUploadBody;

  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  try {
    const response = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async (pathname) => {
        if (!isValidBlobThumbnailPathname(pathname)) {
          throw new Error("Thumbnail uploads must use the thumbnails/ prefix.");
        }

        return {
          allowedContentTypes: [...thumbnailUploadContentTypes],
          maximumSizeInBytes: maxImageUploadBytes(),
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
          tokenPayload: user.id,
        };
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Blob thumbnail upload failed.", error);
    return thumbnailUploadFailure(error);
  }
}
