﻿// frontend/src/pages/Accounts.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, X, Loader2 } from "lucide-react";
import { dataApi } from "../services/dataApi";
import type { Txn } from "../types";

type AccountRow = {
  id: string | number;
  name?: string;
  type?: string;
  balance?: number | string;
  institution?: string;
  accountNumber?: string;
};

export default function AccountsPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Edit modals
  const [editingAccount, setEditingAccount] = useState<AccountRow | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Txn | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  
  // Message state
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    let mounted = true;
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
    return () => { mounted = false; };
  };

  const fmtMoney = (v: number | string | undefined) => {
    const n = typeof v === "string" ? Number(v) : v ?? 0;
    return Number.isFinite(n)
      ? n.toLocaleString(undefined, { style: "currency", currency: "USD" })
      : "$0.00";
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const parts = datePart.split('-');
      if (parts.length !== 3) return 'Invalid Date';
      const [year, month, day] = parts;
      return `${month}/${day}/${year}`;
    } catch (e) {
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

  const handleDeleteAccount = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await dataApi.deleteAccount(Number(id));
      setMessage({ type: 'success', text: 'Account deleted successfully!' });
      await loadData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to delete account' 
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleDeleteTransaction = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await dataApi.deleteTransaction(Number(id));
      setMessage({ type: 'success', text: 'Transaction deleted successfully!' });
      await loadData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to delete transaction' 
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    setSaving(true);
    setMessage(null);

    try {
      await dataApi.updateAccount(Number(editingAccount.id), {
        name: editingAccount.name,
        type: editingAccount.type,
        balance: Number(editingAccount.balance),
        institution: editingAccount.institution,
        accountNumber: editingAccount.accountNumber,
      });
      
      setMessage({ type: 'success', text: 'Account updated successfully!' });
      setShowAccountModal(false);
      setEditingAccount(null);
      await loadData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update account' 
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    setSaving(true);
    setMessage(null);

    try {
      await dataApi.updateTransaction(Number(editingTransaction.id), {
        accountId: editingTransaction.accountId ? Number(editingTransaction.accountId) : undefined,
        transactionDate: editingTransaction.transactionDate || editingTransaction.date,
        amount: Number(editingTransaction.amount),
        category: editingTransaction.category,
        type: editingTransaction.type,
        note: editingTransaction.note,
        merchant: editingTransaction.merchant,
      });
      
      setMessage({ type: 'success', text: 'Transaction updated successfully!' });
      setShowTransactionModal(false);
      setEditingTransaction(null);
      await loadData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update transaction' 
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

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
      {/* Message Banner */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          <span className="flex-1 font-medium">{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-current hover:opacity-70">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Accounts Section */}
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
                  className="rounded-2xl text-white flex flex-col justify-between relative"
                  style={{
                    backgroundColor: "#00995C",
                    minHeight: "180px",
                    padding: "20px",
                  }}
                >
                  {/* Edit/Delete buttons */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => {
                        setEditingAccount(a);
                        setShowAccountModal(true);
                      }}
                      className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                      title="Edit Account"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(a.id)}
                      disabled={saving}
                      className="p-1.5 bg-white/20 hover:bg-rose-500 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

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

      {/* Transactions Section */}
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
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-slate-50">
                    <td className="p-3">
                      {formatDate(r.date || r.transactionDate)}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {r.category}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs truncate">{r.note ?? ""}</td>
                    <td
                      className={`p-3 text-right font-medium ${
                        r.type === "in" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {r.type === "in" ? "+" : "-"}
                      {fmtMoney(r.amount)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingTransaction(r);
                            setShowTransactionModal(true);
                          }}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Transaction"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(r.id)}
                          disabled={saving}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="p-4 text-slate-500" colSpan={5}>
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit Account Modal */}
      {showAccountModal && editingAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Edit Account</h2>
              <button
                onClick={() => {
                  setShowAccountModal(false);
                  setEditingAccount(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAccount} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Account Name *</label>
                <input
                  type="text"
                  value={editingAccount.name || ''}
                  onChange={(e) => setEditingAccount({...editingAccount, name: e.target.value})}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Type *</label>
                <select
                  value={editingAccount.type || ''}
                  onChange={(e) => setEditingAccount({...editingAccount, type: e.target.value})}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Balance *</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingAccount.balance || ''}
                  onChange={(e) => setEditingAccount({...editingAccount, balance: e.target.value})}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Institution</label>
                <input
                  type="text"
                  value={editingAccount.institution || ''}
                  onChange={(e) => setEditingAccount({...editingAccount, institution: e.target.value})}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAccountModal(false);
                    setEditingAccount(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showTransactionModal && editingTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Edit Transaction</h2>
              <button
                onClick={() => {
                  setShowTransactionModal(false);
                  setEditingTransaction(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTransaction} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Date *</label>
                <input
                  type="date"
                  value={editingTransaction.transactionDate || editingTransaction.date || ''}
                  onChange={(e) => setEditingTransaction({...editingTransaction, transactionDate: e.target.value, date: e.target.value})}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTransaction.amount || ''}
                  onChange={(e) => setEditingTransaction({...editingTransaction, amount: parseFloat(e.target.value)})}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Type *</label>
                <select
                  value={editingTransaction.type || ''}
                  onChange={(e) => setEditingTransaction({...editingTransaction, type: e.target.value})}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                >
                  <option value="out">Expense (Out)</option>
                  <option value="in">Income (In)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Category *</label>
                <select
                  value={editingTransaction.category || ''}
                  onChange={(e) => setEditingTransaction({...editingTransaction, category: e.target.value})}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                >
                  <option value="Groceries">Groceries</option>
                  <option value="Dining">Dining</option>
                  <option value="Gas">Gas</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Housing">Housing</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Education">Education</option>
                  <option value="Personal Care">Personal Care</option>
                  <option value="Savings">Savings</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Note</label>
                <textarea
                  value={editingTransaction.note || ''}
                  onChange={(e) => setEditingTransaction({...editingTransaction, note: e.target.value})}
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Merchant</label>
                <input
                  type="text"
                  value={editingTransaction.merchant || ''}
                  onChange={(e) => setEditingTransaction({...editingTransaction, merchant: e.target.value})}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransactionModal(false);
                    setEditingTransaction(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}