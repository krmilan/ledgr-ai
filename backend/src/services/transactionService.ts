// transactionService.ts
// Avoids all Prisma namespace types — compatible with Prisma v5 on Render

import { prisma } from "./prisma";

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

export const getTransactions = async ({
  userId,
  page = 1,
  limit = 20,
  category,
  startDate,
  endDate,
  search,
}: GetTransactionsParams) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { userId };

  if (category) where.category = category;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate)   where.date.lte = new Date(endDate);
  }
  if (search) where.name = { contains: search, mode: "insensitive" };

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
      // Pass amount as string — Prisma accepts string for Decimal fields
      amount: amount.toString(),
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (updates.name     !== undefined) data.name     = updates.name.trim();
  if (updates.amount   !== undefined) data.amount   = updates.amount.toString();
  if (updates.category !== undefined) data.category = updates.category.trim();
  if (updates.date     !== undefined) data.date     = new Date(updates.date);

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { userId };

  if (month && year) {
    where.date = {
      gte: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
      lte: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
    };
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