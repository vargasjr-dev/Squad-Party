import { NextRequest } from "next/server";

/**
 * POST /api/create — Game Studio chat.
 *
 * Streams Claude's response for conversational game creation.
 * Requires ANTHROPIC_API_KEY; without it we tell the client the
 * generator isn't connected yet (the UI shows a friendly message).
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const { messages } = await request.json();

  if (!apiKey) {
    return Response.json(
      { error: "Game generation isn't connected yet — coming soon!" },
      { status: 503 },
    );
  }

  const systemPrompt = [
    "You are the Squad Party Game Studio, a playful game designer.",
    "The user describes a party mini-game; help them refine it and keep",
    "replies short and energetic. Focus on rules a group of friends can",
    "play in minutes: trivia, drawing, word games, social deduction,",
    "speed rounds.",
  ].join(" ");

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      stream: true,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    }),
  });

  if (!upstream.ok || !upstream.body) {
    return Response.json(
      { error: "The game generator hiccuped. Try again." },
      { status: 502 },
    );
  }

  // Convert Anthropic SSE into a plain text stream the client reads.
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
          if (
            event.type === "content_block_delta" &&
            event.delta?.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
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
