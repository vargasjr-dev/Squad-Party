"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "~/lib/auth.client";

interface GameMetadata {
  name: string;
  description: string;
}

interface Game {
  id: string;
  metadata: GameMetadata;
  isDraft: boolean;
  isPublished: boolean;
  updatedAt: string;
}

/**
 * /create — The Studio.
 * Lists the signed-in creator's games; each can be edited in the
 * chat or taken to a lobby to play. New games start in the chat.
 */
export default function StudioPage() {
  const router = useRouter();
  const { data: auth, isPending } = authClient.useSession();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending) return;
    if (!auth?.user) {
      setLoading(false);
      return;
    }
    fetch("/api/games")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setGames(Array.isArray(data) ? data : []))
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, [auth?.user, isPending]);

  const handlePlay = async (game: Game) => {
    if (!auth?.user) return;
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hostId: auth.user.id,
        hostName: auth.user.name || "Host",
        playlistId: game.id,
        playlistName: game.metadata.name,
      }),
    });
    if (res.ok) {
      const session = await res.json();
      router.push(`/sessions/${session.id}`);
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-text-secondary">Loading your studio...</p>
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
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-end mb-8">
        <Link
          href="/create/chat"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:scale-[1.02] transition-all"
        >
          + New Game
        </Link>
      </div>

      {games.length === 0 ? (
        <div className="rounded-2xl p-10 bg-white/5 border border-white/10 text-center">
          <p className="text-4xl mb-3">🎲</p>
          <p className="font-semibold text-lg mb-1">No games yet</p>
          <p className="text-text-secondary text-sm mb-6">
            Describe a mini-game to your designer and watch it come to life.
          </p>
          <Link
            href="/create/chat"
            className="inline-flex items-center justify-center bg-white/10 border border-white/20 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/15 transition-all"
          >
            🎨 Create your first game
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game) => (
            <div
              key={game.id}
              className="rounded-xl p-4 bg-white/5 border border-white/10 hover:border-coral/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {game.metadata.name || "Untitled game"}
                  </p>
                  <p className="text-text-secondary text-sm truncate">
                    {game.metadata.description || "A party mini-game"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        game.isPublished
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {game.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Link
                    href={`/create/chat?game=${game.id}`}
                    className="text-sm font-medium text-coral hover:underline text-right"
                  >
                    ✏️ Edit in Chat
                  </Link>
                  <button
                    onClick={() => handlePlay(game)}
                    className="text-sm font-medium text-coral hover:underline text-right"
                  >
                    ▶️ Play
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
