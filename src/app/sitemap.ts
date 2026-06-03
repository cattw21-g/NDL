import type { MetadataRoute } from "next";

import { absoluteSiteUrl } from "@/lib/site-url";

const publicRoutes = [
  "/",
  "/rules",
  "/players",
  "/submit",
  "/suggest-level",
  "/level-suggestions",
  "/changelog",
  "/news",
  "/login",
  "/register",
  "/verify-email",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicRoutes.map((route) => ({
    url: absoluteSiteUrl(route),
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
