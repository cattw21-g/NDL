import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  blobReadWriteToken,
  imageUploadProvider,
  maxImageUploadBytes,
} from "@/lib/upload-storage";
import {
  isValidSuggestionBlobThumbnailPathname,
  thumbnailUploadContentTypes,
} from "@/lib/thumbnail-upload";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const token = blobReadWriteToken();

  if (imageUploadProvider() !== "blob" || !token) {
    return NextResponse.json(
      {
        error:
          "Uploads are unavailable right now. You can paste a direct image URL instead.",
      },
      { status: 400 },
    );
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
        if (!isValidSuggestionBlobThumbnailPathname(pathname)) {
          throw new Error(
            "Suggestion thumbnail uploads must use the suggestion-thumbnails/ prefix.",
          );
        }

        return {
          allowedContentTypes: [...thumbnailUploadContentTypes],
          maximumSizeInBytes: maxImageUploadBytes(),
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
          tokenPayload: user.id,
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Suggestion Blob thumbnail upload failed.", error);
    return NextResponse.json(
      { error: "Thumbnail upload failed. Try again or use an image URL." },
      { status: 400 },
    );
  }
}
