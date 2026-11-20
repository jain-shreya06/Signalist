const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const REQUEST_TIMEOUT_MS = 8_000;

export class FinnhubApiError extends Error {
  constructor(public readonly status: number) {
    super(`Finnhub request failed with status ${status}.`);
    this.name = "FinnhubApiError";
  }
}

export async function fetchFinnhubJSON<T>(
  path: string,
  parameters: Record<string, string>,
  token: string,
  revalidateSeconds?: number,
  fetcher: typeof fetch = fetch,
): Promise<T> {
  const url = new URL(path.replace(/^\//, ""), FINNHUB_BASE_URL + "/");
  for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, value);
  url.searchParams.set("token", token);

  const init: RequestInit & { next?: { revalidate: number } } = revalidateSeconds
    ? { cache: "force-cache", next: { revalidate: revalidateSeconds }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
    : { cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) };

  const response = await fetcher(url, init);
  if (!response.ok) throw new FinnhubApiError(response.status);
  return response.json() as Promise<T>;
}

export async function verifyFinnhubStock(
  symbol: string,
  token: string,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  const profile = await fetchFinnhubJSON<{ name?: string; ticker?: string }>(
    "/stock/profile2",
    { symbol },
    token,
    undefined,
    fetcher,
  );
  return typeof profile.name === "string" && profile.name.trim().length > 0;
}
