"use client";

import { useState } from "react";
import { Sparkles, Trash2, Loader2 } from "lucide-react";
import { useApi } from "@/lib/api";

interface DemoDataButtonProps {
  onComplete: () => void; // callback to refresh dashboard data
  hasData: boolean;       // true if user already has transactions
}

export default function DemoDataButton({ onComplete, hasData }: DemoDataButtonProps) {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const result = await api.demo.seed();
      setMessage(`✓ Loaded ${result.transactionsSeeded} transactions and ${result.budgetsSeeded} budgets`);
      // Refresh dashboard after 800ms so user sees the success message
      setTimeout(() => {
        onComplete();
        setMessage(null);
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load demo data");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("This will delete ALL your transactions, budgets, and insights. Are you sure?")) return;
    setClearing(true);
    setMessage(null);
    setError(null);
    try {
      await api.demo.clear();
      setMessage("✓ All data cleared");
      setTimeout(() => {
        onComplete();
        setMessage(null);
      }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to clear data");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {/* Load demo data button — only show if no data yet */}
        {!hasData && (
          <button
            onClick={handleSeed}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 14px",
              backgroundColor: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: "8px",
              fontSize: "13px", fontWeight: 500,
              color: "#10b981",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = "rgba(16,185,129,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "rgba(16,185,129,0.1)"; }}
          >
            {loading
              ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />
              : <Sparkles size={13} />
            }
            {loading ? "Loading demo…" : "Load Demo Data"}
          </button>
        )}

        {/* Clear data button — always show */}
        {hasData && (
          <button
            onClick={handleClear}
            disabled={clearing}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 14px",
              backgroundColor: "transparent",
              border: "1px solid #1e1e2e",
              borderRadius: "8px",
              fontSize: "13px", fontWeight: 500,
              color: "#6b7280",
              cursor: clearing ? "not-allowed" : "pointer",
              opacity: clearing ? 0.6 : 1,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (!clearing) { e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; e.currentTarget.style.color = "#ef4444"; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e2e"; e.currentTarget.style.color = "#6b7280"; }}
          >
            {clearing
              ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />
              : <Trash2 size={13} />
            }
            {clearing ? "Clearing…" : "Clear All Data"}
          </button>
        )}
      </div>

      {/* Feedback messages */}
      {message && (
        <p style={{ fontSize: "12px", color: "#10b981" }}>{message}</p>
      )}
      {error && (
        <p style={{ fontSize: "12px", color: "#ef4444" }}>{error}</p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
