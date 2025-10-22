import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import type { Txn } from "../types";

type AccountRow = {
  id: string | number;
  name?: string;
  type?: string;
  balance?: number | string;
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [q, setQ] = useState("");

  // load accounts + transactions
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [acctData, txnData] = await Promise.all([
          api.getAccounts(),
          api.getTransactions(),
        ]);
        if (!mounted) return;
        setAccounts(Array.isArray(acctData) ? acctData : []);
        setTxns(Array.isArray(txnData) ? txnData : []);
      } catch {
        if (!mounted) return;
        setAccounts([]);
        setTxns([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const fmtMoney = (v: number | string | undefined) => {
    const n = typeof v === "string" ? Number(v) : v ?? 0;
    return Number.isFinite(n)
      ? n.toLocaleString(undefined, { style: "currency", currency: "USD" })
      : "$0.00";
  };

  const filtered = useMemo(
    () =>
      txns.filter((r) =>
        (r.category + (r.note ?? "") + r.amount + r.date)
          .toLowerCase()
          .includes(q.toLowerCase())
      ),
    [txns, q]
  );

  return (
    <div className="space-y-8">
      {/* ---------- Accounts ---------- */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Accounts</h2>

        <div className="grid gap-4 md:grid-cols-3">
          {accounts.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl shadow-md transition-shadow bg-white hover:shadow-lg"
            >
              <div
                className="rounded-2xl text-white flex flex-col justify-between"
                style={{
                  backgroundColor: "#00995C", // your green
                  minHeight: "180px",          // uniform height
                  padding: "20px",
                }}
              >
                <div>
                  <div className="text-green-100/90 text-xs tracking-wide">
                    Available balance
                  </div>
                  <div className="mt-1 text-3xl font-bold">
                    {fmtMoney(a.balance)}
                  </div>
                  <div className="mt-3 h-px bg-green-300/40" />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-4 text-sm">
                  <div>
                    <div className="text-green-100/80">Type</div>
                    <div className="font-medium">
                      {(a.type ?? "").toUpperCase() || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-green-100/80">Account</div>
                    <div className="font-medium">{a.name || "—"}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Transactions (below accounts) ---------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Transactions</h2>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="rounded-xl border px-3 py-2"
          />
        </div>

        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Category</th>
                <th className="text-left p-3">Note</th>
                <th className="text-right p-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">
                    {new Date(r.date).toLocaleDateString()}
                  </td>
                  <td className="p-3">{r.category}</td>
                  <td className="p-3">{r.note ?? ""}</td>
                  <td
                    className={`p-3 text-right ${
                      r.type === "in" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {r.type === "in" ? "+" : "-"}
                    {fmtMoney(r.amount)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={4}>
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
