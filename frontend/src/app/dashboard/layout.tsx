"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useApi } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const api = useApi();

  useEffect(() => {
    if (isLoaded && user) {
      const email = user.primaryEmailAddress?.emailAddress || "";
      api.users.sync(email).catch(console.error);
    }
  }, [isLoaded, user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isLoaded) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "32px", height: "32px", border: "2px solid #10b981", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Desktop: sidebar offset */
        @media (min-width: 769px) {
          .main-content {
            margin-left: 240px;
            padding: 32px;
          }
        }

        /* Mobile: top bar offset */
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            padding: 72px 16px 24px 16px;
          }
        }
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#0a0a0f" }}>
        <Sidebar />
        <main className="main-content" style={{ flex: 1, overflowY: "auto", minHeight: "100vh" }}>
          {children}
        </main>
      </div>
    </>
  );
}
