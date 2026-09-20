// Temporary egress diagnostic — remove after debugging.
export async function GET() {
  const targets = [
    "https://api.fireworks.ai/inference/v1/models",
    "https://example.com",
    "https://api.github.com",
  ];
  const results = await Promise.all(
    targets.map(async (t) => {
      try {
        const res = await fetch(t, {
          signal: AbortSignal.timeout(8000),
          headers: { Authorization: "Bearer invalid" },
        });
        return `${t} -> ${res.status}`;
      } catch (e) {
        return `${t} -> ERROR ${(e as Error).name}: ${(e as Error).message}`;
      }
    }),
  );
  return new Response(results.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
