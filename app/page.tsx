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
    description: "Build your own games with the Lua-powered Game Studio.",
  },
  {
    emoji: "📱",
    title: "Cross-Platform",
    description: "Web, iOS, and Android. Play from any device.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-navy to-charcoal text-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
        <h1 className="text-6xl font-bold mb-3 bg-gradient-to-r from-coral to-yellow bg-clip-text text-transparent">
          Squad Party
        </h1>
        <p className="text-xl text-text-secondary mb-10 max-w-md">
          Party games with your squad — trivia, drawing, word games, and
          custom creations. One link, everyone plays.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Link
            href="/play"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold text-lg px-8 py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
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

      {/* Download */}
      <section id="download" className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Get Squad Party</h2>
        <p className="text-text-secondary mb-8">
          Play instantly on the web, or download the native app for the best
          experience.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <a
            href="https://testflight.apple.com/join/PLACEHOLDER"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-white text-navy font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors"
          >
            🍎 TestFlight (iOS)
          </a>
          <div className="inline-flex items-center justify-center gap-2 bg-white/10 text-text-secondary font-semibold px-6 py-3 rounded-xl border border-white/10 cursor-not-allowed">
            🤖 Android — Coming Soon
          </div>
        </div>

        <p className="text-text-secondary text-sm">
          iOS app available via TestFlight. Android app coming later.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-text-secondary text-sm">
        <p>
          Built by{" "}
          <a
            href="https://vargasjr.dev"
            className="text-coral hover:underline"
          >
            VargasJR
          </a>
        </p>
      </footer>
    </main>
  );
}
