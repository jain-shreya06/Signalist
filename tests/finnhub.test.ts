import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchFinnhubJSON, FinnhubApiError, verifyFinnhubStock } from "../lib/finnhub/client";

test("Finnhub client sends the private token in the server request and validates JSON", async () => {
  let requestUrl: URL | undefined;
  let requestInit: RequestInit | undefined;
  const fetcher: typeof fetch = async (input, init) => {
    requestUrl = new URL(String(input));
    requestInit = init;
    return Response.json({ name: "Example Inc." });
  };

  const result = await fetchFinnhubJSON<{ name: string }>(
    "/stock/profile2",
    { symbol: "EXM" },
    "mock-token",
    undefined,
    fetcher,
  );

  assert.equal(result.name, "Example Inc.");
  assert.equal(requestUrl?.origin, "https://finnhub.io");
  assert.equal(requestUrl?.pathname, "/api/v1/stock/profile2");
  assert.equal(requestUrl?.searchParams.get("symbol"), "EXM");
  assert.equal(requestUrl?.searchParams.get("token"), "mock-token");
  assert.ok(requestInit?.signal instanceof AbortSignal);
});

test("Finnhub client reports rate limits without including credentials or body text", async () => {
  const fetcher: typeof fetch = async () => new Response("token=mock-token", { status: 429 });
  await assert.rejects(
    fetchFinnhubJSON("quote", { symbol: "EXM" }, "mock-token", undefined, fetcher),
    (error: unknown) => {
      assert(error instanceof FinnhubApiError);
      assert.equal(error.status, 429);
      assert.doesNotMatch(error.message, /mock-token/);
      return true;
    },
  );
});

test("stock profile validation distinguishes valid and unavailable profiles", async () => {
  const validFetcher: typeof fetch = async () => Response.json({ name: "Example Inc." });
  const invalidFetcher: typeof fetch = async () => Response.json({});
  assert.equal(await verifyFinnhubStock("EXM", "mock-token", validFetcher), true);
  assert.equal(await verifyFinnhubStock("NOPE", "mock-token", invalidFetcher), false);
});
