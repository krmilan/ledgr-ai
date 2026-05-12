"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import {
  LayoutDashboard, ArrowLeftRight, PieChart,
  Sparkles, TrendingUp, LogOut, UserCircle, Menu, X,
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress || "";
  const name = user?.fullName || user?.firstName || email.split("@")[0] || "User";
  const initials = name.slice(0, 2).toUpperCase();

  const NavContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: "24px", borderBottom: "1px solid #1e1e2e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", backgroundColor: "#10b981", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <TrendingUp size={16} color="white" />
          </div>
          <span style={{ color: "white", fontWeight: 700, fontSize: "20px" }}>
            Ledgr<span style={{ color: "#10b981" }}>.ai</span>
          </span>
        </div>
        {/* Close button on mobile */}
        <button onClick={() => setMobileOpen(false)}
          style={{ display: "none", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: "4px" }}
          className="mobile-close-btn">
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              onClick={() => setMobileOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", fontSize: "14px", fontWeight: 500, textDecoration: "none", color: active ? "#34d399" : "#9ca3af", backgroundColor: active ? "rgba(16,185,129,0.08)" : "transparent", border: active ? "1px solid rgba(16,185,129,0.2)" : "1px solid transparent" }}>
              <Icon size={18} />{label}
            </Link>
          );
        })}
      </nav>

      {/* Profile + signout */}
      <div style={{ borderTop: "1px solid #1e1e2e" }}>
        <Link href="/profile" onClick={() => setMobileOpen(false)}
          style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", textDecoration: "none", borderBottom: "1px solid #1e1e2e", backgroundColor: pathname === "/profile" ? "rgba(16,185,129,0.05)" : "transparent" }}>
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt={name} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "13px", fontWeight: 700, color: "white" }}>{initials}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "13px", color: "white", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
            <p style={{ fontSize: "11px", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</p>
          </div>
          <UserCircle size={15} color="#6b7280" />
        </Link>
        <div style={{ padding: "12px 16px" }}>
          <SignOutButton redirectUrl="/sign-in">
            <button style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px", fontSize: "14px", fontWeight: 500, color: "#9ca3af", backgroundColor: "transparent", border: "1px solid #1e1e2e", cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.borderColor = "#1e1e2e"; }}>
              <LogOut size={15} />Sign Out
            </button>
          </SignOutButton>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        /* Desktop sidebar */
        .sidebar-desktop {
          position: fixed;
          top: 0;
          left: 0;
          width: 240px;
          height: 100vh;
          background-color: #111118;
          border-right: 1px solid #1e1e2e;
          display: flex;
          flex-direction: column;
          z-index: 50;
        }

        /* Mobile top bar */
        .mobile-topbar {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 56px;
          background-color: #111118;
          border-bottom: 1px solid #1e1e2e;
          z-index: 50;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
        }

        /* Mobile drawer */
        .mobile-drawer {
          position: fixed;
          top: 0;
          left: 0;
          width: 280px;
          height: 100vh;
          background-color: #111118;
          border-right: 1px solid #1e1e2e;
          display: flex;
          flex-direction: column;
          z-index: 100;
          transform: translateX(-100%);
          transition: transform 0.25s ease;
        }
        .mobile-drawer.open {
          transform: translateX(0);
        }

        /* Mobile overlay */
        .mobile-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 99;
          display: none;
        }
        .mobile-overlay.open {
          display: block;
        }

        .mobile-close-btn { display: none !important; }

        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .mobile-close-btn { display: flex !important; }
        }
      `}</style>

      {/* Desktop sidebar */}
      <aside className="sidebar-desktop">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "28px", height: "28px", backgroundColor: "#10b981", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={14} color="white" />
          </div>
          <span style={{ color: "white", fontWeight: 700, fontSize: "18px" }}>
            Ledgr<span style={{ color: "#10b981" }}>.ai</span>
          </span>
        </div>
        <button onClick={() => setMobileOpen(true)}
          style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: "8px" }}>
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile overlay */}
      <div className={`mobile-overlay ${mobileOpen ? "open" : ""}`} onClick={() => setMobileOpen(false)} />

      {/* Mobile drawer */}
      <div className={`mobile-drawer ${mobileOpen ? "open" : ""}`}>
        <NavContent />
      </div>
    </>
  );
}
