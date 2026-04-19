"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/sessions", label: "Play", emoji: "🎮" },
  { href: "/games", label: "Games", emoji: "🎲" },
  { href: "/profile", label: "Profile", emoji: "👤" },
];

/**
 * Shared navigation for authenticated game pages.
 * Coral accent on active link, responsive (horizontal on desktop, bottom bar on mobile).
 */
export default function GameNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: top nav */}
      <nav className="hidden sm:flex items-center justify-between px-6 py-4 border-b border-white/10 bg-navy/80 backdrop-blur-sm">
        <Link
          href="/"
          className="text-xl font-bold bg-gradient-to-r from-coral to-yellow bg-clip-text text-transparent"
        >
          Squad Party
        </Link>

        <div className="flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? "text-coral"
                  : "text-text-secondary hover:text-white"
              }`}
            >
              {item.emoji} {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile: bottom bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-4 py-3 border-t border-white/10 bg-navy/95 backdrop-blur-sm">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              pathname.startsWith(item.href)
                ? "text-coral"
                : "text-text-secondary"
            }`}
          >
            <span className="text-lg">{item.emoji}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
