// Temporary Fireworks diagnostic — remove after debugging.
export async function GET() {
  const apiKey = process.env.FIREWORKS_API_KEY;
  const keyInfo = {
    present: !!apiKey,
    length: apiKey?.length ?? 0,
    hasQuotes: apiKey ? /^["']|["']$/.test(apiKey) : false,
    hasWhitespace: apiKey ? /\s/.test(apiKey) : false,
    prefix: apiKey ? apiKey.slice(0, 4) : "",
  };

  const nonStream = await (async () => {
    try {
      const res = await fetch(
        "https://api.fireworks.ai/inference/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "accounts/fireworks/models/glm-5p3-flash",
            max_tokens: 20,
            messages: [{ role: "user", content: "say hi" }],
          }),
          signal: AbortSignal.timeout(15000),
        },
      );
      const text = await res.text();
      return `non-stream -> ${res.status}: ${text.slice(0, 150)}`;
    } catch (e) {
      return `non-stream -> ERROR ${(e as Error).name}: ${(e as Error).message}`;
    }
  })();

  const streamAttempt = await (async () => {
    try {
      const res = await fetch(
        "https://api.fireworks.ai/inference/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "accounts/fireworks/models/glm-5p3-flash",
            max_tokens: 20,
            stream: true,
            messages: [{ role: "user", content: "say hi" }],
          }),
          signal: AbortSignal.timeout(15000),
        },
      );
      const text = await res.text();
      return `stream -> ${res.status}: ${text.slice(0, 150)}`;
    } catch (e) {
      return `stream -> ERROR ${(e as Error).name}: ${(e as Error).message}`;
    }
  })();

  return new Response(
    JSON.stringify({ keyInfo, nonStream, streamAttempt }, null, 2),
    { headers: { "Content-Type": "application/json" } },
  );
}
