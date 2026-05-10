// StatsCard — displays a single metric with label, value, and optional trend
// Used for: Total Income, Total Expenses, Net Savings, Transaction Count

import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon: LucideIcon;
  iconColor?: string;
  valueColor?: string;
}

export default function StatsCard({
  label,
  value,
  subtext,
  trend,
  trendValue,
  icon: Icon,
  iconColor = "text-emerald-500",
  valueColor = "text-white",
}: StatsCardProps) {
  const trendColor =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
      ? "text-red-400"
      : "text-gray-400";

  const trendSymbol = trend === "up" ? "↑" : trend === "down" ? "↓" : "";

  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5 flex flex-col gap-3 hover:border-[#2a2a3e] transition-colors">
      {/* Label row with icon */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </span>
        <div className={`${iconColor} opacity-70`}>
          <Icon size={16} />
        </div>
      </div>

      {/* Value */}
      <div className={`text-2xl font-bold ${valueColor} tabular-nums`}>
        {value}
      </div>

      {/* Trend or subtext */}
      {(trendValue || subtext) && (
        <div className={`text-xs ${trendColor}`}>
          {trendSymbol && <span className="mr-1">{trendSymbol}</span>}
          {trendValue || subtext}
        </div>
      )}
    </div>
  );
}