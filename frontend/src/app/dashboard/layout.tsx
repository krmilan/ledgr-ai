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
      <div style={{
        minHeight: "100vh", backgroundColor: "#0a0a0f",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: "32px", height: "32px",
          border: "2px solid #10b981",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#0a0a0f" }}>
      <Sidebar />
      {/* marginLeft must match sidebar width exactly */}
      <main style={{
        marginLeft: "240px",
        flex: 1,
        padding: "32px",
        minHeight: "100vh",
        overflowY: "auto",
      }}>
        {children}
      </main>
    </div>
  );
}
