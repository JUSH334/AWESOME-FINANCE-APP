﻿// frontend/src/pages/Accounts.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { dataApi } from "../services/dataApi";
import type { Txn } from "../types";

type AccountRow = {
  id: string | number;
  name?: string;
  type?: string;
  balance?: number | string;
};

export default function AccountsPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  // load accounts + transactions
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [acctData, txnData] = await Promise.all([
          dataApi.getAccounts(),
          dataApi.getTransactions(),
        ]);
        if (!mounted) return;
        setAccounts(Array.isArray(acctData) ? acctData : []);
        setTxns(Array.isArray(txnData) ? txnData : []);
      } catch (error) {
        console.error('Failed to load data:', error);
        if (!mounted) return;
        setAccounts([]);
        setTxns([]);
      } finally {
        if (mounted) setLoading(false);
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

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    
    try {
      // Extract just the date part (YYYY-MM-DD)
      const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const parts = datePart.split('-');
      
      if (parts.length !== 3) return 'Invalid Date';
      
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      
      // Simply reformat to MM/DD/YYYY without any Date object conversion
      return `${month}/${day}/${year}`;
      
    } catch (e) {
      console.error('Date parsing error:', e, 'for date:', dateStr);
      return 'Invalid Date';
    }
  };

  const filtered = useMemo(
    () =>
      txns.filter((r) =>
        (r.category + (r.note ?? "") + r.amount + (r.date || r.transactionDate || ''))
          .toLowerCase()
          .includes(q.toLowerCase())
      ),
    [txns, q]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ---------- Accounts ---------- */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Accounts</h2>
          <button
            onClick={() => navigate('/add-data', { state: { activeTab: 'account' } })}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-600 mb-4">No accounts found</p>
            <a
              href="/add-data"
              className="inline-block px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Add Your First Account
            </a>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {accounts.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl shadow-md transition-shadow bg-white hover:shadow-lg"
              >
                <div
                  className="rounded-2xl text-white flex flex-col justify-between"
                  style={{
                    backgroundColor: "#00995C",
                    minHeight: "180px",
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
        )}
      </section>

      {/* ---------- Transactions (below accounts) ---------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Transactions</h2>
          <div className="flex items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="rounded-xl border px-3 py-2"
            />
            <button
              onClick={() => navigate('/add-data')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          </div>
        </div>

        {txns.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-600 mb-4">No transactions found</p>
            <a
              href="/add-data"
              className="inline-block px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Add Your First Transaction
            </a>
          </div>
        ) : (
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
                      {formatDate(r.date || r.transactionDate)}
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
        )}
      </section>
    </div>
  );
}