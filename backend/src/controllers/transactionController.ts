// transactionController.ts
// HTTP layer for transaction endpoints.
//
// THE KEY FIX: req.userId is the Clerk ID ("user_2abc...").
// Transactions are stored with our PostgreSQL UUID as user_id.
// resolveDbUserId() bridges the gap — looks up our UUID by Clerk ID.
// Every controller calls this first before any DB operation.

import { categorizeTransaction } from "../services/aiService";
import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import { getUserByClerkId } from "../services/userService";
import { isValidCategory, CATEGORIES } from "../types/categories";
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
} from "../services/transactionService";

// ─── Helper ───────────────────────────────────────────────────────────

// Converts Clerk ID → our PostgreSQL UUID
// Returns null if user doesn't exist in our DB yet
const resolveDbUserId = async (clerkId: string): Promise<string | null> => {
  const user = await getUserByClerkId(clerkId);
  return user?.id ?? null;
};

// ─── Controllers ──────────────────────────────────────────────────────

// GET /api/transactions
export const listTransactions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const dbUserId = await resolveDbUserId(req.userId!);
  if (!dbUserId) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const category = req.query.category as string | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const search = req.query.search as string | undefined;

  const result = await getTransactions({
    userId: dbUserId,
    page,
    limit,
    category,
    startDate,
    endDate,
    search,
  });

  res.status(200).json({ success: true, data: result });
};

// GET /api/transactions/summary
// IMPORTANT: registered BEFORE /:id in the router
export const getSummary = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const dbUserId = await resolveDbUserId(req.userId!);
  if (!dbUserId) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  const month = parseInt(req.query.month as string) || undefined;
  const year = parseInt(req.query.year as string) || undefined;

  const summary = await getTransactionSummary(dbUserId, month, year);

  res.status(200).json({ success: true, data: summary });
};

// GET /api/transactions/:id
export const getTransaction = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const dbUserId = await resolveDbUserId(req.userId!);
  if (!dbUserId) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  const transactionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const transaction = await getTransactionById(transactionId, dbUserId);

  if (!transaction) {
    res.status(404).json({ success: false, error: "Transaction not found" });
    return;
  }

  res.status(200).json({ success: true, data: { transaction } });
};

// POST /api/transactions
export const createTransactionHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const dbUserId = await resolveDbUserId(req.userId!);
  if (!dbUserId) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  const { name, amount, category, date } = req.body;

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount)) {
    res.status(400).json({ success: false, error: "Amount must be a valid number" });
    return;
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    res.status(400).json({ success: false, error: "Date must be a valid date string" });
    return;
  }

    let finalCategory = category;
  let aiCategorized = false;

  // If category is "Auto" or not provided, use AI to categorize
  if (!category || category === "Auto") {
    try {
      finalCategory = await categorizeTransaction(name, parsedAmount);
      aiCategorized = true;
    } catch {
      // If AI fails, fall back to "Other" — never block the transaction save
      finalCategory = "Other";
      aiCategorized = false;
    }
  } else {
    // Manual category — validate it
    if (!isValidCategory(category)) {
      res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${CATEGORIES.join(", ")}`,
      });
      return;
    }
  }

  const transaction = await createTransaction({
    userId: dbUserId,
    name,
    amount: parsedAmount,
    category: finalCategory,
    date,
    aiCategorized,
  });

  res.status(201).json({
    success: true,
    data: { transaction },
    message: "Transaction created successfully",
  });
};

// PUT/PATCH /api/transactions/:id
export const updateTransactionHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const dbUserId = await resolveDbUserId(req.userId!);
  if (!dbUserId) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  const { name, amount, category, date } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (amount !== undefined) updates.amount = parseFloat(amount);
  if (category !== undefined) updates.category = category;
  if (date !== undefined) updates.date = date;

  const transactionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const transaction = await updateTransaction(transactionId, dbUserId, updates);

  if (!transaction) {
    res.status(404).json({ success: false, error: "Transaction not found" });
    return;
  }

  res.status(200).json({
    success: true,
    data: { transaction },
    message: "Transaction updated successfully",
  });
};

export const patchTransactionHandler = updateTransactionHandler;

// DELETE /api/transactions/:id
export const deleteTransactionHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const dbUserId = await resolveDbUserId(req.userId!);
  if (!dbUserId) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  const transactionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await deleteTransaction(transactionId, dbUserId);

  if (!result) {
    res.status(404).json({ success: false, error: "Transaction not found" });
    return;
  }

  res.status(200).json({ success: true, message: "Transaction deleted successfully" });
};