import { useState } from "react";
import { demoDashboard } from "../data/demo";

type TabKey = "budgets" | "calculator";

export default function BudgetAndCalculatorTabbedPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("budgets");

  // Budgets data
  const items = demoDashboard.budget;
  const total = items.reduce((a, b) => a + b.value, 0);

  // Calculator state
  const [income, setIncome] = useState(5000);
  const [savePct, setSavePct] = useState(20);
  const savings = Math.round((income * savePct) / 100);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Budgets & Savings</h2>

      {/* Tabs */}
      <div role="tablist" aria-label="Budgets and Calculator" className="flex gap-2">
        <button
          role="tab"
          aria-selected={activeTab === "budgets"}
          onClick={() => setActiveTab("budgets")}
          className={`rounded-xl px-4 py-2 text-sm font-medium border transition
            ${activeTab === "budgets" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"}`}
        >
          Budgets
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "calculator"}
          onClick={() => setActiveTab("calculator")}
          className={`rounded-xl px-4 py-2 text-sm font-medium border transition
            ${activeTab === "calculator" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"}`}
        >
          Calculator
        </button>
      </div>

      {/* Panels */}
      {activeTab === "budgets" && (
        <section
          role="tabpanel"
          aria-labelledby="budgets-tab"
          className="rounded-2xl border bg-white p-4"
        >
          <h3 className="text-base font-medium mb-3">Budgets</h3>
          {items.map((b) => (
            <div key={b.name} className="mb-4 last:mb-0">
              <div className="flex justify-between text-sm mb-1">
                <span>{b.name}</span>
                <span>${b.value.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${total ? (b.value / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </section>
      )}

      {activeTab === "calculator" && (
        <section
          role="tabpanel"
          aria-labelledby="calculator-tab"
          className="rounded-2xl border bg-white p-4"
        >
          <h3 className="text-base font-medium mb-3">Savings Calculator</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              Monthly Income
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-xl border p-2"
              />
            </label>
            <label className="text-sm">
              Save %
              <input
                type="number"
                value={savePct}
                onChange={(e) => setSavePct(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-xl border p-2"
              />
            </label>
          </div>
          <div className="text-sm mt-3">
            You’ll save <span className="font-semibold">${savings.toLocaleString()}</span> / month
          </div>
        </section>
      )}
    </div>
  );
}