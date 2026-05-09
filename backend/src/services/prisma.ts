// This file creates a single shared Prisma client instance.
//
// The problem we're solving: In development, Next.js/Node hot-reload
// creates new module instances on every file change. Without this pattern,
// you'd create hundreds of database connections and hit Supabase's limit.
//
// The solution: store the client on the global object (which survives hot-reloads)
// and reuse it if it already exists.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"] // Log all SQL queries in development
        : ["error"],                  // Only log errors in production
  });

// In development, save to global so hot-reload reuses the connection
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;