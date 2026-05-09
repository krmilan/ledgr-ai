// transactionController.ts — HTTP layer for transactions.
// Thin by design: parse → call service → respond.
// All logic is in transactionService.ts.

import { CATEGORIES, isValidCategory } from "../types/categories";
import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
} from "../services/transactionService";

// GET /api/transactions
// Query params: page, limit, category, startDate, endDate, search
export const listTransactions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.userId!;

  // Parse query params — everything from the URL is a string, so we convert types
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // cap at 100
  const category = req.query.category as string | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const search = req.query.search as string | undefined;

  const result = await getTransactions({
    userId,
    page,
    limit,
    category,
    startDate,
    endDate,
    search,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
};

// GET /api/transactions/summary
// Must be defined BEFORE /:id route or Express matches "summary" as an id
export const getSummary = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.userId!;
  const month = parseInt(req.query.month as string) || undefined;
  const year = parseInt(req.query.year as string) || undefined;

  const summary = await getTransactionSummary(userId, month, year);

  res.status(200).json({
    success: true,
    data: summary,
  });
};

// GET /api/transactions/:id
export const getTransaction = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;

  const transaction = await getTransactionById(id, userId);

  if (!transaction) {
    res.status(404).json({
      success: false,
      error: "Transaction not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: { transaction },
  });
};

// POST /api/transactions
export const createTransactionHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.userId!;
  const { name, amount, category, date } = req.body;

  // Amount validation — must be a real number
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount)) {
    res.status(400).json({
      success: false,
      error: "Amount must be a valid number",
    });
    return;
  }

  // Date validation
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    res.status(400).json({
      success: false,
      error: "Date must be a valid date string",
    });
    return;
  }

  // Validation
  if (!isValidCategory(category)) {
  res.status(400).json({
    success: false,
    error: `Invalid category. Must be one of: ${CATEGORIES.join(", ")}`,
  });
  return;
}

  const transaction = await createTransaction({
    userId,
    name,
    amount: parsedAmount,
    category,
    date,
  });

  // 201 Created — the correct status code for successful resource creation
  res.status(201).json({
    success: true,
    data: { transaction },
    message: "Transaction created successfully",
  });
};

// PUT /api/transactions/:id — full update
export const updateTransactionHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;
  const { name, amount, category, date } = req.body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (amount !== undefined) updates.amount = parseFloat(amount);
  if (category !== undefined) updates.category = category;
  if (date !== undefined) updates.date = date;

  const transaction = await updateTransaction(id, userId, updates);

  if (!transaction) {
    // null means either not found OR wrong user — we return 404 either way
    // Never reveal "this exists but isn't yours" — that leaks data
    res.status(404).json({
      success: false,
      error: "Transaction not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: { transaction },
    message: "Transaction updated successfully",
  });
};

// PATCH /api/transactions/:id — partial update (same logic, different semantics)
export const patchTransactionHandler = updateTransactionHandler;

// DELETE /api/transactions/:id
export const deleteTransactionHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;

  const result = await deleteTransaction(id, userId);

  if (!result) {
    res.status(404).json({
      success: false,
      error: "Transaction not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Transaction deleted successfully",
  });
};