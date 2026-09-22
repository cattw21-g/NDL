import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { apiOk } from "./api-response";

export interface CacheOptions {
  sMaxAge?: number;
  staleWhileRevalidate?: number;
}

/**
 * Standard Cache-Control headers for public API endpoints.
 */
export function publicCacheHeaders(
  sMaxAge = 60,
  staleWhileRevalidate = 300,
): Record<string, string> {
  return {
    "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
    Vary: "Accept-Encoding, Accept",
  };
}

/**
 * Generates a deterministic weak ETag for an arbitrary JSON payload.
 */
export function computeEtag(data: unknown): string {
  const json = typeof data === "string" ? data : JSON.stringify(data);
  const hash = crypto.createHash("sha1").update(json).digest("hex").slice(0, 16);
  return `W/"${hash}"`;
}

/**
 * Validates If-None-Match headers against the generated ETag.
 * Returns true if the client cache is already fresh (304 Not Modified).
 */
export function isEtagFresh(request: Request, etag: string): boolean {
  const clientEtag = request.headers.get("if-none-match");
  if (!clientEtag) return false;

  const cleanClient = clientEtag.trim();
  const cleanServer = etag.trim();

  if (cleanClient === cleanServer) return true;

  // Handle stripped weak prefixes or comma-separated lists
  const clientTokens = cleanClient.split(",").map((t) => t.trim().replace(/^W\//, ""));
  const serverToken = cleanServer.replace(/^W\//, "");

  return clientTokens.includes(serverToken);
}

/**
 * Delivers an API response with automatic ETag generation and Cache-Control headers.
 * If the client's If-None-Match matches, returns 304 Not Modified.
 */
export function cachedApiOk<T>(
  request: Request,
  data: T,
  options?: CacheOptions,
) {
  const sMaxAge = options?.sMaxAge ?? 60;
  const staleWhileRevalidate = options?.staleWhileRevalidate ?? 300;
  const headers = publicCacheHeaders(sMaxAge, staleWhileRevalidate);
  const etag = computeEtag(data);

  headers["ETag"] = etag;

  if (isEtagFresh(request, etag)) {
    return new NextResponse(null, {
      status: 304,
      headers,
    });
  }

  return apiOk(data, {
    headers,
  });
}

/**
 * Delivers a standard NextResponse.json with automatic ETag generation and Cache-Control headers.
 * If the client's If-None-Match matches, returns 304 Not Modified.
 */
export function cachedJson<T>(
  request: Request,
  data: T,
  init?: ResponseInit & CacheOptions,
) {
  const sMaxAge = init?.sMaxAge ?? 60;
  const staleWhileRevalidate = init?.staleWhileRevalidate ?? 300;
  const headers = {
    ...publicCacheHeaders(sMaxAge, staleWhileRevalidate),
    ...(init?.headers ? Object.fromEntries(new Headers(init.headers)) : {}),
  };
  const etag = computeEtag(data);
  headers["ETag"] = etag;

  if (isEtagFresh(request, etag)) {
    return new NextResponse(null, {
      status: 304,
      headers,
    });
  }

  return NextResponse.json(data, {
    ...init,
    headers,
  });
}

