﻿import { useEffect, useState, useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Loader2, Settings, ChevronDown, X } from 'lucide-react';
import { dataApi } from '../services/dataApi';
import { budgetApi } from '../services/budgetApi';
import { profileApi } from '../services/profileApi';
import {
  LineChart, BarChart, PieChart, AreaChart, ScatterChart,
  Line, Bar, Pie, Area, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend, Label, LabelList, ReferenceLine, Brush
} from 'recharts';

const DEFAULT_COLORS = [
  '#16a34a', '#2563eb', '#dc2626', '#f59e0b',
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'
];

type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter';
type DataMode = 'total' | 'average' | 'cumulative' | 'percentageOfTotal';
type TimeRange = '7d' | '30d' | '3m' | '6m' | '1y' | 'all';
type AggregationMode = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

interface ChartConfig {
  type: ChartType;
  showGridlines: boolean;
  showTooltip: boolean;
  smoothLines: boolean;
  lineWidth: number;
  xAxisField: string;
  yAxisField: string;
  xAxisLabel: string;
  yAxisLabel: string;
  showLegend: boolean;
  showDataLabels: boolean;
  dataMode: DataMode;
  selectedCategories: string[];
  timeRange: TimeRange;
  aggregation: AggregationMode;
  showMovingAverage: boolean;
  movingAveragePeriod: number;
  showBudgetLine: boolean;
  selectedAccounts: string[];
  showIncomeExpense: 'all' | 'income' | 'expense';
  useLogScale: boolean;
  showBrush: boolean;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [savingsGoal, setSavingsGoal] = useState<number>(12000);

  const [spendingConfig, setSpendingConfig] = useState<ChartConfig>({
    type: 'area',
    showGridlines: true,
    showTooltip: true,
    smoothLines: true,
    lineWidth: 2,
    xAxisField: 'month',
    yAxisField: 'amount',
    xAxisLabel: 'Month',
    yAxisLabel: 'Amount Spent',
    showLegend: false,
    showDataLabels: false,
    dataMode: 'total',
    selectedCategories: [],
    timeRange: '6m',
    aggregation: 'monthly',
    showMovingAverage: false,
    movingAveragePeriod: 7,
    showBudgetLine: false,
    selectedAccounts: [],
    showIncomeExpense: 'expense',
    useLogScale: false,
    showBrush: false,
  });

  const [categoryConfig, setCategoryConfig] = useState<ChartConfig & {
    sortBy: 'amount' | 'name' | 'count';
    sortOrder: 'asc' | 'desc';
    showPercentages: boolean;
    maxCategories: number;
    groupOthers: boolean;
  }>({
    type: 'bar',
    showGridlines: true,
    showTooltip: true,
    smoothLines: false,
    lineWidth: 2,
    xAxisField: 'category',
    yAxisField: 'amount',
    xAxisLabel: 'Category',
    yAxisLabel: 'Amount',
    showLegend: false,
    showDataLabels: false,
    dataMode: 'total',
    selectedCategories: [],
    timeRange: 'all',
    aggregation: 'monthly',
    showMovingAverage: false,
    movingAveragePeriod: 7,
    showBudgetLine: false, 
    selectedAccounts: [],
    showIncomeExpense: 'expense',
    useLogScale: false,
    showBrush: false,
    sortBy: 'amount',
    sortOrder: 'desc',
    showPercentages: true,
    maxCategories: 10,
    groupOthers: true,
  });

  const [showSpendingConfig, setShowSpendingConfig] = useState(false);
  const [showCategoryConfig, setShowCategoryConfig] = useState(false);
  const [drillDownTransactions, setDrillDownTransactions] = useState<any[]>([]);
  const [showDrillDown, setShowDrillDown] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

// Close config panels when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside spending config
      const spendingPanel = document.querySelector('.spending-config-container');
      if (showSpendingConfig && spendingPanel && !spendingPanel.contains(target)) {
        setShowSpendingConfig(false);
      }
      
      // Check if click is outside category config
      const categoryPanel = document.querySelector('.category-config-container');
      if (showCategoryConfig && categoryPanel && !categoryPanel.contains(target)) {
        setShowCategoryConfig(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSpendingConfig, showCategoryConfig]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [accountsData, transactionsData, budgetsData, goalsData] = await Promise.all([
        dataApi.getAccounts(),
        dataApi.getTransactions(),
        budgetApi.getBudgets().catch(() => []),
        profileApi.getFinancialGoals().catch(() => ({ savingsGoal: 12000, monthlyIncome: 0 }))
      ]);

      setAccounts(accountsData);
      setTransactions(transactionsData);
      setBudgets(budgetsData);
      setSavingsGoal(goalsData.savingsGoal || 12000);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all unique categories
  // Get all unique categories based on active chart config
const allCategories = useMemo(() => {
  // Determine which config is currently open
  const activeConfig = showSpendingConfig ? spendingConfig : 
                       showCategoryConfig ? categoryConfig : 
                       spendingConfig; // default to spending config
  
  // Filter transactions based on income/expense setting
  let relevantTransactions = transactions;
  
  if (activeConfig.showIncomeExpense === 'income') {
    relevantTransactions = transactions.filter(t => t.type === 'in');
  } else if (activeConfig.showIncomeExpense === 'expense') {
    relevantTransactions = transactions.filter(t => t.type === 'out');
  }
  
  const cats = new Set(relevantTransactions.map(t => t.category || 'Other'));
  return Array.from(cats);
}, [transactions, spendingConfig.showIncomeExpense, categoryConfig.showIncomeExpense, showSpendingConfig, showCategoryConfig]);

  // Get all unique accounts
  const allAccounts = useMemo(() => {
    return accounts.map(a => a.name || a.id);
  }, [accounts]);

  // Helper: Get date range based on config
  const getDateRange = (config: ChartConfig) => {
    const now = new Date();
    let startDate = new Date();
    
    switch (config.timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '3m':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
      default:
        startDate = new Date(0);
    }
    
const endDate = now;

    
    return { startDate, endDate };
  };

  // Helper: Filter transactions based on config
  const filterTransactions = (txns: any[], config: ChartConfig) => {
    const { startDate, endDate } = getDateRange(config);
    
    return txns.filter(t => {
      const date = new Date(t.transactionDate || t.date);
      const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
      
      // Date range
      if (date < startDate || date > endDate) return false;
      
      // Income/Expense filter
      if (config.showIncomeExpense === 'income' && t.type !== 'in') return false;
      if (config.showIncomeExpense === 'expense' && t.type !== 'out') return false;
      
      // Category filter (single)
      
      // Multi-category filter
      if (config.selectedCategories.length > 0 && !config.selectedCategories.includes(t.category || 'Other')) return false;
      
      // Account filter
      if (config.selectedAccounts.length > 0) {
        const accountName = accounts.find(a => a.id === t.accountId)?.name || t.accountName;
        if (!config.selectedAccounts.includes(accountName)) return false;
      }
      
      return true;
    });
  };

  // Helper: Calculate moving average
  const calculateMovingAverage = (data: any[], period: number, key: string) => {
    return data.map((item, index) => {
      const start = Math.max(0, index - period + 1);
      const subset = data.slice(start, index + 1);
      const avg = subset.reduce((sum, d) => sum + (d[key] || 0), 0) / subset.length;
      return { ...item, movingAvg: avg };
    });
  };

  // Helper: Aggregate data by period
  const aggregateByPeriod = (txns: any[], aggregation: AggregationMode) => {
    const grouped: { [key: string]: { total: number; count: number; date: Date; byCategory: { [cat: string]: number } } } = {};
    
    txns.forEach(t => {
      const date = new Date(t.transactionDate || t.date);
      let key = '';
      
      switch (aggregation) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarterly':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'yearly':
          key = `${date.getFullYear()}`;
          break;
      }
      
      const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
      const category = t.category || 'Other';
      
      if (!grouped[key]) {
        grouped[key] = { total: 0, count: 0, date, byCategory: {} };
      }
      
      grouped[key].total += amount;
      grouped[key].count += 1;
      grouped[key].byCategory[category] = (grouped[key].byCategory[category] || 0) + amount;
    });
    
    return grouped;
  };

