// This file defines custom TypeScript types used across the entire backend.
// Think of types as contracts — they guarantee what shape your data will be.

import { Request } from "express";

// When a user is authenticated, we attach their info to the request object.
// This extends Express's built-in Request type with our custom field.
export interface AuthenticatedRequest extends Request {
  userId?: string;   // Clerk's user ID, attached by auth middleware after JWT verification
  userEmail?: string; // The user's email, also from the Clerk JWT claims
}

// Standard API response shape — every endpoint returns this format.
// Consistency here makes your frontend code much simpler to write.
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

