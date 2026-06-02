import { describe, expect, it } from "vitest";

import { createNdlApiClient, NdlApiError } from "./ndl-api.js";

describe("NDL API client", () => {
  it("calls public commands through public API paths without staff auth", async () => {
    const calls: Array<{ url: string; headers: HeadersInit | undefined }> = [];
    const api = createNdlApiClient(
      {
        ndlPublicApiBase: "https://ndl.test",
        ndlBotApiSecret: "staff-secret",
      },
      async (input, init) => {
        calls.push({ url: input.toString(), headers: init?.headers });
        return jsonResponse({ ok: true, data: { levels: [], limit: 5 } });
      },
    );

    await api.getTopLevels(5);

    expect(calls[0]?.url).toBe("https://ndl.test/api/public/levels?limit=5");
    expect(JSON.stringify(calls[0]?.headers)).not.toContain("staff-secret");
  });

  it("attaches the bot secret only to staff API calls", async () => {
    const calls: Array<{ url: string; headers: HeadersInit | undefined }> = [];
    const api = createNdlApiClient(
      {
        ndlPublicApiBase: "https://ndl.test",
        ndlBotApiSecret: "staff-secret",
      },
      async (input, init) => {
        calls.push({ url: input.toString(), headers: init?.headers });
        return jsonResponse({
          ok: true,
          data: { submissions: [], limit: 10 },
        });
      },
    );

    await api.getPendingRecords(10);

    expect(calls[0]?.url).toBe(
      "https://ndl.test/api/bot/staff/pending-records?limit=10",
    );
    expect(calls[0]?.headers).toMatchObject({
      Authorization: "Bearer staff-secret",
    });
  });

  it("rejects staff calls when the staff secret is missing", async () => {
    const api = createNdlApiClient({
      ndlPublicApiBase: "https://ndl.test",
      ndlBotApiSecret: null,
    });

    await expect(api.getPendingRecords()).rejects.toMatchObject({
      code: "staff_not_configured",
    });
  });

  it("converts not found, rate limit, network, and malformed responses", async () => {
    const notFound = createNdlApiClient(
      { ndlPublicApiBase: "https://ndl.test", ndlBotApiSecret: null },
      async () =>
        jsonResponse(
          {
            ok: false,
            error: { code: "not_found", message: "Level not found." },
          },
          404,
        ),
    );
    await expect(notFound.getLevel("missing")).rejects.toMatchObject({
      code: "not_found",
      status: 404,
    });

    const rateLimited = createNdlApiClient(
      { ndlPublicApiBase: "https://ndl.test", ndlBotApiSecret: null },
      async () =>
        jsonResponse(
          {
            ok: false,
            error: {
              code: "rate_limited",
              message: "Wait.",
              retryAfterSeconds: 30,
            },
          },
          429,
        ),
    );
    await expect(rateLimited.getRules()).rejects.toMatchObject({
      code: "rate_limited",
      retryAfterSeconds: 30,
    });

    const network = createNdlApiClient(
      { ndlPublicApiBase: "https://ndl.test", ndlBotApiSecret: null },
      async () => {
        throw new Error("offline");
      },
    );
    await expect(network.getRecentRecords()).rejects.toBeInstanceOf(
      NdlApiError,
    );
    await expect(network.getRecentRecords()).rejects.toMatchObject({
      code: "api_unavailable",
    });

    const malformed = createNdlApiClient(
      { ndlPublicApiBase: "https://ndl.test", ndlBotApiSecret: null },
      async () => new Response("not-json", { status: 200 }),
    );
    await expect(malformed.getRules()).rejects.toMatchObject({
      code: "malformed_response",
    });
  });
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
