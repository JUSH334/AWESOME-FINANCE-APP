import { NavLink } from "react-router-dom";
import { LayoutDashboard, CreditCard, Wallet, TrendingDown, Calculator, Settings, User } from "lucide-react";
import type { JSX } from "react";
export default function Sidebar() {
  const link = (to: string, label: string, icon: JSX.Element) => (
    <NavLink to={to} className={({ isActive }) =>
      `w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
        isActive ? "bg-green-600 text-white" : "text-slate-600 hover:bg-slate-100"}` }>
      {icon}<span>{label}</span>
    </NavLink>
  );
  return (
    <aside className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-col h-full">
      <div className="mb-6">
        <div className="text-2xl font-bold leading-none">MyFin</div>
        <div className="text-xs text-slate-500">Financial Dashboard</div>
      </div>
      <nav className="space-y-1">
        {link("/dashboard", "Dashboard", <LayoutDashboard size={18} />)}
        {link("/accounts", "Accounts", <CreditCard size={18} />)}
        {link("/budgets", "Budgets", <Wallet size={18} />)}
        {link("/transactions", "Transactions", <TrendingDown size={18} />)}
        {link("/calculator", "Calculator", <Calculator size={18} />)}
        {link("/profile", "Profile", <User size={18} />)}
        {link("/settings", "Settings", <Settings size={18} />)}
      </nav>
      <div className="mt-auto pt-6 text-xs text-slate-500">v1.0 • Demo</div>
    </aside>
  );
}
