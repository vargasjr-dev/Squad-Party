"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "~/lib/auth.client";

/**
 * Shared email + password auth form.
 * Renders sign-in by default with a toggle to sign-up.
 */
export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res =
        mode === "signin"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({
              email,
              password,
              name: name.trim() || email.split("@")[0],
            });

      if (res.error) {
        setError(res.error.message || "Something went wrong. Try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-6 bg-white/5 border border-white/10 space-y-4"
    >
      <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 text-sm font-medium">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-colors ${
              mode === m
                ? "bg-gradient-to-r from-coral to-[#FF8E8E] text-white"
                : "text-text-secondary hover:text-white"
            }`}
          >
            {m === "signin" ? "Sign In" : "Sign Up"}
          </button>
        ))}
      </div>

      {mode === "signup" && (
        <input
          type="text"
          placeholder="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-coral/50 focus:outline-none text-sm placeholder:text-text-secondary/50"
        />
      )}
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-coral/50 focus:outline-none text-sm placeholder:text-text-secondary/50"
      />
      <input
        type="password"
        required
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete={mode === "signin" ? "current-password" : "new-password"}
        minLength={8}
        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-coral/50 focus:outline-none text-sm placeholder:text-text-secondary/50"
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-coral to-[#FF8E8E] text-white font-semibold text-sm disabled:opacity-40 hover:scale-[1.01] transition-all"
      >
        {submitting ? "..." : mode === "signin" ? "Sign In" : "Create Account"}
      </button>
    </form>
  );
}
