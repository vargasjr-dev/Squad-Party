"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && "ontouchend" in document);
  if (isIOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

const PLATFORM_INFO: Record<
  Platform,
  { emoji: string; name: string; blurb: string; cta: string }
> = {
  ios: {
    emoji: "🍎",
    name: "iOS",
    blurb:
      "Optimized for iPhone and iPad, with push notifications for game night.",
    cta: "Coming Soon on the App Store",
  },
  android: {
    emoji: "🤖",
    name: "Android",
    blurb: "Native Android experience, with push notifications for game night.",
    cta: "Coming Soon on Google Play",
  },
  other: {
    emoji: "📱",
    name: "Mobile",
    blurb: "Native apps for iOS and Android are on the way.",
    cta: "Coming Soon",
  },
};

export default function MobilePage() {
  const [platform, setPlatform] = useState<Platform>("other");

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const info = PLATFORM_INFO[platform];

  return (
    <main className="relative h-dvh overflow-hidden bg-gradient-to-b from-navy to-charcoal text-white flex flex-col">
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center">
        <span className="text-6xl mb-6">{info.emoji}</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-coral to-yellow bg-clip-text text-transparent">
          Squad Party for {info.name}
        </h1>
        <p className="mt-4 text-lg text-text-secondary max-w-md">
          {info.blurb} In the meantime, the full game plays right in your
          browser.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <div className="inline-flex items-center justify-center gap-2 bg-white/5 text-text-secondary font-medium text-lg px-8 py-4 rounded-2xl border border-white/10">
            🔔 {info.cta}
          </div>
          <Link
            href="/play"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold text-lg px-8 py-4 rounded-2xl hover:scale-[1.03] active:scale-[0.98] transition-all shadow-lg shadow-coral/25"
          >
            🎮 Play on Web Now
          </Link>
        </div>

        {platform === "other" && (
          <p className="mt-8 text-sm text-text-secondary/70">
            On your phone? Open{" "}
            <span className="text-text-secondary">squadparty.vargasjr.dev</span>{" "}
            and we&apos;ll show you the right app.
          </p>
        )}
      </div>

      <footer className="relative pb-5 px-6 text-center text-xs text-text-secondary/60">
        © {new Date().getFullYear()} VargasJR LLC ·{" "}
        <Link href="/" className="hover:text-coral transition-colors">
          Home
        </Link>
      </footer>
    </main>
  );
}
