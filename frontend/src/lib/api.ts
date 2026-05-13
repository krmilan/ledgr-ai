import { useAuth } from "@clerk/nextjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface Transaction {
  id: string;
  userId: string;
  name: string;
  amount: string;
  category: string;
  date: string;
  aiCategorized: boolean;
  createdAt: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  byCategory: { category: string; total: number }[];
  transactionCount: number;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface Budget {
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

export interface BudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentUsed: number;
  budgetCount: number;
  statusCounts: { good: number; warning: number; over: number };
  budgets: Budget[];
}

const createApiClient = (getToken: () => Promise<string | null>) => {
  const fetch_ = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const token = await getToken();
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || `API error ${res.status}`);
    return data.data as T;
  };

  const qs = (params: Record<string, string | number | undefined>) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.set(k, String(v)); });
    const s = q.toString();
    return s ? `?${s}` : "";
  };

  return {
    users: {
      sync: (email: string) =>
        fetch_<{ user: { id: string; clerkId: string; email: string } }>(
          "/api/users/sync", { method: "POST", body: JSON.stringify({ email }) }
        ),
    },
    transactions: {
      list: (p?: { page?: number; limit?: number; category?: string; search?: string }) =>
        fetch_<PaginatedTransactions>(`/api/transactions${qs({ ...p })}`),
      summary: (month?: number, year?: number) =>
        fetch_<TransactionSummary>(`/api/transactions/summary${qs({ month, year })}`),
      create: (d: { name: string; amount: number; category: string; date: string }) =>
        fetch_<{ transaction: Transaction }>("/api/transactions", { method: "POST", body: JSON.stringify(d) }),
      update: (id: string, d: Partial<{ name: string; amount: number; category: string; date: string }>) =>
        fetch_<{ transaction: Transaction }>(`/api/transactions/${id}`, { method: "PATCH", body: JSON.stringify(d) }),
      delete: (id: string) =>
        fetch_<{ message: string }>(`/api/transactions/${id}`, { method: "DELETE" }),
    },
    budgets: {
      list: (month?: number, year?: number) =>
        fetch_<BudgetSummary>(`/api/budgets${qs({ month, year })}`),
      upsert: (d: { category: string; limitAmount: number; month: number; year: number }) =>
        fetch_<{ budget: Budget }>("/api/budgets", { method: "POST", body: JSON.stringify(d) }),
      delete: (id: string) =>
        fetch_<{ message: string }>(`/api/budgets/${id}`, { method: "DELETE" }),
    },
    ai: {
      getInsight: (month?: number, year?: number) =>
        fetch_<{ insight: string | null }>(
          `/api/ai/insights${qs({ month, year })}`
        ),
      generateInsight: (month: number, year: number) =>
        fetch_<{ insight: string }>(
          "/api/ai/insights",
        { method: "POST", body: JSON.stringify({ month, year }) }
        ),
    },
    demo: {
      seed: () =>
        fetch_<{ transactionsSeeded: number; budgetsSeeded: number }>(
          "/api/demo/seed",
            { method: "POST" }
        ),
      clear: () =>
        fetch_<{ message: string }>(
         "/api/demo/clear",
          { method: "DELETE" }
        ),
    },
  };
};

export const useApi = () => {
  const { getToken } = useAuth();
  return createApiClient(() => getToken());
};