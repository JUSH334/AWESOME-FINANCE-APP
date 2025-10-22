import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet, useLocation } from "react-router-dom";
import { useMemo } from "react";

// cast Header to any to allow passing props without changing Header's typings here
const HeaderComponent: any = Header;

export default function AppShell() {
  const location = useLocation();

  // Dynamically determine the current page name
  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path === "/dashboard") return "Dashboard";
    if (path === "/accounts") return "Accounts";
    if (path === "/budgets") return "Budgets";
    if (path === "/transactions") return "Transactions";
    if (path === "/profile") return "Profile";
    if (path === "/settings") return "Settings";
    return "";
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-[1400px] grid grid-cols-12 gap-4 p-4">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-3 xl:col-span-2">
          <Sidebar />
        </div>

        {/* Main section */}
        <main className="col-span-12 md:col-span-9 xl:col-span-10">
          {/* Pass the dynamic title to the Header */}
          <HeaderComponent title={pageTitle} />

          {/* Page content */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
