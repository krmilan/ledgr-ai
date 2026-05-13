// demoController.ts
// Seeds realistic Indian finance demo data for the current user.
// Safe to call multiple times — clears existing demo data first.
// Only seeds if user has fewer than 5 transactions (prevents overwriting real data).

import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types";
import { getUserByClerkId } from "../services/userService";
import { prisma } from "../services/prisma";

const resolveDbUserId = async (clerkId: string): Promise<string | null> => {
  const user = await getUserByClerkId(clerkId);
  return user?.id ?? null;
};

// Realistic Indian finance transactions for current month + last month
const getDemoTransactions = (userId: string) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // Helper: create a UTC date for this month
  const thisMonth = (day: number) =>
    new Date(Date.UTC(year, month, day, 10, 0, 0));

  // Helper: create a UTC date for last month
  const lastMonth = (day: number) => {
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    return new Date(Date.UTC(y, m, day, 10, 0, 0));
  };

  return [
    // ── This month ─────────────────────────────────────────────
    { userId, name: "Monthly Salary",      amount: "85000",  category: "Income",        date: thisMonth(1),  aiCategorized: false },
    { userId, name: "Freelance Payment",   amount: "15000",  category: "Income",        date: thisMonth(5),  aiCategorized: false },
    { userId, name: "Swiggy",              amount: "-450",   category: "Food",          date: thisMonth(2),  aiCategorized: true  },
    { userId, name: "Zomato",              amount: "-380",   category: "Food",          date: thisMonth(4),  aiCategorized: true  },
    { userId, name: "Big Basket",          amount: "-2200",  category: "Food",          date: thisMonth(6),  aiCategorized: true  },
    { userId, name: "Ola Cab",             amount: "-280",   category: "Transport",     date: thisMonth(3),  aiCategorized: true  },
    { userId, name: "Metro Card Recharge", amount: "-500",   category: "Transport",     date: thisMonth(7),  aiCategorized: false },
    { userId, name: "Petrol",              amount: "-1800",  category: "Transport",     date: thisMonth(10), aiCategorized: false },
    { userId, name: "Netflix",             amount: "-649",   category: "Entertainment", date: thisMonth(3),  aiCategorized: true  },
    { userId, name: "Spotify",             amount: "-119",   category: "Entertainment", date: thisMonth(3),  aiCategorized: true  },
    { userId, name: "Amazon Shopping",     amount: "-2300",  category: "Shopping",      date: thisMonth(8),  aiCategorized: true  },
    { userId, name: "Myntra",              amount: "-1499",  category: "Shopping",      date: thisMonth(12), aiCategorized: true  },
    { userId, name: "Gym Membership",      amount: "-1500",  category: "Health",        date: thisMonth(1),  aiCategorized: false },
    { userId, name: "Apollo Pharmacy",     amount: "-620",   category: "Health",        date: thisMonth(9),  aiCategorized: true  },
    { userId, name: "Electricity Bill",    amount: "-1200",  category: "Utilities",     date: thisMonth(7),  aiCategorized: false },
    { userId, name: "Internet Bill",       amount: "-999",   category: "Utilities",     date: thisMonth(5),  aiCategorized: false },
    { userId, name: "House Rent",          amount: "-18000", category: "Housing",       date: thisMonth(1),  aiCategorized: false },
    { userId, name: "Udemy Course",        amount: "-1299",  category: "Education",     date: thisMonth(11), aiCategorized: true  },

    // ── Last month ──────────────────────────────────────────────
    { userId, name: "Monthly Salary",      amount: "85000",  category: "Income",        date: lastMonth(1),  aiCategorized: false },
    { userId, name: "Swiggy",              amount: "-380",   category: "Food",          date: lastMonth(3),  aiCategorized: true  },
    { userId, name: "Zomato",              amount: "-520",   category: "Food",          date: lastMonth(7),  aiCategorized: true  },
    { userId, name: "Big Basket",          amount: "-1900",  category: "Food",          date: lastMonth(10), aiCategorized: true  },
    { userId, name: "Rapido",              amount: "-150",   category: "Transport",     date: lastMonth(4),  aiCategorized: true  },
    { userId, name: "Petrol",              amount: "-1600",  category: "Transport",     date: lastMonth(8),  aiCategorized: false },
    { userId, name: "Amazon Prime",        amount: "-1499",  category: "Entertainment", date: lastMonth(2),  aiCategorized: true  },
    { userId, name: "BookMyShow",          amount: "-800",   category: "Entertainment", date: lastMonth(15), aiCategorized: true  },
    { userId, name: "Flipkart",            amount: "-3200",  category: "Shopping",      date: lastMonth(5),  aiCategorized: true  },
    { userId, name: "Gym Membership",      amount: "-1500",  category: "Health",        date: lastMonth(1),  aiCategorized: false },
    { userId, name: "Electricity Bill",    amount: "-1100",  category: "Utilities",     date: lastMonth(6),  aiCategorized: false },
    { userId, name: "Internet Bill",       amount: "-999",   category: "Utilities",     date: lastMonth(5),  aiCategorized: false },
    { userId, name: "House Rent",          amount: "-18000", category: "Housing",       date: lastMonth(1),  aiCategorized: false },
  ];
};

