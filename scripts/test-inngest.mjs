import "dotenv/config";

const appUrl = process.argv[2] || process.env.BETTER_AUTH_URL;
if (!appUrl) {
  console.log("NOT VERIFIED: BETTER_AUTH_URL is not configured, so the Inngest endpoint cannot be located.");
  process.exitCode = 2;
} else {
  const endpoint = new URL("/api/inngest", appUrl);
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(7_000) });
    if ([401, 403].includes(response.status)) {
      console.log(`NOT VERIFIED: Inngest endpoint is reachable but rejected the unsigned registry check (HTTP ${response.status}).`);
      process.exitCode = 2;
    } else if (!response.ok) {
      console.error(`Inngest endpoint smoke test failed with HTTP ${response.status}.`);
      process.exitCode = 1;
    } else {
      console.log(`Inngest endpoint responded with HTTP ${response.status}; registered handlers are reachable.`);
    }

    if (!process.env.INNGEST_SIGNING_KEY) {
      console.log("NOT VERIFIED: webhook signature enforcement requires INNGEST_SIGNING_KEY.");
    } else if (response.ok) {
      const unsigned = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
        signal: AbortSignal.timeout(7_000),
      });
      if (![400, 401, 403].includes(unsigned.status)) {
        console.error(`Unsigned Inngest request was not rejected (HTTP ${unsigned.status}).`);
        process.exitCode = 1;
      } else {
        console.log(`Unsigned Inngest request rejected with HTTP ${unsigned.status}.`);
      }
    }

    if (!process.env.INNGEST_EVENT_KEY) {
      console.log("NOT VERIFIED: live Inngest event delivery requires INNGEST_EVENT_KEY.");
    } else {
      console.log("Inngest event delivery credentials are configured; this smoke test does not dispatch an event.");
    }
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? "timed out" : "is not reachable";
    console.log(`NOT VERIFIED: Inngest endpoint ${reason}; start the Signalist app or configure a reachable base URL.`);
    process.exitCode = 2;
  }
}
