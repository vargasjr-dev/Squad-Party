"use client";

/**
 * Shared error boundary for all game routes.
 * Catches runtime errors and offers a retry.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-center max-w-md px-6">
        <div className="text-4xl">😵</div>
        <h2 className="text-xl font-bold text-white">Something went wrong</h2>
        <p className="text-text-secondary text-sm">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          className="btn-coral text-sm"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
