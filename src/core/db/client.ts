import { PrismaClient } from "@prisma/client";

// Reuse a single client across hot-reloads in dev and across serverless
// invocations in prod (avoids exhausting the connection pool at scale).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
