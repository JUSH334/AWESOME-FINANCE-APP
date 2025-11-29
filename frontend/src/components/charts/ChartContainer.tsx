import React, { useMemo } from 'react';
import { ChartConfigurator } from './ChartConfigurator';
import { LineChartRenderer, AreaChartRenderer, BarChartRenderer, PieChartRenderer } from './ChartRenderers';
import { sortData } from '../../utils/chartUtils';
import type { DataPoint, ChartConfig } from '../../types/chart';
import type { PresetDefinition } from '../../types/chart';

interface ChartContainerProps {
  preset: PresetDefinition;
  data: DataPoint[];
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  preset,
  data,
  config,
  onConfigChange,
}) => {
  const processedData = useMemo(() => {
    let result = [...data];
    result = sortData(result, Array.isArray(preset.yAxis) ? preset.yAxis[0] : preset.yAxis, config.sortOrder);
    return result;
  }, [data, preset, config.sortOrder]);

  const renderChart = () => {
    const props = { data: processedData, preset, config };
    switch (preset.type) {
      case 'bar':
        return <BarChartRenderer {...props} />;
      case 'pie':
        return <PieChartRenderer {...props} />;
      case 'area':
        return <AreaChartRenderer {...props} />;
      case 'line':
      default:
        return <LineChartRenderer {...props} />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{preset.name}</h3>
          <p className="text-sm text-slate-600 mt-1">{preset.description}</p>
        </div>
        <ChartConfigurator preset={preset} config={config} onConfigChange={onConfigChange} />
      </div>
      <div className="w-full h-80 bg-slate-50 rounded-lg p-4">
        {processedData.length > 0 ? renderChart() : (
          <div className="flex items-center justify-center h-full text-slate-500">
            No data available
          </div>
        )}
      </div>
    </div>
  );
};