import "dotenv/config";

const token = process.env.FINNHUB_API_KEY;
if (!token) {
  console.log("NOT VERIFIED: FINNHUB_API_KEY is not configured.");
  process.exitCode = 2;
} else {
  const symbol = process.env.FINNHUB_TEST_SYMBOL || "AAPL";
  try {
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}`, {
      headers: { "X-Finnhub-Token": token },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`Finnhub quote smoke test failed with HTTP ${response.status}.`);
      process.exitCode = 1;
    } else {
      const quote = await response.json();
      const numericFields = ["c", "h", "l", "o", "pc"];
      const validNumbers = numericFields.every((field) =>
        typeof quote?.[field] === "number" && Number.isFinite(quote[field]) && quote[field] > 0
      );
      const validTimestamp = Number.isInteger(quote?.t) && quote.t > 0;

      if (!validNumbers || !validTimestamp) {
        console.error("Finnhub returned an incomplete or unavailable quote; no market values were inferred.");
        process.exitCode = 1;
      } else {
        console.log(`Finnhub live quote verified for ${symbol}: price=${quote.c}, open=${quote.o}, high=${quote.h}, low=${quote.l}, previousClose=${quote.pc}, timestamp=${new Date(quote.t * 1000).toISOString()}.`);
      }
    }
  } catch (error) {
    const status = error instanceof Error && error.name === "TimeoutError" ? "timed out" : "could not be reached";
    console.error(`Finnhub live quote test ${status}; credentials and response data were not printed.`);
    process.exitCode = 1;
  }
}
