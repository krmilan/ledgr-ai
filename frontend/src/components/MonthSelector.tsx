"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthSelectorProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function MonthSelector({
  month,
  year,
  onChange,
}: MonthSelectorProps) {
  const goBack = () => {
    if (month === 1) onChange(12, year - 1);
    else onChange(month - 1, year);
  };

  const goForward = () => {
    // Don't allow going into the future beyond current month
    const now = new Date();
    if (year === now.getFullYear() && month === now.getMonth() + 1) return;
    if (month === 12) onChange(1, year + 1);
    else onChange(month + 1, year);
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return month === now.getMonth() + 1 && year === now.getFullYear();
  };

  return (
    <div className="flex items-center gap-2 bg-[#111118] border border-[#1e1e2e] rounded-lg px-3 py-1.5">
      <button
        onClick={goBack}
        className="text-gray-400 hover:text-white transition-colors p-0.5"
      >
        <ChevronLeft size={16} />
      </button>

      <span className="text-sm font-medium text-white min-w-[110px] text-center">
        {MONTHS[month - 1]} {year}
      </span>

      <button
        onClick={goForward}
        disabled={isCurrentMonth()}
        className="text-gray-400 hover:text-white transition-colors p-0.5 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}