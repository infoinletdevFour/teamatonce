import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { PieChart as PieChartIcon, Download, Filter } from 'lucide-react';
import { ProjectsByStatusData } from '@/services/analyticsService';
import {
  tooltipStyles,
  formatCurrency,
  exportChartDataToCSV,
} from '@/utils/chartConfig';

interface ProjectStatusPieChartProps {
  data: ProjectsByStatusData[];
  onStatusClick?: (status: string) => void;
}

export const ProjectStatusPieChart: React.FC<ProjectStatusPieChartProps> = ({
  data,
  onStatusClick,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={tooltipStyles.container}>
          <div className="flex items-center space-x-2 mb-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: data.color }}
            />
            <p className={tooltipStyles.title}>{data.status}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between space-x-6">
              <span className={tooltipStyles.label}>Projects:</span>
              <span className="text-lg font-bold text-gray-900">{data.count}</span>
            </div>
            <div className="flex items-center justify-between space-x-6">
              <span className={tooltipStyles.label}>Percentage:</span>
              <span className="text-lg font-bold text-blue-600">{data.percentage.toFixed(1)}%</span>
            </div>
            <div className={tooltipStyles.separator} />
            <div className="flex items-center justify-between space-x-6">
              <span className={tooltipStyles.label}>Total Value:</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(data.totalValue)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Handle pie click
  const handlePieClick = (data: any, index: number) => {
    setActiveIndex(index === activeIndex ? null : index);
    setSelectedStatus(data.status === selectedStatus ? null : data.status);
    if (data.status !== selectedStatus) {
      onStatusClick?.(data.status);
    } else {
      onStatusClick?.('all');
    }
  };

  // Handle export
  const handleExport = () => {
    const exportData = data.map(item => ({
      Status: item.status,
      Count: item.count,
      'Percentage %': item.percentage.toFixed(1),
      'Total Value': item.totalValue,
    }));
    exportChartDataToCSV(exportData, 'projects-by-status');
  };

  // Calculate totals
  const totalProjects = data.reduce((sum, item) => sum + item.count, 0);
  const totalValue = data.reduce((sum, item) => sum + item.totalValue, 0);

  // Custom label for pie slices
  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage.toFixed(0)}%`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <PieChartIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Projects by Status</h3>
              <p className="text-sm text-gray-600">Distribution of project statuses</p>
            </div>
          </div>

          {/* Export button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-50 border border-gray-200"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </motion.button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Total Projects</div>
            <div className="text-lg font-black text-blue-600">{totalProjects}</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Total Value</div>
            <div className="text-lg font-black text-green-600">{formatCurrency(totalValue)}</div>
          </div>
        </div>
      </div>

      {/* Chart and Legend */}
      <div className="p-6">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <PieChartIcon className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-lg font-semibold text-gray-500">No project data available</p>
            <p className="text-sm text-gray-400">Start adding projects to see status distribution</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data as any}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={renderCustomLabel}
                    labelLine={false}
                    onClick={handlePieClick}
                    cursor="pointer"
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                        stroke={activeIndex === index ? '#1F2937' : 'none'}
                        strokeWidth={activeIndex === index ? 3 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend with Details */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 mb-3">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">
                  {selectedStatus ? `Filtered: ${selectedStatus}` : 'Click to filter'}
                </span>
              </div>
              {data.map((entry, index) => (
                <motion.div
                  key={entry.status}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handlePieClick(entry, index)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border-2 ${
                    activeIndex === index
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm font-bold text-gray-900">{entry.status}</span>
                    </div>
                    <span className="text-sm font-black text-blue-600">
                      {entry.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{entry.count} projects</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(entry.totalValue)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${entry.percentage}%`,
                        backgroundColor: entry.color,
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {data.length > 0 && (
        <div className="px-6 pb-6">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-600 mb-1">Most Common</div>
                <div className="text-sm font-black text-blue-600">
                  {data.reduce((max, item) => (item.count > max.count ? item : max), data[0]).status}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Highest Value</div>
                <div className="text-sm font-black text-green-600">
                  {data.reduce((max, item) => (item.totalValue > max.totalValue ? item : max), data[0]).status}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Avg per Project</div>
                <div className="text-sm font-black text-purple-600">
                  {formatCurrency(totalValue / totalProjects)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectStatusPieChart;
