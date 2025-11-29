import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import type { ChartConfig, SortOrder } from '../../types/chart';
import type { PresetDefinition } from '../../types/chart';

interface ChartConfiguratorProps {
  config: ChartConfig;
  preset: PresetDefinition;
  onConfigChange: (config: ChartConfig) => void;
}

export const ChartConfigurator: React.FC<ChartConfiguratorProps> = ({
  config,
  preset,
  onConfigChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateConfig = (updates: Partial<ChartConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const hideOption = (option: string) => preset.hideOptions?.includes(option) ?? false;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
      >
        <Settings className="w-4 h-4" />
        Options
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50 space-y-4">
          {!hideOption('sortOrder') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label>
              <select
                value={config.sortOrder}
                onChange={(e) => updateConfig({ sortOrder: e.target.value as SortOrder })}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          )}

          {preset.type !== 'pie' && (
            <>
              {!hideOption('smoothLines') && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.smoothLines}
                    onChange={(e) => updateConfig({ smoothLines: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700">Smooth Lines</span>
                </label>
              )}

              {!hideOption('lineWidth') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
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

              {!hideOption('gridlines') && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showGridlines}
                    onChange={(e) => updateConfig({ showGridlines: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700">Show Gridlines</span>
                </label>
              )}
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
        </div>
      )}
    </div>
  );
};