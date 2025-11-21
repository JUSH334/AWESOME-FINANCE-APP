﻿import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet, useLocation } from "react-router-dom";
import { useMemo } from "react";

const HeaderComponent: any = Header;

export default function AppShell() {
  const location = useLocation();

  const pageInfo = useMemo(() => {
    const path = location.pathname;
    if (path === "/dashboard") return { 
      title: "Dashboard", 
      subtitle: "",
      showWelcome: true
    };
    if (path === "/accounts") return { 
      title: "Accounts & Transactions", 
      subtitle: "View and manage your accounts and transactions",
      showWelcome: false
    };
    if (path === "/budgets") return { 
      title: "Budgets & Calculator", 
      subtitle: "Manage your spending limits and plan your savings",
      showWelcome: false
    };
    if (path === "/ai-insights") return { 
      title: "AI Insights", 
      subtitle: "Personalized recommendations powered by machine learning and LLM",
      showWelcome: false
    };
    if (path === "/add-data") return { 
      title: "Add Financial Data", 
      subtitle: "Add accounts and transactions manually or upload bank statements",
      showWelcome: false
    };
    if (path === "/profile") return { 
      title: "Profile Settings", 
      subtitle: "Manage your account settings and preferences",
      showWelcome: false
    };
    return { title: "", subtitle: "", showWelcome: false };
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
          <HeaderComponent 
            title={pageInfo.title} 
            subtitle={pageInfo.subtitle}
            showWelcome={pageInfo.showWelcome}
          />
          <Outlet />
        </main>
      </div>
    </div>
  );
}