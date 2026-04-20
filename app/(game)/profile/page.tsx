"use client";

import Link from "next/link";
import { authClient } from "~/lib/auth.client";

/**
 * /profile — Player profile page.
 * Shows username, avatar, game stats, and account actions.
 * Uses the auth session to identify the current user.
 */
export default function ProfilePage() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="max-w-md mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
        <p className="text-text-secondary mb-6">
          Create an account or sign in to view your profile.
        </p>
        <Link
          href="/api/auth/signin"
          className="inline-flex items-center justify-center bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold px-6 py-3 rounded-xl hover:scale-[1.02] transition-all"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const user = session.user;
  const initials = (user.name || user.email || "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      {/* Avatar + Name */}
      <div className="flex flex-col items-center mb-8">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "Avatar"}
            className="w-20 h-20 rounded-full mb-4 border-2 border-coral"
          />
        ) : (
          <div className="w-20 h-20 rounded-full mb-4 bg-gradient-to-br from-coral to-yellow flex items-center justify-center text-2xl font-bold text-navy">
            {initials}
          </div>
        )}
        <h1 className="text-2xl font-bold">{user.name || "Player"}</h1>
        <p className="text-text-secondary text-sm">{user.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Games" value={0} emoji="🎮" />
        <StatCard label="Wins" value={0} emoji="🏆" />
        <StatCard label="Rank" value={0} emoji="📊" />
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={() => authClient.signOut()}
          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-text-secondary hover:text-white hover:border-white/20 transition-colors text-sm font-medium"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  emoji,
}: {
  label: string;
  value: number;
  emoji: string;
}) {
  return (
    <div className="rounded-xl p-4 bg-white/5 border border-white/10 text-center">
      <p className="text-2xl mb-1">{emoji}</p>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-text-secondary text-xs">{label}</p>
    </div>
  );
}
