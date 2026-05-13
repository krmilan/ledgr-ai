"use client";

import DemoDataButton from "@/components/DemoDataButton";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { TrendingUp, TrendingDown, Wallet, Receipt, ChevronLeft, ChevronRight, Sparkles, RefreshCw, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useApi, TransactionSummary, Transaction } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const fmt = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n.toFixed(0)}`;
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CAT_COLORS: Record<string, string> = {
  Food:"#f97316", Transport:"#3b82f6", Entertainment:"#a855f7",
  Shopping:"#ec4899", Health:"#ef4444", Housing:"#eab308",
  Utilities:"#9ca3af", Education:"#6366f1", Travel:"#06b6d4",
  Income:"#10b981", Other:"#9ca3af",
};

function StatCard({ label, value, sub, valueColor = "#fff", icon: Icon, iconColor = "#10b981" }: {
  label: string; value: string; sub?: string;
  valueColor?: string; icon: React.ElementType; iconColor?: string;
}) {
  return (
    <div style={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</span>
        <Icon size={14} color={iconColor} opacity={0.7} />
      </div>
      <div style={{ fontSize: "22px", fontWeight: 700, color: valueColor, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: "11px", color: "#6b7280" }}>{sub}</div>}
    </div>
  );
}

function MonthPicker({ month, year, onChange }: { month: number; year: number; onChange: (m: number, y: number) => void }) {
  const now = new Date();
  const isNow = month === now.getMonth() + 1 && year === now.getFullYear();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "8px", padding: "6px 10px" }}>
      <button onClick={() => month === 1 ? onChange(12, year - 1) : onChange(month - 1, year)}
        style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", display: "flex", padding: "2px" }}>
        <ChevronLeft size={15} />
      </button>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "white", minWidth: "90px", textAlign: "center" }}>
        {MONTHS[month - 1]} {year}
      </span>
      <button onClick={() => { if (!isNow) month === 12 ? onChange(1, year + 1) : onChange(month + 1, year); }}
        disabled={isNow}
        style={{ background: "none", border: "none", color: isNow ? "#374151" : "#9ca3af", cursor: isNow ? "not-allowed" : "pointer", display: "flex", padding: "2px" }}>
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

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
      } catch { /* optional */ }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally { setLoading(false); }
  }, [month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const handleAi = async () => {
    setAiLoading(true);
    try {
      const result = await api.ai.generateInsight(month, year);
      setAiText(result.insight);
    } catch (e) {
      setAiText(e instanceof Error ? e.message : "Failed to generate insight");
    } finally { setAiLoading(false); }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const savingsRate = summary?.totalIncome ? Math.round((summary.netSavings / summary.totalIncome) * 100) : 0;
  const chartData = (summary?.byCategory || [])
    .filter(d => d.total > 0 && d.category !== "Income")
    .slice(0, 6)
    .map(d => ({ name: d.category.length > 7 ? d.category.slice(0, 7) + "…" : d.category, total: Math.round(d.total) }));

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "white" }}>
              {greeting()}, {user?.firstName || "there"} 👋
            </h1>
            <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>Your financial snapshot</p>
            {/* Demo button sits under the greeting */}
            <div style={{ marginTop: "10px" }}>
              <DemoDataButton
                hasData={(summary?.transactionCount ?? 0) > 0}
                onComplete={load}
              />
            </div>
          </div>
        <MonthPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
      </div>

      {error && (
        <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", color: "#f87171", fontSize: "14px" }}>
          {error} <button onClick={load} style={{ color: "#10b981", background: "none", border: "none", cursor: "pointer", marginLeft: "8px" }}>Retry</button>
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
          <div style={{ width: "28px", height: "28px", border: "2px solid #10b981", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {!loading && !error && summary && (
        <>
          {/* Stats — uses responsive CSS class */}
          <div className="grid-4" style={{ marginBottom: "16px" }}>
            <StatCard label="Income"       value={fmt(summary.totalIncome)}              sub="this month"                    icon={TrendingUp}   valueColor="#10b981" iconColor="#10b981" />
            <StatCard label="Expenses"     value={fmt(summary.totalExpenses)}            sub="this month"                    icon={TrendingDown} valueColor="#ef4444" iconColor="#ef4444" />
            <StatCard label="Net Savings"  value={fmt(Math.max(0, summary.netSavings))} sub={`${savingsRate}% savings rate`} icon={Wallet}       valueColor="#ffffff" iconColor="#3b82f6" />
            <StatCard label="Transactions" value={String(summary.transactionCount)}      sub="this month"                    icon={Receipt}      valueColor="#ffffff" iconColor="#a855f7" />
          </div>

          {/* Chart + AI — stacks on tablet/mobile */}
          <div className="grid-2" style={{ marginBottom: "16px" }}>
            <div style={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "20px" }}>
              <h2 style={{ fontSize: "13px", fontWeight: 600, color: "#9ca3af", marginBottom: "16px" }}>Spending by Category</h2>
              {chartData.length === 0 ? (
                <div style={{ height: "180px", display: "flex", alignItems: "center", justifyContent: "center", color: "#4b5563", fontSize: "14px" }}>
                  No expense data for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e1e2e" />
                    <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} width={40} />
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
              )}
            </div>

            {/* AI Panel */}
            <div style={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "12px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ backgroundColor: "rgba(16,185,129,0.05)", borderBottom: "1px solid rgba(16,185,129,0.1)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={14} color="#10b981" />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#10b981" }}>AI Insights</span>
                </div>
                <span style={{ fontSize: "11px", color: "#6b7280", backgroundColor: "#1a1a24", padding: "2px 8px", borderRadius: "20px" }}>GPT-4o mini</span>
              </div>
              <div style={{ flex: 1, padding: "16px", minHeight: "120px" }}>
                {aiLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[100, 80, 90, 60].map((w, i) => (
                      <div key={i} style={{ height: "11px", backgroundColor: "#1a1a24", borderRadius: "4px", width: `${w}%`, animation: "pulse 1.5s ease-in-out infinite" }} />
                    ))}
                  </div>
                ) : aiText ? (
                  <p style={{ fontSize: "13px", color: "#d1d5db", lineHeight: 1.65 }}>{aiText}</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "10px", textAlign: "center", padding: "16px 0" }}>
                    <Sparkles size={20} color="#10b981" opacity={0.5} />
                    <p style={{ fontSize: "13px", color: "#6b7280" }}>Generate an AI analysis of your spending.</p>
                  </div>
                )}
              </div>
              <div style={{ padding: "12px 16px", borderTop: "1px solid #1e1e2e" }}>
                <button onClick={handleAi} disabled={aiLoading} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, backgroundColor: aiLoading ? "rgba(16,185,129,0.05)" : "#10b981", color: aiLoading ? "#10b981" : "white", border: aiLoading ? "1px solid rgba(16,185,129,0.2)" : "none", cursor: aiLoading ? "not-allowed" : "pointer" }}>
                  <RefreshCw size={13} style={{ animation: aiLoading ? "spin 0.8s linear infinite" : "none" }} />
                  {aiLoading ? "Generating…" : aiText ? "Regenerate" : "Generate Insight"}
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
            {recentTxs.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "#4b5563", fontSize: "14px" }}>
                No transactions yet. <a href="/transactions" style={{ color: "#10b981" }}>Add one →</a>
              </div>
            ) : (
              recentTxs.map((tx, i) => {
                const amt = parseFloat(tx.amount);
                const pos = amt >= 0;
                const color = CAT_COLORS[tx.category] || "#9ca3af";
                return (
                  <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: i < recentTxs.length - 1 ? "1px solid #1e1e2e" : "none" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: pos ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: pos ? "#10b981" : "#ef4444" }}>
                      {pos ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 500, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.name}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: color, display: "block", flexShrink: 0 }} />
                        <span style={{ fontSize: "11px", color: "#6b7280" }}>{tx.category} · {fmtDate(tx.date)}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: pos ? "#10b981" : "#ef4444", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                      {pos ? "+" : "-"}₹{Math.abs(amt).toLocaleString("en-IN")}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {!loading && !error && summary?.transactionCount === 0 && (
        <div style={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "48px 24px", textAlign: "center", marginTop: "16px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>💰</div>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "white", marginBottom: "6px" }}>No transactions yet</h3>
          <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px" }}>Add your first transaction to start tracking.</p>
          <a href="/transactions" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: "#10b981", color: "white", borderRadius: "8px", fontSize: "14px", fontWeight: 500, textDecoration: "none" }}>
            Add Transaction
          </a>
        </div>
      )}
    </div>
  );
}
