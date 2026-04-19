"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "~/lib/auth.client";

interface Playlist {
  id: string;
  name: string;
  description: string;
  games: string[];
  creatorId: string;
  isPublic: boolean;
  playCount: number;
}

/**
 * /playlists — Browse and create mini-game collections.
 * Public playlists visible to all; create button for authenticated users.
 */
export default function PlaylistsPage() {
  const { data: session } = authClient.useSession();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch("/api/playlists")
      .then((r) => r.json())
      .then((data) => {
        setPlaylists(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const publicPlaylists = playlists.filter((p) => p.isPublic);
  const myPlaylists = playlists.filter(
    (p) => p.creatorId === session?.user?.id,
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Playlists</h1>
        {session?.user && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:scale-[1.02] transition-all"
          >
            + New Playlist
          </button>
        )}
      </div>

      {showCreate && session?.user && (
        <CreatePlaylistForm
          userId={session.user.id}
          onCreated={(p) => {
            setPlaylists([p, ...playlists]);
            setShowCreate(false);
          }}
        />
      )}

      {loading ? (
        <p className="text-text-secondary text-center py-12">Loading...</p>
      ) : (
        <>
          {/* My Playlists */}
          {myPlaylists.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-text-secondary">
                🎵 My Playlists ({myPlaylists.length})
              </h2>
              <div className="space-y-3">
                {myPlaylists.map((p) => (
                  <PlaylistCard key={p.id} playlist={p} />
                ))}
              </div>
            </section>
          )}

          {/* Public Playlists */}
          <section>
            <h2 className="text-lg font-semibold mb-4 text-text-secondary">
              🌐 Public Playlists ({publicPlaylists.length})
            </h2>
            {publicPlaylists.length === 0 ? (
              <div className="rounded-2xl p-8 bg-white/5 border border-white/10 text-center">
                <p className="text-text-secondary">
                  No public playlists yet. Create the first one!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {publicPlaylists.map((p) => (
                  <PlaylistCard key={p.id} playlist={p} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const gameCount = playlist.games?.length || 0;

  return (
    <div className="rounded-xl p-4 bg-white/5 border border-white/10 hover:border-coral/30 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{playlist.name}</p>
          <p className="text-text-secondary text-sm mt-1">
            {playlist.description}
          </p>
          <p className="text-text-secondary text-xs mt-2">
            {gameCount} game{gameCount !== 1 ? "s" : ""} · {playlist.playCount}{" "}
            play{playlist.playCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href={`/sessions/new?playlist=${playlist.id}`}
          className="text-sm font-medium text-coral hover:underline shrink-0 ml-4"
        >
          Play →
        </Link>
      </div>
    </div>
  );
}

function CreatePlaylistForm({
  userId,
  onCreated,
}: {
  userId: string;
  onCreated: (p: Playlist) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim(),
        creatorId: userId,
        games: [],
      }),
    });

    if (res.ok) {
      const playlist = await res.json();
      onCreated(playlist);
      setName("");
      setDescription("");
    }
    setSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl p-5 bg-white/5 border border-coral/30 mb-8 space-y-4"
    >
      <h3 className="font-semibold">Create Playlist</h3>
      <input
        type="text"
        placeholder="Playlist name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-coral/50 focus:outline-none text-sm"
      />
      <input
        type="text"
        placeholder="Short description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-coral/50 focus:outline-none text-sm"
      />
      <button
        type="submit"
        disabled={!name.trim() || submitting}
        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold text-sm disabled:opacity-40 hover:scale-[1.01] transition-all"
      >
        {submitting ? "Creating..." : "Create Playlist"}
      </button>
    </form>
  );
}
