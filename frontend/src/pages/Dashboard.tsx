﻿import React, { useState, useMemo, useCallback } from 'react';
import {
  LineChart, BarChart, PieChart, AreaChart, ScatterChart,
  Line, Bar, Pie, Area, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ChevronDown, Settings } from 'lucide-react';

// ==================== TYPES & INTERFACES ====================

type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter';
type AggregationType = 'sum' | 'avg' | 'count';
type SortOrder = 'asc' | 'desc';

interface DataPoint {
  [key: string]: string | number;
}

interface ChartConfig {
  type: ChartType;
  xAxis: string;
  yAxis: string;
  sortOrder: SortOrder;
  aggregation: AggregationType;
  colors: string[];
  showGridlines: boolean;
  showLegend: boolean;
  showTooltip: boolean;
  smoothLines: boolean;
  lineWidth: number;
  includePercentages: boolean;
}

interface ChartContainerProps {
  title: string;
  data: DataPoint[];
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
  fields: string[];
}

// ==================== UTILITY FUNCTIONS ====================

const DEFAULT_COLORS = [
  '#16a34a', '#2563eb', '#dc2626', '#f59e0b',
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'
];

const aggregateData = (
  data: DataPoint[],
  xField: string,
  yField: string,
  aggregationType: AggregationType
): DataPoint[] => {
  const grouped: { [key: string]: number[] } = {};

  data.forEach(point => {
    const key = String(point[xField]);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(Number(point[yField]) || 0);
  });

  return Object.entries(grouped).map(([key, values]) => {
    let aggregated: number;
    switch (aggregationType) {
      case 'avg':
        aggregated = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'count':
        aggregated = values.length;
        break;
      case 'sum':
      default:
        aggregated = values.reduce((a, b) => a + b, 0);
    }
    return { [xField]: key, [yField]: aggregated };
  });
};

const sortData = (data: DataPoint[], yField: string, order: SortOrder): DataPoint[] => {
  return [...data].sort((a, b) => {
    const valA = Number(a[yField]) || 0;
    const valB = Number(b[yField]) || 0;
    return order === 'asc' ? valA - valB : valB - valA;
  });
};

const formatNumber = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
};

// ==================== CHART CONFIGURATOR COMPONENT ====================

interface ChartConfiguratorProps {
  config: ChartConfig;
  fields: string[];
  onConfigChange: (config: ChartConfig) => void;
}

