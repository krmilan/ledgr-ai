"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, Loader2, Trash2, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { useApi, Budget, BudgetSummary } from "@/lib/api";
import { CATEGORIES } from "@/lib/categories";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CAT_COLORS: Record<string, string> = {
  Food:"#f97316",Transport:"#3b82f6",Entertainment:"#a855f7",Shopping:"#ec4899",
  Health:"#ef4444",Housing:"#eab308",Utilities:"#9ca3af",Education:"#6366f1",
  Travel:"#06b6d4",Income:"#10b981",Other:"#9ca3af",
};

// ─── Budget Modal ─────────────────────────────────────────────────────

function BudgetModal({ open, onClose, onSave, month, year }: {
  open: boolean; onClose: () => void;
  onSave: (d: { category: string; limitAmount: number; month: number; year: number }) => Promise<void>;
  month: number; year: number;
}) {
  const [category, setCategory] = useState("Food");
  const [limit, setLimit] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) { setCategory("Food"); setLimit(""); setErr(""); }
  }, [open]);

  const submit = async () => {
    const a = parseFloat(limit);
    if (isNaN(a) || a <= 0) { setErr("Enter a valid positive amount"); return; }
    setSaving(true); setErr("");
    try {
      await onSave({ category, limitAmount: a, month, year });
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    } finally { setSaving(false); }
  };

  if (!open) return null;

  const inp: React.CSSProperties = {
    width: "100%", backgroundColor: "#1a1a24", border: "1px solid #1e1e2e",
    borderRadius: "8px", padding: "10px 14px", fontSize: "14px", color: "white",
    outline: "none", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = { fontSize: "13px", fontWeight: 500, color: "#d1d5db", display: "block", marginBottom: "6px" };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(4px)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
    }}>
      <div style={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "16px", width: "100%", maxWidth: "400px", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #1e1e2e" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "white" }}>Set Budget</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", display: "flex" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {err && (
            <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#f87171" }}>
              {err}
            </div>
          )}

          <div>
            <label style={lbl}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inp, appearance: "none" }}>
              {CATEGORIES.filter(c => c !== "Income").map(c => (
                <option key={c} value={c} style={{ backgroundColor: "#1a1a24" }}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={lbl}>Monthly Limit (₹)</label>
            <input type="number" value={limit} onChange={e => setLimit(e.target.value)}
              placeholder="e.g. 5000" min="0" step="100" style={inp} />
          </div>

          <div style={{ backgroundColor: "#1a1a24", borderRadius: "8px", padding: "12px", fontSize: "13px", color: "#9ca3af" }}>
            Setting budget for <strong style={{ color: "white" }}>{MONTHS[month - 1]} {year}</strong>.
            If a budget for this category already exists, it will be updated.
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", padding: "0 24px 24px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #1e1e2e", backgroundColor: "transparent", color: "#9ca3af", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={submit} disabled={saving} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            padding: "10px", borderRadius: "8px", border: "none",
            backgroundColor: "#10b981", color: "white", fontSize: "14px", fontWeight: 500,
            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
          }}>
            {saving && <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />}
            {saving ? "Saving…" : "Save Budget"}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Budget Card ──────────────────────────────────────────────────────

function BudgetCard({ budget, onDelete }: { budget: Budget; onDelete: (id: string) => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  const color = CAT_COLORS[budget.category] || "#9ca3af";

  const statusConfig = {
    good:    { icon: CheckCircle,    color: "#10b981", label: "On track"    },
    warning: { icon: AlertTriangle,  color: "#f59e0b", label: "Near limit"  },
    over:    { icon: TrendingUp,     color: "#ef4444", label: "Over budget" },
  }[budget.status];

  const StatusIcon = statusConfig.icon;

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(budget.id); }
    catch { setDeleting(false); }
  };

  return (
    <div style={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: color, display: "block" }} />
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "white" }}>{budget.category}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
              <StatusIcon size={11} color={statusConfig.color} />
              <span style={{ fontSize: "11px", color: statusConfig.color }}>{statusConfig.label}</span>
            </div>
          </div>
        </div>
        <button onClick={handleDelete} disabled={deleting}
          style={{ padding: "6px", borderRadius: "6px", border: "none", backgroundColor: "transparent", color: "#6b7280", cursor: deleting ? "not-allowed" : "pointer", display: "flex", alignItems: "center" }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#6b7280"; }}>
          {deleting ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={14} />}
        </button>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ height: "6px", backgroundColor: "#1a1a24", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${Math.min(budget.percentUsed, 100)}%`,
            backgroundColor: statusConfig.color,
            borderRadius: "3px",
            transition: "width 0.5s ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>{budget.percentUsed}% used</span>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>
            ₹{budget.remaining.toLocaleString("en-IN")} left
          </span>
        </div>
      </div>

      {/* Amounts */}
      <div style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#1a1a24", borderRadius: "8px", padding: "10px 14px" }}>
        <div>
          <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "2px" }}>Spent</p>
          <p style={{ fontSize: "15px", fontWeight: 600, color: budget.isOverBudget ? "#ef4444" : "white" }}>
            ₹{budget.spent.toLocaleString("en-IN")}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "2px" }}>Limit</p>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "white" }}>
            ₹{budget.limitAmount.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────

export default function BudgetsPage() {
  const api = useApi();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const isNow = month === now.getMonth() + 1 && year === now.getFullYear();
  const prevMonth = () => month === 1 ? (setMonth(12), setYear(y => y - 1)) : setMonth(m => m - 1);
  const nextMonth = () => { if (!isNow) month === 12 ? (setMonth(1), setYear(y => y + 1)) : setMonth(m => m + 1); };

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const d = await api.budgets.list(month, year);
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load budgets");
    } finally { setLoading(false); }
  }, [month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const handleSave = async (d: { category: string; limitAmount: number; month: number; year: number }) => {
    await api.budgets.upsert(d);
    await load();
  };

  const handleDelete = async (id: string) => {
    await api.budgets.delete(id);
    await load();
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "16px",
  };

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "white" }}>Budgets</h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
            {data?.budgetCount ? `${data.budgetCount} budgets for ${MONTHS[month - 1]} ${year}` : "No budgets set"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {/* Month picker */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "8px", padding: "6px 12px" }}>
            <button onClick={prevMonth} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", display: "flex" }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "white", minWidth: "100px", textAlign: "center" }}>
              {MONTHS[month - 1]} {year}
            </span>
            <button onClick={nextMonth} disabled={isNow} style={{ background: "none", border: "none", color: isNow ? "#374151" : "#9ca3af", cursor: isNow ? "not-allowed" : "pointer", display: "flex" }}>
              <ChevronRight size={16} />
            </button>
          </div>
          <button onClick={() => setModalOpen(true)} style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 16px", backgroundColor: "#10b981", color: "white",
            borderRadius: "8px", fontSize: "14px", fontWeight: 500, border: "none", cursor: "pointer",
          }}>
            <Plus size={16} /> Set Budget
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

      {!loading && !error && data && (
        <>
          {/* Summary strip */}
          {data.budgetCount > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
              {[
                { label: "TOTAL BUDGETED",  value: `₹${data.totalBudgeted.toLocaleString("en-IN")}`,  color: "#fff" },
                { label: "TOTAL SPENT",     value: `₹${data.totalSpent.toLocaleString("en-IN")}`,     color: data.totalSpent > data.totalBudgeted ? "#ef4444" : "#fff" },
                { label: "REMAINING",       value: `₹${data.totalRemaining.toLocaleString("en-IN")}`, color: "#10b981" },
                { label: "OVERALL USED",    value: `${data.overallPercentUsed}%`,                     color: data.overallPercentUsed > 100 ? "#ef4444" : data.overallPercentUsed >= 75 ? "#f59e0b" : "#fff" },
              ].map(({ label, value, color }) => (
                <div key={label} style={cardStyle}>
                  <p style={{ fontSize: "10px", color: "#6b7280", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "8px" }}>{label}</p>
                  <p style={{ fontSize: "20px", fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Status badges */}
          {data.budgetCount > 0 && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
              {[
                { label: `${data.statusCounts.good} On track`,    color: "#10b981" },
                { label: `${data.statusCounts.warning} Near limit`, color: "#f59e0b" },
                { label: `${data.statusCounts.over} Over budget`,  color: "#ef4444" },
              ].map(({ label, color }) => (
                <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 500, backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: color }} />
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Budget cards grid */}
          {data.budgets.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
              {data.budgets.map(b => (
                <BudgetCard key={b.id} budget={b} onDelete={handleDelete} />
              ))}
            </div>
          ) : (
            /* Empty state */
            <div style={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "64px 32px", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎯</div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "white", marginBottom: "8px" }}>
                No budgets for {MONTHS[month - 1]} {year}
              </h3>
              <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "24px" }}>
                Set spending limits for each category to stay on track.
              </p>
              <button onClick={() => setModalOpen(true)} style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "10px 20px", backgroundColor: "#10b981", color: "white",
                borderRadius: "8px", fontSize: "14px", fontWeight: 500, border: "none", cursor: "pointer",
              }}>
                <Plus size={16} /> Set Your First Budget
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <BudgetModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} month={month} year={year} />
    </div>
  );
}
