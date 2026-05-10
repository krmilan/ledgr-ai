// aiService.ts — All OpenAI interactions in one place.
//
// Two functions:
//   1. categorizeTransaction — given a name + amount, return the best category
//   2. generateInsight — given a user's monthly spending, return a paragraph of analysis
//
// We use gpt-4o-mini because it's:
//   - Fast (< 2 seconds)
//   - Cheap ($0.15 per million input tokens)
//   - Smart enough for classification and short analysis tasks

import OpenAI from "openai";
import { prisma } from "./prisma";
import { CATEGORIES } from "../types/categories";

// Lazy-initialize the client so the app doesn't crash on startup
// if OPENAI_API_KEY is missing — it only fails when actually called
let openaiClient: OpenAI | null = null;

const getClient = (): OpenAI => {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
};

// ─── Feature 1: Auto-categorization ──────────────────────────────────

export const categorizeTransaction = async (
  name: string,
  amount: number
): Promise<string> => {
  const client = getClient();

  // We use a system prompt + user prompt pattern.
  // The system prompt sets strict output rules — respond with ONLY one word.
  // This prevents the model from adding explanation text we'd need to parse.
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 10, // we only need one word — cap tokens to save cost
    temperature: 0, // 0 = deterministic, no creativity needed for classification
    messages: [
      {
        role: "system",
        content: `You are a financial transaction categorizer.
Given a transaction name and amount, respond with EXACTLY ONE WORD from this list:
${CATEGORIES.join(", ")}
No explanation. No punctuation. Just the category word.
If amount is positive, it is likely Income.
Use "Other" if nothing fits.`,
      },
      {
        role: "user",
        content: `Transaction: "${name}", Amount: ${amount > 0 ? "+" : ""}${amount}`,
      },
    ],
  });

  const result = completion.choices[0]?.message?.content?.trim() || "Other";

  // Validate the response is actually one of our categories
  // If the model hallucinated something else, default to "Other"
  const isValid = CATEGORIES.includes(result as typeof CATEGORIES[number]);
  return isValid ? result : "Other";
};

// ─── Feature 2: Monthly insights ─────────────────────────────────────

export const generateInsight = async (
  userId: string,
  month: number,
  year: number
): Promise<string> => {
  const client = getClient();

  // Fetch the user's spending data for this month
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    select: { name: true, amount: true, category: true },
  });

  if (transactions.length === 0) {
    return "No transactions found for this period. Add some transactions to get AI-powered insights!";
  }

  // Aggregate the data before sending to OpenAI
  // We send summaries, not raw transactions — cheaper and more focused
  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryTotals: Record<string, number> = {};

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    if (amount >= 0) {
      totalIncome += amount;
    } else {
      totalExpenses += Math.abs(amount);
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + Math.abs(amount);
    }
  }

  const savingsRate = totalIncome > 0
    ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)
    : 0;

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cat, amt]) => `${cat}: ₹${amt.toLocaleString("en-IN")}`)
    .join(", ");

  // Build the prompt with the aggregated data
  const prompt = `
Analyze this person's finances for ${new Date(year, month - 1).toLocaleString("en-IN", { month: "long", year: "numeric" })}:

- Total Income: ₹${totalIncome.toLocaleString("en-IN")}
- Total Expenses: ₹${totalExpenses.toLocaleString("en-IN")}
- Net Savings: ₹${(totalIncome - totalExpenses).toLocaleString("en-IN")}
- Savings Rate: ${savingsRate}%
- Top spending categories: ${topCategories}
- Number of transactions: ${transactions.length}

Write a concise, friendly financial insight in 3-4 sentences. 
Mention the savings rate, highlight the biggest spending category, 
and give one specific actionable tip. 
Use Indian Rupee (₹) for amounts. Be encouraging but honest.
Do not use bullet points — write in flowing prose.
  `.trim();

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 200,
    temperature: 0.7, // some creativity for natural-sounding text
    messages: [
      {
        role: "system",
        content: "You are a friendly personal finance advisor who gives concise, actionable insights. Always use ₹ for Indian Rupees.",
      },
      { role: "user", content: prompt },
    ],
  });

  const insight = completion.choices[0]?.message?.content?.trim() ||
    "Unable to generate insight at this time. Please try again.";

    // Save the insight to the database so it persists between sessions
    // Save to database — delete old one first, then create fresh
    // This is cleaner than upsert when we don't have a unique compound key
    await prisma.aiInsight.deleteMany({
        where: { userId, month, year },
    });

    await prisma.aiInsight.create({
        data: { userId, insightText: insight, month, year },
    });

    return insight;
};

// getLatestInsight — fetch the most recently saved insight for a period
export const getLatestInsight = async (
  userId: string,
  month: number,
  year: number
): Promise<string | null> => {
  const insight = await prisma.aiInsight.findFirst({
    where: { userId, month, year },
    orderBy: { generatedAt: "desc" },
  });
  return insight?.insightText || null;
};