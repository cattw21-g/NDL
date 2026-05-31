import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";
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
  thumbnailUploadContentTypes,
} from "@/lib/thumbnail-upload";

export const dynamic = "force-dynamic";

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
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Blob thumbnail upload failed.", error);
    return NextResponse.json(
      { error: "Thumbnail upload failed. Try again or use an image URL." },
      { status: 400 },
    );
  }
}
