import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/core/db/client";
import { MAX_FAILED_LOGIN_ATTEMPTS, LOCKOUT_MINUTES } from "./constants";

/**
 * Auth.js (NextAuth v5) — email + password only, no OAuth, no adapter.
 *
 * Session strategy is JWT: Credentials-based auth doesn't support database
 * sessions in Auth.js, and JWT also reads better at scale (no session-table
 * lookup on every request). Since there's no OAuth provider anymore, there's
 * nothing for a PrismaAdapter to link — user creation happens explicitly in
 * core/auth/actions.ts after email verification, not here.
 *
 * `authorize()` is the actual security boundary for login — it enforces
 * "must be verified" and "lockout after repeated failures" itself, not just
 * core/auth/actions.ts's wrapper (which exists only to produce specific,
 * friendly error messages). Even if something calls signIn("credentials", …)
 * directly, this still blocks unverified or locked-out accounts.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        // Locked out from too many recent failed attempts.
        if (user.lockedUntil && user.lockedUntil > new Date()) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          const attempts = user.failedLoginAttempts + 1;
          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: attempts,
              lockedUntil:
                attempts >= MAX_FAILED_LOGIN_ATTEMPTS
                  ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000)
                  : null,
            },
          });
          return null;
        }

        // Correct password, but the account isn't verified yet — never issue
        // a session. core/auth/actions.ts checks this ahead of time too, to
        // show "Please verify your email before signing in." instead of a
        // generic failure, but this check is what actually enforces it.
        if (!user.emailVerified) return null;

        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await db.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    // Keep the JWT minimal (just the user id). Everything else (name,
    // nickname, etc.) is read fresh from the DB where it's used, so profile
    // edits show up immediately instead of waiting for re-login.
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