const ChartConfigurator: React.FC<ChartConfiguratorProps> = ({
  config,
  fields,
  onConfigChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateConfig = (updates: Partial<ChartConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <Settings className="w-4 h-4" />
        Configure
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-10 space-y-4">
          {/* Chart Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Chart Type</label>
            <select
              value={config.type}
              onChange={(e) => updateConfig({ type: e.target.value as ChartType })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
              <option value="area">Area Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="scatter">Scatter Plot</option>
            </select>
          </div>

          {/* X-Axis */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">X-Axis</label>
            <select
              value={config.xAxis}
              onChange={(e) => updateConfig({ xAxis: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {fields.map(field => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </div>

          {/* Y-Axis */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Y-Axis</label>
            <select
              value={config.yAxis}
              onChange={(e) => updateConfig({ yAxis: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {fields.map(field => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </div>

          {/* Aggregation */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Aggregation</label>
            <select
              value={config.aggregation}
              onChange={(e) => updateConfig({ aggregation: e.target.value as AggregationType })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="sum">Sum</option>
              <option value="avg">Average</option>
              <option value="count">Count</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Sort Order</label>
            <select
              value={config.sortOrder}
              onChange={(e) => updateConfig({ sortOrder: e.target.value as SortOrder })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          {/* Line Width (for line/area charts) */}
          {['line', 'area'].includes(config.type) && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Line Width: {config.lineWidth}px
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={config.lineWidth}
                onChange={(e) => updateConfig({ lineWidth: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          )}

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            {config.type !== 'pie' && (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showGridlines}
                    onChange={(e) => updateConfig({ showGridlines: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700">Show Gridlines</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.smoothLines}
                    onChange={(e) => updateConfig({ smoothLines: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700">Smooth Lines</span>
                </label>
              </>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showLegend}
                onChange={(e) => updateConfig({ showLegend: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-slate-700">Show Legend</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showTooltip}
                onChange={(e) => updateConfig({ showTooltip: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-slate-700">Show Tooltip</span>
            </label>
            {config.type === 'pie' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includePercentages}
                  onChange={(e) => updateConfig({ includePercentages: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-slate-700">Show Percentages</span>
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== CHART RENDERER COMPONENTS ====================

interface ChartRendererProps {
  data: DataPoint[];
  config: ChartConfig;
}

const LineChartRenderer: React.FC<ChartRendererProps> = ({ data, config }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      {config.showGridlines && <CartesianGrid strokeDasharray="3 3" />}
      <XAxis dataKey={config.xAxis} />
      <YAxis />
      {config.showTooltip && <Tooltip formatter={(value) => formatNumber(value as number)} />}
      {config.showLegend}
      <Line
        type={config.smoothLines ? 'monotone' : 'linear'}
        dataKey={config.yAxis}
        stroke={config.colors[0]}
        strokeWidth={config.lineWidth}
        dot={{ r: 4 }}
      />
    </LineChart>
  </ResponsiveContainer>
);

const BarChartRenderer: React.FC<ChartRendererProps> = ({ data, config }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      {config.showGridlines && <CartesianGrid strokeDasharray="3 3" />}
      <XAxis dataKey={config.xAxis} />
      <YAxis />
      {config.showTooltip && <Tooltip formatter={(value) => formatNumber(value as number)} />}
      {config.showLegend}
      <Bar dataKey={config.yAxis} fill={config.colors[0]} />
    </BarChart>
  </ResponsiveContainer>
);

const AreaChartRenderer: React.FC<ChartRendererProps> = ({ data, config }) => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={data}>
      {config.showGridlines && <CartesianGrid strokeDasharray="3 3" />}
      <XAxis dataKey={config.xAxis} />
      <YAxis />
      {config.showTooltip && <Tooltip formatter={(value) => formatNumber(value as number)} />}
      {config.showLegend}
      <Area
        type={config.smoothLines ? 'monotone' : 'linear'}
        dataKey={config.yAxis}
        fill={config.colors[0]}
        stroke={config.colors[0]}
        strokeWidth={config.lineWidth}
      />
    </AreaChart>
  </ResponsiveContainer>
);

const PieChartRenderer: React.FC<ChartRendererProps> = ({ data, config }) => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      {config.showTooltip && <Tooltip formatter={(value) => formatNumber(value as number)} />}
      {config.showLegend}
      <Pie
        data={data}
        dataKey={config.yAxis}
        nameKey={config.xAxis}
        cx="50%"
        cy="50%"
        outerRadius={80}
        label={config.includePercentages}
      >
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={config.colors[index % config.colors.length]} />
        ))}
      </Pie>
    </PieChart>
  </ResponsiveContainer>
);

const ScatterChartRenderer: React.FC<ChartRendererProps> = ({ data, config }) => (
  <ResponsiveContainer width="100%" height={300}>
    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
      {config.showGridlines && <CartesianGrid strokeDasharray="3 3" />}
      <XAxis dataKey={config.xAxis} />
      <YAxis dataKey={config.yAxis} />
      {config.showTooltip && <Tooltip formatter={(value) => formatNumber(value as number)} />}
      {config.showLegend}
      <Scatter data={data} fill={config.colors[0]} />
    </ScatterChart>
  </ResponsiveContainer>
);

// ==================== CHART CONTAINER COMPONENT ====================

const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  data,
  config,
  onConfigChange,
  fields,
}) => {
  const processedData = useMemo(() => {
    let result = aggregateData(data, config.xAxis, config.yAxis, config.aggregation);
    result = sortData(result, config.yAxis, config.sortOrder);
    return result;
  }, [data, config.xAxis, config.yAxis, config.aggregation, config.sortOrder]);

  const renderChart = useCallback(() => {
    const props = { data: processedData, config };
    switch (config.type) {
      case 'bar':
        return <BarChartRenderer {...props} />;
      case 'area':
        return <AreaChartRenderer {...props} />;
      case 'pie':
        return <PieChartRenderer {...props} />;
      case 'scatter':
        return <ScatterChartRenderer {...props} />;
      case 'line':
      default:
        return <LineChartRenderer {...props} />;
    }
  }, [processedData, config]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <ChartConfigurator
          config={config}
          fields={fields}
          onConfigChange={onConfigChange}
        />
      </div>
      <div className="w-full h-80">
        {renderChart()}
      </div>
    </div>
  );
};

// ==================== DEMO DASHBOARD ====================

export default function Dashboard() {
  // Sample data
  const transactionData: DataPoint[] = [
    { month: 'Jan', groceries: 450, dining: 320, gas: 180, entertainment: 220 },
    { month: 'Feb', groceries: 480, dining: 290, gas: 200, entertainment: 250 },
    { month: 'Mar', groceries: 420, dining: 380, gas: 190, entertainment: 180 },
    { month: 'Apr', groceries: 510, dining: 310, gas: 210, entertainment: 290 },
    { month: 'May', groceries: 460, dining: 340, gas: 220, entertainment: 240 },
    { month: 'Jun', groceries: 520, dining: 360, gas: 200, entertainment: 300 },
  ];

  const budgetData: DataPoint[] = [
    { category: 'Groceries', budgeted: 2000, spent: 2470 },
    { category: 'Dining', budgeted: 1500, spent: 1680 },
    { category: 'Gas', budgeted: 800, spent: 1020 },
    { category: 'Entertainment', budgeted: 1000, spent: 1160 },
    { category: 'Utilities', budgeted: 500, spent: 480 },
  ];

  const [transactionConfig, setTransactionConfig] = useState<ChartConfig>({
    type: 'line',
    xAxis: 'month',
    yAxis: 'groceries',
    sortOrder: 'asc',
    aggregation: 'sum',
    colors: DEFAULT_COLORS,
    showGridlines: true,
    showLegend: true,
    showTooltip: true,
    smoothLines: true,
    lineWidth: 2,
    includePercentages: false,
  });

  const [budgetConfig, setBudgetConfig] = useState<ChartConfig>({
    type: 'bar',
    xAxis: 'category',
    yAxis: 'spent',
    sortOrder: 'desc',
    aggregation: 'sum',
    colors: DEFAULT_COLORS,
    showGridlines: true,
    showLegend: true,
    showTooltip: true,
    smoothLines: false,
    lineWidth: 2,
    includePercentages: false,
  });

  const transactionFields = ['month', 'groceries', 'dining', 'gas', 'entertainment'];
  const budgetFields = ['category', 'budgeted', 'spent'];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Customizable Dashboard</h1>
          <p className="text-slate-600 mt-2">Configure charts with different types, axes, and display options</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartContainer
            title="Transaction Trends"
            data={transactionData}
            config={transactionConfig}
            onConfigChange={setTransactionConfig}
            fields={transactionFields}
          />

          <ChartContainer
            title="Budget Analysis"
            data={budgetData}
            config={budgetConfig}
            onConfigChange={setBudgetConfig}
            fields={budgetFields}
          />
        </div>
      </div>
    </div>
  );
}