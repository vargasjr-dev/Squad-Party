import Link from "next/link";

const FEATURES = [
  {
    emoji: "🎲",
    title: "Party Games",
    description: "Trivia, drawing, word games, and more — all in one app.",
  },
  {
    emoji: "👥",
    title: "Play Together",
    description: "One host, everyone joins. No accounts needed for guests.",
  },
  {
    emoji: "🎨",
    title: "Custom Games",
    description: "Build your own games with the AI-powered Game Studio.",
  },
  {
    emoji: "📱",
    title: "Cross-Platform",
    description: "Web, iOS, and Android. Play from any device.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Create a Session",
    description:
      "Pick a game or build one with the Game Studio. Get a join code.",
  },
  {
    step: "2",
    title: "Share the Link",
    description:
      "Send the code to your squad. No downloads or signups needed to join.",
  },
  {
    step: "3",
    title: "Play Together",
    description: "Everyone plays from their own device. Results in real time.",
  },
];

const GAME_TYPES = [
  { emoji: "🧠", name: "Trivia" },
  { emoji: "🎨", name: "Drawing" },
  { emoji: "💬", name: "Word Games" },
  { emoji: "🏆", name: "Competitions" },
  { emoji: "🎭", name: "Social Deduction" },
  { emoji: "⚡", name: "Speed Rounds" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-navy to-charcoal text-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-coral/10 border border-coral/20 text-coral text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          🎉 Now in beta — join the party
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-coral to-yellow bg-clip-text text-transparent">
          Squad Party
        </h1>
        <p className="text-xl text-text-secondary mb-10 max-w-lg">
          Party games with your squad — trivia, drawing, word games, and custom
          creations. One link, everyone plays.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Link
            href="/play"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold text-lg px-8 py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-coral/25"
          >
            🎮 Play on Web
          </Link>
          <a
            href="#download"
            className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold text-lg px-8 py-4 rounded-xl border border-white/20 hover:bg-white/15 transition-all"
          >
            📱 Get the App
          </a>
        </div>
      </section>

      {/* Game Types */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="flex flex-wrap justify-center gap-3">
          {GAME_TYPES.map((game) => (
            <span
              key={game.name}
              className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-sm text-text-secondary px-4 py-2 rounded-full"
            >
              {game.emoji} {game.name}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything you need for game night
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl p-6 bg-white/5 border border-white/10 hover:border-coral/30 transition-colors"
            >
              <p className="text-3xl mb-3">{feature.emoji}</p>
              <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
              <p className="text-text-secondary text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Up and running in 30 seconds
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <div key={step.step} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-coral to-yellow text-navy font-bold text-lg mb-4">
                {step.step}
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-text-secondary text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Download */}
      <section
        id="download"
        className="max-w-2xl mx-auto px-6 py-16 text-center"
      >
        <h2 className="text-3xl font-bold mb-4">Get Squad Party</h2>
        <p className="text-text-secondary mb-8">
          Play instantly on the web, or download the native app for the best
          experience.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Link
            href="/play"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold px-6 py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-coral/25"
          >
            🎮 Play on Web — Free
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 bg-white/5 text-text-secondary font-medium px-6 py-3 rounded-xl border border-white/10">
            🍎 iOS — Coming to TestFlight
          </div>
          <div className="inline-flex items-center justify-center gap-2 bg-white/5 text-text-secondary font-medium px-6 py-3 rounded-xl border border-white/10">
            🤖 Android — Coming Soon
          </div>
        </div>

        <p className="text-text-secondary text-sm">
          Native apps coming soon. Play on the web in the meantime — same
          experience, no download needed.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-secondary text-sm">
            © {new Date().getFullYear()} Squad Party
          </p>
          <div className="flex items-center gap-6 text-sm text-text-secondary">
            <Link href="/play" className="hover:text-coral transition-colors">
              Play
            </Link>
            <a
              href="https://vargasjr.dev"
              className="hover:text-coral transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Built by VargasJR
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
