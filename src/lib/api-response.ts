import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "bad_request"
  | "unauthorized"
  | "not_found"
  | "rate_limited"
  | "server_error";

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    {
      ok: true,
      data,
    },
    init,
  );
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        ...extra,
      },
    },
    { status },
  );
}

export function apiBadRequest(message = "Invalid API request.") {
  return apiError("bad_request", message, 400);
}

export function apiUnauthorized(message = "Unauthorized.") {
  return apiError("unauthorized", message, 401);
}

export function apiNotFound(message = "Not found.") {
  return apiError("not_found", message, 404);
}

export function apiRateLimited(message: string, retryAfterSeconds: number) {
  return apiError("rate_limited", message, 429, {
    retryAfterSeconds,
  });
}
