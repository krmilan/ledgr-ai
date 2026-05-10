"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowDownLeft, ArrowRight } from "lucide-react";
import { Transaction } from "@/lib/api";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

// Format a number as Indian Rupees
// toLocaleString("en-IN") gives: 1,00,000 format
const formatAmount = (amount: string | number) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const abs = Math.abs(num);
  const formatted = abs.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return { formatted, isPositive: num >= 0 };
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

// Category color dots — visual categorization at a glance
const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-orange-500",
  Transport: "bg-blue-500",
  Entertainment: "bg-purple-500",
  Shopping: "bg-pink-500",
  Health: "bg-red-500",
  Housing: "bg-yellow-500",
  Utilities: "bg-gray-500",
  Education: "bg-indigo-500",
  Travel: "bg-cyan-500",
  Income: "bg-emerald-500",
  Other: "bg-gray-400",
};

export default function RecentTransactions({
  transactions,
}: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 text-sm">
        No transactions yet.{" "}
        <Link href="/transactions" className="text-emerald-500 hover:underline">
          Add your first one →
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#1e1e2e]">
      {transactions.map((tx) => {
        const { formatted, isPositive } = formatAmount(tx.amount);
        const dotColor = CATEGORY_COLORS[tx.category] || "bg-gray-400";

        return (
          <div
            key={tx.id}
            className="flex items-center gap-4 py-3 hover:bg-[#1a1a24] px-2 rounded-lg transition-colors -mx-2"
          >
            {/* Income vs expense icon */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                isPositive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {isPositive ? (
                <ArrowDownLeft size={16} />
              ) : (
                <ArrowUpRight size={16} />
              )}
            </div>

            {/* Name + category */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{tx.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                <span className="text-xs text-gray-500">
                  {tx.category} · {formatDate(tx.date)}
                </span>
                {tx.aiCategorized && (
                  <span className="text-xs text-emerald-600">✦ AI</span>
                )}
              </div>
            </div>

            {/* Amount */}
            <div
              className={`text-sm font-semibold tabular-nums ${
                isPositive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isPositive ? "+" : "-"}₹{formatted}
            </div>
          </div>
        );
      })}

      {/* Link to full transactions page */}
      <div className="pt-3">
        <Link
          href="/transactions"
          className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-colors py-2"
        >
          View all transactions
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}