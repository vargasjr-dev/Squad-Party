import Link from "next/link";

/**
 * Custom 404 page — branded, helpful, not a dead end.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-navy to-charcoal flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-4">🎮</div>
        <h1 className="text-4xl font-bold text-white mb-2">Game Over</h1>
        <p className="text-text-secondary mb-8">
          This page doesn&apos;t exist. Maybe the game moved?
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-coral">
            🏠 Home
          </Link>
          <Link href="/discover" className="btn-ghost">
            🎲 Discover Games
          </Link>
        </div>
      </div>
    </main>
  );
}
