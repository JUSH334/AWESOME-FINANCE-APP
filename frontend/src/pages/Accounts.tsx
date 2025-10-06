import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { Account } from "../types";
export default function AccountsPage() {
  const [rows, setRows] = useState<Account[]>([]);
  useEffect(() => { api.getAccounts().then(setRows); }, []);
  const fmt = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Accounts</h2>
      <div className="grid md:grid-cols-3 gap-3">
        {rows.map(a => (
          <div key={a.id} className="rounded-2xl bg-white border p-4">
            <div className="text-slate-500 text-sm">{a.type.toUpperCase()}</div>
            <div className="text-lg font-semibold">{a.name}</div>
            <div className="mt-2 text-2xl">{fmt(a.balance)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
