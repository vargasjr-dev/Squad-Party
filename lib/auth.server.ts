import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../server/db";

/**
 * Server-side auth configuration — reuses the vellymon.game pattern.
 *
 * Email + password auth with optional Google OAuth.
 * Uses Drizzle adapter with the existing PostgreSQL connection.
 * Password reset emails will be added when RESEND_API_KEY is configured.
 */

// Only configure Google OAuth if credentials are provided
const socialProviders =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : undefined;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: false,
  },
  ...(socialProviders && { socialProviders }),
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
