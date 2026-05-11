"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import {
  User, Mail, Calendar, TrendingUp,
  Receipt, PieChart, Shield, ChevronRight,
} from "lucide-react";
import { useApi, TransactionSummary } from "@/lib/api";

const fmt = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n.toFixed(0)}`;
};

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const api = useApi();
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [showClerkProfile, setShowClerkProfile] = useState(false);
  const now = new Date();

  useEffect(() => {
    api.transactions.summary(now.getMonth() + 1, now.getFullYear())
      .then(setSummary).catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isLoaded || !user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
        <div style={{ width: "28px", height: "28px", border: "2px solid #10b981", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const email = user.primaryEmailAddress?.emailAddress || "";
  const name = user.fullName || user.firstName || email.split("@")[0] || "User";
  const initials = name.slice(0, 2).toUpperCase();
  const joinedDate = new Date(user.createdAt!).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const savingsRate = summary?.totalIncome ? Math.round((summary.netSavings / summary.totalIncome) * 100) : 0;

  const card: React.CSSProperties = { backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "20px" };

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "white" }}>Profile</h1>
        <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>Manage your account details</p>
      </div>

      {/* Profile card */}
      <div style={{ ...card, marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {user.imageUrl ? (
              <img src={user.imageUrl} alt={name} style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "2px solid #1e1e2e" }} />
            ) : (
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 700, color: "white", border: "2px solid #1e1e2e" }}>
                {initials}
              </div>
            )}
            <div style={{ position: "absolute", bottom: "4px", right: "4px", width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "#10b981", border: "2px solid #111118" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "white", marginBottom: "4px" }}>{name}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <Mail size={13} color="#6b7280" />
              <span style={{ fontSize: "14px", color: "#9ca3af" }}>{email}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={13} color="#6b7280" />
              <span style={{ fontSize: "13px", color: "#6b7280" }}>Joined {joinedDate}</span>
            </div>
          </div>
          <button onClick={() => setShowClerkProfile(true)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px", fontSize: "14px", fontWeight: 500, color: "#10b981", cursor: "pointer" }}>
            <User size={15} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>This Month</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {[
            { label: "Income",       value: summary ? fmt(summary.totalIncome)              : "—", icon: TrendingUp, color: "#10b981" },
            { label: "Expenses",     value: summary ? fmt(summary.totalExpenses)            : "—", icon: Receipt,    color: "#ef4444" },
            { label: "Saved",        value: summary ? fmt(Math.max(0, summary.netSavings)) : "—", icon: PieChart,   color: "#3b82f6" },
            { label: "Savings Rate", value: summary ? `${savingsRate}%`                     : "—", icon: Shield,     color: savingsRate >= 20 ? "#10b981" : "#f59e0b" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                <Icon size={14} color={color} opacity={0.8} />
              </div>
              <p style={{ fontSize: "20px", fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Account details */}
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Account Details</h3>
        <div style={card}>
          {[
            { label: "Full Name",      value: name,                         icon: User     },
            { label: "Email Address",  value: email,                        icon: Mail     },
            { label: "Member Since",   value: joinedDate,                   icon: Calendar },
            { label: "Authentication", value: "Clerk — Secured with JWT",   icon: Shield   },
          ].map(({ label, value, icon: Icon }, i, arr) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 0", borderBottom: i < arr.length - 1 ? "1px solid #1e1e2e" : "none" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#1a1a24", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={16} color="#6b7280" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "2px" }}>{label}</p>
                <p style={{ fontSize: "14px", color: "white", fontWeight: 500 }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Quick Actions</h3>
        <div style={card}>
          {[
            { label: "Edit profile & change password", desc: "Update your name, photo, and security settings" },
            { label: "Connected accounts",             desc: "Manage Google and other OAuth connections"       },
          ].map(({ label, desc }, i, arr) => (
            <button key={label} onClick={() => setShowClerkProfile(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "14px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", borderBottom: i < arr.length - 1 ? "1px solid #1e1e2e" : "none" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "14px", color: "white", fontWeight: 500, marginBottom: "2px" }}>{label}</p>
                <p style={{ fontSize: "12px", color: "#6b7280" }}>{desc}</p>
              </div>
              <ChevronRight size={16} color="#6b7280" />
            </button>
          ))}
        </div>
      </div>

      {/* Clerk UserProfile modal */}
      {showClerkProfile && (
        <div onClick={e => e.target === e.currentTarget && setShowClerkProfile(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ position: "relative", maxHeight: "90vh", overflowY: "auto", borderRadius: "16px" }}>
            <button onClick={() => setShowClerkProfile(false)} style={{ position: "absolute", top: "12px", right: "12px", zIndex: 10, backgroundColor: "#1a1a24", border: "1px solid #1e1e2e", borderRadius: "6px", color: "#9ca3af", cursor: "pointer", padding: "6px 10px", fontSize: "12px" }}>
              ✕ Close
            </button>
            <UserProfile appearance={{ baseTheme: dark, variables: { colorBackground: "#111118", colorInputBackground: "#1a1a24", colorInputText: "#ffffff", colorText: "#ffffff", colorTextSecondary: "#9ca3af", colorPrimary: "#10b981", borderRadius: "0.5rem" }, elements: { card: { border: "1px solid #1e1e2e" }, formButtonPrimary: { backgroundColor: "#10b981" }, footerActionLink: { color: "#10b981" } } }} />
          </div>
        </div>
      )}
    </div>
  );
}