const getDemoBudgets = (userId: string) => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-indexed
  const year = now.getFullYear();

  return [
    { userId, category: "Food",          limitAmount: "8000",  month, year },
    { userId, category: "Transport",     limitAmount: "3000",  month, year },
    { userId, category: "Entertainment", limitAmount: "2000",  month, year },
    { userId, category: "Shopping",      limitAmount: "5000",  month, year },
    { userId, category: "Health",        limitAmount: "3000",  month, year },
    { userId, category: "Utilities",     limitAmount: "2500",  month, year },
    { userId, category: "Housing",       limitAmount: "20000", month, year },
    { userId, category: "Education",     limitAmount: "2000",  month, year },
  ];
};

// POST /api/demo/seed
export const seedDemoData = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const dbUserId = await resolveDbUserId(req.userId!);
  if (!dbUserId) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  // Safety check — don't overwrite if user has real data (more than 5 transactions)
  const existingCount = await prisma.transaction.count({
    where: { userId: dbUserId },
  });

  if (existingCount > 5) {
    res.status(409).json({
      success: false,
      error: "You already have transaction data. Clear your transactions first to load demo data.",
    });
    return;
  }

  // Clear any existing demo data for a clean seed
  await prisma.transaction.deleteMany({ where: { userId: dbUserId } });
  await prisma.budget.deleteMany({ where: { userId: dbUserId } });
  await prisma.aiInsight.deleteMany({ where: { userId: dbUserId } });

  // Seed transactions
  const transactions = getDemoTransactions(dbUserId);
  await prisma.transaction.createMany({ data: transactions });

  // Seed budgets
  const budgets = getDemoBudgets(dbUserId);
  for (const budget of budgets) {
    await prisma.budget.upsert({
      where: {
        userId_category_month_year: {
          userId: budget.userId,
          category: budget.category,
          month: budget.month,
          year: budget.year,
        },
      },
      update: { limitAmount: budget.limitAmount },
      create: budget,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      transactionsSeeded: transactions.length,
      budgetsSeeded: budgets.length,
    },
    message: "Demo data loaded successfully!",
  });
};

// DELETE /api/demo/clear
export const clearDemoData = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const dbUserId = await resolveDbUserId(req.userId!);
  if (!dbUserId) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  await prisma.transaction.deleteMany({ where: { userId: dbUserId } });
  await prisma.budget.deleteMany({ where: { userId: dbUserId } });
  await prisma.aiInsight.deleteMany({ where: { userId: dbUserId } });

  res.status(200).json({
    success: true,
    message: "All data cleared successfully",
  });
};