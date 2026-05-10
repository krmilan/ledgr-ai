"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Sparkles,
  TrendingUp,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight   },
  { href: "/budgets",      label: "Budgets",      icon: PieChart         },
  { href: "/ai-insights",  label: "AI Insights",  icon: Sparkles         },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  const email = user?.primaryEmailAddress?.emailAddress || "";
  const name = user?.fullName || user?.firstName || email.split("@")[0] || "User";
  const initials = name.slice(0, 2).toUpperCase();

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
          const active = href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);
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
      </nav>

      {/* User profile + sign out */}
      <div style={{ borderTop: "1px solid #1e1e2e" }}>
        {/* User info */}
        <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Avatar — initials based */}
          <div style={{
            width: "36px", height: "36px",
            borderRadius: "50%",
            backgroundColor: "#10b981",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            fontSize: "13px", fontWeight: 700, color: "white",
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "13px", color: "white", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {name}
            </p>
            <p style={{ fontSize: "11px", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {email}
            </p>
          </div>
        </div>

        {/* Sign out button */}
        <div style={{ padding: "0 16px 16px" }}>
          <SignOutButton redirectUrl="/sign-in">
            <button style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#9ca3af",
              backgroundColor: "transparent",
              border: "1px solid #1e1e2e",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)";
                e.currentTarget.style.color = "#ef4444";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#9ca3af";
                e.currentTarget.style.borderColor = "#1e1e2e";
              }}
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </div>
    </aside>
  );
}
