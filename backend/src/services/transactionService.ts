// transactionService.ts
// All database logic for transactions.
// userId is always our PostgreSQL UUID, never the Clerk ID.

import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

// ─── Helper ───────────────────────────────────────────────────────────

const toDecimal = (value: number) => new Prisma.Decimal(value);

// ─── Types ────────────────────────────────────────────────────────────

export interface GetTransactionsParams {
  userId: string;
  page?: number;
  limit?: number;
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CreateTransactionParams {
  userId: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  aiCategorized?: boolean;
}

export interface UpdateTransactionParams {
  name?: string;
  amount?: number;
  category?: string;
  date?: string;
}

// ─── Service Functions ────────────────────────────────────────────────

export const getTransactions = async ({
  userId,
  page = 1,
  limit = 20,
  category,
  startDate,
  endDate,
  search,
}: GetTransactionsParams) => {
  const where: Prisma.TransactionWhereInput = { userId };

  if (category) where.category = category;

  if (startDate || endDate) {
    where.date = {};
    if (startDate) (where.date as Prisma.DateTimeFilter).gte = new Date(startDate);
    if (endDate)   (where.date as Prisma.DateTimeFilter).lte = new Date(endDate);
  }

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
};

export const getTransactionById = async (id: string, userId: string) => {
  return prisma.transaction.findFirst({ where: { id, userId } });
};

export const createTransaction = async ({
  userId,
  name,
  amount,
  category,
  date,
  aiCategorized = false,
}: CreateTransactionParams) => {
  return prisma.transaction.create({
    data: {
      userId,
      name: name.trim(),
      amount: toDecimal(amount),
      category: category.trim(),
      date: new Date(date),
      aiCategorized,
    },
  });
};

export const updateTransaction = async (
  id: string,
  userId: string,
  updates: UpdateTransactionParams
) => {
  const existing = await getTransactionById(id, userId);
  if (!existing) return null;

  const data: Prisma.TransactionUpdateInput = {};
  if (updates.name !== undefined)     data.name     = updates.name.trim();
  if (updates.amount !== undefined)   data.amount   = toDecimal(updates.amount);
  if (updates.category !== undefined) data.category = updates.category.trim();
  if (updates.date !== undefined)     data.date     = new Date(updates.date);

  return prisma.transaction.update({ where: { id }, data });
};

export const deleteTransaction = async (id: string, userId: string) => {
  const existing = await getTransactionById(id, userId);
  if (!existing) return null;
  await prisma.transaction.delete({ where: { id } });
  return true;
};

export const getTransactionSummary = async (
  userId: string,
  month?: number,
  year?: number
) => {
  const where: Prisma.TransactionWhereInput = { userId };

  if (month && year) {
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endOfMonth   = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    where.date = { gte: startOfMonth, lte: endOfMonth };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    select: { amount: true, category: true },
  });

  let totalIncome   = 0;
  let totalExpenses = 0;
  const categoryTotals: Record<string, number> = {};

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    if (amount >= 0) {
      totalIncome += amount;
    } else {
      totalExpenses += Math.abs(amount);
    }
    if (!categoryTotals[tx.category]) categoryTotals[tx.category] = 0;
    categoryTotals[tx.category] += Math.abs(amount);
  }

  const byCategory = Object.entries(categoryTotals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  return {
    totalIncome,
    totalExpenses,
    netSavings: totalIncome - totalExpenses,
    byCategory,
    transactionCount: transactions.length,
  };
};