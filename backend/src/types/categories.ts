// categories.ts — Single source of truth for valid transaction categories.
//
// IMPORTANT: Budget matching works by comparing category strings exactly.
// If a transaction is categorized as "food" but the budget is "Food",
// they won't match. This constant enforces consistent casing everywhere.

export const CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Shopping",
  "Health",
  "Housing",
  "Utilities",
  "Education",
  "Travel",
  "Income",
  "Other",
] as const;

// This creates a TypeScript union type: "Food" | "Transport" | ...
// Use this as a type anywhere you accept a category string
export type Category = (typeof CATEGORIES)[number];

export const isValidCategory = (value: string): value is Category => {
  return CATEGORIES.includes(value as Category);
};