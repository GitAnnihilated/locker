import type { DefaultSession } from "next-auth";

// The session callback in core/auth/auth.ts copies the JWT's user id onto
// the session. Declare it here so `session.user.id` is typed across the app.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
