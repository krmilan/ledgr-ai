// budgetService.ts
// Fixed: avoid Prisma namespace types that don't resolve on Render

import { prisma } from "./prisma";
import { Prisma, Budget } from "@prisma/client";

// ─── Helper ───────────────────────────────────────────────────────────

const toDecimal = (value: number) => new Prisma.Decimal(value);

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

const getBudgetStatus = (percentUsed: number): "good" | "warning" | "over" => {
  if (percentUsed > 100) return "over";
  if (percentUsed >= 75) return "warning";
  return "good";
};

// ─── Service Functions ─────────────────────────────────────────────────

export const getBudgetsWithSpend = async (
  userId: string,
  month: number,
  year: number
): Promise<BudgetWithSpend[]> => {
  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    orderBy: { category: "asc" },
  });

  if (budgets.length === 0) return [];

  const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endOfMonth   = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const spending = await prisma.transaction.groupBy({
    by: ["category"],
    where: {
      userId,
      date: { gte: startOfMonth, lte: endOfMonth },
      amount: { lt: 0 },
    },
    _sum: { amount: true },
  });

  const spendingMap: Record<string, number> = {};
  for (const item of spending) {
    spendingMap[item.category] = Math.abs(Number(item._sum.amount ?? 0));
  }

  // Explicit Budget type on callback fixes TS7006
  return budgets.map((budget: Budget): BudgetWithSpend => {
    const limitAmount = Number(budget.limitAmount);
    const spent       = spendingMap[budget.category] ?? 0;
    const remaining   = Math.max(0, limitAmount - spent);
    const percentUsed = limitAmount > 0
      ? Math.round((spent / limitAmount) * 100)
      : 0;

    return {
      id:           budget.id,
      category:     budget.category,
      limitAmount,
      spent,
      remaining,
      percentUsed,
      isOverBudget: spent > limitAmount,
      status:       getBudgetStatus(percentUsed),
      month:        budget.month,
      year:         budget.year,
    };
  });
};

export const upsertBudget = async ({
  userId,
  category,
  limitAmount,
  month,
  year,
}: CreateBudgetParams) => {
  return prisma.budget.upsert({
    where: {
      userId_category_month_year: { userId, category, month, year },
    },
    update: { limitAmount: toDecimal(limitAmount) },
    create: {
      userId,
      category: category.trim(),
      limitAmount: toDecimal(limitAmount),
      month,
      year,
    },
  });
};

export const updateBudget = async (
  id: string,
  userId: string,
  updates: UpdateBudgetParams
) => {
  const existing = await prisma.budget.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const data: {
    limitAmount?: Prisma.Decimal;
    category?: string;
  } = {};

  if (updates.limitAmount !== undefined) data.limitAmount = toDecimal(updates.limitAmount);
  if (updates.category    !== undefined) data.category    = updates.category.trim();

  return prisma.budget.update({ where: { id }, data });
};

export const deleteBudget = async (id: string, userId: string) => {
  const existing = await prisma.budget.findFirst({ where: { id, userId } });
  if (!existing) return null;
  await prisma.budget.delete({ where: { id } });
  return true;
};

export const getBudgetSummary = async (
  userId: string,
  month: number,
  year: number
) => {
  const budgetsWithSpend = await getBudgetsWithSpend(userId, month, year);

  const totalBudgeted = budgetsWithSpend.reduce((sum, b) => sum + b.limitAmount, 0);
  const totalSpent    = budgetsWithSpend.reduce((sum, b) => sum + b.spent,       0);

  const statusCounts = { good: 0, warning: 0, over: 0 };
  for (const b of budgetsWithSpend) statusCounts[b.status]++;

  return {
    totalBudgeted,
    totalSpent,
    totalRemaining:     Math.max(0, totalBudgeted - totalSpent),
    overallPercentUsed: totalBudgeted > 0
      ? Math.round((totalSpent / totalBudgeted) * 100)
      : 0,
    budgetCount:  budgetsWithSpend.length,
    statusCounts,
    budgets:      budgetsWithSpend,
  };
};