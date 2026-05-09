// routes/transactions.ts
// Order matters here — /summary must be registered before /:id
// Otherwise Express treats the string "summary" as an :id value

import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  listTransactions,
  getSummary,
  getTransaction,
  createTransactionHandler,
  updateTransactionHandler,
  patchTransactionHandler,
  deleteTransactionHandler,
} from "../controllers/transactionController";

const router = Router();

// Apply requireAuth to ALL routes in this router at once
// This is cleaner than adding it to every individual route
router.use(requireAuth);

// Summary route MUST come before /:id
router.get("/summary", asyncHandler(getSummary));

// Collection routes
router.get("/", asyncHandler(listTransactions));
router.post(
  "/",
  validateBody(["name", "amount", "category", "date"]),
  asyncHandler(createTransactionHandler)
);

// Single resource routes
router.get("/:id", asyncHandler(getTransaction));
router.put("/:id", asyncHandler(updateTransactionHandler));
router.patch("/:id", asyncHandler(patchTransactionHandler));
router.delete("/:id", asyncHandler(deleteTransactionHandler));

export default router;