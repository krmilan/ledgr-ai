// budgetController.ts
// HTTP layer for budget endpoints.
// Same pattern as transactionController:
// req.userId = Clerk ID → resolveDbUserId() → PostgreSQL UUID

import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import { getUserByClerkId } from "../services/userService";
import {
  getBudgetSummary,
  upsertBudget,
  updateBudget,
  deleteBudget,
} from "../services/budgetService";

// ─── Helper ───────────────────────────────────────────────────────────

const resolveDbUserId = async (clerkId: string): Promise<string | null> => {
  const user = await getUserByClerkId(clerkId);
  return user?.id ?? null;
};

// ─── Controllers ──────────────────────────────────────────────────────

// GET /api/budgets?month=5&year=2026
export const listBudgets = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const dbUserId = await resolveDbUserId(req.userId!);
  if (!dbUserId) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  const now = new Date();
  const month = parseInt(req.query.month as string) || now.getMonth() + 1;
  const year = parseInt(req.query.year as string) || now.getFullYear();

  if (month < 1 || month > 12) {
    res.status(400).json({ success: false, error: "Month must be 1–12" });
    return;
  }

  const summary = await getBudgetSummary(dbUserId, month, year);

  res.status(200).json({ success: true, data: summary });
};

// POST /api/budgets
export const createBudgetHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const dbUserId = await resolveDbUserId(req.userId!);
  if (!dbUserId) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  const { category, limitAmount, month, year } = req.body;

  const parsedLimit = parseFloat(limitAmount);
  const parsedMonth = parseInt(month);
  const parsedYear = parseInt(year);

  if (isNaN(parsedLimit) || parsedLimit <= 0) {
    res.status(400).json({ success: false, error: "limitAmount must be a positive number" });
    return;
  }

  if (parsedMonth < 1 || parsedMonth > 12) {
    res.status(400).json({ success: false, error: "Month must be 1–12" });
    return;
  }

  if (parsedYear < 2000 || parsedYear > 2100) {
    res.status(400).json({ success: false, error: "Invalid year" });
    return;
  }

  const budget = await upsertBudget({
    userId: dbUserId,
    category,
    limitAmount: parsedLimit,
    month: parsedMonth,
    year: parsedYear,
  });

  res.status(201).json({
    success: true,
    data: { budget },
    message: "Budget saved successfully",
  });
};

// PATCH /api/budgets/:id
export const updateBudgetHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const dbUserId = await resolveDbUserId(req.userId!);
  if (!dbUserId) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  const { limitAmount, category } = req.body;
  const updates: { limitAmount?: number; category?: string } = {};
  if (limitAmount !== undefined) updates.limitAmount = parseFloat(limitAmount);
  if (category !== undefined) updates.category = category;

  const budget = await updateBudget(req.params.id as string, dbUserId, updates);

  if (!budget) {
    res.status(404).json({ success: false, error: "Budget not found" });
    return;
  }

  res.status(200).json({
    success: true,
    data: { budget },
    message: "Budget updated successfully",
  });
};

// DELETE /api/budgets/:id
export const deleteBudgetHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const dbUserId = await resolveDbUserId(req.userId!);
  if (!dbUserId) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  const result = await deleteBudget(req.params.id as string, dbUserId);

  if (!result) {
    res.status(404).json({ success: false, error: "Budget not found" });
    return;
  }

  res.status(200).json({ success: true, message: "Budget deleted successfully" });
};