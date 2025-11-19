﻿// frontend/src/components/AppShell.tsx
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet, useLocation } from "react-router-dom";
import { useMemo } from "react";

const HeaderComponent: any = Header;

export default function AppShell() {
  const location = useLocation();

  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path === "/dashboard") return "Dashboard";
    if (path === "/accounts") return "Accounts";
    if (path === "/budgets") return "Budgets";
    if (path === "/ai-insights") return "AI Insights";
    if (path === "/add-data") return "Add Data";
    if (path === "/profile") return "Profile";
    return "";
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-[1400px] flex gap-4 p-4 min-h-screen">
        {/* Sidebar - Fixed height */}
        <div className="w-64 flex-shrink-0">
          <div className="sticky top-4">
            <Sidebar />
          </div>
        </div>

        {/* Main section */}
        <main className="flex-1 min-w-0">
          <HeaderComponent title={pageTitle} />
          <Outlet />
        </main>
      </div>
    </div>
  );
}