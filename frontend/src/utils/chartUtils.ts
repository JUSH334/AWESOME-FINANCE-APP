import type { DataPoint, SortOrder } from '../types/chart';

export const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
};

export const sortData = (data: DataPoint[], yField: string, order: SortOrder): DataPoint[] => {
  return [...data].sort((a, b) => {
    const valA = Number(a[yField]) || 0;
    const valB = Number(b[yField]) || 0;
    return order === 'asc' ? valA - valB : valB - valA;
  });
};

export const transformTransactionData = (transactions: any[]): DataPoint[] => {
  const monthlyData: { [key: string]: { amount: number; date: string } } = {};

  transactions.forEach(txn => {
    const date = new Date(txn.transactionDate || txn.date);
    const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { amount: 0, date: monthKey };
    }
    
    const amount = typeof txn.amount === 'string' ? parseFloat(txn.amount) : txn.amount;
    if (txn.type === 'out') {
      monthlyData[monthKey].amount += amount;
    }
  });

  return Object.values(monthlyData).slice(-6);
};

export const transformCategoryData = (transactions: any[]): DataPoint[] => {
  const categoryData: { [key: string]: number } = {};

  transactions
    .filter(txn => txn.type === 'out')
    .forEach(txn => {
      const category = txn.category || 'Other';
      const amount = typeof txn.amount === 'string' ? parseFloat(txn.amount) : txn.amount;
      categoryData[category] = (categoryData[category] || 0) + amount;
    });

  return Object.entries(categoryData).map(([category, amount]) => ({
    category,
    amount,
  }));
};

export const transformBudgetData = (budgets: any[]): DataPoint[] => {
  return budgets.map(b => ({
    category: b.category,
    budgeted: typeof b.amount === 'string' ? parseFloat(b.amount) : b.amount,
    spent: typeof b.spent === 'string' ? parseFloat(b.spent) : b.spent,
  }));
};

export const transformMonthlyComparison = (transactions: any[]): DataPoint[] => {
  const monthlyData: { [key: string]: { income: number; expenses: number } } = {};

  transactions.forEach(txn => {
    const date = new Date(txn.transactionDate || txn.date);
    const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }
    
    const amount = typeof txn.amount === 'string' ? parseFloat(txn.amount) : txn.amount;
    if (txn.type === 'in') {
      monthlyData[monthKey].income += amount;
    } else {
      monthlyData[monthKey].expenses += amount;
    }
  });

  return Object.entries(monthlyData)
    .slice(-6)
    .map(([month, data]) => ({ month, ...data }));
};

export const transformSavingsProgress = (transactions: any[]): DataPoint[] => {
  const monthlyData: { [key: string]: number } = {};
  let runningBalance = 0;

  transactions
    .sort((a, b) => new Date(a.transactionDate || a.date).getTime() - new Date(b.transactionDate || b.date).getTime())
    .forEach(txn => {
      const date = new Date(txn.transactionDate || txn.date);
      const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      const amount = typeof txn.amount === 'string' ? parseFloat(txn.amount) : txn.amount;
      runningBalance += txn.type === 'in' ? amount : -amount;
      monthlyData[monthKey] = runningBalance;
    });

  return Object.entries(monthlyData)
    .slice(-6)
    .map(([month, balance]) => ({ month, balance }));
};