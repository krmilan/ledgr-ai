"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, ArrowLeftRight, PieChart, Sparkles, TrendingUp } from "lucide-react";

const NAV = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight   },
  { href: "/budgets",      label: "Budgets",      icon: PieChart         },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "240px",
      height: "100vh",
      backgroundColor: "#111118",
      borderRight: "1px solid #1e1e2e",
      display: "flex",
      flexDirection: "column",
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: "24px", borderBottom: "1px solid #1e1e2e" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px",
            backgroundColor: "#10b981",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <TrendingUp size={16} color="white" />
          </div>
          <span style={{ color: "white", fontWeight: 700, fontSize: "20px" }}>
            Ledgr<span style={{ color: "#10b981" }}>.ai</span>
          </span>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              textDecoration: "none",
              color: active ? "#34d399" : "#9ca3af",
              backgroundColor: active ? "rgba(16,185,129,0.08)" : "transparent",
              border: active ? "1px solid rgba(16,185,129,0.2)" : "1px solid transparent",
              transition: "all 0.15s",
            }}>
              <Icon size={18} />
              {label}
            </Link>
          );
        })}

        {/* AI Insights - disabled */}
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "10px 12px", borderRadius: "8px",
          fontSize: "14px", fontWeight: 500,
          color: "#4b5563", cursor: "not-allowed",
        }}>
          <Sparkles size={18} />
          AI Insights
          <span style={{
            marginLeft: "auto", fontSize: "11px",
            backgroundColor: "#1a1a24", color: "#6b7280",
            padding: "2px 6px", borderRadius: "4px",
          }}>soon</span>
        </div>
      </nav>

      {/* User */}
      <div style={{ padding: "16px", borderTop: "1px solid #1e1e2e" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
          <div>
            <p style={{ fontSize: "13px", color: "white", fontWeight: 500 }}>My Account</p>
            <p style={{ fontSize: "11px", color: "#6b7280" }}>Manage profile</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
