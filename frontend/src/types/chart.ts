export type ChartPreset = 'spending-trend' | 'category-breakdown' | 'budget-vs-actual' | 'monthly-comparison' | 'savings-progress';
export type AggregationType = 'sum' | 'avg' | 'count';
export type SortOrder = 'asc' | 'desc';

export interface DataPoint {
  [key: string]: string | number | Date;
}

export interface ChartConfig {
  preset: ChartPreset;
  sortOrder: SortOrder;
  showGridlines: boolean;
  showLegend: boolean;
  showTooltip: boolean;
  smoothLines: boolean;
  lineWidth: number;
  colors: string[];
}

export interface PresetDefinition {
  id: ChartPreset;
  name: string;
  description: string;
  icon: React.ReactNode;
  type: 'line' | 'bar' | 'pie' | 'area';
  xAxis: string;
  yAxis: string | string[];
  dataTransform?: (data: any) => DataPoint[];
  aggregation: AggregationType;
  hideOptions?: string[];
}