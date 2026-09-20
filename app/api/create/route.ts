import { NextRequest } from "next/server";

const FIREWORKS_URL = "https://api.fireworks.ai/inference/v1/chat/completions";
const GLM_MODEL = "accounts/fireworks/models/glm-5p3-flash";

const SYSTEM_PROMPT = [
  "You are the Squad Party Studio designer, a playful game design partner.",
  "The user describes a party mini-game; help them refine it with short,",
  "energetic replies. Focus on rules a group of friends can play in",
  "minutes: trivia, drawing, word games, social deduction, speed rounds.",
  "",
  "Once you and the user settle on a name for the game, include this tag",
  "on its own line at the END of your reply (exactly once, not before):",
  "[[GAME_NAME: The Chosen Name]]",
  "Only include the tag when a real name is agreed on; keep it short and fun.",
].join("\n");

/**
 * POST /api/create — Studio chat, powered by GLM 5.3 Flash on Fireworks.
 * Streams newline-delimited JSON events to the client:
 *   {"type":"reasoning","text":"..."}  reasoning steps (replace each other)
 *   {"type":"content","text":"..."}    visible reply tokens
 *   {"type":"game_name","text":"..."}  parsed [[GAME_NAME: ...]] tag
 * Requires FIREWORKS_API_KEY; without it we return a 503 the UI renders
 * as a friendly notice.
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.FIREWORKS_API_KEY;
  const { messages } = await request.json();

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
        max_tokens: 2000,
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

  // Fireworks streams OpenAI-style SSE (content + reasoning_content deltas);
  // convert to newline-delimited JSON events.
  // NOTE: pump inside start() — the pull()-based variant never flushes
  // on Vercel's runtime (response stalls with no headers).
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let sseBuffer = "";
  let full = ""; // accumulated visible+tag content
  let sent = 0; // chars of `full` already emitted as content
  let emittedName = false;

  // Hold back a tail that could be the start of a [[GAME_NAME: ...]] tag.
  const heldBack = (s: string) => {
    for (let i = Math.min(s.length, 20); i > 0; i--) {
      if ("[[GAME_NAME: ]]".startsWith(s.slice(s.length - i))) return i;
    }
    return 0;
  };

  const send = (controller: ReadableStreamDefaultController, event: object) => {
    controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
  };

  const handleDelta = (
    controller: ReadableStreamDefaultController,
    delta: {
      content?: string | null;
      reasoning_content?: string | null;
    },
  ) => {
    if (delta.reasoning_content) {
      send(controller, { type: "reasoning", text: delta.reasoning_content });
    }
    if (delta.content) {
      full += delta.content;

      if (!emittedName) {
        const match = full.match(/\[\[GAME_NAME:\s*([^\]]+)\]\]/);
        if (match?.[1]) {
          emittedName = true;
          send(controller, { type: "game_name", text: match[1].trim() });
        }
      }

      // Don't emit past the tag; once the tag is closed, emit everything.
      const tagStart = full.indexOf("[[");
      let safeEnd: number;
      if (tagStart === -1) {
        safeEnd = full.length - heldBack(full);
      } else if (emittedName && full.includes("]]", tagStart)) {
        safeEnd = full.length;
      } else {
        safeEnd = tagStart;
      }
      safeEnd = Math.max(sent, safeEnd);
      if (safeEnd > sent) {
        send(controller, { type: "content", text: full.slice(sent, safeEnd) });
        sent = safeEnd;
      }
    }
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split("\n");
          sseBuffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const event = JSON.parse(payload);
              const delta = event.choices?.[0]?.delta;
              if (delta) handleDelta(controller, delta);
            } catch {
              // Partial JSON across chunks — keep it in the buffer.
            }
          }
        }
        controller.close();
      } catch (e) {
        console.error("[create] stream pump failed:", (e as Error).message);
        controller.error(e);
      }
    },
    cancel() {
      reader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
