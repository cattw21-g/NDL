"use client";

import { useEffect } from "react";
import { markNewsPostAsRead } from "@/lib/news-read-store";

export function MarkNewsReadOnMount({ slug }: { slug: string }) {
  useEffect(() => {
    if (slug) {
      markNewsPostAsRead(slug);
    }
  }, [slug]);

  return null;
}
