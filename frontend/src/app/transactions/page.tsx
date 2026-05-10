"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, X, Loader2, Trash2, Pencil } from "lucide-react";
import { useApi, Transaction, TransactionSummary } from "@/lib/api";
import { CATEGORIES } from "@/lib/categories";

// ─── Helpers ──────────────────────────────────────────────────────────

const fmt = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n.toFixed(0)}`;
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const CAT_COLORS: Record<string, string> = {
  Food: "#f97316", Transport: "#3b82f6", Entertainment: "#a855f7",
  Shopping: "#ec4899", Health: "#ef4444", Housing: "#eab308",
  Utilities: "#9ca3af", Education: "#6366f1", Travel: "#06b6d4",
  Income: "#10b981", Other: "#9ca3af",
};

// ─── Transaction Modal ────────────────────────────────────────────────

function TxModal({ open, onClose, onSave, tx }: {
  open: boolean;
  onClose: () => void;
  onSave: (d: { name: string; amount: number; category: string; date: string }) => Promise<void>;
  tx?: Transaction | null;
}) {
  const editing = !!tx;
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState("");
  const [isExpense, setIsExpense] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    if (tx) {
      const a = parseFloat(tx.amount);
      setName(tx.name);
      setAmount(String(Math.abs(a)));
      setCategory(tx.category);
      setDate(new Date(tx.date).toISOString().split("T")[0]);
      setIsExpense(a < 0);
    } else {
      setName(""); setAmount(""); setCategory("Auto");
      setDate(new Date().toISOString().split("T")[0]);
      setIsExpense(true);
    }
    setErr("");
  }, [open, tx]);

  const submit = async () => {
    if (!name.trim()) { setErr("Name is required"); return; }
    const a = parseFloat(amount);
    if (isNaN(a) || a <= 0) { setErr("Enter a valid positive amount"); return; }
    if (!date) { setErr("Date is required"); return; }
    setSaving(true); setErr("");
    try {
      await onSave({ name: name.trim(), amount: isExpense ? -a : a, category, date });
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
      <div style={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "16px", width: "100%", maxWidth: "440px", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #1e1e2e" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "white" }}>
            {editing ? "Edit Transaction" : "Add Transaction"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", display: "flex" }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {err && (
            <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#f87171" }}>
              {err}
            </div>
          )}

          {/* Name */}
          <div>
            <label style={lbl}>Transaction Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Swiggy, Salary, Netflix" style={inp} />
          </div>

          {/* Amount */}
          <div>
            <label style={lbl}>Amount</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ display: "flex", borderRadius: "8px", border: "1px solid #1e1e2e", overflow: "hidden", flexShrink: 0 }}>
                <button onClick={() => setIsExpense(true)} style={{
                  padding: "10px 12px", fontSize: "13px", fontWeight: 500, border: "none", cursor: "pointer",
                  backgroundColor: isExpense ? "rgba(239,68,68,0.15)" : "transparent",
                  color: isExpense ? "#f87171" : "#6b7280",
                }}>− Expense</button>
                <button onClick={() => setIsExpense(false)} style={{
                  padding: "10px 12px", fontSize: "13px", fontWeight: 500, border: "none", cursor: "pointer",
                  backgroundColor: !isExpense ? "rgba(16,185,129,0.15)" : "transparent",
                  color: !isExpense ? "#34d399" : "#6b7280",
                }}>+ Income</button>
              </div>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00" min="0" step="0.01" style={{ ...inp, flex: 1 }} />
            </div>
          </div>

          {/* Category */}
          <div>
            <label style={lbl}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inp, appearance: "none" }}>
              <option value="Auto" style={{ backgroundColor: "#1a1a24" }}>✦ Auto-detect (AI)</option>
              {CATEGORIES.map(c => <option key={c} value={c} style={{ backgroundColor: "#1a1a24" }}>{c}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label style={lbl}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: "12px", padding: "0 24px 24px" }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px", borderRadius: "8px", fontSize: "14px", fontWeight: 500,
            border: "1px solid #1e1e2e", backgroundColor: "transparent", color: "#9ca3af", cursor: "pointer",
          }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            padding: "10px", borderRadius: "8px", fontSize: "14px", fontWeight: 500,
            backgroundColor: "#10b981", color: "white", border: "none",
            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
          }}>
            {saving && <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />}
            {saving ? "Saving…" : editing ? "Update" : "Add Transaction"}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────

function DeleteModal({ open, onClose, onConfirm, name, deleting }: {
  open: boolean; onClose: () => void; onConfirm: () => Promise<void>;
  name: string; deleting: boolean;
}) {
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(4px)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
    }}>
      <div style={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "16px", width: "100%", maxWidth: "380px", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Trash2 size={20} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "white", marginBottom: "8px" }}>Delete Transaction</h2>
        <p style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "24px" }}>
          Delete <strong style={{ color: "white" }}>{name}</strong>? This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #1e1e2e", backgroundColor: "transparent", color: "#9ca3af", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", borderRadius: "8px", border: "none", backgroundColor: "#ef4444", color: "white", fontSize: "14px", fontWeight: 500, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1 }}>
            {deleting && <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />}
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const api = useApi();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { setPage(1); }, [search, catFilter]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [t, s] = await Promise.all([
        api.transactions.list({ page, limit: LIMIT, category: catFilter || undefined, search: search || undefined }),
        api.transactions.summary(),
      ]);
      setTxs(t.transactions);
      setTotalPages(t.pagination.totalPages);
      setTotal(t.pagination.total);
      setSummary(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally { setLoading(false); }
  }, [page, search, catFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const handleSave = async (d: { name: string; amount: number; category: string; date: string }) => {
    if (editTx) await api.transactions.update(editTx.id, d);
    else await api.transactions.create(d);
    await load();
    setEditTx(null);
  };

  const handleDelete = async () => {
    if (!deleteTx) return;
    setDeleting(true);
    try { await api.transactions.delete(deleteTx.id); await load(); setDeleteTx(null); }
    catch (e) { setError(e instanceof Error ? e.message : "Delete failed"); }
    finally { setDeleting(false); }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "16px",
  };

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "white" }}>Transactions</h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
            {total > 0 ? `${total} transactions` : "No transactions yet"}
          </p>
        </div>
        <button onClick={() => { setEditTx(null); setModalOpen(true); }} style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "10px 16px", backgroundColor: "#10b981", color: "white",
          borderRadius: "8px", fontSize: "14px", fontWeight: 500, border: "none", cursor: "pointer",
        }}>
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* Stats */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "INCOME",       value: fmt(summary.totalIncome),              color: "#10b981" },
            { label: "EXPENSES",     value: fmt(summary.totalExpenses),            color: "#ef4444" },
            { label: "NET SAVINGS",  value: fmt(Math.max(0, summary.netSavings)), color: "#ffffff" },
            { label: "TRANSACTIONS", value: String(summary.transactionCount),      color: "#ffffff" },
          ].map(({ label, value, color }) => (
            <div key={label} style={cardStyle}>
              <p style={{ fontSize: "10px", color: "#6b7280", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "8px" }}>{label}</p>
              <p style={{ fontSize: "20px", fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={14} color="#6b7280" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Search transactions…"
            style={{ width: "100%", backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "8px", padding: "10px 14px 10px 36px", fontSize: "14px", color: "white", outline: "none", boxSizing: "border-box" }} />
        </div>
        {/* Category */}
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{
          backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "8px",
          padding: "10px 14px", fontSize: "14px", color: catFilter ? "white" : "#6b7280", outline: "none",
        }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c} style={{ backgroundColor: "#1a1a24" }}>{c}</option>)}
        </select>
        {/* Clear filters */}
        {(search || catFilter) && (
          <button onClick={() => { setSearchInput(""); setCatFilter(""); }} style={{
            display: "flex", alignItems: "center", gap: "6px", padding: "10px 14px",
            backgroundColor: "transparent", border: "1px solid #1e1e2e", borderRadius: "8px",
            fontSize: "13px", color: "#9ca3af", cursor: "pointer",
          }}>
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", color: "#f87171", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <div style={{ width: "28px", height: "28px", border: "2px solid #10b981", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          {txs.length === 0 ? (
            <div style={{ padding: "64px 32px", textAlign: "center" }}>
              <p style={{ fontSize: "32px", marginBottom: "12px" }}>💸</p>
              <p style={{ color: "#6b7280", fontSize: "14px" }}>
                {search || catFilter ? "No transactions match your filters" : "No transactions yet. Add your first one!"}
              </p>
            </div>
          ) : (
            <>
              {/* Header row */}
              <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr 1.5fr 1.5fr 80px", gap: "16px", padding: "12px 24px", backgroundColor: "#1a1a24", fontSize: "11px", fontWeight: 600, color: "#6b7280", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                <div>Name</div><div>Category</div><div>Date</div><div style={{ textAlign: "right" }}>Amount</div><div style={{ textAlign: "right" }}>Actions</div>
              </div>

              {/* Rows */}
              {txs.map((tx, i) => {
                const amt = parseFloat(tx.amount);
                const pos = amt >= 0;
                const color = CAT_COLORS[tx.category] || "#9ca3af";
                return (
                  <div key={tx.id} style={{
                    display: "grid", gridTemplateColumns: "3fr 2fr 1.5fr 1.5fr 80px", gap: "16px",
                    padding: "16px 24px", alignItems: "center",
                    borderTop: i === 0 ? "none" : "1px solid #1e1e2e",
                    transition: "background 0.1s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1a1a24")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* Name */}
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 500, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.name}</p>
                      {tx.aiCategorized && <span style={{ fontSize: "11px", color: "#10b981" }}>✦ AI</span>}
                    </div>

                    {/* Category badge */}
                    <div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, backgroundColor: `${color}20`, color }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
                        {tx.category}
                      </span>
                    </div>

                    {/* Date */}
                    <div style={{ fontSize: "13px", color: "#9ca3af" }}>{fmtDate(tx.date)}</div>

                    {/* Amount */}
                    <div style={{ textAlign: "right", fontSize: "14px", fontWeight: 600, color: pos ? "#10b981" : "#ef4444", fontVariantNumeric: "tabular-nums" }}>
                      {pos ? "+" : "-"}₹{Math.abs(amt).toLocaleString("en-IN")}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                      <button onClick={() => { setEditTx(tx); setModalOpen(true); }}
                        style={{ padding: "6px", borderRadius: "6px", border: "none", backgroundColor: "transparent", color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center" }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#1e1e2e"; e.currentTarget.style.color = "white"; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#6b7280"; }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteTx(tx)}
                        style={{ padding: "6px", borderRadius: "6px", border: "none", backgroundColor: "transparent", color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center" }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#ef4444"; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#6b7280"; }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
          <p style={{ fontSize: "13px", color: "#6b7280" }}>
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid #1e1e2e", backgroundColor: "transparent", color: page === 1 ? "#374151" : "#9ca3af", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: "13px" }}>
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{
                width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #1e1e2e",
                backgroundColor: page === p ? "#10b981" : "transparent",
                color: page === p ? "white" : "#9ca3af", cursor: "pointer", fontSize: "13px", fontWeight: 500,
              }}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid #1e1e2e", backgroundColor: "transparent", color: page === totalPages ? "#374151" : "#9ca3af", cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: "13px" }}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <TxModal open={modalOpen} onClose={() => { setModalOpen(false); setEditTx(null); }} onSave={handleSave} tx={editTx} />
      <DeleteModal open={!!deleteTx} onClose={() => setDeleteTx(null)} onConfirm={handleDelete} name={deleteTx?.name || ""} deleting={deleting} />
    </div>
  );
}
