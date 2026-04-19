import { auth } from "../../../../lib/auth.server";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Catch-all auth route — handles all better-auth endpoints:
 * - POST /api/auth/sign-up/email
 * - POST /api/auth/sign-in/email
 * - POST /api/auth/sign-out
 * - GET  /api/auth/session
 * - POST /api/auth/forgot-password (when RESEND_API_KEY configured)
 * - POST /api/auth/reset-password
 * - GET  /api/auth/callback/google (when OAuth configured)
 */
export const { GET, POST } = toNextJsHandler(auth);
