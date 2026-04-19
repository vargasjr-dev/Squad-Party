"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWebSocket } from "~/lib/useWebSocket";
import { authClient } from "~/lib/auth.client";

interface GameState {
  phase: "loading" | "playing" | "scoring" | "finished";
  currentGame: string;
  round: number;
  totalRounds: number;
  scores: Record<string, number>;
  timer: number;
}

/**
 * /play/[sessionId] — Live game play page.
 *
 * Connects via WebSocket for real-time multiplayer.
 * Displays current mini-game, scores, timer, and game state.
 * The actual mini-game rendering will be handled by a Lua sandbox
 * in a future PR — this PR establishes the connection + chrome.
 */
export default function GamePlayPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { data: auth } = authClient.useSession();

  const [gameState, setGameState] = useState<GameState>({
    phase: "loading",
    currentGame: "",
    round: 0,
    totalRounds: 0,
    scores: {},
    timer: 0,
  });

  const wsUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/ws?session=${sessionId}`
      : "";

  const { status, send } = useWebSocket({
    url: wsUrl,
    onMessage: (data) => {
      const msg = data as { type: string; payload?: Partial<GameState> };
      if (msg.type === "gameState" && msg.payload) {
        setGameState((prev) => ({ ...prev, ...msg.payload }));
      }
    },
  });

  const playerName =
    auth?.user?.name || auth?.user?.email?.split("@")[0] || "Player";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Top Bar — Round + Timer */}
      <div className="flex items-center justify-between px-6 py-3 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary">
            Round {gameState.round}/{gameState.totalRounds}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              status === "connected"
                ? "bg-green-400"
                : status === "connecting"
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-red-400"
            }`}
          />
        </div>
        <div className="text-sm font-mono font-bold">
          {gameState.timer > 0 ? `${gameState.timer}s` : "—"}
        </div>
        <button
          onClick={() => router.push(`/sessions/${sessionId}`)}
          className="text-xs text-text-secondary hover:text-white"
        >
          Leave
        </button>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        {gameState.phase === "loading" && (
          <div className="text-center">
            <div className="text-4xl mb-4">🎮</div>
            <h2 className="text-xl font-bold mb-2">
              {status === "connecting"
                ? "Connecting..."
                : status === "connected"
                  ? "Waiting for game to start..."
                  : "Connection lost"}
            </h2>
            <p className="text-text-secondary text-sm">
              {status === "error" && "Reconnecting..."}
            </p>
          </div>
        )}

        {gameState.phase === "playing" && (
          <div className="text-center max-w-lg w-full">
            <h2 className="text-lg font-semibold mb-2 text-text-secondary">
              Now Playing
            </h2>
            <h1 className="text-2xl font-bold mb-8">
              {gameState.currentGame || "Mini Game"}
            </h1>
            {/* Mini-game sandbox renders here in future PR */}
            <div className="rounded-2xl p-16 bg-white/5 border border-white/10 border-dashed">
              <p className="text-text-secondary">
                🎮 Game canvas — Lua sandbox coming soon
              </p>
            </div>
          </div>
        )}

        {gameState.phase === "finished" && (
          <div className="text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h2 className="text-xl font-bold mb-6">Game Over!</h2>
            <button
              onClick={() => router.push("/sessions")}
              className="bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold px-6 py-2.5 rounded-xl hover:scale-[1.02] transition-all"
            >
              Back to Sessions
            </button>
          </div>
        )}
      </div>

      {/* Scoreboard */}
      {Object.keys(gameState.scores).length > 0 && (
        <div className="px-6 py-4 bg-white/5 border-t border-white/10">
          <div className="flex items-center justify-center gap-6">
            {Object.entries(gameState.scores)
              .sort(([, a], [, b]) => b - a)
              .map(([name, score]) => (
                <div key={name} className="text-center">
                  <p
                    className={`text-sm font-medium ${name === playerName ? "text-coral" : ""}`}
                  >
                    {name}
                  </p>
                  <p className="text-lg font-bold">{score}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
