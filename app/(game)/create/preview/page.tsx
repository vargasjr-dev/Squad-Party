"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "~/lib/auth.client";

/**
 * /create/preview — Lua game preview and solo testing.
 *
 * After Claude generates a mini-game, players can preview and
 * test it in a sandboxed environment before publishing.
 * Displays the game canvas, Lua source code, and test controls.
 *
 * Phase 4, Item 1 — the creative feedback loop.
 */
export default function GamePreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const gameId = searchParams.get("game");

  const [activeTab, setActiveTab] = useState<"preview" | "code" | "logs">(
    "preview",
  );
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "[System] Game preview ready. Press Play to start.",
  ]);

  const handlePlay = () => {
    setIsRunning(true);
    setLogs((prev) => [...prev, "[System] Game started..."]);
    // Lua sandbox execution will be wired here
    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        "[System] Game running in sandbox.",
        "[System] Lua execution not yet connected — coming soon!",
      ]);
    }, 500);
  };

  const handleStop = () => {
    setIsRunning(false);
    setLogs((prev) => [...prev, "[System] Game stopped."]);
  };

  const handlePublish = () => {
    // Will POST to /api/games to save and make available in playlists
    setLogs((prev) => [
      ...prev,
      "[System] Publishing not yet wired — coming in Phase 4 Item 3.",
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/create")}
            className="text-text-secondary text-sm hover:text-white"
          >
            ← Back to Studio
          </button>
          <h1 className="text-lg font-bold">Game Preview</h1>
        </div>
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={handlePlay}
              className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/30 transition"
            >
              ▶ Play
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition"
            >
              ■ Stop
            </button>
          )}
          <button
            onClick={handlePublish}
            disabled={!session?.user}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-coral to-[#FF8E8E] text-white text-sm font-semibold disabled:opacity-40 hover:scale-[1.02] transition-all"
          >
            Publish
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(["preview", "code", "logs"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium transition ${
              activeTab === tab
                ? "text-coral border-b-2 border-coral"
                : "text-text-secondary hover:text-white"
            }`}
          >
            {tab === "preview"
              ? "🎮 Preview"
              : tab === "code"
                ? "📝 Code"
                : "📋 Logs"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "preview" && (
          <div className="flex items-center justify-center h-full p-6">
            <div className="w-full max-w-lg rounded-2xl p-16 bg-white/5 border border-white/10 border-dashed text-center">
              {isRunning ? (
                <>
                  <div className="text-4xl mb-4 animate-bounce">🎮</div>
                  <p className="text-text-secondary">
                    Game running in Lua sandbox...
                  </p>
                  <p className="text-text-secondary text-xs mt-2">
                    (Sandbox engine coming in a future PR)
                  </p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-4">🎨</div>
                  <p className="text-text-secondary">
                    Press Play to test your game
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "code" && (
          <div className="p-6">
            <div className="rounded-xl bg-gray-900 border border-white/10 p-4 font-mono text-sm text-green-400 whitespace-pre-wrap min-h-[300px]">
              {`-- Generated mini-game (placeholder)
-- Real Lua will be generated by Claude

local game = {}

function game.init(players)
  -- Initialize game state
  print("Game initialized with " .. #players .. " players")
end

function game.update(dt)
  -- Game logic runs each frame
end

function game.onInput(playerId, input)
  -- Handle player input
end

function game.getScores()
  -- Return current scores
  return {}
end

return game`}
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="p-6">
            <div className="rounded-xl bg-gray-900 border border-white/10 p-4 font-mono text-xs min-h-[300px] space-y-1">
              {logs.map((log, i) => (
                <p
                  key={i}
                  className={
                    log.includes("[Error]")
                      ? "text-red-400"
                      : log.includes("[System]")
                        ? "text-yellow-400"
                        : "text-gray-400"
                  }
                >
                  {log}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
