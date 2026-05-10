// TransactionModal.tsx — Add and Edit form in a modal overlay.
//
// One component handles both ADD and EDIT modes:
// - If `transaction` prop is provided → Edit mode (pre-fills form)
// - If no `transaction` prop → Add mode (empty form)
//
// This is the "controlled form" pattern: every input is bound to
// React state via value + onChange. No uncontrolled refs needed.

"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Transaction } from "@/lib/api";
import { CATEGORIES } from "@/lib/categories";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    amount: number;
    category: string;
    date: string;
  }) => Promise<void>;
  transaction?: Transaction | null; // if provided = edit mode
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSave,
  transaction,
}: TransactionModalProps) {
  const isEditMode = !!transaction;

  // Form state — one piece of state per field
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState("");
  const [isExpense, setIsExpense] = useState(true); // toggle for +/-
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When editing, pre-fill the form with existing transaction data
  useEffect(() => {
    if (transaction) {
      setName(transaction.name);
      const amt = parseFloat(transaction.amount);
      setIsExpense(amt < 0);
      setAmount(String(Math.abs(amt)));
      setCategory(transaction.category);
      // Format date as YYYY-MM-DD for the date input
      setDate(new Date(transaction.date).toISOString().split("T")[0]);
    } else {
      // Reset form for add mode
      setName("");
      setAmount("");
      setCategory("Food");
      setIsExpense(true);
      // Default date to today
      setDate(new Date().toISOString().split("T")[0]);
    }
    setError(null);
  }, [transaction, isOpen]);

  const handleSubmit = async () => {
    // Client-side validation before hitting the API
    if (!name.trim()) {
      setError("Transaction name is required");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid positive amount");
      return;
    }

    if (!date) {
      setError("Date is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        // Apply sign: expenses are negative, income is positive
        amount: isExpense ? -parsedAmount : parsedAmount,
        category,
        date,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save transaction");
    } finally {
      setIsSaving(false);
    }
  };

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    // Modal backdrop — fixed overlay covering the entire screen
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1e1e2e]">
          <h2 className="text-lg font-semibold text-white">
            {isEditMode ? "Edit Transaction" : "Add Transaction"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form body */}
        <div className="p-6 space-y-4">
          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Transaction name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Transaction Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Swiggy, Salary, Netflix"
              className="w-full bg-[#1a1a24] border border-[#1e1e2e] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 placeholder:text-gray-600 transition-colors"
            />
          </div>

          {/* Amount + type toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Amount
            </label>
            <div className="flex gap-2">
              {/* Expense / Income toggle */}
              <div className="flex rounded-lg border border-[#1e1e2e] overflow-hidden flex-shrink-0">
                <button
                  onClick={() => setIsExpense(true)}
                  className={`px-3 py-2.5 text-sm font-medium transition-colors ${
                    isExpense
                      ? "bg-red-500/20 text-red-400"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  − Expense
                </button>
                <button
                  onClick={() => setIsExpense(false)}
                  className={`px-3 py-2.5 text-sm font-medium transition-colors ${
                    !isExpense
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  + Income
                </button>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="flex-1 bg-[#1a1a24] border border-[#1e1e2e] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 placeholder:text-gray-600 transition-colors"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#1a1a24] border border-[#1e1e2e] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-[#1a1a24]">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#1a1a24] border border-[#1e1e2e] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-[#1e1e2e] text-gray-400 hover:text-white rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            {isSaving ? "Saving…" : isEditMode ? "Update" : "Add Transaction"}
          </button>
        </div>
      </div>
    </div>
  );
}