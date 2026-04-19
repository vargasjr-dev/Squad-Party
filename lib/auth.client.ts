import { createAuthClient } from "better-auth/react";

/**
 * Client-side auth hooks for React components.
 *
 * Usage:
 *   import { authClient } from "~/lib/auth.client";
 *
 *   // Sign up
 *   await authClient.signUp.email({ email, password, name });
 *
 *   // Sign in
 *   await authClient.signIn.email({ email, password });
 *
 *   // Sign out
 *   await authClient.signOut();
 *
 *   // Get session (React hook)
 *   const { data: session } = authClient.useSession();
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});