  // Calculate summary statistics from REAL data
  const summary = useMemo(() => {
    const totalBalance = accounts.reduce((sum, acc) => {
      const balance = typeof acc.balance === 'string' ? parseFloat(acc.balance) : acc.balance;
      return sum + (balance || 0);
    }, 0);

    // Last 30 days income and expenses
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = transactions.filter(t => {
      const txnDate = new Date(t.transactionDate || t.date);
      return txnDate >= thirtyDaysAgo;
    });

    const monthlyIncome = recentTransactions
      .filter(t => t.type === 'in')
      .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0);

    const monthlyExpenses = recentTransactions
      .filter(t => t.type === 'out')
      .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0);

    const goalProgress = savingsGoal > 0 ? Math.min(totalBalance / savingsGoal, 1) : 0;

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      savingsGoal,
      goalProgress
    };
  }, [accounts, transactions, savingsGoal]);

  // Calculate spending by month with all new features
  const monthlySpendingData = useMemo(() => {
    let filteredTxns = filterTransactions(transactions, spendingConfig);
    
    const grouped = aggregateByPeriod(filteredTxns, spendingConfig.aggregation);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let result = Object.entries(grouped)
      .map(([key, data]) => {
        const date = new Date(data.date);
        let label = '';
        
        switch (spendingConfig.aggregation) {
  case 'daily':
    // Include year for ranges that might span multiple years
    if (spendingConfig.timeRange === '1y' || spendingConfig.timeRange === 'all') {
      label = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } else {
      label = `${months[date.getMonth()]} ${date.getDate()}`;
    }
    break;
  case 'weekly':
    // Include year for ranges that might span multiple years
    if (spendingConfig.timeRange === '1y' || spendingConfig.timeRange === 'all') {
      label = `Week of ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } else {
      label = `Week of ${months[date.getMonth()]} ${date.getDate()}`;
    }
    break;
  case 'monthly':
    label = `${months[date.getMonth()]} ${date.getFullYear()}`;
    break;
  case 'quarterly':
    label = key;
    break;
  case 'yearly':
    label = key;
    break;
}
        
        // Calculate amount based on income/expense filter
        let amount = data.total;
        
        // For 'all' mode, we need to calculate net (income - expenses)
        if (spendingConfig.showIncomeExpense === 'all') {
          // Recalculate from original transactions for this period
          const periodTxns = filteredTxns.filter(t => {
            const txDate = new Date(t.transactionDate || t.date);
            // Check if transaction belongs to this period
            let periodKey = '';
            switch (spendingConfig.aggregation) {
              case 'daily':
                periodKey = txDate.toISOString().split('T')[0];
                break;
              case 'weekly':
                const weekStart = new Date(txDate);
                weekStart.setDate(txDate.getDate() - txDate.getDay());
                periodKey = weekStart.toISOString().split('T')[0];
                break;
              case 'monthly':
                periodKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
                break;
              case 'quarterly':
                const quarter = Math.floor(txDate.getMonth() / 3) + 1;
                periodKey = `${txDate.getFullYear()}-Q${quarter}`;
                break;
              case 'yearly':
                periodKey = `${txDate.getFullYear()}`;
                break;
            }
            return periodKey === key;
          });
          
          const income = periodTxns
            .filter(t => t.type === 'in')
            .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0);
          
          const expenses = periodTxns
            .filter(t => t.type === 'out')
            .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0);
          
          amount = income - expenses; // Net amount
        }
        
        if (spendingConfig.dataMode === 'average') {
          amount = data.count > 0 ? amount / data.count : 0;
        } else if (spendingConfig.dataMode === 'percentageOfTotal') {
          const total = Object.values(grouped).reduce((sum, g) => sum + g.total, 0);
          amount = total > 0 ? (Math.abs(amount) / total) * 100 : 0;
        }
        
        return {
          month: label,
          date: key,
          amount,
          totalSpent: data.total,
          transactionCount: data.count,
          ...data.byCategory
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Apply cumulative if needed
    if (spendingConfig.dataMode === 'cumulative') {
      let cumSum = 0;
      result = result.map(item => {
        cumSum += item.amount;
        return { ...item, amount: cumSum };
      });
    }
    
    // Add moving average
    if (spendingConfig.showMovingAverage) {
      result = calculateMovingAverage(result, spendingConfig.movingAveragePeriod, 'amount');
    }

    
    return result;
  }, [transactions, spendingConfig, accounts]);

  // Calculate spending by category with all new features
 // Calculate spending by category with all new features
  const categorySpendingData = useMemo(() => {
    let filteredTxns = filterTransactions(transactions, categoryConfig);
    
    const categoryData: { [key: string]: { total: number; count: number; transactions: any[] } } = {};

    filteredTxns.forEach(t => {
      const category = t.category || 'Other';
      const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
      
      if (!categoryData[category]) {
        categoryData[category] = { total: 0, count: 0, transactions: [] };
      }
      
      categoryData[category].total += amount;
      categoryData[category].count += 1;
      categoryData[category].transactions.push(t);
    });

    const total = Object.values(categoryData).reduce((sum, d) => sum + d.total, 0);

    let result = Object.entries(categoryData)
      .map(([category, data]) => {
        let amount = data.total;
        
        if (categoryConfig.dataMode === 'average') {
          amount = data.count > 0 ? data.total / data.count : 0;
        } else if (categoryConfig.dataMode === 'percentageOfTotal') {
          amount = total > 0 ? (data.total / total) * 100 : 0;
        }
        
        // Find budget for this category
        const categoryBudget = budgets.find(b => b.category === category);
        
        return {
          category,
          amount,
          total: data.total,
          transactionCount: data.count,
          percentage: total > 0 ? (data.total / total) * 100 : 0,
          transactions: data.transactions,
          budget: categoryBudget?.amount || 0
        };
      });
    
    // Apply sorting
    if (categoryConfig.sortBy === 'amount') {
      result.sort((a, b) => categoryConfig.sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount);
    } else if (categoryConfig.sortBy === 'name') {
      result.sort((a, b) => categoryConfig.sortOrder === 'desc' 
        ? b.category.localeCompare(a.category) 
        : a.category.localeCompare(b.category));
    } else if (categoryConfig.sortBy === 'count') {
      result.sort((a, b) => categoryConfig.sortOrder === 'desc' 
        ? b.transactionCount - a.transactionCount 
        : a.transactionCount - b.transactionCount);
    }
    
    // Apply max categories limit and group others
    if (categoryConfig.groupOthers && result.length > categoryConfig.maxCategories) {
      const topCategories = result.slice(0, categoryConfig.maxCategories);
      const otherCategories = result.slice(categoryConfig.maxCategories);
      
      const othersTotal = otherCategories.reduce((sum, cat) => sum + cat.total, 0);
      const othersCount = otherCategories.reduce((sum, cat) => sum + cat.transactionCount, 0);
      const othersTransactions = otherCategories.flatMap(cat => cat.transactions);
      
      if (othersTotal > 0) {
        let othersAmount = othersTotal;
        if (categoryConfig.dataMode === 'average') {
          othersAmount = othersCount > 0 ? othersTotal / othersCount : 0;
        } else if (categoryConfig.dataMode === 'percentageOfTotal') {
          othersAmount = total > 0 ? (othersTotal / total) * 100 : 0;
        }
        
        topCategories.push({
          category: 'Others',
          amount: othersAmount,
          total: othersTotal,
          transactionCount: othersCount,
          percentage: total > 0 ? (othersTotal / total) * 100 : 0,
          transactions: othersTransactions,
          budget: 0
        });
      }
      
      result = topCategories;
    } else {
      result = result.slice(0, categoryConfig.maxCategories);
    }
    
    // Multi-category filter for highlighting
    if (categoryConfig.selectedCategories.length > 0) {
      result = result.filter(item => categoryConfig.selectedCategories.includes(item.category));
    }
    
    return result;
  }, [transactions, categoryConfig, accounts, budgets]);

  const fmtMoney = (v: number) => {
    return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
  };

  const formatValue = (value: number, mode: 'currency' | 'percentage') => {
    if (mode === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    // currency
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

const formatTooltipValue = (value: number, mode: 'currency' | 'percentage') => {
    if (mode === 'percentage') {
      return `${value.toFixed(2)}%`;
    }
    // currency
    return value.toLocaleString(undefined, { style: "currency", currency: "USD" });
  };


  // Get dynamic axis labels based on config
  const getDynamicAxisLabels = (config: ChartConfig, isSpendingChart: boolean) => {
    let xLabel = '';
    let yLabel = '';
    
    if (isSpendingChart) {
      // X-axis label based on aggregation
      switch (config.aggregation) {
        case 'daily':
          xLabel = 'Date';
          break;
        case 'weekly':
          xLabel = 'Week';
          break;
        case 'monthly':
          xLabel = 'Month';
          break;
        case 'quarterly':
          xLabel = 'Quarter';
          break;
        case 'yearly':
          xLabel = 'Year';
          break;
      }
      
      // Y-axis label based on data mode and income/expense filter
      if (config.yAxisField === 'transactionCount') {
        yLabel = 'Number of Transactions';
      } else {
        // Based on income/expense setting
        if (config.showIncomeExpense === 'expense') {
          if (config.dataMode === 'total') yLabel = 'Total Spent';
          else if (config.dataMode === 'average') yLabel = 'Average Spent';
          else if (config.dataMode === 'cumulative') yLabel = 'Cumulative Spending';
          else if (config.dataMode === 'percentageOfTotal') yLabel = '% of Total Spending';
        } else if (config.showIncomeExpense === 'income') {
          if (config.dataMode === 'total') yLabel = 'Total Earned';
          else if (config.dataMode === 'average') yLabel = 'Average Earned';
          else if (config.dataMode === 'cumulative') yLabel = 'Cumulative Income';
          else if (config.dataMode === 'percentageOfTotal') yLabel = '% of Total Income';
        } else {
          // All (net)
          if (config.dataMode === 'total') yLabel = 'Net Amount (Income - Expenses)';
          else if (config.dataMode === 'average') yLabel = 'Average Net Amount';
          else if (config.dataMode === 'cumulative') yLabel = 'Cumulative Net';
          else if (config.dataMode === 'percentageOfTotal') yLabel = '% of Total';
        }
      }
    } else {
      // Category chart
      xLabel = 'Category';
      
      if (config.yAxisField === 'transactionCount') {
        yLabel = 'Number of Transactions';
      } else if (config.yAxisField === 'percentage') {
        yLabel = 'Percentage of Total';
      } else {
        if (config.showIncomeExpense === 'expense') {
          if (config.dataMode === 'total') yLabel = 'Total Spent';
          else if (config.dataMode === 'average') yLabel = 'Average Spent';
          else yLabel = 'Amount Spent';
        } else if (config.showIncomeExpense === 'income') {
          if (config.dataMode === 'total') yLabel = 'Total Earned';
          else if (config.dataMode === 'average') yLabel = 'Average Earned';
          else yLabel = 'Amount Earned';
        } else {
          yLabel = 'Net Amount';
        }
      }
    }
    
    return { xLabel, yLabel };
  };

  // Get format mode based on data mode
  const getFormatMode = (dataMode: DataMode): 'currency' | 'percentage' => {
    if (dataMode === 'percentageOfTotal') {
      return 'percentage';
    }
    return 'currency';
  };

  // Handle drill-down click
  const handleChartClick = (data: any, config: ChartConfig) => {
    if (!data || !data.activePayload) return;
    
    const payload = data.activePayload[0]?.payload;
    if (!payload) return;
    
    let relevantTxns: any[] = [];
    
    if (payload.category) {
      // Category chart clicked
      const categoryItem = categorySpendingData.find(c => c.category === payload.category);
      relevantTxns = categoryItem?.transactions || [];
    } else if (payload.month || payload.date) {
      // Time series chart clicked
      const filtered = filterTransactions(transactions, config);
      // Filter to specific time period
      relevantTxns = filtered.filter(t => {
        const date = new Date(t.transactionDate || t.date);
        // Match based on aggregation period
        return true; // Simplified - would need more logic
      });
    }
    
    setDrillDownTransactions(relevantTxns);
    setShowDrillDown(true);
  };

  // Enhanced Chart Configurator Component
  const ChartConfigurator = ({ 
    config, 
    onConfigChange, 
    isOpen, 
    setIsOpen,
    isSpendingChart,
    chartId
  }: {
    config: ChartConfig;
    onConfigChange: (config: ChartConfig) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    isSpendingChart: boolean;
    chartId: string;
  }) => {
    const updateConfig = (updates: Partial<ChartConfig>) => {
      onConfigChange({ ...config, ...updates });
    };


    const toggleCategory = (category: string) => {
      const current = config.selectedCategories;
      const updated = current.includes(category)
        ? current.filter(c => c !== category)
        : [...current, category];
      updateConfig({ selectedCategories: updated });
    };

    const toggleAccount = (account: string) => {
      const current = config.selectedAccounts;
      const updated = current.includes(account)
        ? current.filter(a => a !== account)
        : [...current, account];
      updateConfig({ selectedAccounts: updated });
    };

    if (!isOpen) return null;

    return (
      <div className="mt-4 pt-4 border-t border-slate-200 animate-in fade-in slide-in-from-bottom duration-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          
          {/* Row 1: Basic Settings */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Chart Type</label>
            <select
              value={config.type}
              onChange={(e) => updateConfig({ type: e.target.value as ChartType })}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="line">Line</option>
              <option value="bar">Bar</option>
              <option value="area">Area</option>
              <option value="pie">Pie</option>
              <option value="scatter">Scatter</option>
            </select>
          </div>

          {isSpendingChart && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Time Range</label>
                <select
                  value={config.timeRange}
                  onChange={(e) => updateConfig({ timeRange: e.target.value as TimeRange })}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {config.aggregation === 'daily' && (
                    <>
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="3m">Last 3 Months</option>
                      <option value="6m">Last 6 Months</option>
                      <option value="1y">Last Year</option>
                      <option value="all">All Time</option>
                    </>
                  )}
                  {config.aggregation === 'weekly' && (
                    <>
                      <option value="30d">Last 30 Days</option>
                      <option value="3m">Last 3 Months</option>
                      <option value="6m">Last 6 Months</option>
                      <option value="1y">Last Year</option>
                      <option value="all">All Time</option>
                    </>
                  )}
                  {config.aggregation === 'monthly' && (
                    <>
                      <option value="3m">Last 3 Months</option>
                      <option value="6m">Last 6 Months</option>
                      <option value="1y">Last Year</option>
                      <option value="all">All Time</option>
                    </>
                  )}
                  {config.aggregation === 'quarterly' && (
                    <>
                      <option value="1y">Last Year</option>
                      <option value="all">All Time</option>
                    </>
                  )}
                  {config.aggregation === 'yearly' && (
                    <>
                      <option value="all">All Time</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Aggregation</label>
                <select
                  value={config.aggregation}
                  onChange={(e) => updateConfig({ aggregation: e.target.value as AggregationMode })}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </>
          )}

          {!isSpendingChart && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Time Range</label>
              <select
                value={config.timeRange}
                onChange={(e) => updateConfig({ timeRange: e.target.value as TimeRange })}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="3m">Last 3 Months</option>
                <option value="6m">Last 6 Months</option>
                <option value="1y">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Data Display</label>
            <select
              value={config.dataMode}
              onChange={(e) => updateConfig({ dataMode: e.target.value as DataMode })}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="total">Total</option>
              <option value="average">Average</option>
              {isSpendingChart && <option value="cumulative">Cumulative</option>}
              <option value="percentageOfTotal">% of Total</option>
            </select>
          </div>

          {/* Row 2: Filters */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Income/Expense</label>
            <select
              value={config.showIncomeExpense}
              onChange={(e) => {
                const newValue = e.target.value as any;
                updateConfig({ 
                  showIncomeExpense: newValue,
                  showBudgetLine: newValue === 'expense' ? config.showBudgetLine : false
                });
              }}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All</option>
              <option value="income">Income Only</option>
              <option value="expense">Expenses Only</option>
            </select>
          </div>

          {/* Category Chart Specific Controls */}
          {!isSpendingChart && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Sort By</label>
                <select
                  value={(config as any).sortBy || 'amount'}
                  onChange={(e) => updateConfig({ sortBy: e.target.value as any })}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="amount">Amount</option>
                  <option value="name">Name</option>
                  <option value="count">Transaction Count</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Sort Order</label>
                <select
                  value={(config as any).sortOrder || 'desc'}
                  onChange={(e) => updateConfig({ sortOrder: e.target.value as any })}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>

<div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Max Categories</label>
                <select
                  value={(config as any).maxCategories || 10}
                  onChange={(e) => updateConfig({ maxCategories: parseInt(e.target.value) } as any)}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Array.from({ length: Math.min(allCategories.length, 20) }, (_, i) => i + 5).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                  {allCategories.length > 20 && <option value={allCategories.length}>All ({allCategories.length})</option>}
                </select>
              </div>
            </>
          )}

        </div>

        {/* Multi-Category Selection */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <label className="block text-xs font-medium text-slate-700 mb-2">Select Multiple Categories</label>
          <div className="flex flex-wrap gap-2">
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  config.selectedCategories.includes(cat)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Account Selection */}
        {allAccounts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <label className="block text-xs font-medium text-slate-700 mb-2">Filter by Accounts</label>
            <div className="flex flex-wrap gap-2">
              {allAccounts.map(acc => (
                <button
                  key={acc}
                  onClick={() => toggleAccount(acc)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    config.selectedAccounts.includes(acc)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {acc}
                </button>
              ))}
            </div>
          </div>
        )}

{/* Toggles Row */}
<div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-4">
  {/* Common toggles */}
  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
    <input
      type="checkbox"
      checked={config.showTooltip}
      onChange={(e) => updateConfig({ showTooltip: e.target.checked })}
      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
    />
    <span className="text-slate-700">Tooltip</span>
  </label>
  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
    <input
      type="checkbox"
      checked={config.showLegend}
      onChange={(e) => updateConfig({ showLegend: e.target.checked })}
      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
    />
    <span className="text-slate-700">Legend</span>
  </label>
  
  {/* Spending Chart Only Toggles */}
  {isSpendingChart && (
    <>
      {config.showIncomeExpense === 'expense' && (
        <label className="flex items-center gap-1.5 cursor-pointer text-xs">
          <input
            type="checkbox"
            checked={config.showBudgetLine}
            onChange={(e) => updateConfig({ showBudgetLine: e.target.checked })}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-slate-700">Budget Line</span>
        </label>
      )}
      <label className="flex items-center gap-1.5 cursor-pointer text-xs">
        <input
          type="checkbox"
          checked={config.showMovingAverage}
          onChange={(e) => updateConfig({ showMovingAverage: e.target.checked })}
          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        <span className="text-slate-700">7-Day Moving Avg</span>
      </label>
    </>
  )}
  
  {/* Category Chart Only Toggles */}
  {!isSpendingChart && (
    <>
      <label className="flex items-center gap-1.5 cursor-pointer text-xs">
        <input
          type="checkbox"
          checked={(config as any).showPercentages}
          onChange={(e) => updateConfig({ showPercentages: e.target.checked })}
          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        <span className="text-slate-700">Show %</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer text-xs">
        <input
          type="checkbox"
          checked={(config as any).groupOthers}
          onChange={(e) => updateConfig({ groupOthers: e.target.checked })}
          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        <span className="text-slate-700">Group Others</span>
      </label>
      {config.showIncomeExpense === 'expense' && (
        <label className="flex items-center gap-1.5 cursor-pointer text-xs">
          <input
            type="checkbox"
            checked={config.showBudgetLine}
            onChange={(e) => updateConfig({ showBudgetLine: e.target.checked })}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-slate-700">Budget Comparison</span>
        </label>
      )}
    </>
  )}
  
  {config.type !== 'pie' && (
    <>
      <label className="flex items-center gap-1.5 cursor-pointer text-xs">
        <input
          type="checkbox"
          checked={config.showGridlines}
          onChange={(e) => updateConfig({ showGridlines: e.target.checked })}
          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        <span className="text-slate-700">Gridlines</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer text-xs">
        <input
          type="checkbox"
          checked={config.showDataLabels}
          onChange={(e) => updateConfig({ showDataLabels: e.target.checked })}
          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        <span className="text-slate-700">Data Labels</span>
      </label>
      {isSpendingChart && (
        <>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={config.showBrush}
              onChange={(e) => updateConfig({ showBrush: e.target.checked })}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-slate-700">Zoom/Brush</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={config.useLogScale}
              onChange={(e) => updateConfig({ useLogScale: e.target.checked })}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-slate-700">Log Scale</span>
          </label>
        </>
      )}
    </>
  )}
</div>
      </div>
    );
  };

  // Render spending chart with all features
  const renderSpendingChart = () => {
    const data = monthlySpendingData;
    const dataKey = spendingConfig.yAxisField;
    const nameKey = spendingConfig.xAxisField;
    const { xLabel, yLabel } = getDynamicAxisLabels(spendingConfig, true); // ADD THIS LINE
    const formatMode = getFormatMode(spendingConfig.dataMode);

      // Determine chart color based on income/expense setting
  const getChartColor = () => {
    if (spendingConfig.showIncomeExpense === 'expense') {
      return '#dc2626'; // Red for expenses
    } else if (spendingConfig.showIncomeExpense === 'income') {
      return '#16a34a'; // Green for income
    } else {
      // For 'all', check if net is negative
      const totalNet = data.reduce((sum, d) => sum + d.amount, 0);
      return totalNet < 0 ? '#dc2626' : '#16a34a'; // Red if negative, green if positive
    }
  };

  const chartColor = getChartColor();

    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
      onClick: (e: any) => handleChartClick(e, spendingConfig)
    };

    const yAxisProps = {
      stroke: "#64748b",
      style: { fontSize: 12 },
      tickFormatter: (v: any) => formatValue(v, formatMode),
      scale: spendingConfig.useLogScale ? 'log' : 'auto' as any,
      domain: spendingConfig.useLogScale ? [1, 'auto'] : undefined
    };

    // Render multi-category lines if selected
    const renderMultiCategoryLines = () => {
      if (spendingConfig.selectedCategories.length === 0) return null;
      
      return spendingConfig.selectedCategories.map((cat, index) => (
        <Line
          key={cat}
          type={spendingConfig.smoothLines ? 'monotone' : 'linear'}
          dataKey={cat}
          stroke={DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
          strokeWidth={spendingConfig.lineWidth}
          dot={{ r: 3 }}
          name={cat}
          isAnimationActive={false}
        />
      ));
    };

    switch (spendingConfig.type) {
      case 'line':
        return (
          <div style={{ outline: 'none' }} tabIndex={-1}>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart {...commonProps}>
                {spendingConfig.showGridlines && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
                <XAxis dataKey={nameKey} stroke="#64748b" style={{ fontSize: 12 }}>
<Label value={xLabel} offset={-5} position="insideBottom" />                </XAxis>
                <YAxis {...yAxisProps}>
<Label value={yLabel} angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />               </YAxis>
{spendingConfig.showTooltip && <Tooltip formatter={(value: any) => formatTooltipValue(value, formatMode)} cursor={false} />}                {spendingConfig.showLegend && <Legend />}
                {spendingConfig.showBudgetLine && budgets.length > 0 && (() => {
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyBudget = totalBudgeted / daysInMonth;
  
  // Adjust based on aggregation
  let budgetAmount = dailyBudget;
  if (spendingConfig.aggregation === 'weekly') budgetAmount = dailyBudget * 7;
  else if (spendingConfig.aggregation === 'monthly') budgetAmount = totalBudgeted;
  else if (spendingConfig.aggregation === 'quarterly') budgetAmount = totalBudgeted * 3;
  else if (spendingConfig.aggregation === 'yearly') budgetAmount = totalBudgeted * 12;
  
  return <ReferenceLine y={budgetAmount} stroke="#ef4444" strokeDasharray="5 5" />;
})()}
                {spendingConfig.showBrush && <Brush dataKey={nameKey} height={30} stroke={chartColor} />}
                
                {/* Main line */}
                <Line
                  type={spendingConfig.smoothLines ? 'monotone' : 'linear'}
                  dataKey={dataKey}
                  stroke={chartColor}
                  strokeWidth={spendingConfig.lineWidth}
                  dot={{ r: 4 }}
                  name="Current"
                  isAnimationActive={false}
                >
                  {spendingConfig.showDataLabels && <LabelList dataKey={dataKey} position="top" formatter={(v: any) => formatValue(v, formatMode)} />}
                </Line>
                
                {/* Multi-category lines */}
                {renderMultiCategoryLines()}
                
                {/* Moving average */}
                {spendingConfig.showMovingAverage && (
                  <Line
                    type="monotone"
                    dataKey="movingAvg"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    name="Moving Avg"
                    strokeDasharray="5 5"
                    isAnimationActive={false}
                  />
                )}
                
                
                
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'bar':
        return (
          <div style={{ outline: 'none' }} tabIndex={-1}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart {...commonProps}>
                {spendingConfig.showGridlines && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
                <XAxis dataKey={nameKey} stroke="#64748b" style={{ fontSize: 12 }}>
<Label value={xLabel} offset={-5} position="insideBottom" />                </XAxis>
                <YAxis {...yAxisProps}>
<Label value={yLabel} angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />          </YAxis>
{spendingConfig.showTooltip && <Tooltip formatter={(value: any) => formatTooltipValue(value, formatMode)} cursor={false} />}                {spendingConfig.showLegend && <Legend />}
                {spendingConfig.showBudgetLine && budgets.length > 0 && (() => {
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyBudget = totalBudgeted / daysInMonth;
  
  // Adjust based on aggregation
  let budgetAmount = dailyBudget;
  if (spendingConfig.aggregation === 'weekly') budgetAmount = dailyBudget * 7;
  else if (spendingConfig.aggregation === 'monthly') budgetAmount = totalBudgeted;
  else if (spendingConfig.aggregation === 'quarterly') budgetAmount = totalBudgeted * 3;
  else if (spendingConfig.aggregation === 'yearly') budgetAmount = totalBudgeted * 12;
  
  return <ReferenceLine y={budgetAmount} stroke="#ef4444" strokeDasharray="5 5" />;
})()}
                {spendingConfig.showBrush && <Brush dataKey={nameKey} height={30} stroke={chartColor} />}
                
                <Bar dataKey={dataKey} fill={chartColor} radius={[8, 8, 0, 0]} isAnimationActive={false}>
                  {spendingConfig.showDataLabels && <LabelList dataKey={dataKey} position="top" formatter={(v: any) => formatValue(v, formatMode)} />}
                </Bar>
                
         
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'area':
        return (
          <div style={{ outline: 'none' }} tabIndex={-1}>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart {...commonProps}>
                {spendingConfig.showGridlines && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
                <XAxis dataKey={nameKey} stroke="#64748b" style={{ fontSize: 12 }}>
<Label value={xLabel} offset={-5} position="insideBottom" />                </XAxis>
                <YAxis {...yAxisProps}>
<Label value={yLabel} angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />  </YAxis>
{spendingConfig.showTooltip && <Tooltip formatter={(value: any) => formatTooltipValue(value, formatMode)} cursor={false} />}                {spendingConfig.showLegend && <Legend />}
                {spendingConfig.showBudgetLine && budgets.length > 0 && (() => {
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyBudget = totalBudgeted / daysInMonth;
  
  // Adjust based on aggregation
  let budgetAmount = dailyBudget;
  if (spendingConfig.aggregation === 'weekly') budgetAmount = dailyBudget * 7;
  else if (spendingConfig.aggregation === 'monthly') budgetAmount = totalBudgeted;
  else if (spendingConfig.aggregation === 'quarterly') budgetAmount = totalBudgeted * 3;
  else if (spendingConfig.aggregation === 'yearly') budgetAmount = totalBudgeted * 12;
  
  return <ReferenceLine y={budgetAmount} stroke="#ef4444" strokeDasharray="5 5" />;
})()}
                {spendingConfig.showBrush && <Brush dataKey={nameKey} height={30} stroke={chartColor} />}
                
                <Area
                  type={spendingConfig.smoothLines ? 'monotone' : 'linear'}
                  dataKey={dataKey}
                  fill={chartColor}
                  stroke={chartColor}
                  strokeWidth={spendingConfig.lineWidth}
                  fillOpacity={0.3}
                  isAnimationActive={false}
                >
                  {spendingConfig.showDataLabels && <LabelList dataKey={dataKey} position="top" formatter={(v: any) => formatValue(v, formatMode)} />}
                </Area>
                
                {spendingConfig.showMovingAverage && (
                  <Area
                    type="monotone"
                    dataKey="movingAvg"
                    fill="#f59e0b"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={0.1}
                    strokeDasharray="5 5"
                    isAnimationActive={false}
                  />
                )}
                
               
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case 'pie':
        return (
          <div style={{ outline: 'none' }} tabIndex={-1}>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
{spendingConfig.showTooltip && <Tooltip formatter={(value: any) => formatTooltipValue(value, formatMode)} cursor={false} />}                
  {spendingConfig.showLegend && <Legend />}
                <Pie
                  data={data}
                  dataKey={dataKey}
                  nameKey="month"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry:any) => entry.month}
                  isAnimationActive={false}
                  onClick={(data) => handleChartClick({ activePayload: [{ payload: data }] }, spendingConfig)}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      case 'scatter':
        return (
          <div style={{ outline: 'none' }} tabIndex={-1}>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart {...commonProps}>
                {spendingConfig.showGridlines && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
                <XAxis dataKey={nameKey} stroke="#64748b" style={{ fontSize: 12 }}>
<Label value={xLabel} offset={-5} position="insideBottom" />                </XAxis>
                <YAxis dataKey={dataKey} {...yAxisProps}>
<Label value={yLabel} angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />       </YAxis>
{spendingConfig.showBudgetLine && budgets.length > 0 && (() => {
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyBudget = totalBudgeted / daysInMonth;
  
  // Adjust based on aggregation
  let budgetAmount = dailyBudget;
  if (spendingConfig.aggregation === 'weekly') budgetAmount = dailyBudget * 7;
  else if (spendingConfig.aggregation === 'monthly') budgetAmount = totalBudgeted;
  else if (spendingConfig.aggregation === 'quarterly') budgetAmount = totalBudgeted * 3;
  else if (spendingConfig.aggregation === 'yearly') budgetAmount = totalBudgeted * 12;
  
  return <ReferenceLine y={budgetAmount} stroke="#ef4444" strokeDasharray="5 5" />;
})()}
                <Scatter name="Spending" data={data} fill={chartColor} isAnimationActive={false} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return null;
    }
  };

  // Render category chart with all features
const renderCategoryChart = () => {
    const data = categorySpendingData;
    const dataKey = categoryConfig.yAxisField;
    const nameKey = categoryConfig.xAxisField;
    const { xLabel, yLabel } = getDynamicAxisLabels(categoryConfig, false); 
    const formatMode = getFormatMode(categoryConfig.dataMode);

    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
      onClick: (e: any) => handleChartClick(e, categoryConfig)
    };

    const yAxisProps = {
      stroke: "#64748b",
      style: { fontSize: 12 },
      tickFormatter: (v: any) => formatValue(v, formatMode),
      scale: categoryConfig.useLogScale ? 'log' : 'auto' as any,
      domain: categoryConfig.useLogScale ? [1, 'auto'] : undefined
    };

    switch (categoryConfig.type) {
      case 'line':
        return (
          <div style={{ outline: 'none' }} tabIndex={-1}>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart {...commonProps}>
                {categoryConfig.showGridlines && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
                <XAxis dataKey={nameKey} stroke="#64748b" style={{ fontSize: 12 }}>
                  {categoryConfig.xAxisLabel && <Label value={categoryConfig.xAxisLabel} offset={-5} position="insideBottom" />}
                </XAxis>
                <YAxis {...yAxisProps}>
                  {categoryConfig.yAxisLabel && <Label value={categoryConfig.yAxisLabel} angle={-90} position="insideLeft" />}
                </YAxis>
{categoryConfig.showTooltip && <Tooltip formatter={(value: any) => formatTooltipValue(value, formatMode)} cursor={false} />}                {categoryConfig.showLegend && <Legend />}
                <Line
                  type={categoryConfig.smoothLines ? 'monotone' : 'linear'}
                  dataKey={dataKey}
                  stroke="#16a34a"
                  strokeWidth={categoryConfig.lineWidth}
                  dot={{ r: 4 }}
                  isAnimationActive={false}
                >
                  {categoryConfig.showDataLabels && <LabelList dataKey={dataKey} position="top" formatter={(v: any) => formatValue(v, formatMode)} />}
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'bar':
        return (
          <div style={{ outline: 'none' }} tabIndex={-1}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart {...commonProps} layout="vertical">
                {categoryConfig.showGridlines && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
                <XAxis type="number" {...yAxisProps} />
                <YAxis type="category" dataKey={nameKey} stroke="#64748b" style={{ fontSize: 12 }} width={100} />
                {categoryConfig.showTooltip && <Tooltip formatter={(value: any) => formatTooltipValue(value, formatMode)} cursor={false} />}
                {categoryConfig.showLegend && <Legend />}
                
                {/* Main bars */}
                <Bar dataKey={dataKey} radius={[0, 8, 8, 0]} isAnimationActive={false}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                  ))}
                  {categoryConfig.showDataLabels && (
                    <LabelList 
                      dataKey={dataKey} 
                      position="right" 
                      formatter={(v: any) => formatValue(v, formatMode)} 
                    />
                  )}
                  {(categoryConfig as any).showPercentages && (
                    <LabelList 
                      dataKey="percentage" 
                      position="right" 
                      formatter={(v: any) => `${v.toFixed(1)}%`}
                      offset={categoryConfig.showDataLabels ? 60 : 10}
                      style={{ fill: '#64748b', fontSize: 11 }}
                    />
                  )}
                </Bar>
                
                {/* Budget comparison bars */}
                {categoryConfig.showBudgetLine && (
                  <Bar dataKey="budget" fill="#ef4444" fillOpacity={0.3} radius={[0, 8, 8, 0]} isAnimationActive={false} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'area':
        return (
          <div style={{ outline: 'none' }} tabIndex={-1}>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart {...commonProps}>
                {categoryConfig.showGridlines && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
                <XAxis dataKey={nameKey} stroke="#64748b" style={{ fontSize: 12 }}>
                  {categoryConfig.xAxisLabel && <Label value={categoryConfig.xAxisLabel} offset={-5} position="insideBottom" />}
                </XAxis>
                <YAxis {...yAxisProps}>
                  {categoryConfig.yAxisLabel && <Label value={categoryConfig.yAxisLabel} angle={-90} position="insideLeft" />}
                </YAxis>
{categoryConfig.showTooltip && <Tooltip formatter={(value: any) => formatTooltipValue(value, formatMode)} cursor={false} />}                {categoryConfig.showLegend && <Legend />}
                <Area
                  type={categoryConfig.smoothLines ? 'monotone' : 'linear'}
                  dataKey={dataKey}
                  fill="#16a34a"
                  stroke="#16a34a"
                  strokeWidth={categoryConfig.lineWidth}
                  fillOpacity={0.3}
                  isAnimationActive={false}
                >
                  {categoryConfig.showDataLabels && <LabelList dataKey={dataKey} position="top" formatter={(v: any) => formatValue(v, formatMode)} />}
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case 'pie':
        return (
          <div style={{ outline: 'none' }} tabIndex={-1}>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
{categoryConfig.showTooltip && <Tooltip formatter={(value: any) => formatTooltipValue(value, formatMode)} cursor={false} />}                {categoryConfig.showLegend && <Legend />}
                <Pie
                  data={data}
                  dataKey={dataKey}
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => (categoryConfig as any).showPercentages ? `${entry.category} (${entry.percentage.toFixed(1)}%)` : entry.category}                  isAnimationActive={false}
                  onClick={(data) => handleChartClick({ activePayload: [{ payload: data }] }, categoryConfig)}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      case 'scatter':
        return (
          <div style={{ outline: 'none' }} tabIndex={-1}>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart {...commonProps}>
                {categoryConfig.showGridlines && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
                <XAxis dataKey={nameKey} stroke="#64748b" style={{ fontSize: 12 }}>
                  {categoryConfig.xAxisLabel && <Label value={categoryConfig.xAxisLabel} offset={-5} position="insideBottom" />}
                </XAxis>
                <YAxis dataKey={dataKey} {...yAxisProps}>
                  {categoryConfig.yAxisLabel && <Label value={categoryConfig.yAxisLabel} angle={-90} position="insideLeft" />}
                </YAxis>
{categoryConfig.showTooltip && <Tooltip formatter={(value: any) => formatTooltipValue(value, formatMode)} cursor={false} />}                {categoryConfig.showLegend && <Legend />}
                <Scatter name="Category" data={data} fill="#16a34a" isAnimationActive={false} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Drill-down Modal */}
      {showDrillDown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Transaction Details ({drillDownTransactions.length} transactions)
              </h3>
              <button
                onClick={() => setShowDrillDown(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <div className="space-y-2">
                {drillDownTransactions.map((txn, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="font-medium text-slate-900">{txn.description || txn.merchant || 'Transaction'}</div>
                      <div className="text-sm text-slate-600">
                        {new Date(txn.transactionDate || txn.date).toLocaleDateString()} • {txn.category || 'Other'}
                      </div>
                    </div>
                    <div className={`font-semibold ${txn.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {txn.type === 'in' ? '+' : '-'}{fmtMoney(typeof txn.amount === 'string' ? parseFloat(txn.amount) : txn.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-700 font-medium">Total Balance</h3>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-semibold">{fmtMoney(summary.totalBalance)}</div>
          <div className="text-emerald-600 text-sm mt-1">Across all accounts</div>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-700 font-medium">Monthly Income</h3>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-semibold">{fmtMoney(summary.monthlyIncome)}</div>
          <div className="text-emerald-600 text-sm mt-1">Last 30 days</div>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-700 font-medium">Monthly Expenses</h3>
            <TrendingDown className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-semibold">{fmtMoney(summary.monthlyExpenses)}</div>
          <div className="text-rose-600 text-sm mt-1">Last 30 days</div>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-700 font-medium">Savings Goal</h3>
            <PiggyBank className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-semibold">{fmtMoney(summary.savingsGoal)}</div>
            <div className="text-sm text-slate-500">
              {Math.round(summary.goalProgress * 100)}%
            </div>
          </div>
          <div className="h-2 mt-3 w-full rounded-full bg-slate-200 overflow-hidden">
            <div 
              className="h-full transition-all duration-500"
              style={{
                width: `${summary.goalProgress * 100}%`,
                background: "linear-gradient(90deg, #00C289 0%, #009E67 100%)",
              }} 
            />
          </div>
        </div>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Spending Over Time */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 spending-config-container">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
  <h3 className="text-lg font-semibold text-slate-900 mb-1">
    {(() => {
      // Base title based on income/expense filter
      let base = 'Spending';
      if (spendingConfig.showIncomeExpense === 'income') base = 'Income';
      else if (spendingConfig.showIncomeExpense === 'all') base = 'Net Cash Flow';
      
      // Add data mode modifier
      if (spendingConfig.dataMode === 'average') base = `Average ${base}`;
      else if (spendingConfig.dataMode === 'cumulative') base = `Cumulative ${base}`;
      else if (spendingConfig.dataMode === 'percentageOfTotal') base = `${base} Distribution`;
      
      // Add time context
      return `${base} Over Time`;
    })()}
  </h3>
  <p className="text-sm text-slate-600">
    {spendingConfig.timeRange === '7d' && 'Last 7 days'}
    {spendingConfig.timeRange === '30d' && 'Last 30 days'}
    {spendingConfig.timeRange === '3m' && 'Last 3 months'}
    {spendingConfig.timeRange === '6m' && 'Last 6 months'}
    {spendingConfig.timeRange === '1y' && 'Last year'}
    {spendingConfig.timeRange === 'all' && 'All time'}
    {' • '}
    {spendingConfig.aggregation === 'daily' && 'Daily'}
    {spendingConfig.aggregation === 'weekly' && 'Weekly'}
    {spendingConfig.aggregation === 'monthly' && 'Monthly'}
    {spendingConfig.aggregation === 'quarterly' && 'Quarterly'}
    {spendingConfig.aggregation === 'yearly' && 'Yearly'}
    {spendingConfig.selectedCategories.length > 0 && (
      <span className="ml-1 text-emerald-600 font-medium">
        • {spendingConfig.selectedCategories.join(', ')}
      </span>
    )}
    {spendingConfig.selectedAccounts.length > 0 && (
      <span className="ml-1 text-blue-600 font-medium">
        • {spendingConfig.selectedAccounts.join(', ')}
      </span>
    )}
  </p>
</div>
            <button
              onClick={() => {
                setShowSpendingConfig(!showSpendingConfig);
                if (!showSpendingConfig) {
                  setTimeout(() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  }, 50);
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Customize
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showSpendingConfig ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          <div id="spending-chart">
            {monthlySpendingData.length > 0 ? (
              renderSpendingChart()
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-500">
                <p>No transaction data available</p>
              </div>
            )}
          </div>

          <ChartConfigurator
            config={spendingConfig}
            onConfigChange={setSpendingConfig}
            isOpen={showSpendingConfig}
            setIsOpen={setShowSpendingConfig}
            isSpendingChart={true}
            chartId="spending-chart"
          />
        </div>

        {/* Spending by Category */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 category-config-container">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
  <h3 className="text-lg font-semibold text-slate-900 mb-1">
    {(() => {
      // Base title based on income/expense filter
      let base = 'Spending';
      if (categoryConfig.showIncomeExpense === 'income') base = 'Income';
      else if (categoryConfig.showIncomeExpense === 'all') base = 'Net';
      
      // Add data mode modifier
      if (categoryConfig.dataMode === 'average') base = `Average ${base}`;
      else if (categoryConfig.dataMode === 'percentageOfTotal') base = `${base} Distribution`;
      
      return `${base} by Category`;
    })()}
  </h3>
  <p className="text-sm text-slate-600">
    {categoryConfig.timeRange === '7d' && 'Last 7 days'}
    {categoryConfig.timeRange === '30d' && 'Last 30 days'}
    {categoryConfig.timeRange === '3m' && 'Last 3 months'}
    {categoryConfig.timeRange === '6m' && 'Last 6 months'}
    {categoryConfig.timeRange === '1y' && 'Last year'}
    {categoryConfig.timeRange === 'all' && 'All time'}
    {categoryConfig.selectedCategories.length > 0 && (
      <span className="ml-1 text-emerald-600 font-medium">
        • {categoryConfig.selectedCategories.join(', ')}
      </span>
    )}
    {categoryConfig.selectedAccounts.length > 0 && (
      <span className="ml-1 text-blue-600 font-medium">
        • {categoryConfig.selectedAccounts.join(', ')}
      </span>
    )}
  </p>
</div>
            <button
              onClick={() => {
                setShowCategoryConfig(!showCategoryConfig);
                if (!showCategoryConfig) {
                  setTimeout(() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  }, 50);
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Customize
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showCategoryConfig ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          <div id="category-chart">
            {categorySpendingData.length > 0 ? (
              renderCategoryChart()
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-500">
                <p>No category data available</p>
              </div>
            )}
          </div>

          <ChartConfigurator
            config={categoryConfig}
            onConfigChange={setCategoryConfig}
            isOpen={showCategoryConfig}
            setIsOpen={setShowCategoryConfig}
            isSpendingChart={false}
            chartId="category-chart"
          />
        </div>
      </div>

      {/* Quick Stats */}
      {transactions.length === 0 && accounts.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
          <p className="text-blue-900 font-medium mb-2">Welcome to Your Dashboard!</p>
          <p className="text-blue-800 mb-4">Get started by adding your first account or transaction</p>
          
            href="/add-data"
            className="inline-block px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
          <a>
            Add Your First Account
          </a>
        </div>
      )}
    </div>
  );
}