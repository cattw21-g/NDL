"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";

import { safeThumbnailSrc, FALLBACK_THUMBNAIL_SRC } from "@/lib/media";

export function SafeThumbnail({
  src,
  alt,
  className,
  allowObjectUrl = false,
  fallbackSrc,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  allowObjectUrl?: boolean;
  fallbackSrc?: string | null;
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

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
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
