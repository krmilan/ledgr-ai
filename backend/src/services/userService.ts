// userService.ts
// Handles all database operations for users.
// Key concept: clerk_id is Clerk's identifier, id is our UUID.
// Every other table uses our UUID (id) as the foreign key.

import { prisma } from "./prisma";

interface SyncUserParams {
  clerkId: string;
  email: string;
}

// findOrCreateUser — upsert pattern
// Safe to call multiple times — always returns the user record
export const findOrCreateUser = async ({ clerkId, email }: SyncUserParams) => {
  const user = await prisma.user.upsert({
    where: { clerkId },
    update: { email },
    create: { clerkId, email },
  });
  return user;
};

// getUserByClerkId — lookup by Clerk's ID string (e.g. "user_2abc...")
// Returns the full user record including our UUID (user.id)
export const getUserByClerkId = async (clerkId: string) => {
  return prisma.user.findUnique({
    where: { clerkId },
  });
};