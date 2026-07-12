import type { DefaultSession } from "next-auth";

// With the database session strategy, Auth.js puts the User id on the session.
// Declare it so `session.user.id` is typed across the app.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
