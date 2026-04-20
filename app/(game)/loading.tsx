/**
 * Shared loading state for all game routes.
 * Shows a pulsing coral skeleton while pages load.
 */
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-coral to-coral/60 animate-pulse" />
        <div className="h-4 w-32 rounded-full bg-white/10 animate-pulse" />
        <div className="h-3 w-24 rounded-full bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}
