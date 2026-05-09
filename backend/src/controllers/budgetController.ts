import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import {
  getBudgetSummary,
  upsertBudget,
  updateBudget,
  deleteBudget,
} from "../services/budgetService";

// GET /api/budgets?month=5&year=2025
// Returns all budgets with actual spending merged in
export const listBudgets = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.userId!;

  // Default to current month/year if not specified
  const now = new Date();
  const month = parseInt(req.query.month as string) || now.getMonth() + 1;
  const year = parseInt(req.query.year as string) || now.getFullYear();

  // Validate month range
  if (month < 1 || month > 12) {
    res.status(400).json({ success: false, error: "Month must be 1–12" });
    return;
  }

  const summary = await getBudgetSummary(userId, month, year);

  res.status(200).json({
    success: true,
    data: summary,
  });
};

// POST /api/budgets
// Creates or updates a budget for a category/month/year (upsert)
export const createBudgetHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.userId!;
  const { category, limitAmount, month, year } = req.body;

  // Type coercion — body values might be strings
  const parsedLimit = parseFloat(limitAmount);
  const parsedMonth = parseInt(month);
  const parsedYear = parseInt(year);

  if (isNaN(parsedLimit) || parsedLimit <= 0) {
    res.status(400).json({
      success: false,
      error: "limitAmount must be a positive number",
    });
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
    userId,
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
  const userId = req.userId!;
  const { id } = req.params;
  const { limitAmount, category } = req.body;

  const updates: { limitAmount?: number; category?: string } = {};
  if (limitAmount !== undefined) updates.limitAmount = parseFloat(limitAmount);
  if (category !== undefined) updates.category = category;

  const budget = await updateBudget(id, userId, updates);

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
  const userId = req.userId!;
  const { id } = req.params;

  const result = await deleteBudget(id, userId);

  if (!result) {
    res.status(404).json({ success: false, error: "Budget not found" });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Budget deleted successfully",
  });
};