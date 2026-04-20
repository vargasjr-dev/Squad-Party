"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "~/lib/auth.client";

interface HistorySession {
  id: string;
  hostName: string;
  playlistName: string;
  players: { id: string; name: string; score?: number }[];
  status: "waiting" | "playing" | "finished";
  currentGameIndex: number;
  createdAt: string;
}

/**
 * /history — Session history: past games and stats.
 * Shows finished sessions with results, and active ones the user participated in.
 * FINAL Phase 3 item — completes Core Web Experience!
 */
export default function SessionHistoryPage() {
  const { data: session } = authClient.useSession();
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((data) => {
        setSessions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter to sessions the user participated in
  const userId = session?.user?.id;
  const mySessions = userId
    ? sessions.filter((s) => s.players.some((p) => p.id === userId))
    : sessions;

  const finished = mySessions
    .filter((s) => s.status === "finished")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const active = mySessions.filter(
    (s) => s.status === "waiting" || s.status === "playing",
  );

  // Calculate stats
  const totalGames = finished.length;
  const totalWins = finished.filter((s) => {
    const sorted = [...s.players].sort(
      (a, b) => (b.score || 0) - (a.score || 0),
    );
    return sorted[0]?.id === userId;
  }).length;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Game History</h1>

      {/* Stats Overview */}
      {userId && totalGames > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard label="Games" value={totalGames} />
          <StatCard label="Wins" value={totalWins} />
          <StatCard
            label="Win Rate"
            value={`${totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0}%`}
          />
        </div>
      )}

      {loading ? (
        <p className="text-text-secondary text-center py-12">Loading...</p>
      ) : (
        <>
          {/* Active Sessions */}
          {active.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-text-secondary">
                🔥 Active ({active.length})
              </h2>
              <div className="space-y-3">
                {active.map((s) => (
                  <HistoryCard key={s.id} session={s} userId={userId} />
                ))}
              </div>
            </section>
          )}

          {/* Finished Sessions */}
          <section>
            <h2 className="text-lg font-semibold mb-4 text-text-secondary">
              📜 Past Games ({finished.length})
            </h2>
            {finished.length === 0 ? (
              <div className="rounded-2xl p-8 bg-white/5 border border-white/10 text-center">
                <p className="text-text-secondary">
                  No games played yet.{" "}
                  <Link href="/sessions" className="text-coral hover:underline">
                    Start one!
                  </Link>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {finished.map((s) => (
                  <HistoryCard key={s.id} session={s} userId={userId} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl p-4 bg-white/5 border border-white/10 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-text-secondary text-xs mt-1">{label}</p>
    </div>
  );
}

function HistoryCard({
  session,
  userId,
}: {
  session: HistorySession;
  userId?: string;
}) {
  const playerCount = session.players.length;
  const isFinished = session.status === "finished";

  // Determine winner
  const sorted = [...session.players].sort(
    (a, b) => (b.score || 0) - (a.score || 0),
  );
  const winner = sorted[0];
  const didWin = winner?.id === userId;

  const dateStr = new Date(session.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Link
      href={
        isFinished
          ? `/results/${session.id}`
          : session.status === "playing"
            ? `/play/${session.id}`
            : `/sessions/${session.id}`
      }
      className="block rounded-xl p-4 bg-white/5 border border-white/10 hover:border-coral/30 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold">{session.playlistName}</p>
            {isFinished && didWin && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                👑 Won
              </span>
            )}
          </div>
          <p className="text-text-secondary text-sm mt-1">
            {session.hostName} · {playerCount} player
            {playerCount !== 1 ? "s" : ""} · {session.currentGameIndex} game
            {session.currentGameIndex !== 1 ? "s" : ""}
          </p>
          <p className="text-text-secondary text-xs mt-1">{dateStr}</p>
        </div>
        <span className="text-text-secondary text-sm">→</span>
      </div>
    </Link>
  );
}
