// validate.ts — Reusable input validation middleware.
//
// Never trust data from clients. Validate everything before
// it reaches your service layer or database.
//
// This middleware checks required fields and returns a clean
// 400 error if anything is missing — before any DB call happens.

import { Request, Response, NextFunction } from "express";

// validateBody takes a list of required field names.
// Returns Express middleware that checks all of them exist in req.body.
//
// Usage in a router:
//   router.post("/", validateBody(["name", "amount", "category"]), asyncHandler(create))
export const validateBody = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missing: string[] = [];

    for (const field of requiredFields) {
      // Check for undefined, null, AND empty string
      if (
        req.body[field] === undefined ||
        req.body[field] === null ||
        req.body[field] === ""
      ) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      res.status(400).json({
        success: false,
        error: `Missing required fields: ${missing.join(", ")}`,
      });
      return;
    }

    next();
  };
};