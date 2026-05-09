// transactionService.ts — All database operations for transactions.
//
// Every function here:
//   1. Accepts plain parameters (not req/res objects)
//   2. Always filters by userId — this is your authorization layer
//   3. Returns typed data the controller can send directly
//
// The userId filter is CRITICAL for security. Without it, a user
// could read or delete another user's transactions.

import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

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

// getTransactions — paginated list with optional filters
// Supports: category filter, date range, search by name
export const getTransactions = async ({
  userId,
  page = 1,
  limit = 20,
  category,
  startDate,
  endDate,
  search,
}: GetTransactionsParams) => {
  // Build the WHERE clause dynamically based on which filters are provided
  // Prisma.TransactionWhereInput is the TypeScript type for Prisma WHERE clauses
  const where: Prisma.TransactionWhereInput = {
    userId, // ALWAYS filter by the authenticated user's ID
  };

  // Only add category filter if one was provided
  if (category) {
    where.category = category;
  }

  // Date range filter — both optional independently
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate); // gte = greater than or equal
    if (endDate) where.date.lte = new Date(endDate);     // lte = less than or equal
  }

  // Search by transaction name (case-insensitive)
  // Prisma's `contains` with `mode: "insensitive"` maps to SQL ILIKE
  if (search) {
    where.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  // Run two queries in parallel:
  //   1. The actual paginated data
  //   2. The total count (needed for frontend pagination controls)
  // Promise.all runs both simultaneously — faster than sequential
  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" }, // newest first
      skip: (page - 1) * limit,  // pagination offset
      take: limit,                // page size
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

// getTransactionById — single record, ownership verified
export const getTransactionById = async (id: string, userId: string) => {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id,
      userId, // ensures user can only access their own transactions
    },
  });

  return transaction; // null if not found or wrong user
};

// createTransaction — inserts a new transaction row
export const createTransaction = async ({
  userId,
  name,
  amount,
  category,
  date,
  aiCategorized = false,
}: CreateTransactionParams) => {
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      name: name.trim(),
      amount: new Prisma.Decimal(amount), // convert number to Prisma Decimal
      category: category.trim(),
      date: new Date(date),
      aiCategorized,
    },
  });

  return transaction;
};

// updateTransaction — partial update, ownership verified
// Only updates fields that are actually provided (PATCH semantics)
export const updateTransaction = async (
  id: string,
  userId: string,
  updates: UpdateTransactionParams
) => {
  // First verify the transaction exists AND belongs to this user
  const existing = await getTransactionById(id, userId);
  if (!existing) return null;

  // Build update object — only include fields that were provided
  // This prevents accidentally overwriting fields with undefined
  const data: Prisma.TransactionUpdateInput = {};
  if (updates.name !== undefined) data.name = updates.name.trim();
  if (updates.amount !== undefined) data.amount = new Prisma.Decimal(updates.amount);
  if (updates.category !== undefined) data.category = updates.category.trim();
  if (updates.date !== undefined) data.date = new Date(updates.date);

  const transaction = await prisma.transaction.update({
    where: { id },
    data,
  });

  return transaction;
};

// deleteTransaction — removes a row, ownership verified
export const deleteTransaction = async (id: string, userId: string) => {
  // Verify ownership before deleting
  const existing = await getTransactionById(id, userId);
  if (!existing) return null;

  await prisma.transaction.delete({
    where: { id },
  });

  return true;
};

// getTransactionSummary — aggregated stats for the dashboard
// Returns: total income, total expenses, net, spending by category
export const getTransactionSummary = async (
  userId: string,
  month?: number,
  year?: number
) => {
  // Build date range filter for the requested month
  const where: Prisma.TransactionWhereInput = { userId };

  if (month && year) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59); // last day of month
    where.date = { gte: startOfMonth, lte: endOfMonth };
  }

  // Get all transactions for the period (for aggregation)
  const transactions = await prisma.transaction.findMany({
    where,
    select: { amount: true, category: true }, // only fetch what we need
  });

  // Aggregate in JavaScript — for small datasets this is fine.
  // For large datasets (100k+ rows) you'd push aggregation to SQL with groupBy.
  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryTotals: Record<string, number> = {};

  for (const tx of transactions) {
    const amount = Number(tx.amount); // Prisma Decimal → JS number

    if (amount >= 0) {
      totalIncome += amount;
    } else {
      totalExpenses += Math.abs(amount);
    }

    // Group by category
    if (!categoryTotals[tx.category]) {
      categoryTotals[tx.category] = 0;
    }
    categoryTotals[tx.category] += Math.abs(amount);
  }

  // Convert category object to sorted array for the frontend chart
  const byCategory = Object.entries(categoryTotals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total); // highest spending first

  return {
    totalIncome,
    totalExpenses,
    netSavings: totalIncome - totalExpenses,
    byCategory,
    transactionCount: transactions.length,
  };
};