// userService.ts — Business logic for user operations.
//
// Services contain logic that doesn't belong in controllers.
// Controllers handle HTTP. Services handle the actual work.
// This separation means you can call userService from multiple
// controllers, or from a background job, without duplicating code.

import { prisma } from "./prisma";

interface SyncUserParams {
  clerkId: string;
  email: string;
}

// findOrCreateUser implements the "upsert" pattern:
// - If a user with this clerkId exists → return them
// - If not → create them and return the new record
//
// This is called every time a user loads the dashboard.
// It's safe to call multiple times — idempotent.
export const findOrCreateUser = async ({ clerkId, email }: SyncUserParams) => {
  // Prisma's upsert: try to find by clerkId, create if not found
  const user = await prisma.user.upsert({
    where: { clerkId },          // look up by Clerk's ID
    update: { email },           // if found, update email (in case it changed)
    create: { clerkId, email },  // if not found, create a new record
  });

  return user;
};

// getUserByClerkId — simple lookup used in middleware and controllers
export const getUserByClerkId = async (clerkId: string) => {
  return prisma.user.findUnique({
    where: { clerkId },
  });
};