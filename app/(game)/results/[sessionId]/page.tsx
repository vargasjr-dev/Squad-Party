"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "~/lib/auth.client";

interface PlayerResult {
  id: string;
  name: string;
  score: number;
  gamesWon: number;
}

interface SessionResults {
  id: string;
  playlistName: string;
  players: PlayerResult[];
  totalGames: number;
  finishedAt: string;
}

/**
 * /results/[sessionId] — Round results with scores, rankings, and animations.
 * Shown after a game session finishes. Dramatic reveal of final standings.
 */
export default function RoundResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { data: auth } = authClient.useSession();
  const [results, setResults] = useState<SessionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    fetch(`/api/sessions?id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        // Transform session data into results format
        const session = Array.isArray(data)
          ? data.find((s: { id: string }) => s.id === sessionId)
          : data;
        if (session) {
          const players = (session.players || []).map(
            (p: {
              id: string;
              name: string;
              score?: number;
              gamesWon?: number;
            }) => ({
              ...p,
              score: p.score || 0,
              gamesWon: p.gamesWon || 0,
            }),
          );
          setResults({
            id: session.id,
            playlistName: session.playlistName || "Game Session",
            players: players.sort(
              (a: PlayerResult, b: PlayerResult) => b.score - a.score,
            ),
            totalGames: session.currentGameIndex || 0,
            finishedAt: session.updatedAt || new Date().toISOString(),
          });
        }
        setLoading(false);
        // Dramatic reveal after a short delay
        setTimeout(() => setRevealed(true), 800);
      })
      .catch(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-text-secondary">Loading results...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="max-w-md mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Results Not Found</h1>
        <button
          onClick={() => router.push("/sessions")}
          className="text-coral hover:underline"
        >
          ← Back to Sessions
        </button>
      </div>
    );
  }

  const winner = results.players[0];
  const isMe = (id: string) => id === auth?.user?.id;

  return (
    <div className="max-w-lg mx-auto px-6 py-8">
      {/* Trophy Header */}
      <div
        className={`text-center mb-8 transition-all duration-1000 ${revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="text-2xl font-bold mb-1">Game Over!</h1>
        <p className="text-text-secondary">{results.playlistName}</p>
        <p className="text-text-secondary text-sm mt-1">
          {results.totalGames} game{results.totalGames !== 1 ? "s" : ""} played
        </p>
      </div>

      {/* Winner Spotlight */}
      {winner && (
        <div
          className={`rounded-2xl p-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/30 text-center mb-6 transition-all duration-1000 delay-300 ${revealed ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        >
          <p className="text-yellow-400 text-sm font-medium mb-2">👑 Winner</p>
          <p className="text-2xl font-bold">
            {winner.name}
            {isMe(winner.id) && <span className="text-coral ml-2">(You!)</span>}
          </p>
          <p className="text-3xl font-bold text-yellow-400 mt-2">
            {winner.score} pts
          </p>
        </div>
      )}

      {/* Full Rankings */}
      <div
        className={`space-y-2 mb-8 transition-all duration-1000 delay-700 ${revealed ? "opacity-100" : "opacity-0"}`}
      >
        <h2 className="text-lg font-semibold mb-3">Final Standings</h2>
        {results.players.map((player, index) => (
          <div
            key={player.id}
            className={`flex items-center gap-4 rounded-xl px-4 py-3 ${
              index === 0
                ? "bg-yellow-500/10 border border-yellow-500/20"
                : "bg-white/5 border border-white/10"
            } ${isMe(player.id) ? "ring-1 ring-coral/30" : ""}`}
          >
            <span
              className={`text-lg font-bold w-8 ${
                index === 0
                  ? "text-yellow-400"
                  : index === 1
                    ? "text-gray-300"
                    : index === 2
                      ? "text-amber-600"
                      : "text-text-secondary"
              }`}
            >
              #{index + 1}
            </span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral to-yellow flex items-center justify-center text-sm font-bold text-navy">
              {player.name[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1">
              <p className="font-medium">
                {player.name}
                {isMe(player.id) && (
                  <span className="text-coral text-xs ml-1">(You)</span>
                )}
              </p>
              <p className="text-text-secondary text-xs">
                {player.gamesWon} game{player.gamesWon !== 1 ? "s" : ""} won
              </p>
            </div>
            <span className="text-lg font-bold">{player.score}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div
        className={`space-y-3 transition-all duration-1000 delay-1000 ${revealed ? "opacity-100" : "opacity-0"}`}
      >
        <button
          onClick={() => router.push("/sessions")}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold hover:scale-[1.01] transition-all"
        >
          Play Again
        </button>
        <button
          onClick={() => router.push("/profile")}
          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-text-secondary font-medium hover:text-white transition-colors"
        >
          View Profile
        </button>
      </div>
    </div>
  );
}
