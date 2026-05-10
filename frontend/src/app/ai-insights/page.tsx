"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, RefreshCw, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, PieChart, Calendar } from "lucide-react";
import { useApi, TransactionSummary } from "@/lib/api";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const CAT_COLORS: Record<string, string> = {
  Food:"#f97316", Transport:"#3b82f6", Entertainment:"#a855f7",
  Shopping:"#ec4899", Health:"#ef4444", Housing:"#eab308",
  Utilities:"#9ca3af", Education:"#6366f1", Travel:"#06b6d4",
  Income:"#10b981", Other:"#9ca3af",
};

const fmt = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n.toFixed(0)}`;
};

export default function AiInsightsPage() {
  const api = useApi();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [insight, setInsight] = useState<string | null>(null);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isNow = month === now.getMonth() + 1 && year === now.getFullYear();

  const prevMonth = () => month === 1 ? (setMonth(12), setYear(y => y - 1)) : setMonth(m => m - 1);
  const nextMonth = () => { if (!isNow) month === 12 ? (setMonth(1), setYear(y => y + 1)) : setMonth(m => m + 1); };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [savedInsight, summaryData] = await Promise.all([
        api.ai.getInsight(month, year),
        api.transactions.summary(month, year),
      ]);
      setInsight(savedInsight.insight);
      setSummary(summaryData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await api.ai.generateInsight(month, year);
      setInsight(result.insight);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate insight");
    } finally {
      setGenerating(false);
    }
  };

  const savingsRate = summary?.totalIncome
    ? Math.round((summary.netSavings / summary.totalIncome) * 100)
    : 0;

  const expenseCategories = summary?.byCategory.filter(c => c.category !== "Income") || [];
  const totalExpenses = expenseCategories.reduce((s, c) => s + c.total, 0);

  const card: React.CSSProperties = {
    backgroundColor: "#111118",
    border: "1px solid #1e1e2e",
    borderRadius: "12px",
    padding: "20px",
  };

  return (
    <div style={{ maxWidth: "1000px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={16} color="#10b981" />
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "white" }}>AI Insights</h1>
          </div>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            AI-powered analysis of your spending patterns
          </p>
        </div>

        {/* Month picker */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "8px", padding: "6px 12px" }}>
          <button onClick={prevMonth} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", display: "flex" }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "white", minWidth: "130px", textAlign: "center" }}>
            {MONTHS[month - 1]} {year}
          </span>
          <button onClick={nextMonth} disabled={isNow} style={{ background: "none", border: "none", color: isNow ? "#374151" : "#9ca3af", cursor: isNow ? "not-allowed" : "pointer", display: "flex" }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", color: "#f87171", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
          <div style={{ width: "28px", height: "28px", border: "2px solid #10b981", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {!loading && (
        <>
          {/* Stats row */}
          {summary && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
              {[
                { label: "Income",       value: fmt(summary.totalIncome),              color: "#10b981", icon: TrendingUp   },
                { label: "Expenses",     value: fmt(summary.totalExpenses),            color: "#ef4444", icon: TrendingDown },
                { label: "Saved",        value: fmt(Math.max(0, summary.netSavings)), color: "#ffffff", icon: PieChart     },
                { label: "Savings Rate", value: `${savingsRate}%`,                     color: savingsRate >= 20 ? "#10b981" : savingsRate >= 10 ? "#f59e0b" : "#ef4444", icon: Calendar },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                    <Icon size={14} color={color} opacity={0.7} />
                  </div>
                  <p style={{ fontSize: "22px", fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{value}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            {/* AI Insight card */}
            <div style={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {/* Card header */}
              <div style={{ backgroundColor: "rgba(16,185,129,0.05)", borderBottom: "1px solid rgba(16,185,129,0.1)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={14} color="#10b981" />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#10b981" }}>
                    Monthly Analysis
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "#6b7280", backgroundColor: "#1a1a24", padding: "2px 8px", borderRadius: "20px" }}>
                  GPT-4o mini
                </span>
              </div>

              {/* Insight text */}
              <div style={{ flex: 1, padding: "20px" }}>
                {generating ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[100, 85, 92, 70, 60].map((w, i) => (
                      <div key={i} style={{ height: "12px", backgroundColor: "#1a1a24", borderRadius: "4px", width: `${w}%`, animation: "pulse 1.5s ease-in-out infinite" }} />
                    ))}
                    <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>Analyzing your finances…</p>
                    <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
                  </div>
                ) : insight ? (
                  <div>
                    <p style={{ fontSize: "14px", color: "#d1d5db", lineHeight: 1.7 }}>{insight}</p>
                    <div style={{ marginTop: "16px", padding: "10px 14px", backgroundColor: "#1a1a24", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Calendar size={13} color="#6b7280" />
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>
                        Analysis for {MONTHS[month - 1]} {year}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", textAlign: "center", gap: "12px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Sparkles size={22} color="#10b981" />
                    </div>
                    <p style={{ fontSize: "14px", color: "#6b7280", maxWidth: "220px" }}>
                      No insight yet for {MONTHS[month - 1]}. Generate one to see your analysis.
                    </p>
                  </div>
                )}
              </div>

              {/* Generate button */}
              <div style={{ padding: "16px 20px", borderTop: "1px solid #1e1e2e" }}>
                <button onClick={handleGenerate} disabled={generating} style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  padding: "11px", borderRadius: "8px", fontSize: "14px", fontWeight: 500,
                  backgroundColor: generating ? "rgba(16,185,129,0.05)" : "#10b981",
                  color: generating ? "#10b981" : "white",
                  border: generating ? "1px solid rgba(16,185,129,0.2)" : "none",
                  cursor: generating ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                }}>
                  <RefreshCw size={14} style={{ animation: generating ? "spin 0.8s linear infinite" : "none" }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  {generating ? "Generating…" : insight ? "Regenerate Insight" : "Generate Insight"}
                </button>
              </div>
            </div>

            {/* Spending breakdown */}
            <div style={{ ...card, display: "flex", flexDirection: "column" }}>
              <h2 style={{ fontSize: "13px", fontWeight: 600, color: "#9ca3af", marginBottom: "16px" }}>
                Spending Breakdown
              </h2>

              {expenseCategories.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#4b5563", fontSize: "14px" }}>
                  No expense data for this period
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {expenseCategories.slice(0, 7).map(({ category, total }) => {
                    const pct = totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0;
                    const color = CAT_COLORS[category] || "#9ca3af";
                    return (
                      <div key={category}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color, flexShrink: 0, display: "block" }} />
                            <span style={{ fontSize: "13px", color: "#d1d5db", fontWeight: 500 }}>{category}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "12px", color: "#6b7280" }}>{pct}%</span>
                            <span style={{ fontSize: "13px", color: "white", fontWeight: 600, fontVariantNumeric: "tabular-nums", minWidth: "60px", textAlign: "right" }}>
                              {fmt(total)}
                            </span>
                          </div>
                        </div>
                        <div style={{ height: "5px", backgroundColor: "#1a1a24", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: "3px", transition: "width 0.5s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Tips section */}
          <div style={card}>
            <h2 style={{ fontSize: "13px", fontWeight: 600, color: "#9ca3af", marginBottom: "16px" }}>
              💡 General Financial Tips
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {[
                { title: "50/30/20 Rule", desc: "Spend 50% on needs, 30% on wants, and save 20% of your income every month.", color: "#10b981" },
                { title: "Emergency Fund", desc: "Keep 3–6 months of expenses in a liquid savings account for unexpected events.", color: "#3b82f6" },
                { title: "Track Everything", desc: "Awareness is the first step. Logging every transaction reveals hidden spending patterns.", color: "#a855f7" },
              ].map(({ title, desc, color }) => (
                <div key={title} style={{ backgroundColor: "#1a1a24", borderRadius: "10px", padding: "16px", borderLeft: `3px solid ${color}` }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "white", marginBottom: "6px" }}>{title}</p>
                  <p style={{ fontSize: "12px", color: "#9ca3af", lineHeight: 1.6 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
