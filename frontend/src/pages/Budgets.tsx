import { demoDashboard } from "../data/demo";
export default function BudgetsPage() {
  const items = demoDashboard.budget;
  const total = items.reduce((a, b) => a + b.value, 0);
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Budgets</h2>
      <div className="rounded-2xl border bg-white p-4">
        {items.map((b) => (
          <div key={b.name} className="mb-4">
            <div className="flex justify-between text-sm mb-1"><span>{b.name}</span><span>${b.value.toLocaleString()}</span></div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${(b.value / total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
