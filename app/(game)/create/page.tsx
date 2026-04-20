"use client";

import { useState, useRef, useEffect } from "react";
import { authClient } from "~/lib/auth.client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

/**
 * /create — Chat-based game creation with AI.
 *
 * Players describe a mini-game in natural language, and Claude
 * generates the game logic (Lua), rules, and metadata.
 * Uses Vercel AI SDK streaming for real-time response display.
 *
 * Phase 4, Item 0 — the creative engine of Squad Party.
 */
export default function GameCreationPage() {
  const { data: session } = authClient.useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "system-welcome",
      role: "assistant",
      content:
        'Hey! I\'m your game designer. Describe a mini-game you want to create — like "a trivia game about movies" or "a reaction-speed tapping game" — and I\'ll build it for you! 🎮',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    // Placeholder for Vercel AI SDK streaming integration
    // Will POST to /api/create with the conversation and stream back
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    // Simulate streaming (replaced by real AI SDK in next iteration)
    try {
      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id ? { ...m, content: accumulated } : m,
            ),
          );
        }
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? {
                  ...m,
                  content:
                    "Sorry, I couldn't generate a response. The AI endpoint isn't connected yet — coming soon!",
                }
              : m,
          ),
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                content:
                  "Couldn't reach the game creation API. This will be wired to Claude via Vercel AI SDK.",
              }
            : m,
        ),
      );
    }

    setIsStreaming(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <h1 className="text-xl font-bold">🎨 Game Studio</h1>
        <p className="text-text-secondary text-sm">
          Describe a mini-game and I&apos;ll create it
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-coral text-white"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.role === "assistant" && !msg.content && isStreaming && (
                <div className="flex gap-1 py-1">
                  <span className="w-2 h-2 bg-coral/60 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-coral/60 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <span className="w-2 h-2 bg-coral/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-6 py-4 border-t border-white/10"
      >
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              session?.user
                ? "Describe your game idea..."
                : "Sign in to create games"
            }
            disabled={!session?.user || isStreaming}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-coral/50 focus:outline-none text-sm disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!input.trim() || !session?.user || isStreaming}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold text-sm disabled:opacity-40 hover:scale-[1.02] transition-all"
          >
            {isStreaming ? "..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
