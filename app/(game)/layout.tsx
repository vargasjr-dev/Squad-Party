import GameNav from "../../components/GameNav";

/**
 * Layout for authenticated game pages.
 * Wraps all routes in the (game) route group with shared navigation.
 * Mobile: bottom nav with padding. Desktop: top nav.
 */
export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-charcoal text-white">
      <GameNav />
      <main className="pb-20 sm:pb-0">{children}</main>
    </div>
  );
}
