// userController.ts — Handles the HTTP layer for user-related requests.
//
// Controllers are thin. They:
//   1. Read from req (params, body, headers)
//   2. Call a service function
//   3. Send a response
//
// Controllers never contain business logic or database queries.
// That lives in services.

import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import { findOrCreateUser } from "../services/userService";

// POST /api/users/sync
// Called by the frontend after login to ensure a DB record exists.
// The Clerk userId comes from req.userId (attached by requireAuth middleware).
export const syncUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  // req.userId is guaranteed to exist here because requireAuth runs first
  const clerkId = req.userId!;

  // req.body contains the email sent from the frontend
  const { email } = req.body;

  if (!email) {
    res.status(400).json({
      success: false,
      error: "Email is required",
    });
    return;
  }

  const user = await findOrCreateUser({ clerkId, email });

  res.status(200).json({
    success: true,
    data: { user },
    message: user ? "User synced successfully" : "User created",
  });
};

// GET /api/users/me
// Returns the current user's profile from your database.
export const getMe = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const clerkId = req.userId!;

  const user = await findOrCreateUser({
    clerkId,
    email: "", // email will not be updated (upsert update: {} in a variation)
  });

  res.status(200).json({
    success: true,
    data: { user },
  });
};