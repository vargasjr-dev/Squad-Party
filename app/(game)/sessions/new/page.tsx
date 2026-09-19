"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "~/lib/auth.client";

interface Playlist {
  id: string;
  name: string;
  description: string;
}

/**
 * /sessions/new — Host a new game session.
 * Pick a playlist, then create a session and head to its lobby.
 */
export default function NewSessionPage() {
  const router = useRouter();
  const { data: auth } = authClient.useSession();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");

  useEffect(() => {
    fetch("/api/playlists")
      .then((r) => r.json())
      .then((data) => setPlaylists(Array.isArray(data) ? data : []))
      .catch(() => setPlaylists([]))
      .finally(() => setLoading(false));
  }, []);

  const handleHost = async (playlist: Playlist) => {
    setError(null);

    let hostId: string;
    let hostName: string;
    if (auth?.user) {
      hostId = auth.user.id;
      hostName = auth.user.name || "Host";
    } else {
      const trimmed = guestName.trim();
      if (!trimmed) {
        setError("Enter your name to host.");
        return;
      }
      hostId = `guest-${crypto.randomUUID()}`;
      hostName = trimmed;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostId,
          hostName,
          playlistId: playlist.id,
          playlistName: playlist.name,
        }),
      });
      if (!res.ok) throw new Error("Failed to create session");
      const session = await res.json();
      router.push(`/sessions/${session.id}`);
    } catch {
      setError("Couldn't create the session. Try again.");
      setCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <button
        onClick={() => router.push("/sessions")}
        className="text-text-secondary text-sm hover:text-white mb-6 inline-block"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-2">Host a Game</h1>
      <p className="text-text-secondary mb-8">
        Pick what you want to play — you&apos;ll get a lobby with a join code.
      </p>

      {!auth?.user && (
        <div className="mb-8">
          <label
            htmlFor="host-name"
            className="block text-sm text-text-secondary mb-2"
          >
            Your name
          </label>
          <input
            id="host-name"
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="e.g. Alex"
            maxLength={30}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-coral/50"
          />
        </div>
      )}

      {loading ? (
        <p className="text-text-secondary text-center py-12">
          Loading playlists...
        </p>
      ) : playlists.length === 0 ? (
        <div className="rounded-2xl p-8 bg-white/5 border border-white/10 text-center">
          <p className="text-text-secondary mb-4">
            No playlists yet — create one in the Game Studio first.
          </p>
          <button
            onClick={() => router.push("/create")}
            className="text-coral hover:underline"
          >
            🎨 Open Game Studio
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => handleHost(playlist)}
              disabled={creating}
              className="w-full text-left rounded-xl p-4 bg-white/5 border border-white/10 hover:border-coral/40 hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">{playlist.name}</p>
                {playlist.description && (
                  <p className="text-text-secondary text-sm">
                    {playlist.description}
                  </p>
                )}
              </div>
              <span className="text-coral font-medium text-sm shrink-0 ml-4">
                {creating ? "Starting..." : "Host →"}
              </span>
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}
    </div>
  );
}
