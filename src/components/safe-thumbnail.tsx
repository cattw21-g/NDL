"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";

import { safeThumbnailSrc, FALLBACK_THUMBNAIL_SRC } from "@/lib/media";

export function SafeThumbnail({
  src,
  alt,
  className,
  allowObjectUrl = false,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  allowObjectUrl?: boolean;
}) {
  const initialSrc = useMemo(
    () => safeThumbnailSrc(src, { allowObjectUrl }),
    [allowObjectUrl, src],
  );
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSrc =
    failedSrc === initialSrc ? FALLBACK_THUMBNAIL_SRC : initialSrc;

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setFailedSrc(initialSrc)}
    />
  );
}
