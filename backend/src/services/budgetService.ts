// budgetService.ts — All database logic for budgets.
//
// The interesting function here is getBudgetsWithSpend().
// It answers: "For each budget I set this month, how much have I
// actually spent in that category?"
//
// This requires data from TWO tables — budgets and transactions —
// merged together in the service layer.

import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────

export interface CreateBudgetParams {
  userId: string;
  category: string;
  limitAmount: number;
  month: number;
  year: number;
}

export interface UpdateBudgetParams {
  limitAmount?: number;
  category?: string;
}

// What we return for each budget — limit + actual spend merged
export interface BudgetWithSpend {
  id: string;
  category: string;
  limitAmount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  status: "good" | "warning" | "over";
  month: number;
  year: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────

// Determine budget health status from percentage used
const getBudgetStatus = (percentUsed: number): "good" | "warning" | "over" => {
  if (percentUsed > 100) return "over";
  if (percentUsed >= 75) return "warning";
  return "good";
};

// ─── Service Functions ─────────────────────────────────────────────────

// getBudgetsWithSpend — the core function of this feature
// Fetches budgets and actual spending for the same month, merges them
export const getBudgetsWithSpend = async (
  userId: string,
  month: number,
  year: number
): Promise<BudgetWithSpend[]> => {
  // ── Query 1: Get all budgets for this user/month/year ──────────────
  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    orderBy: { category: "asc" },
  });

  if (budgets.length === 0) return [];

  // ── Query 2: Get spending grouped by category for this month ───────
  // We need the start and end of the requested month for the date filter
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  // Prisma's groupBy — equivalent to:
  // SELECT category, SUM(ABS(amount)) FROM transactions
  // WHERE user_id = ? AND date BETWEEN ? AND ? AND amount < 0
  // GROUP BY category
  const spending = await prisma.transaction.groupBy({
    by: ["category"],
    where: {
      userId,
      date: { gte: startOfMonth, lte: endOfMonth },
      // Only count expenses (negative amounts)
      // Positive amounts are income — don't count against budget
      amount: { lt: 0 },
    },
    _sum: { amount: true },
  });

  // Convert spending array to a map for O(1) lookup: { "Food": 6240, ... }
  const spendingMap: Record<string, number> = {};
  for (const item of spending) {
    // _sum.amount is negative (expenses), so we use Math.abs()
    spendingMap[item.category] = Math.abs(Number(item._sum.amount ?? 0));
  }

  // ── Merge: combine budget limits with actual spending ──────────────
  const result: BudgetWithSpend[] = budgets.map((budget) => {
    const limitAmount = Number(budget.limitAmount);
    // If no spending in this category this month, default to 0
    const spent = spendingMap[budget.category] ?? 0;
    const remaining = Math.max(0, limitAmount - spent); // floor at 0
    const percentUsed = limitAmount > 0
      ? Math.round((spent / limitAmount) * 100)
      : 0;

    return {
      id: budget.id,
      category: budget.category,
      limitAmount,
      spent,
      remaining,
      percentUsed,
      isOverBudget: spent > limitAmount,
      status: getBudgetStatus(percentUsed),
      month: budget.month,
      year: budget.year,
    };
  });

  return result;
};

// createBudget — inserts a new budget row
// The @@unique constraint on [userId, category, month, year]
// will throw a Prisma error if a duplicate is attempted
export const createBudget = async ({
  userId,
  category,
  limitAmount,
  month,
  year,
}: CreateBudgetParams) => {
  try {
    const budget = await prisma.budget.create({
      data: {
        userId,
        category: category.trim(),
        limitAmount: new Prisma.Decimal(limitAmount),
        month,
        year,
      },
    });
    return { budget, error: null };
  } catch (error) {
    // Prisma error code P2002 = unique constraint violation
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        budget: null,
        error: `A budget for ${category} in ${month}/${year} already exists`,
      };
    }
    throw error; // re-throw unexpected errors
  }
};

// upsertBudget — create or update a budget for a category/month/year
// More user-friendly than createBudget — no duplicate errors
export const upsertBudget = async ({
  userId,
  category,
  limitAmount,
  month,
  year,
}: CreateBudgetParams) => {
  const budget = await prisma.budget.upsert({
    where: {
      // This matches the @@unique constraint name Prisma generates
      userId_category_month_year: { userId, category, month, year },
    },
    update: { limitAmount: new Prisma.Decimal(limitAmount) },
    create: {
      userId,
      category: category.trim(),
      limitAmount: new Prisma.Decimal(limitAmount),
      month,
      year,
    },
  });
  return budget;
};

// updateBudget — partial update by id, ownership verified
export const updateBudget = async (
  id: string,
  userId: string,
  updates: UpdateBudgetParams
) => {
  // Verify ownership first
  const existing = await prisma.budget.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const data: Prisma.BudgetUpdateInput = {};
  if (updates.limitAmount !== undefined) {
    data.limitAmount = new Prisma.Decimal(updates.limitAmount);
  }
  if (updates.category !== undefined) {
    data.category = updates.category.trim();
  }

  return prisma.budget.update({ where: { id }, data });
};

// deleteBudget — removes a budget, ownership verified
export const deleteBudget = async (id: string, userId: string) => {
  const existing = await prisma.budget.findFirst({ where: { id, userId } });
  if (!existing) return null;

  await prisma.budget.delete({ where: { id } });
  return true;
};

// getBudgetSummary — overall budget health for a month
// Returns totals across all budgets + a count by status
export const getBudgetSummary = async (
  userId: string,
  month: number,
  year: number
) => {
  const budgetsWithSpend = await getBudgetsWithSpend(userId, month, year);

  const totalBudgeted = budgetsWithSpend.reduce(
    (sum, b) => sum + b.limitAmount, 0
  );
  const totalSpent = budgetsWithSpend.reduce((sum, b) => sum + b.spent, 0);

  const statusCounts = { good: 0, warning: 0, over: 0 };
  for (const b of budgetsWithSpend) {
    statusCounts[b.status]++;
  }

  return {
    totalBudgeted,
    totalSpent,
    totalRemaining: Math.max(0, totalBudgeted - totalSpent),
    overallPercentUsed:
      totalBudgeted > 0
        ? Math.round((totalSpent / totalBudgeted) * 100)
        : 0,
    budgetCount: budgetsWithSpend.length,
    statusCounts,
    budgets: budgetsWithSpend,
  };
};