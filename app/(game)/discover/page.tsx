"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "~/lib/auth.client";

interface CommunityGame {
  id: string;
  name: string;
  description: string;
  creatorName: string;
  minPlayers: number;
  maxPlayers: number;
  tags: string[];
  playCount: number;
  rating: number;
  createdAt: string;
}

type SortOption = "popular" | "newest" | "top-rated";
type FilterTag = string | null;

/**
 * /discover — Community game discovery.
 *
 * Browse and play user-created games. Search, filter by tags,
 * sort by popularity/newest/rating. The social layer of Squad Party.
 *
 * Phase 4, Item 4 — FINAL Phase 4 item!
 * Completing this means the entire Game Studio is shipped.
 */
export default function DiscoverPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [games, setGames] = useState<CommunityGame[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("popular");
  const [activeTag, setActiveTag] = useState<FilterTag>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Popular tags for quick filtering
  const popularTags = [
    "trivia",
    "speed",
    "strategy",
    "word",
    "music",
    "drawing",
    "party",
    "brain",
  ];

  useEffect(() => {
    loadGames();
  }, [sort, activeTag]);

  const loadGames = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ sort });
      if (activeTag) params.set("tag", activeTag);
      const res = await fetch(`/api/games/discover?${params}`);
      if (res.ok) {
        const data = await res.json();
        setGames(data.games ?? []);
      }
    } catch {
      // API not connected yet — show empty state
    }
    setIsLoading(false);
  };

  const filteredGames = search
    ? games.filter(
        (g) =>
          g.name.toLowerCase().includes(search.toLowerCase()) ||
          g.description.toLowerCase().includes(search.toLowerCase()) ||
          g.tags.some((t) => t.includes(search.toLowerCase())),
      )
    : games;

  const handlePlay = (gameId: string) => {
    router.push(`/sessions?game=${gameId}`);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <div className="px-6 py-8 text-center border-b border-white/10">
        <h1 className="text-3xl font-bold mb-2">🌍 Discover Games</h1>
        <p className="text-text-secondary">
          Browse games created by the Squad Party community
        </p>
      </div>

      {/* Search + Filters */}
      <div className="px-6 py-4 border-b border-white/10 space-y-3">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search games..."
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-coral/50 focus:outline-none text-sm"
        />

        {/* Sort + Tags */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-1">
            {(
              [
                ["popular", "🔥 Popular"],
                ["newest", "✨ Newest"],
                ["top-rated", "⭐ Top Rated"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setSort(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  sort === value
                    ? "bg-coral/20 text-coral"
                    : "bg-white/5 text-text-secondary hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex gap-1 flex-wrap">
            {popularTags.map((tag) => (
              <button
                key={tag}
                onClick={() =>
                  setActiveTag(activeTag === tag ? null : tag)
                }
                className={`px-2.5 py-1 rounded-full text-xs transition ${
                  activeTag === tag
                    ? "bg-coral/20 text-coral"
                    : "bg-white/5 text-text-secondary hover:text-white"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="flex-1 px-6 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-xl bg-white/5 border border-white/10 p-5 animate-pulse h-44"
              />
            ))}
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎮</div>
            <h2 className="text-xl font-bold mb-2">No games yet!</h2>
            <p className="text-text-secondary mb-6">
              Be the first to create a game for the community.
            </p>
            <button
              onClick={() => router.push("/create")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold hover:scale-[1.02] transition-all"
            >
              Create a Game
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGames.map((game) => (
              <div
                key={game.id}
                className="rounded-xl bg-white/5 border border-white/10 p-5 hover:border-coral/30 transition group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold group-hover:text-coral transition truncate">
                    {game.name}
                  </h3>
                  <span className="text-xs text-text-secondary whitespace-nowrap ml-2">
                    {game.playCount} plays
                  </span>
                </div>
                <p className="text-text-secondary text-sm mb-3 line-clamp-2">
                  {game.description}
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {game.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-white/5 text-text-secondary text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">
                    by {game.creatorName} • {game.minPlayers}-
                    {game.maxPlayers} players
                  </span>
                  <button
                    onClick={() => handlePlay(game.id)}
                    disabled={!session?.user}
                    className="px-3 py-1.5 rounded-lg bg-coral/20 text-coral text-xs font-medium hover:bg-coral/30 transition disabled:opacity-40"
                  >
                    Play
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Footer */}
      <div className="px-6 py-6 border-t border-white/10 text-center">
        <p className="text-text-secondary text-sm mb-3">
          Got a game idea? Share it with the world!
        </p>
        <button
          onClick={() => router.push("/create")}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold text-sm hover:scale-[1.02] transition-all"
        >
          🎨 Create a Game
        </button>
      </div>
    </div>
  );
}
