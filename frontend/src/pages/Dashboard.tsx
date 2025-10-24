﻿import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Stat } from "../components/ui/Stat";
import NetWorthBar from "../charts/NetWorthBar";
import BudgetDonut from "../charts/BudgetDonut";
import { api } from "../services/api";
import { useEffect, useState } from "react";
import type { DashboardData } from "../types";
function currency(n: number) { return n.toLocaleString(undefined, { style: "currency", currency: "USD" }); }
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  useEffect(() => { api.getDashboard().then(setData); }, []);
  if (!data) return <div className="p-6">Loading…</div>;
  const { summary, netWorth, budget } = data;
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <Card title="Total Balance" icon={<Wallet size={18} />}><Stat value={currency(summary.total)} note={"+20.1% from last month"} tone="up" /></Card>
        <Card title="Monthly Income" icon={<TrendingUp size={18} />}><Stat value={currency(summary.income)} note={"+12.5% from last month"} tone="up" /></Card>
        <Card title="Monthly Expenses" icon={<TrendingDown size={18} />}><Stat value={currency(summary.expenses)} note={"−5.2% from last month"} tone="down" /></Card>
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
    }} />
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Account Overview">
          <div className="text-2xl font-semibold">{currency(summary.total)}</div>
          <div className="text-green-600 text-sm mb-4">+{currency(3231.89)} this month</div>
          <NetWorthBar data={netWorth} />
        </Card>
        <Card title="Monthly Budget">
          <div className="text-2xl font-semibold">{currency(budget.reduce((a, b) => a + b.value, 0))}</div>
          <BudgetDonut data={budget} />
        </Card>
      </div>
    </div>
  );
}