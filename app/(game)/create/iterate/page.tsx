"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "~/lib/auth.client";

interface IterationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  type?: "text" | "code-update" | "rule-change";
}

/**
 * /create/iterate — Conversational game iteration.
 *
 * After initial game creation and preview, players refine their
 * game through conversation. Change rules, tweak logic, update
 * metadata — all through natural language.
 *
 * Phase 4, Item 2 — the creative refinement loop.
 */
export default function GameIteratePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const gameId = searchParams.get("game");

  const [messages, setMessages] = useState<IterationMessage[]>([
    {
      id: "system-welcome",
      role: "assistant",
      content:
        "Your game is looking good! Want to refine it? Try things like:\n\n• \"Make the timer shorter\"\n• \"Add a bonus round\"\n• \"Change the scoring to be based on speed\"\n• \"Make it harder after round 3\"\n\nI'll update the Lua code and rules for you! 🎮",
      timestamp: Date.now(),
      type: "text",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [changeLog, setChangeLog] = useState<string[]>([]);
  const [showChanges, setShowChanges] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: IterationMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    const assistantMessage: IterationMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      type: "text",
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const res = await fetch("/api/create/iterate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
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
              m.id === assistantMessage.id
                ? { ...m, content: accumulated }
                : m,
            ),
          );
        }

        // Track the change
        setChangeLog((prev) => [
          ...prev,
          `${new Date().toLocaleTimeString()}: ${userMessage.content}`,
        ]);
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? {
                  ...m,
                  content:
                    "The iteration API isn't connected yet — coming soon! For now, you can describe changes and I'll note them.",
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
                  "Couldn't reach the iteration API. This will be wired to Claude for live game updates.",
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
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/create/preview?game=" + (gameId ?? ""))}
            className="text-text-secondary text-sm hover:text-white"
          >
            ← Back to Preview
          </button>
          <h1 className="text-lg font-bold">🔄 Refine Your Game</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChanges(!showChanges)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              showChanges
                ? "bg-coral/20 text-coral"
                : "bg-white/5 text-text-secondary hover:text-white"
            }`}
          >
            📋 Changes ({changeLog.length})
          </button>
          <button
            onClick={() =>
              router.push("/create/preview?game=" + (gameId ?? ""))
            }
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-coral to-[#FF8E8E] text-white text-sm font-semibold hover:scale-[1.02] transition-all"
          >
            Preview →
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat */}
        <div className="flex-1 flex flex-col">
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
                      : msg.type === "code-update"
                        ? "bg-green-500/10 border border-green-500/20"
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
                    ? "Describe a change — rules, timing, scoring..."
                    : "Sign in to iterate on games"
                }
                disabled={!session?.user || isStreaming}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-coral/50 focus:outline-none text-sm disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={!input.trim() || !session?.user || isStreaming}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold text-sm disabled:opacity-40 hover:scale-[1.02] transition-all"
              >
                {isStreaming ? "..." : "Refine"}
              </button>
            </div>
          </form>
        </div>

        {/* Change Log Sidebar */}
        {showChanges && (
          <div className="w-72 border-l border-white/10 p-4 overflow-y-auto">
            <h3 className="text-sm font-bold mb-3">📋 Change Log</h3>
            {changeLog.length === 0 ? (
              <p className="text-text-secondary text-xs">
                No changes yet. Describe what to tweak!
              </p>
            ) : (
              <div className="space-y-2">
                {changeLog.map((change, i) => (
                  <div
                    key={i}
                    className="text-xs text-text-secondary bg-white/5 rounded-lg p-2"
                  >
                    {change}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
