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
}

/**
 * /create/chat — Studio chat editor.
 * Conversational game design powered by GLM 5.3 Flash (Fireworks).
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
  const [loadingGame, setLoadingGame] = useState(!!gameId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    const firstUser = chatHistory.find((m) => m.role === "user");
    const derivedName =
      gameName ?? firstUser?.content.trim().slice(0, 60) ?? "Untitled game";
    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId: savedGameId,
        name: derivedName,
        chatHistory,
      }),
    });
    if (res.ok) {
      const game = await res.json();
      setSavedGameId(game.id);
      setGameName(game.metadata?.name ?? derivedName);
      if (!gameId && game.id) {
        window.history.replaceState(null, "", `/create/chat?game=${game.id}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
                    "Sorry, I couldn't generate a response. The game designer isn't connected yet — coming soon!",
                }
              : m,
          ),
        );
      }

      await saveGame([
        ...historyAfterUser,
        { ...assistantMessage, content: "" },
      ]);
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                content: "Couldn't reach the Studio. Try again.",
              }
            : m,
        ),
      );
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
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {gameName && (
          <p className="text-center text-xs text-text-secondary/60">
            Editing <span className="text-text-secondary">{gameName}</span>
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-coral text-white"
                  : "bg-white/5 border border-white/10 text-text-secondary"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">
                {msg.content || "..."}
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
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your game idea..."
            disabled={isStreaming}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-coral/50 focus:outline-none text-sm disabled:opacity-40"
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
