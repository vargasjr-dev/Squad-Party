"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "~/lib/auth.client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  // Transient (not persisted): live designer reasoning while streaming.
  reasoning?: string;
}

interface StreamEvent {
  type: "reasoning" | "content" | "game_name";
  text: string;
}

const WELCOME: ChatMessage = {
  id: "system-welcome",
  role: "assistant",
  content:
    "Hey! I'm your game designer. Tell me what kind of game you're dreaming up and we'll build it together! 🎮",
  timestamp: 0,
};

/**
 * /create/chat — Studio chat editor.
 * Streams the designer's reasoning + reply (GLM 5.3 Flash on Fireworks).
 * ?game=<id> resumes an existing game's chat; without it, a new game
 * row is created on the first exchange.
 */
export default function StudioChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get("game");
  const { data: auth, isPending } = authClient.useSession();

  const [gameName, setGameName] = useState<string | null>(null);
  const [savedGameId, setSavedGameId] = useState<string | null>(gameId);
  const [version, setVersion] = useState(1);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingGame, setLoadingGame] = useState(!!gameId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Grow the textarea with content, capped at 4 lines.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 104)}px`;
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadGame = useCallback(async () => {
    if (!gameId) return;
    try {
      const res = await fetch("/api/games");
      if (res.ok) {
        const games = await res.json();
        const game = Array.isArray(games)
          ? games.find((g: { id: string }) => g.id === gameId)
          : null;
        if (game) {
          setGameName(game.metadata?.name || null);
          setVersion(
            Math.max(
              1,
              Math.round(parseFloat(game.metadata?.version || "0.1") * 10) || 1,
            ),
          );
          if (game.chatHistory?.length) setMessages(game.chatHistory);
        } else {
          router.replace("/create");
        }
      }
    } finally {
      setLoadingGame(false);
    }
  }, [gameId, router]);

  useEffect(() => {
    if (isPending) return;
    if (!auth?.user) {
      setLoadingGame(false);
      return;
    }
    loadGame();
  }, [auth?.user, isPending, loadGame]);

  const saveGame = async (chatHistory: ChatMessage[]) => {
    // Persist only role/content — reasoning is transient.
    const persisted = chatHistory.map(({ role, content, timestamp, id }) => ({
      id,
      role,
      content,
      timestamp,
    }));
    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId: savedGameId,
        name: gameName,
        chatHistory: persisted,
      }),
    });
    if (res.ok) {
      const game = await res.json();
      setSavedGameId(game.id);
      setVersion((v) => v + 1);
      if (!gameId && game.id) {
        window.history.replaceState(null, "", `/create/chat?game=${game.id}`);
      }
    }
  };

  const handlePlay = async () => {
    if (!auth?.user || !savedGameId) return;
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hostId: auth.user.id,
        hostName: auth.user.name || "Host",
        playlistId: savedGameId,
        playlistName: gameName || "Custom game",
      }),
    });
    if (res.ok) {
      const session = await res.json();
      router.push(`/sessions/${session.id}`);
    }
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    const historyAfterUser = [...messages, userMessage];
    setMessages(historyAfterUser);
    setInput("");
    setIsStreaming(true);

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    setMessages([...historyAfterUser, assistantMessage]);

    const updateAssistant = (patch: Partial<ChatMessage>) =>
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id ? { ...m, ...patch } : m,
        ),
      );

    try {
      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyAfterUser.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      let finalContent = "";
      let finalReasoning = "";

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let ndjson = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          ndjson += decoder.decode(value, { stream: true });
          const lines = ndjson.split("\n");
          ndjson = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const event: StreamEvent = JSON.parse(line);
              if (event.type === "reasoning") {
                finalReasoning += event.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, reasoning: finalReasoning }
                      : m,
                  ),
                );
              } else if (event.type === "content") {
                finalContent += event.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: finalContent }
                      : m,
                  ),
                );
              } else if (event.type === "game_name") {
                setGameName(event.text);
              }
            } catch {
              // Partial line — the next chunk completes it.
            }
          }
        }
      } else {
        finalContent =
          "Sorry, I couldn't generate a response. The game designer isn't connected yet — coming soon!";
        updateAssistant({ content: finalContent });
      }

      await saveGame([
        ...historyAfterUser,
        {
          id: assistantMessage.id,
          role: "assistant",
          content: finalContent,
          timestamp: assistantMessage.timestamp,
        },
      ]);
    } catch {
      updateAssistant({ content: "Couldn't reach the Studio. Try again." });
    }

    setIsStreaming(false);
  };

  if (isPending || loadingGame) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!auth?.user) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <p className="text-4xl mb-4">🎨</p>
        <p className="text-text-secondary mb-6">
          Sign in to build and keep your games.
        </p>
        <Link
          href="/profile"
          className="inline-flex items-center justify-center bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold px-6 py-3 rounded-xl hover:scale-[1.02] transition-all"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-white/10 shrink-0">
        <img
          src="/designer-avatar.svg"
          alt="Squad Party designer"
          className="w-9 h-9 rounded-full"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">
            {gameName ?? "Game Studio"}
          </p>
          <p className="text-xs text-text-secondary">
            v0.{version} · your party game designer
          </p>
        </div>
        {gameName && savedGameId && (
          <button
            onClick={handlePlay}
            className="shrink-0 inline-flex items-center gap-1.5 bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold px-4 py-2 rounded-xl text-sm hover:scale-[1.02] transition-all"
          >
            ▶️ Play
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <img
                src="/designer-avatar.svg"
                alt=""
                className="w-7 h-7 rounded-full shrink-0 mt-1"
              />
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-coral text-white"
                  : "bg-white/5 border border-white/10 text-text-secondary"
              }`}
            >
              {msg.reasoning && !msg.content && (
                <p className="text-sm text-text-muted italic whitespace-pre-wrap">
                  {msg.reasoning.slice(-160)}
                </p>
              )}
              {msg.reasoning && msg.content && (
                <p className="text-xs text-text-muted/70 italic mb-1">
                  💭{" "}
                  {msg.reasoning.length > 60
                    ? "…" + msg.reasoning.slice(-60)
                    : msg.reasoning}
                </p>
              )}
              <p className="text-sm whitespace-pre-wrap">
                {msg.content || (msg.role === "user" ? "" : "...")}
              </p>
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
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={1}
            placeholder="Describe your game idea..."
            disabled={isStreaming}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-coral/50 focus:outline-none text-sm disabled:opacity-40 resize-none leading-5 max-h-[104px] overflow-y-auto"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold text-sm disabled:opacity-40 hover:scale-[1.02] transition-all"
          >
            {isStreaming ? "..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
