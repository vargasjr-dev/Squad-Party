/**
 * /play — Game lobby. Join or create a party.
 * Placeholder until the real game lobby is built.
 */
export default function PlayPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 text-center">
      <h1 className="text-3xl font-bold mb-4">Play</h1>
      <p className="text-text-secondary mb-8">
        Join a party or create your own. Games start when everyone&apos;s
        ready.
      </p>

      <div className="rounded-2xl p-8 bg-white/5 border border-white/10">
        <p className="text-4xl mb-3">🎮</p>
        <p className="font-semibold text-lg">Game Lobby</p>
        <p className="text-text-secondary text-sm mt-2">
          Coming soon — create or join a party to start playing.
        </p>
      </div>
    </div>
  );
}
