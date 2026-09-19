import Link from "next/link";

const FLOATING_EMOJI = ["🎲", "🎨", "🧠", "💬", "🏆", "🎭", "⚡", "🃏"];

const GAME_TYPES = [
  "Trivia",
  "Drawing",
  "Word Games",
  "Social Deduction",
  "Speed Rounds",
];

export default function Home() {
  return (
    <main className="relative h-dvh overflow-hidden bg-gradient-to-b from-navy to-charcoal text-white flex flex-col">
      {/* Floating game pieces */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {FLOATING_EMOJI.map((emoji, i) => (
          <span
            key={emoji}
            className="absolute opacity-10 text-6xl sm:text-7xl animate-float select-none"
            style={{
              left: `${(i * 12.5 + 6) % 90}%`,
              top: `${(i % 2 === 0 ? 12 : 62) + ((i * 7) % 18)}%`,
              animationDelay: `${i * 0.9}s`,
              animationDuration: `${7 + (i % 4)}s`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-6xl sm:text-8xl font-extrabold tracking-tight bg-gradient-to-r from-coral via-[#FFB08E] to-yellow bg-clip-text text-transparent drop-shadow-[0_2px_24px_rgba(255,111,97,0.25)]">
          Squad Party
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-text-secondary max-w-md">
          One host. One link. Everyone plays.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/play"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold text-lg px-8 py-4 rounded-2xl hover:scale-[1.03] active:scale-[0.98] transition-all shadow-lg shadow-coral/25"
          >
            🎮 Play on Web
          </Link>
          <Link
            href="/mobile"
            className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold text-lg px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/15 hover:scale-[1.03] active:scale-[0.98] transition-all"
          >
            📱 Get the App
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {GAME_TYPES.map((game) => (
            <span
              key={game}
              className="text-xs sm:text-sm text-text-secondary/80 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full"
            >
              {game}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative pb-5 px-6 text-center text-xs text-text-secondary/60">
        © {new Date().getFullYear()} VargasJR LLC ·{" "}
        <Link href="/play" className="hover:text-coral transition-colors">
          Play
        </Link>{" "}
        ·{" "}
        <a
          href="https://vargasjr.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-coral transition-colors"
        >
          Built by VargasJR
        </a>
      </footer>
    </main>
  );
}
