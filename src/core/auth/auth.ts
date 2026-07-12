import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/core/db/client";

/**
 * Auth.js (NextAuth v5).
 *
 * Session strategy is JWT, not database — this is required, not a style
 * choice: the Credentials provider (email+password) cannot use database
 * sessions in Auth.js. The Prisma adapter still persists Users/Accounts as
 * normal; only session *transport* is a signed cookie instead of a DB row.
 * This also reads better at scale (no session lookup on every request).
 *
 * Google's `profile()` is overridden to strip the name Google supplies.
 * Many students sign in with a parent's or a shared family Google account —
 * the account holder's Google name must never silently become the Locker
 * identity. `name` is only ever set by the user, via Profile Setup or the
 * credentials sign-up form. See core/auth/session.ts for the gate that
 * routes first-time users to Profile Setup before anything else.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Google verifies email ownership itself, so it's safe to auto-link a
      // Google sign-in to an existing Locker account with the same email
      // (e.g. one created via the email+password form). Without this, Auth.js
      // refuses to link by default and throws OAuthAccountNotLinked instead.
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: null, // never trust the Google account's name as the Locker identity
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
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
        if (!user?.passwordHash) return null; // no password set -> Google-only account

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    // Keep the JWT minimal (just the user id). Everything else (name,
    // profileCompletedAt, etc.) is read fresh from the DB where it's used,
    // so profile edits show up immediately instead of waiting for re-login.
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
