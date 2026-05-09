// routes/users.ts — Maps URLs to controller functions.
//
// The router's only job is to say:
//   "When a POST hits /sync, run requireAuth then syncUser"
//
// Notice requireAuth comes BEFORE the controller in every route.
// Express runs middleware left-to-right, so auth always runs first.

import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { syncUser, getMe } from "../controllers/userController";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

// POST /api/users/sync
// Frontend calls this after every login to ensure DB record exists
router.post("/sync", requireAuth, asyncHandler(syncUser));

// GET /api/users/me
// Returns current user's profile
router.get("/me", requireAuth, asyncHandler(getMe));

export default router;