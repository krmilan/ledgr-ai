export const CATEGORIES = [
  "Food", "Transport", "Entertainment", "Shopping",
  "Health", "Housing", "Utilities", "Education",
  "Travel", "Income", "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Food:          { bg: "#f97316/10", text: "#fb923c", dot: "#f97316" },
  Transport:     { bg: "#3b82f6/10", text: "#60a5fa", dot: "#3b82f6" },
  Entertainment: { bg: "#a855f7/10", text: "#c084fc", dot: "#a855f7" },
  Shopping:      { bg: "#ec4899/10", text: "#f472b6", dot: "#ec4899" },
  Health:        { bg: "#ef4444/10", text: "#f87171", dot: "#ef4444" },
  Housing:       { bg: "#eab308/10", text: "#facc15", dot: "#eab308" },
  Utilities:     { bg: "#6b7280/10", text: "#9ca3af", dot: "#6b7280" },
  Education:     { bg: "#6366f1/10", text: "#818cf8", dot: "#6366f1" },
  Travel:        { bg: "#06b6d4/10", text: "#22d3ee", dot: "#06b6d4" },
  Income:        { bg: "#10b981/10", text: "#34d399", dot: "#10b981" },
  Other:         { bg: "#6b7280/10", text: "#9ca3af", dot: "#6b7280" },
};