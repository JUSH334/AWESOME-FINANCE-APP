﻿// frontend/src/pages/Budgets.tsx
import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Calculator, PiggyBank, TrendingDown, AlertTriangle, CheckCircle, Loader2, X } from "lucide-react";
import { budgetApi, type Budget } from "../services/budgetApi";

type TabKey = "budgets" | "calculator";

const CATEGORIES = [
  "Groceries",
  "Dining",
  "Gas",
  "Shopping",
  "Utilities",
  "Housing",
  "Insurance",
  "Healthcare",
  "Entertainment",
  "Transportation",
  "Education",
  "Personal Care",
  "Savings",
  "Other"
];

export default function BudgetsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("budgets");
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [periodType, setPeriodType] = useState<'monthly' | 'yearly'>('monthly');

  // Calculator state
  const [income, setIncome] = useState(5000);
  const [savePct, setSavePct] = useState(20);
  const savings = Math.round((income * savePct) / 100);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const data = await budgetApi.getBudgets();
      setBudgets(data);
    } catch (error) {
      console.error('Failed to load budgets:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to load budgets' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget);
      setCategory(budget.category);
      setAmount(budget.amount.toString());
      setPeriodType(budget.periodType);
    } else {
      setEditingBudget(null);
      setCategory("");
      setAmount("");
      setPeriodType('monthly');
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBudget(null);
    setCategory("");
    setAmount("");
    setPeriodType('monthly');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !amount) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      if (editingBudget) {
        await budgetApi.updateBudget(editingBudget.id, {
          category,
          amount: parseFloat(amount),
          periodType
        });
        setMessage({ type: 'success', text: 'Budget updated successfully!' });
      } else {
        await budgetApi.createBudget({
          category,
          amount: parseFloat(amount),
          periodType
        });
        setMessage({ type: 'success', text: 'Budget created successfully!' });
      }
      
      await loadBudgets();
      handleCloseModal();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save budget' 
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await budgetApi.deleteBudget(id);
      setMessage({ type: 'success', text: 'Budget deleted successfully!' });
      await loadBudgets();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to delete budget' 
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const getBudgetStatus = (budget: Budget) => {
    const percentage = (budget.spent / budget.amount) * 100;
    if (percentage >= 100) return { color: 'rose', icon: AlertTriangle, label: 'Over Budget' };
    if (percentage >= 80) return { color: 'amber', icon: AlertTriangle, label: 'Warning' };
    return { color: 'emerald', icon: CheckCircle, label: 'On Track' };
  };

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading budgets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}


      {/* Message Banner */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span className="flex-1 font-medium">{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-current hover:opacity-70">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab("budgets")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === "budgets"
              ? "bg-emerald-600 text-white"
              : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300"
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          Budgets
        </button>
        <button
          onClick={() => setActiveTab("calculator")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === "calculator"
              ? "bg-emerald-600 text-white"
              : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300"
          }`}
        >
          <Calculator className="w-4 h-4" />
          Savings Calculator
        </button>
      </div>

      {/* Budgets Tab */}
      {activeTab === "budgets" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Budgeted</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalBudgeted)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Spent</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalSpent)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  totalRemaining >= 0 ? 'bg-emerald-100' : 'bg-rose-100'
                }`}>
                  <CheckCircle className={`w-5 h-5 ${
                    totalRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Remaining</p>
                  <p className={`text-2xl font-bold ${
                    totalRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {formatCurrency(totalRemaining)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Add Budget Button */}
          <div className="flex justify-end">
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Budget
            </button>
          </div>

          {/* Budget List */}
          {budgets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <PiggyBank className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">No budgets set yet</p>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Your First Budget
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => {
                const status = getBudgetStatus(budget);
                const StatusIcon = status.icon;
                const percentage = Math.min((budget.spent / budget.amount) * 100, 100);

                return (
                  <div key={budget.id} className="rounded-2xl bg-white border border-slate-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{budget.category}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            {budget.periodType}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-slate-900">
                            {formatCurrency(budget.spent)}
                          </span>
                          <span className="text-slate-500">of {formatCurrency(budget.amount)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(budget)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(budget.id)}
                          disabled={saving}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${
                          percentage >= 100 
                            ? 'bg-rose-500' 
                            : percentage >= 80 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-slate-600">{percentage.toFixed(1)}% used</span>
                      <span className={budget.amount - budget.spent >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {formatCurrency(budget.amount - budget.spent)} remaining
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Calculator Tab */}
      {activeTab === "calculator" && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Savings Calculator</h3>
          <p className="text-sm text-slate-600 mb-6">
            Calculate how much you can save based on your income and savings goals
          </p>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Monthly Income ($)
                </label>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  placeholder="5000"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Savings Percentage (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={savePct}
                    onChange={(e) => setSavePct(Number(e.target.value))}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    value={savePct}
                    onChange={(e) => setSavePct(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                    className="w-20 rounded-xl border border-slate-300 px-3 py-2 text-center focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700 mb-1">Monthly Savings</p>
                  <p className="text-3xl font-bold text-emerald-900">{formatCurrency(savings)}</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center">
                  <PiggyBank className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-emerald-200">
                <div>
                  <p className="text-xs text-emerald-700">6 Months</p>
                  <p className="text-lg font-semibold text-emerald-900">{formatCurrency(savings * 6)}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-700">1 Year</p>
                  <p className="text-lg font-semibold text-emerald-900">{formatCurrency(savings * 12)}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-700">5 Years</p>
                  <p className="text-lg font-semibold text-emerald-900">{formatCurrency(savings * 60)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-sm text-slate-600 mb-1">Monthly Spending</p>
                <p className="text-xl font-semibold text-slate-900">{formatCurrency(income - savings)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-sm text-slate-600 mb-1">Savings Rate</p>
                <p className="text-xl font-semibold text-slate-900">{savePct}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingBudget ? 'Edit Budget' : 'Create Budget'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="1000.00"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Period *</label>
                <select
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value as 'monthly' | 'yearly')}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingBudget ? 'Update Budget' : 'Create Budget'
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