"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "~/lib/auth.client";

interface SessionPlayer {
  id: string;
  name: string;
}

interface SessionDetail {
  id: string;
  hostId: string;
  hostName: string;
  playlistName: string;
  players: SessionPlayer[];
  status: "waiting" | "playing" | "finished";
  code: string;
}

/**
 * /sessions/[id] — Session lobby / waiting room.
 * Players see who's joined, host can start the game.
 * Polls for updates every 3 seconds while waiting.
 */
export default function SessionLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: auth } = authClient.useSession();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  // Fetch session details + poll while waiting
  useEffect(() => {
    const fetchSession = () => {
      fetch(`/api/sessions?id=${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSession(data.find((s: SessionDetail) => s.id === id) || null);
          } else {
            setSession(data);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    fetchSession();
    const interval = setInterval(fetchSession, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-text-secondary">Loading session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Session Not Found</h1>
        <p className="text-text-secondary mb-6">
          This session may have ended or doesn&apos;t exist.
        </p>
        <button
          onClick={() => router.push("/sessions")}
          className="text-coral hover:underline"
        >
          ← Back to Sessions
        </button>
      </div>
    );
  }

  const isHost = auth?.user?.id === session.hostId;
  const isJoined = session.players.some((p) => p.id === auth?.user?.id);
  const playerCount = session.players.length;

  const handleJoin = async () => {
    if (!auth?.user) return;
    setJoining(true);
    // Join logic would POST to /api/sessions/[id]/join
    // Placeholder for now — will be wired in game play phase
    setJoining(false);
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/sessions")}
          className="text-text-secondary text-sm hover:text-white mb-4 inline-block"
        >
          ← Sessions
        </button>
        <h1 className="text-2xl font-bold">{session.hostName}&apos;s Game</h1>
        <p className="text-text-secondary">
          {session.playlistName} · Code:{" "}
          <span className="font-mono text-coral">{session.code}</span>
        </p>
      </div>

      {/* Status */}
      <div className="rounded-xl p-4 bg-white/5 border border-white/10 mb-6 text-center">
        <span
          className={`text-sm font-medium px-3 py-1.5 rounded-full ${
            session.status === "waiting"
              ? "bg-green-500/20 text-green-400"
              : session.status === "playing"
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-gray-500/20 text-gray-400"
          }`}
        >
          {session.status === "waiting"
            ? "⏳ Waiting for players..."
            : session.status === "playing"
              ? "🔥 Game in progress"
              : "✅ Game finished"}
        </span>
      </div>

      {/* Players */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Players ({playerCount})</h2>
        <div className="space-y-2">
          {session.players.length === 0 ? (
            <p className="text-text-secondary text-sm py-4 text-center">
              No players yet — share the code to invite!
            </p>
          ) : (
            session.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 rounded-xl px-4 py-3 bg-white/5 border border-white/10"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral to-yellow flex items-center justify-center text-sm font-bold text-navy">
                  {player.name[0]?.toUpperCase() || "?"}
                </div>
                <span className="font-medium">{player.name}</span>
                {player.id === session.hostId && (
                  <span className="text-xs text-yellow-400 ml-auto">
                    👑 Host
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Actions */}
      {session.status === "waiting" && (
        <div className="space-y-3">
          {isHost ? (
            <button
              disabled={playerCount < 2}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] transition-all"
            >
              🎮 Start Game {playerCount < 2 ? "(need 2+ players)" : ""}
            </button>
          ) : !isJoined ? (
            <button
              onClick={handleJoin}
              disabled={joining || !auth?.user}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold disabled:opacity-40 hover:scale-[1.01] transition-all"
            >
              {joining ? "Joining..." : "Join Game"}
            </button>
          ) : (
            <p className="text-center text-text-secondary text-sm">
              ✅ You&apos;re in! Waiting for host to start...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
