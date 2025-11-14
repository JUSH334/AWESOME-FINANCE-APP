﻿// frontend/src/pages/Dashboard.tsx
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Stat } from "../components/ui/Stat";
import NetWorthBar from "../charts/NetWorthBar";
import BudgetDonut from "../charts/BudgetDonut";
import { api } from "../services/api";
import { useEffect, useState } from "react";
import type { DashboardData } from "../types";

function currency(n: number) { 
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" }); 
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    setLoading(true);
    api.getDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 mb-4">No data available</p>
        <a
          href="/add-data"
          className="inline-block px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
        >
          Add Your Financial Data
        </a>
      </div>
    );
  }

  const { summary, netWorth, budget } = data;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <Card title="Total Balance" icon={<Wallet size={18} />}>
          <Stat value={currency(summary.total)} note={summary.total > 0 ? "Your current balance" : "Start adding accounts"} tone={summary.total > 0 ? "up" : "default"} />
        </Card>
        <Card title="Monthly Income" icon={<TrendingUp size={18} />}>
          <Stat value={currency(summary.income)} note={summary.income > 0 ? "Last 30 days" : "No income recorded"} tone={summary.income > 0 ? "up" : "default"} />
        </Card>
        <Card title="Monthly Expenses" icon={<TrendingDown size={18} />}>
          <Stat value={currency(summary.expenses)} note={summary.expenses > 0 ? "Last 30 days" : "No expenses recorded"} tone={summary.expenses > 0 ? "down" : "default"} />
        </Card>
        <Card title="Savings Goal" icon={<PiggyBank size={18} />}>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-semibold">{currency(summary.savingsGoal)}</div>
            <div className="text-sm text-slate-500">{Math.round(summary.goalProgress * 100)}% completed</div>
          </div>
          <div className="h-2 mt-3 w-full rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full"
              style={{
                width: `${summary.goalProgress * 100}%`,
                background: "linear-gradient(90deg, #00C289 0%, #009E67 100%)",
              }} 
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Account Overview">
          <div className="text-2xl font-semibold">{currency(summary.total)}</div>
          <div className="text-green-600 text-sm mb-4">
            {netWorth.length > 0 ? "Last 6 months trend" : "Start tracking your finances"}
          </div>
          {netWorth.length > 0 ? (
            <NetWorthBar data={netWorth} />
          ) : (
            <div className="h-[320px] flex items-center justify-center text-slate-500">
              <p>Add transactions to see trends</p>
            </div>
          )}
        </Card>

        <Card title="Monthly Budget">
          <div className="text-2xl font-semibold">
            {currency(budget.reduce((a, b) => a + b.value, 0))}
          </div>
          {budget.length > 0 && budget.some(b => b.value > 0) ? (
            <BudgetDonut data={budget} />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              <p>Add income and expenses to see budget breakdown</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}