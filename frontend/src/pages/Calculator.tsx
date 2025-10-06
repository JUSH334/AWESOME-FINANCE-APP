import { useState } from "react";
export default function CalculatorPage() {
  const [income, setIncome] = useState(5000);
  const [savePct, setSavePct] = useState(20);
  const savings = Math.round((income * savePct) / 100);
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Savings Calculator</h2>
      <div className="rounded-2xl border bg-white p-4 grid gap-3 md:grid-cols-3">
        <label className="text-sm">Monthly Income
          <input type="number" value={income} onChange={e=>setIncome(+e.target.value)} className="mt-1 w-full rounded-xl border p-2" />
        </label>
        <label className="text-sm">Save %
          <input type="number" value={savePct} onChange={e=>setSavePct(+e.target.value)} className="mt-1 w-full rounded-xl border p-2" />
        </label>
        <div className="text-sm">You’ll save <span className="font-semibold">${savings.toLocaleString()}</span> / month</div>
      </div>
    </div>
  );
}
