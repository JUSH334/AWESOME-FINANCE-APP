﻿// frontend/src/components/Sidebar.tsx
import { NavLink, Link } from "react-router-dom";
import { LayoutDashboard, Wallet, PiggyBank, User, Brain } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="bg-white rounded-2xl shadow-sm p-4 space-y-6">
      <Link to="/dashboard" className="flex items-center gap-3">
        <div className="h-10 w-10 md:h-12 md:w-12 shrink-0">
          <svg viewBox="0 0 64 64" aria-hidden="true" className="h-full w-full text-emerald-700">
            <defs>
              <linearGradient id="mf-globe-grad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="28" fill="url(#mf-globe-grad)" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5" />
            <path d="M4 32 A 28 12 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
            <path d="M4 32 A 28 20 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
            <path d="M32 4 A 28 28 0 0 1 32 60" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
            <path d="M32 4 A 28 28 0 0 0 32 60" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 leading-tight">MyFin</h2>
          <p className="text-slate-500 text-sm leading-tight">Financial Dashboard</p>
        </div>
      </Link>

      <nav className="space-y-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-xl font-medium ${
              isActive ? "bg-green-600 text-white" : "text-slate-700 hover:bg-slate-100"
            }`
          }
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </NavLink>

        <NavLink
          to="/accounts"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-xl font-medium ${
              isActive ? "bg-green-600 text-white" : "text-slate-700 hover:bg-slate-100"
            }`
          }
        >
          <Wallet className="w-4 h-4" />
          Accounts
        </NavLink>

        <NavLink
          to="/budgets"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-xl font-medium ${
              isActive ? "bg-green-600 text-white" : "text-slate-700 hover:bg-slate-100"
            }`
          }
        >
          <PiggyBank className="w-4 h-4" />
          Budgets
        </NavLink>

        <NavLink
          to="/ai-insights"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-xl font-medium ${
              isActive ? "bg-green-600 text-white" : "text-slate-700 hover:bg-slate-100"
            }`
          }
        >
          <Brain className="w-4 h-4" />
          AI Insights
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-xl font-medium ${
              isActive ? "bg-green-600 text-white" : "text-slate-700 hover:bg-slate-100"
            }`
          }
        >
          <User className="w-4 h-4" />
          Profile
        </NavLink>
      </nav>

      <p className="text-xs text-slate-400 mt-4">v1.0 • Demo</p>
    </aside>
  );
}