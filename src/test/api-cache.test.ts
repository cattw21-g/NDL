import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  cachedApiOk,
  computeEtag,
  isEtagFresh,
  publicCacheHeaders,
} from "../lib/api-cache";

describe("api-cache utilities", () => {
  it("formats standard public cache headers", () => {
    const headers = publicCacheHeaders(120, 600);
    expect(headers["Cache-Control"]).toBe("public, s-maxage=120, stale-while-revalidate=600");
    expect(headers["Vary"]).toContain("Accept-Encoding");
  });

  it("computes deterministic weak ETags", () => {
    const dataA = { name: "Acheron Nerfed", rank: 1 };
    const dataB = { name: "Acheron Nerfed", rank: 1 };
    const dataC = { name: "Kocmoc", rank: 2 };

    const etagA = computeEtag(dataA);
    const etagB = computeEtag(dataB);
    const etagC = computeEtag(dataC);

    expect(etagA.startsWith('W/"')).toBe(true);
    expect(etagA).toBe(etagB);
    expect(etagA).not.toBe(etagC);
  });

  it("detects fresh cache with If-None-Match header", () => {
    const payload = { test: true };
    const etag = computeEtag(payload);

    const reqMatch = new NextRequest("http://localhost:3000/api/public/levels", {
      headers: { "if-none-match": etag },
    });
    expect(isEtagFresh(reqMatch, etag)).toBe(true);

    const reqMismatch = new NextRequest("http://localhost:3000/api/public/levels", {
      headers: { "if-none-match": 'W/"outdated-etag"' },
    });
    expect(isEtagFresh(reqMismatch, etag)).toBe(false);

    const reqNoHeader = new NextRequest("http://localhost:3000/api/public/levels");
    expect(isEtagFresh(reqNoHeader, etag)).toBe(false);
  });

  it("returns 304 Not Modified when client provides matching ETag", () => {
    const payload = { levels: [{ id: "lvl-1", name: "Sakupen" }] };
    const etag = computeEtag(payload);

    const req = new NextRequest("http://localhost:3000/api/public/levels", {
      headers: { "if-none-match": etag },
    });

    const res = cachedApiOk(req, payload);
    expect(res.status).toBe(304);
    expect(res.headers.get("ETag")).toBe(etag);
    expect(res.headers.get("Cache-Control")).toContain("public, s-maxage=");
  });

  it("returns 200 with data and headers when client cache is cold", async () => {
    const payload = { levels: [{ id: "lvl-1", name: "Sakupen" }] };

    const req = new NextRequest("http://localhost:3000/api/public/levels");
    const res = cachedApiOk(req, payload);

    expect(res.status).toBe(200);
    expect(res.headers.get("ETag")).toBeTruthy();
    expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=60, stale-while-revalidate=300");

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.levels[0].name).toBe("Sakupen");
  });
});
