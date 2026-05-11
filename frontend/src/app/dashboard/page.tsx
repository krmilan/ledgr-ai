"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { TrendingUp, TrendingDown, Wallet, Receipt, ChevronLeft, ChevronRight, Sparkles, RefreshCw, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useApi, TransactionSummary, Transaction } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────

const fmt = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n.toFixed(0)}`;
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Sub-components ───────────────────────────────────────────────────

function StatCard({ label, value, sub, valueColor = "#fff", icon: Icon, iconColor = "#10b981" }: {
  label: string; value: string; sub?: string;
  valueColor?: string; icon: React.ElementType; iconColor?: string;
}) {
  return (
    <div style={{
      backgroundColor: "#111118", border: "1px solid #1e1e2e",
      borderRadius: "12px", padding: "20px",
      display: "flex", flexDirection: "column", gap: "12px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
          {label}
        </span>
        <Icon size={15} color={iconColor} opacity={0.7} />
      </div>
      <div style={{ fontSize: "24px", fontWeight: 700, color: valueColor, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "12px", color: "#6b7280" }}>{sub}</div>}
    </div>
  );
}

function MonthPicker({ month, year, onChange }: {
  month: number; year: number;
  onChange: (m: number, y: number) => void;
}) {
  const now = new Date();
  const isNow = month === now.getMonth() + 1 && year === now.getFullYear();
  const prev = () => month === 1 ? onChange(12, year - 1) : onChange(month - 1, year);
  const next = () => { if (!isNow) month === 12 ? onChange(1, year + 1) : onChange(month + 1, year); };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "8px", padding: "6px 12px" }}>
      <button onClick={prev} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: "2px", display: "flex" }}>
        <ChevronLeft size={16} />
      </button>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "white", minWidth: "100px", textAlign: "center" }}>
        {MONTHS[month - 1]} {year}
      </span>
      <button onClick={next} disabled={isNow} style={{ background: "none", border: "none", color: isNow ? "#374151" : "#9ca3af", cursor: isNow ? "not-allowed" : "pointer", padding: "2px", display: "flex" }}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function SpendChart({ data }: { data: TransactionSummary["byCategory"] }) {
  const chartData = data.filter(d => d.total > 0 && d.category !== "Income").slice(0, 7).map(d => ({
    name: d.category.length > 9 ? d.category.slice(0, 9) + "…" : d.category,
    total: Math.round(d.total),
  }));

  if (!chartData.length) return (
    <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "#4b5563", fontSize: "14px" }}>
      No expense data for this period
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e1e2e" />
        <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false}
          tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} width={44} />
        <Tooltip
          contentStyle={{ backgroundColor: "#1a1a24", border: "1px solid #1e1e2e", borderRadius: "8px" }}
          labelStyle={{ color: "#9ca3af", fontSize: "12px" }}
          itemStyle={{ color: "white", fontSize: "13px", fontWeight: 600 }}
          formatter={(v: unknown) => [`₹${Number(v).toLocaleString("en-IN")}`, "Spent"]}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
          {chartData.map((_, i) => <Cell key={i} fill="#10b981" opacity={1 - i * 0.1} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function RecentTx({ transactions }: { transactions: Transaction[] }) {
  if (!transactions.length) return (
    <div style={{ padding: "48px 0", textAlign: "center", color: "#4b5563", fontSize: "14px" }}>
      No transactions yet. Add your first one!
    </div>
  );

  return (
    <div>
      {transactions.map((tx, i) => {
        const amt = parseFloat(tx.amount);
        const pos = amt >= 0;
        return (
          <div key={tx.id} style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "12px 0",
            borderBottom: i < transactions.length - 1 ? "1px solid #1e1e2e" : "none",
          }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: pos ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: pos ? "#10b981" : "#ef4444",
            }}>
              {pos ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.name}</p>
              <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{tx.category} · {fmtDate(tx.date)}</p>
            </div>
            <span style={{ fontSize: "14px", fontWeight: 600, color: pos ? "#10b981" : "#ef4444", fontVariantNumeric: "tabular-nums" }}>
              {pos ? "+" : "-"}₹{Math.abs(amt).toLocaleString("en-IN")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useUser();
  const api = useApi();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [recentTxs, setRecentTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [s, t] = await Promise.all([
        api.transactions.summary(month, year),
        api.transactions.list({ limit: 5, page: 1 }),
      ]);
      setSummary(s);
      setRecentTxs(t.transactions);
    try {
      const saved = await api.ai.getInsight(month, year);
      if (saved.insight) setAiText(saved.insight);
    } catch {
      // Silently ignore — insight is optional
    }
    
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const handleAi = async () => {
    setAiLoading(true);
    try {
      const result = await api.ai.generateInsight(month, year);
      setAiText(result.insight);
    } catch (e) {
      setAiText(
        e instanceof Error ? e.message : "Failed to generate insight. Check your OpenAI API key."
      );
    } finally {
      setAiLoading(false);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const savingsRate = summary?.totalIncome
    ? Math.round((summary.netSavings / summary.totalIncome) * 100) : 0;

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "white" }}>
            {greeting()}, {user?.firstName || "there"} 👋
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
            Your financial snapshot
          </p>
        </div>
        <MonthPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
      </div>

      {/* Error */}
      {error && (
        <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "12px 16px", marginBottom: "24px", color: "#f87171", fontSize: "14px" }}>
          {error} <button onClick={load} style={{ color: "#10b981", background: "none", border: "none", cursor: "pointer", marginLeft: "8px" }}>Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
          <div style={{ width: "32px", height: "32px", border: "2px solid #10b981", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {!loading && !error && summary && (
        <>
          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
            <StatCard label="Total Income"   value={fmt(summary.totalIncome)}              sub="this month"                    icon={TrendingUp}   valueColor="#10b981" iconColor="#10b981" />
            <StatCard label="Total Expenses" value={fmt(summary.totalExpenses)}            sub="this month"                    icon={TrendingDown} valueColor="#ef4444" iconColor="#ef4444" />
            <StatCard label="Net Savings"    value={fmt(Math.max(0, summary.netSavings))} sub={`${savingsRate}% savings rate`} icon={Wallet}       valueColor="#ffffff" iconColor="#3b82f6" />
            <StatCard label="Transactions"   value={String(summary.transactionCount)}      sub="this month"                    icon={Receipt}      valueColor="#ffffff" iconColor="#a855f7" />
          </div>

          {/* Chart + AI */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "24px" }}>
            {/* Chart card */}
            <div style={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "20px" }}>
              <h2 style={{ fontSize: "13px", fontWeight: 600, color: "#9ca3af", marginBottom: "16px" }}>
                Spending by Category
              </h2>
              <SpendChart data={summary.byCategory} />
            </div>

            {/* AI panel */}
            <div style={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "12px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ backgroundColor: "rgba(16,185,129,0.05)", borderBottom: "1px solid rgba(16,185,129,0.1)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={14} color="#10b981" />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#10b981" }}>AI Insights</span>
                </div>
                <span style={{ fontSize: "11px", color: "#6b7280", backgroundColor: "#1a1a24", padding: "2px 8px", borderRadius: "20px" }}>GPT-4o mini</span>
              </div>
              <div style={{ flex: 1, padding: "16px" }}>
                {aiLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[100, 80, 90, 60].map((w, i) => (
                      <div key={i} style={{ height: "12px", backgroundColor: "#1a1a24", borderRadius: "4px", width: `${w}%`, animation: "pulse 1.5s ease-in-out infinite" }} />
                    ))}
                    <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
                  </div>
                ) : aiText ? (
                  <p style={{ fontSize: "13px", color: "#d1d5db", lineHeight: 1.6 }}>{aiText}</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px", textAlign: "center" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Sparkles size={18} color="#10b981" />
                    </div>
                    <p style={{ fontSize: "13px", color: "#6b7280" }}>
                      Generate an AI analysis of your spending patterns.
                    </p>
                  </div>
                )}
              </div>
              <div style={{ padding: "12px 16px", borderTop: "1px solid #1e1e2e" }}>
                <button onClick={handleAi} disabled={aiLoading} style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  padding: "10px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: aiLoading ? "not-allowed" : "pointer",
                  backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
                  color: "#10b981", opacity: aiLoading ? 0.5 : 1, transition: "all 0.15s",
                }}>
                  <RefreshCw size={13} style={{ animation: aiLoading ? "spin 0.8s linear infinite" : "none" }} />
                  {aiLoading ? "Generating…" : "Generate Insight"}
                </button>
              </div>
            </div>
          </div>

          {/* Recent transactions */}
          <div style={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "13px", fontWeight: 600, color: "#9ca3af" }}>Recent Transactions</h2>
              <a href="/transactions" style={{ fontSize: "12px", color: "#10b981", textDecoration: "none" }}>View all →</a>
            </div>
            <RecentTx transactions={recentTxs} />
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && !error && summary?.transactionCount === 0 && (
        <div style={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "64px 32px", textAlign: "center", marginTop: "24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>💰</div>
          <h3 style={{ fontSize: "18px", fontWeight: 600, color: "white", marginBottom: "8px" }}>No transactions yet</h3>
          <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "24px" }}>Add your first transaction to start tracking.</p>
          <a href="/transactions" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "10px 20px", backgroundColor: "#10b981", color: "white",
            borderRadius: "8px", fontSize: "14px", fontWeight: 500, textDecoration: "none",
          }}>Add Transaction</a>
        </div>
      )}
    </div>
  );
}
