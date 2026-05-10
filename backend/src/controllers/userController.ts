// userController.ts
// Handles user sync and profile endpoints.
// req.userId = Clerk ID (e.g. "user_2abc...")
// user.id    = our PostgreSQL UUID (used as FK everywhere)

import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import { findOrCreateUser, getUserByClerkId } from "../services/userService";

// POST /api/users/sync
// Called by the frontend after every login.
// Creates a DB record for new users, updates email for existing ones.
export const syncUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const clerkId = req.userId!;
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ success: false, error: "Email is required" });
    return;
  }

  const user = await findOrCreateUser({ clerkId, email });

  res.status(200).json({
    success: true,
    data: { user },
    message: "User synced successfully",
  });
};

// GET /api/users/me
// Returns the current user's DB record.
export const getMe = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const clerkId = req.userId!;
  const user = await getUserByClerkId(clerkId);

  if (!user) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  res.status(200).json({ success: true, data: { user } });
};