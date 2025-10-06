import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import type { Txn } from "../types";
export default function TransactionsPage() {
  const [rows, setRows] = useState<Txn[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => { api.getTransactions().then(setRows); }, []);
  const fmt = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });
  const filtered = useMemo(() =>
    rows.filter(r => (r.category + (r.note ?? "") + r.amount + r.date).toLowerCase().includes(q.toLowerCase())), [rows, q]);
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Transactions</h2>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="rounded-xl border px-3 py-2" />
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Category</th><th className="text-left p-3">Note</th><th className="text-right p-3">Amount</th></tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{new Date(r.date).toLocaleDateString()}</td>
                <td className="p-3">{r.category}</td>
                <td className="p-3">{r.note ?? ""}</td>
                <td className={`p-3 text-right ${r.type === "in" ? "text-emerald-600" : "text-rose-600"}`}>
                  {r.type === "in" ? "+" : "-"}{fmt(r.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
