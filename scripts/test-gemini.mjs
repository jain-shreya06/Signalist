import "dotenv/config";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.log("NOT VERIFIED: GEMINI_API_KEY is not configured.");
  process.exitCode = 2;
} else {
  const models = ["gemini-3.5-flash-lite"];
  let failed = false;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "Reply with OK." }] }],
            generationConfig: { maxOutputTokens: 8, temperature: 0 },
          }),
          signal: AbortSignal.timeout(20_000),
        },
      );

      if (!response.ok) {
        console.error(`Gemini live request for ${model} failed with HTTP ${response.status}.`);
        failed = true;
        continue;
      }

      const body = await response.json();
      const text = body?.candidates?.[0]?.content?.parts
        ?.map((part) => typeof part?.text === "string" ? part.text : "")
        .join("");
      if (!text?.trim()) {
        console.error(`Gemini live request for ${model} returned no text candidate.`);
        failed = true;
        continue;
      }
      console.log(`Gemini live request verified for ${model}; response structure is valid.`);
    } catch (error) {
      const reason = error instanceof Error && error.name === "TimeoutError" ? "timed out" : "could not be reached";
      console.error(`Gemini live request for ${model} ${reason}; credentials and response body were not printed.`);
      failed = true;
    }
  }

  if (failed) process.exitCode = 1;
}
