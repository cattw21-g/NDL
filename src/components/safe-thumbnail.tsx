"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import { safeThumbnailSrc, FALLBACK_THUMBNAIL_SRC } from "@/lib/media";

const DEFAULT_SIZES =
  "(max-width: 640px) 144px, (max-width: 768px) 176px, (max-width: 1024px) 208px, 224px";

function isOptimizableSource(src: string): boolean {
  if (!src) return false;
  if (src.startsWith("blob:") || src.startsWith("data:")) return false;
  if (src.endsWith(".svg") || src.includes(".svg?")) return false;
  if (src.endsWith(".gif") || src.includes(".gif?")) return false;
  if (src.startsWith("/")) return true; // Local static public images
  try {
    const url = new URL(src);
    const host = url.hostname.toLowerCase();
    if (host.endsWith(".public.blob.vercel-storage.com")) return true;
    if (host === "img.youtube.com" || host === "i.ytimg.com") return true;
    if (host === "cdn.discordapp.com") return true;
  } catch {}
  return false;
}

export function SafeThumbnail({
  src,
  alt,
  className,
  allowObjectUrl = false,
  fallbackSrc,
  priority = false,
  sizes,
  quality = 80,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  allowObjectUrl?: boolean;
  fallbackSrc?: string | null;
  priority?: boolean;
  sizes?: string;
  quality?: number;
}) {
  const initialSrc = useMemo(
    () => safeThumbnailSrc(src, { allowObjectUrl }),
    [allowObjectUrl, src],
  );
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const fallback = useMemo(() => {
    if (fallbackSrc) {
      return safeThumbnailSrc(fallbackSrc, { allowObjectUrl });
    }
    return FALLBACK_THUMBNAIL_SRC;
  }, [allowObjectUrl, fallbackSrc]);

  const imageSrc =
    failedSrc === initialSrc
      ? fallback
      : failedSrc === fallback
        ? FALLBACK_THUMBNAIL_SRC
        : initialSrc;

  const isOptimizable = isOptimizableSource(imageSrc);

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      sizes={sizes || DEFAULT_SIZES}
      quality={quality}
      priority={priority}
      unoptimized={!isOptimizable}
      className={className}
      onError={() => {
        if (failedSrc !== initialSrc) {
          setFailedSrc(initialSrc);
        } else {
          setFailedSrc(fallback);
        }
      }}
    />
  );
}
