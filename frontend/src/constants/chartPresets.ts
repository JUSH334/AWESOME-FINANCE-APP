import { TrendingUp, PieChart, BarChart3 } from 'lucide-react';
import type { PresetDefinition, ChartPreset } from '../types/chart';

export const DEFAULT_COLORS = [
  '#16a34a', '#2563eb', '#dc2626', '#f59e0b',
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'
];

export const CHART_PRESETS: Record<ChartPreset, PresetDefinition> = {
  'spending-trend': {
    id: 'spending-trend',
    name: 'Spending Trend',
    description: 'Track spending over time',
    icon: <TrendingUp className="w-5 h-5" />,
    type: 'area',
    xAxis: 'month',
    yAxis: 'amount',
    aggregation: 'sum',
    hideOptions: ['sortOrder'],
  },
  'category-breakdown': {
    id: 'category-breakdown',
    name: 'Category Breakdown',
    description: 'Pie chart of spending by category',
    icon: <PieChart className="w-5 h-5" />,
    type: 'pie',
    xAxis: 'category',
    yAxis: 'amount',
    aggregation: 'sum',
    hideOptions: ['smoothLines', 'lineWidth', 'sortOrder'],
  },
  'budget-vs-actual': {
    id: 'budget-vs-actual',
    name: 'Budget vs Actual',
    description: 'Compare budgeted vs actual spending',
    icon: <BarChart3 className="w-5 h-5" />,
    type: 'bar',
    xAxis: 'category',
    yAxis: ['budgeted', 'spent'],
    aggregation: 'sum',
    hideOptions: ['smoothLines', 'lineWidth'],
  },
  'monthly-comparison': {
    id: 'monthly-comparison',
    name: 'Monthly Comparison',
    description: 'Income vs Expenses by month',
    icon: <BarChart3 className="w-5 h-5" />,
    type: 'bar',
    xAxis: 'month',
    yAxis: ['income', 'expenses'],
    aggregation: 'sum',
    hideOptions: ['smoothLines', 'lineWidth'],
  },
  'savings-progress': {
    id: 'savings-progress',
    name: 'Savings Progress',
    description: 'Track progress toward savings goal',
    icon: <TrendingUp className="w-5 h-5" />,
    type: 'line',
    xAxis: 'month',
    yAxis: 'balance',
    aggregation: 'sum',
    hideOptions: ['sortOrder'],
  },
};