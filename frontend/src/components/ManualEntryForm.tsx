// frontend/src/components/ManualEntryForm.tsx
import { useState, useEffect } from 'react';
import { Plus, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { dataApi } from '../services/dataApi';

type EntryType = 'account' | 'transaction';

// Helper function to get today's date in YYYY-MM-DD format without timezone issues
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface ManualEntryFormProps {
  initialEntryType?: 'account' | 'transaction';
}

export default function ManualEntryForm({ initialEntryType }: ManualEntryFormProps) {
  const [entryType, setEntryType] = useState<EntryType>(initialEntryType || 'transaction');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Account form state
  const [accountForm, setAccountForm] = useState({
    name: '',
    type: 'checking',
    balance: '',
    institution: '',
    accountNumber: ''
  });

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState({
    accountId: '',
    transactionDate: getTodayDateString(), // Use local date instead of UTC
    amount: '',
    category: 'Other',
    type: 'out',
    note: '',
    merchant: '',
    updateBalance: true
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await dataApi.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await dataApi.createAccount({
        name: accountForm.name,
        type: accountForm.type,
        balance: parseFloat(accountForm.balance) || 0,
        institution: accountForm.institution,
        accountNumber: accountForm.accountNumber
      });

      setMessage({ type: 'success', text: 'Account created successfully!' });
      setAccountForm({
        name: '',
        type: 'checking',
        balance: '',
        institution: '',
        accountNumber: ''
      });
      loadAccounts();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to create account' });
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await dataApi.createTransaction({
        accountId: transactionForm.accountId ? parseInt(transactionForm.accountId) : null,
        transactionDate: transactionForm.transactionDate,
        amount: parseFloat(transactionForm.amount),
        category: transactionForm.category,
        type: transactionForm.type,
        note: transactionForm.note,
        merchant: transactionForm.merchant,
        updateBalance: transactionForm.updateBalance
      });

      setMessage({ type: 'success', text: 'Transaction added successfully!' });
      setTransactionForm({
        accountId: transactionForm.accountId,
        transactionDate: getTodayDateString(), // Use local date instead of UTC
        amount: '',
        category: 'Other',
        type: 'out',
        note: '',
        merchant: '',
        updateBalance: true
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to add transaction' });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Income',
    'Salary',
    'Groceries',
    'Dining',
    'Gas',
    'Shopping',
    'Utilities',
    'Housing',
    'Insurance',
    'Healthcare',
    'Entertainment',
    'Transfer',
    'Other'
  ];

  return (
    <div className="p-6">
      {/* Entry Type Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setEntryType('transaction')}
          className={`flex-1 py-2 px-4 rounded-xl font-medium transition-colors ${
            entryType === 'transaction'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Add Transaction
        </button>
        <button
          onClick={() => setEntryType('account')}
          className={`flex-1 py-2 px-4 rounded-xl font-medium transition-colors ${
            entryType === 'account'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Add Account
        </button>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 ${
          message.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="flex-1 font-medium">{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-current hover:opacity-70">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Account Form */}
      {entryType === 'account' && (
        <form onSubmit={handleAccountSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Account Name *
              </label>
              <input
                type="text"
                value={accountForm.name}
                onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                placeholder="e.g., Chase Checking"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Account Type *
              </label>
              <select
                value={accountForm.type}
                onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit">Credit Card</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Initial Balance
              </label>
              <input
                type="number"
                step="0.01"
                value={accountForm.balance}
                onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Institution
              </label>
              <input
                type="text"
                value={accountForm.institution}
                onChange={(e) => setAccountForm({ ...accountForm, institution: e.target.value })}
                placeholder="e.g., Chase Bank"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Account Number (optional)
              </label>
              <input
                type="text"
                value={accountForm.accountNumber}
                onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                placeholder="Last 4 digits"
                maxLength={4}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Create Account
              </>
            )}
          </button>
        </form>
      )}

      {/* Transaction Form */}
      {entryType === 'transaction' && (
        <form onSubmit={handleTransactionSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Account
              </label>
              <select
                value={transactionForm.accountId}
                onChange={(e) => setTransactionForm({ ...transactionForm, accountId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              >
                <option value="">No specific account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Date *
              </label>
              <input
                type="date"
                value={transactionForm.transactionDate}
                onChange={(e) => setTransactionForm({ ...transactionForm, transactionDate: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Amount * ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                placeholder="0.00"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Type *
              </label>
              <select
                value={transactionForm.type}
                onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              >
                <option value="out">Expense (Out)</option>
                <option value="in">Income (In)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Category *
              </label>
              <select
                value={transactionForm.category}
                onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Merchant
              </label>
              <input
                type="text"
                value={transactionForm.merchant}
                onChange={(e) => setTransactionForm({ ...transactionForm, merchant: e.target.value })}
                placeholder="e.g., Walmart"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Note
              </label>
              <textarea
                value={transactionForm.note}
                onChange={(e) => setTransactionForm({ ...transactionForm, note: e.target.value })}
                placeholder="Additional details..."
                rows={2}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={transactionForm.updateBalance}
                  onChange={(e) => setTransactionForm({ ...transactionForm, updateBalance: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">
                  Update account balance automatically
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Adding Transaction...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add Transaction
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}