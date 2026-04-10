import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { TrendingDown, Download, AlertTriangle } from 'lucide-react';
import { BurndownData } from '@/services/analyticsService';
import {
  chartColors,
  tooltipStyles,
  formatChartDate,
  exportChartDataToCSV,
} from '@/utils/chartConfig';

interface BurndownChartProps {
  data: BurndownData[];
  sprintName?: string;
}

export const BurndownChart: React.FC<BurndownChartProps> = ({
  data,
  sprintName = 'Current Sprint',
}) => {
  const [showIdealLine, setShowIdealLine] = useState(true);
  const [showVariance, setShowVariance] = useState(true);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const variance = data.idealRemaining - data.actualRemaining;

      return (
        <div className={tooltipStyles.container}>
          <p className={tooltipStyles.title}>{formatChartDate(label, 'medium')}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className={tooltipStyles.label}>Ideal Remaining:</span>
              </div>
              <span className="text-sm font-bold text-red-600">{data.idealRemaining}</span>
            </div>
            <div className="flex items-center justify-between space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className={tooltipStyles.label}>Actual Remaining:</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{data.actualRemaining}</span>
            </div>
            <div className={tooltipStyles.separator} />
            <div className="flex items-center justify-between space-x-6">
              <span className={tooltipStyles.label}>Completed:</span>
              <span className="text-sm font-bold text-green-600">{data.completedWork}</span>
            </div>
            <div className="flex items-center justify-between space-x-6">
              <span className={tooltipStyles.label}>Total Work:</span>
              <span className="text-sm font-bold text-gray-900">{data.totalWork}</span>
            </div>
            <div className={tooltipStyles.separator} />
            <div className="flex items-center justify-between space-x-6">
              <span className={tooltipStyles.label}>Variance:</span>
              <span
                className={`text-sm font-bold ${
                  variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : 'text-gray-900'
                }`}
              >
                {variance > 0 ? '+' : ''}{variance} {variance > 0 ? 'ahead' : variance < 0 ? 'behind' : 'on track'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Handle export
  const handleExport = () => {
    const exportData = data.map(item => ({
      Date: item.date,
      'Ideal Remaining': item.idealRemaining,
      'Actual Remaining': item.actualRemaining,
      'Total Work': item.totalWork,
      'Completed Work': item.completedWork,
      Variance: item.idealRemaining - item.actualRemaining,
    }));
    exportChartDataToCSV(exportData, `burndown-${sprintName.replace(/\s+/g, '-').toLowerCase()}`);
  };

  // Calculate statistics
  const latestData = data[data.length - 1];
  const totalWork = latestData?.totalWork || 0;
  const completedWork = latestData?.completedWork || 0;
  const remainingWork = latestData?.actualRemaining || 0;
  const progressPercentage = totalWork > 0 ? (completedWork / totalWork) * 100 : 0;
  const currentVariance = latestData ? latestData.idealRemaining - latestData.actualRemaining : 0;
  const isBehindSchedule = currentVariance < 0;
  const isAheadOfSchedule = currentVariance > 0;

  // Calculate velocity (completed work per day)
  const daysElapsed = data.length;
  const velocity = daysElapsed > 0 ? completedWork / daysElapsed : 0;

  // Estimate completion date based on current velocity
  const daysToComplete = velocity > 0 ? Math.ceil(remainingWork / velocity) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-blue-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-blue-600 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Burndown Chart</h3>
              <p className="text-sm text-gray-600">{sprintName}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Toggle controls */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setShowIdealLine(!showIdealLine)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  showIdealLine
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Ideal Line
              </button>
              <button
                onClick={() => setShowVariance(!showVariance)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  showVariance
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Variance
              </button>
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
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Total Work</div>
            <div className="text-lg font-black text-gray-900">{totalWork}</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Completed</div>
            <div className="text-lg font-black text-green-600">{completedWork}</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Remaining</div>
            <div className="text-lg font-black text-blue-600">{remainingWork}</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Progress</div>
            <div className="text-lg font-black text-purple-600">{progressPercentage.toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <TrendingDown className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-lg font-semibold text-gray-500">No burndown data available</p>
            <p className="text-sm text-gray-400">Start tracking work to see burndown progress</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="varianceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis
                dataKey="date"
                stroke={chartColors.axis}
                style={{ fontSize: 12, fontWeight: 600 }}
                tickFormatter={(date) => formatChartDate(date, 'short')}
              />
              <YAxis
                stroke={chartColors.axis}
                style={{ fontSize: 12, fontWeight: 600 }}
                label={{ value: 'Work Remaining', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, fontWeight: 600 }}
                iconType="line"
              />

              {/* Zero line */}
              <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" />

              {/* Variance area (only if enabled) */}
              {showVariance && showIdealLine && (
                <Area
                  type="monotone"
                  dataKey="idealRemaining"
                  fill="url(#varianceGradient)"
                  stroke="none"
                />
              )}

              {/* Ideal burndown line */}
              {showIdealLine && (
                <Line
                  type="linear"
                  dataKey="idealRemaining"
                  name="Ideal Remaining"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                />
              )}

              {/* Actual burndown line */}
              <Line
                type="monotone"
                dataKey="actualRemaining"
                name="Actual Remaining"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Sprint Info and Insights */}
      {data.length > 0 && (
        <div className="px-6 pb-6 space-y-4">
          {/* Schedule Status */}
          {isBehindSchedule && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">Behind Schedule</p>
                  <p className="text-xs text-red-700 mt-1">
                    You are {Math.abs(currentVariance)} units behind the ideal pace.
                    At current velocity ({velocity.toFixed(1)} units/day), you need{' '}
                    {daysToComplete} more days to complete remaining work.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isAheadOfSchedule && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <TrendingDown className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-900">Ahead of Schedule</p>
                  <p className="text-xs text-green-700 mt-1">
                    You are {currentVariance} units ahead of the ideal pace.
                    At current velocity ({velocity.toFixed(1)} units/day), you're on track to finish early!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sprint Metrics */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-600 mb-1">Velocity</div>
                <div className="text-lg font-black text-blue-600">
                  {velocity.toFixed(1)} <span className="text-xs font-medium">units/day</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Days Elapsed</div>
                <div className="text-lg font-black text-purple-600">{daysElapsed}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Est. Days to Complete</div>
                <div className="text-lg font-black text-green-600">
                  {daysToComplete > 0 ? daysToComplete : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BurndownChart;
