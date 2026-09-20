import { NextRequest } from "next/server";

const FIREWORKS_URL = "https://api.fireworks.ai/inference/v1/chat/completions";
const GLM_MODEL = "accounts/fireworks/models/glm-5p3-flash";

const SYSTEM_PROMPT = [
  "You are the Squad Party Studio designer, a playful game design partner.",
  "The user describes a party mini-game; help them refine it with short,",
  "energetic replies. Focus on rules a group of friends can play in",
  "minutes: trivia, drawing, word games, social deduction, speed rounds.",
].join(" ");

/**
 * POST /api/create — Studio chat, powered by GLM 5.3 Flash on Fireworks.
 * Streams plain text back to the client. Requires FIREWORKS_API_KEY;
 * without it we return a 503 the UI renders as a friendly notice.
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.FIREWORKS_API_KEY;
  const { messages } = await request.json();
  console.log(
    "[create] start, messages:",
    Array.isArray(messages) ? messages.length : "?",
  );

  if (!apiKey) {
    return Response.json(
      { error: "The game designer isn't connected yet — coming soon!" },
      { status: 503 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(FIREWORKS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GLM_MODEL,
        stream: true,
        max_tokens: 800,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        ],
      }),
      signal: AbortSignal.timeout(45000),
    });
    console.log("[create] upstream status:", upstream.status);
  } catch (e) {
    console.error("[create] upstream fetch failed:", (e as Error).message);
    return Response.json(
      { error: "The game designer hiccuped. Try again." },
      { status: 502 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    return Response.json(
      { error: "The game designer hiccuped. Try again." },
      { status: 502 },
    );
  }

  // Fireworks streams OpenAI-style SSE; convert to a plain text stream.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = upstream.body.getReader();
  let buffer = "";

  const stream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const event = JSON.parse(payload);
          const text = event.choices?.[0]?.delta?.content;
          if (text) controller.enqueue(encoder.encode(text));
        } catch {
          // Partial JSON across chunks — keep it in the buffer.
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
