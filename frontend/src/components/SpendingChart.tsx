// SpendingChart — bar chart of spending by category using Recharts
// Recharts is built on D3 but with a React-friendly declarative API

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TransactionSummary } from "@/lib/api";

interface SpendingChartProps {
  data: TransactionSummary["byCategory"];
}

// Custom tooltip that matches our dark theme
// Recharts lets you replace the default tooltip with any React component
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#1a1a24] border border-[#1e1e2e] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-white">
        ₹{payload[0].value.toLocaleString("en-IN")}
      </p>
    </div>
  );
};

export default function SpendingChart({ data }: SpendingChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        No spending data for this period
      </div>
    );
  }

  // Take top 7 categories — chart gets crowded beyond that
  const chartData = data
    .filter((d) => d.total > 0)
    .slice(0, 7)
    .map((d) => ({
      category: d.category,
      // Shorten long category names for the X axis
      name: d.category.length > 8 ? d.category.slice(0, 8) + "…" : d.category,
      total: Math.round(d.total),
    }));

  return (
    // ResponsiveContainer makes the chart fill its parent's width
    // height must be a fixed pixel value — "100%" doesn't work for height
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={chartData}
        margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        barSize={28}
      >
        {/* Subtle horizontal grid lines only — no vertical lines */}
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#1e1e2e"
        />

        <XAxis
          dataKey="name"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />

        {/* Format Y axis as Indian locale numbers */}
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) =>
            v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
          }
          width={48}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "#ffffff08" }} // very subtle hover highlight
        />

        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
          {/* Gradient from bright to dimmer emerald — highest bar is brightest */}
          {chartData.map((_, index) => (
            <Cell
              key={index}
              fill="#10b981"
              opacity={1 - index * 0.1} // each subsequent bar slightly dimmer
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}