"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "~/lib/auth.client";

interface Session {
  id: string;
  hostName: string;
  playlistName: string;
  players: { id: string; name: string }[];
  status: "waiting" | "playing" | "finished";
}

/**
 * /sessions — Browse active game sessions.
 * Shows a list of joinable sessions and a button to host a new one.
 */
export default function SessionsPage() {
  const { data: session } = authClient.useSession();
  const [sessions, setSessions] = useState<Session[]>([]);
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

  const activeSessions = sessions.filter((s) => s.status === "waiting");
  const inProgress = sessions.filter((s) => s.status === "playing");

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Game Sessions</h1>
        {session?.user && (
          <Link
            href="/sessions/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:scale-[1.02] transition-all"
          >
            + Host Game
          </Link>
        )}
      </div>

      {loading ? (
        <p className="text-text-secondary text-center py-12">Loading...</p>
      ) : (
        <>
          {/* Waiting Sessions */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-text-secondary">
              🎮 Open to Join ({activeSessions.length})
            </h2>
            {activeSessions.length === 0 ? (
              <div className="rounded-2xl p-8 bg-white/5 border border-white/10 text-center">
                <p className="text-text-secondary">
                  No open sessions right now. Host one!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSessions.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            )}
          </section>

          {/* In Progress */}
          {inProgress.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 text-text-secondary">
                🔥 In Progress ({inProgress.length})
              </h2>
              <div className="space-y-3">
                {inProgress.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function SessionCard({ session }: { session: Session }) {
  const playerCount = session.players?.length || 0;
  const isWaiting = session.status === "waiting";

  return (
    <div className="rounded-xl p-4 bg-white/5 border border-white/10 hover:border-coral/30 transition-colors flex items-center justify-between">
      <div>
        <p className="font-semibold">{session.hostName}&apos;s Game</p>
        <p className="text-text-secondary text-sm">
          {session.playlistName} · {playerCount} player
          {playerCount !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            isWaiting
              ? "bg-green-500/20 text-green-400"
              : "bg-yellow-500/20 text-yellow-400"
          }`}
        >
          {isWaiting ? "Open" : "Playing"}
        </span>
        {isWaiting && (
          <Link
            href={`/sessions/${session.id}`}
            className="text-sm font-medium text-coral hover:underline"
          >
            Join →
          </Link>
        )}
      </div>
    </div>
  );
}
