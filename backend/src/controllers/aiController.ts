// aiController.ts — HTTP handlers for AI endpoints.
// Same pattern as other controllers: resolve Clerk ID → DB UUID first.

import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import { getUserByClerkId } from "../services/userService";
import {
  generateInsight,
  getLatestInsight,
  categorizeTransaction,
} from "../services/aiService";

const resolveDbUserId = async (clerkId: string): Promise<string | null> => {
  const user = await getUserByClerkId(clerkId);
  return user?.id ?? null;
};

// POST /api/ai/insights
// Generates a new AI insight for the given month/year and saves it
export const generateInsightHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const dbUserId = await resolveDbUserId(req.userId!);
  if (!dbUserId) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  const now = new Date();
  const month = parseInt(req.body.month) || now.getMonth() + 1;
  const year = parseInt(req.body.year) || now.getFullYear();

  try {
    const insight = await generateInsight(dbUserId, month, year);
    res.status(200).json({ success: true, data: { insight } });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "AI service unavailable",
    });
  }
};

// GET /api/ai/insights?month=5&year=2026
// Returns the most recently saved insight without generating a new one
export const getInsightHandler = async (
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

  const insight = await getLatestInsight(dbUserId, month, year);

  res.status(200).json({
    success: true,
    data: { insight },
  });
};

// POST /api/ai/categorize
// Categorizes a single transaction name — used for testing
export const categorizeHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { name, amount } = req.body;

  if (!name) {
    res.status(400).json({ success: false, error: "name is required" });
    return;
  }

  const category = await categorizeTransaction(name, parseFloat(amount) || -1);

  res.status(200).json({ success: true, data: { category } });
};