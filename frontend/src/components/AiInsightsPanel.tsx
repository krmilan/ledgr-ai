"use client";

import { Sparkles, RefreshCw } from "lucide-react";

interface AiInsightsPanelProps {
  insight?: string;
  isLoading?: boolean;
  onGenerate?: () => void;
}

export default function AiInsightsPanel({
  insight,
  isLoading = false,
  onGenerate,
}: AiInsightsPanelProps) {
  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header with emerald tint */}
      <div className="bg-emerald-500/5 border-b border-emerald-500/10 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">
            AI Insights
          </span>
        </div>
        <span className="text-xs text-gray-500 bg-[#1a1a24] px-2 py-0.5 rounded-full">
          GPT-4o mini
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 p-5">
        {isLoading ? (
          <div className="space-y-2">
            {/* Skeleton loading lines */}
            {[100, 80, 90, 60].map((w, i) => (
              <div
                key={i}
                className="h-3 bg-[#1a1a24] rounded animate-pulse"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        ) : insight ? (
          <p className="text-sm text-gray-300 leading-relaxed">{insight}</p>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Sparkles size={18} className="text-emerald-400" />
            </div>
            <p className="text-sm text-gray-400">
              Generate an AI analysis of your spending patterns this month.
            </p>
          </div>
        )}
      </div>

      {/* Generate button */}
      <div className="p-4 border-t border-[#1e1e2e]">
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Generating…" : "Generate Insight"}
        </button>
      </div>
    </div>
  );
}