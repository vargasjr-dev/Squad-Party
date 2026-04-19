export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-white">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-coral to-yellow bg-clip-text text-transparent">
          Squad Party
        </h1>
        <p className="text-lg mb-12 opacity-70">
          Party games with your squad
        </p>

        <div className="rounded-2xl p-8 mb-6 border border-white/10">
          <p className="text-2xl mb-2">🎮</p>
          <p className="font-semibold text-lg">Coming Soon</p>
          <p className="opacity-60 text-sm mt-2">
            Rebuilding from the ground up — web, iOS, and Android.
          </p>
        </div>
      </div>
    </main>
  );
}
