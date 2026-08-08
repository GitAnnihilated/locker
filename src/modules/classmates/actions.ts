"use server";

import { requireUser } from "@/core/auth/session";
import { searchClassmates as searchClassmatesQuery } from "./queries";

/** Client-safe entry point — queries.ts imports Prisma directly, so it can only run server-side. */
export async function searchClassmates(query: string, courseId?: string) {
  const user = await requireUser();
  return searchClassmatesQuery(user.id, query, courseId);
}
