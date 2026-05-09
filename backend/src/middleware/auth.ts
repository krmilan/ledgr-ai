// auth.ts — The gatekeeper of your entire API.
//
// Every protected route passes through this function first.
// It does three things:
//   1. Extracts the JWT from the Authorization header
//   2. Asks Clerk to verify it (checks signature + expiry)
//   3. Attaches the userId to the request object for controllers to use
//
// If anything fails, it returns 401 immediately — the request never
// reaches your controller.

import { Response, NextFunction } from "express";
import { verifyToken } from "@clerk/backend";
import { AuthenticatedRequest } from "../types";

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // ── Step 1: Extract the token ──────────────────────────────────
    // The frontend sends: Authorization: Bearer eyJhbGci...
    // We split on " " and take the second part (the actual token)
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "No authorization token provided",
      });
      return; // Stop execution — don't call next()
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: "Malformed authorization header",
      });
      return;
    }

    // ── Step 2: Verify the token with Clerk ────────────────────────
    // verifyToken checks:
    //   - The token signature (was it really issued by Clerk?)
    //   - The expiry (has it expired?)
    //   - The issuer (does it belong to YOUR Clerk app?)
    // This is a network call to Clerk's JWKS endpoint on first call,
    // then cached locally — so it's fast after warmup.
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    // ── Step 3: Attach userId to the request ───────────────────────
    // payload.sub is the "subject" — Clerk's unique user ID
    // Format: "user_2abc123def456"
    // Controllers access this via req.userId — no need to re-verify
    req.userId = payload.sub;

    // Move to the next middleware or controller
    next();
  } catch (error) {
    // Clerk throws errors for expired tokens, invalid signatures, etc.
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};