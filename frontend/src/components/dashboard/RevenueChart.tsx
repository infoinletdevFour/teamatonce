import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, DollarSign, Download, BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon } from 'lucide-react';
import { RevenueData } from '@/services/companyService';

interface RevenueChartProps {
  data: RevenueData[];
  period: 'monthly' | 'quarterly' | 'yearly';
  onPeriodChange?: (period: 'monthly' | 'quarterly' | 'yearly') => void;
}

type ChartType = 'line' | 'area' | 'bar';

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  period,
  onPeriodChange
}) => {
  const [chartType, setChartType] = useState<ChartType>('area');

  // Ensure data is an array
  const chartData = Array.isArray(data) ? data : [];

  // Calculate statistics
  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
  const averageRevenue = chartData.length > 0 ? totalRevenue / chartData.length : 0;
  const maxRevenue = chartData.length > 0 ? Math.max(...chartData.map(item => item.revenue)) : 0;

  // Calculate growth (comparing last two periods)
  const recentRevenue = chartData[chartData.length - 1]?.revenue || 0;
  const previousRevenue = chartData[chartData.length - 2]?.revenue || 0;
  const growth = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-xl">
          <p className="text-sm font-semibold text-gray-900 mb-2">{payload[0].payload.month}</p>
          <div className="space-y-1">
            <p className="text-lg font-bold text-green-600">
              ${payload[0].value.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600">
              {payload[0].payload.projects} projects
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#9333EA" stopOpacity={0.8}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              style={{ fontSize: '12px', fontWeight: 600 }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px', fontWeight: 600 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="url(#colorRevenue)"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#9333EA" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3B82F6"/>
                <stop offset="100%" stopColor="#9333EA"/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              style={{ fontSize: '12px', fontWeight: 600 }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px', fontWeight: 600 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="url(#lineGradient)"
              strokeWidth={3}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="#9333EA" stopOpacity={0.9}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              style={{ fontSize: '12px', fontWeight: 600 }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px', fontWeight: 600 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="revenue"
              fill="url(#colorRevenue)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Revenue Analytics</h3>
              <p className="text-sm text-gray-600">Financial performance overview</p>
            </div>
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setChartType('line')}
              className={`p-2 rounded-lg transition-all ${
                chartType === 'line'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LineChartIcon className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setChartType('area')}
              className={`p-2 rounded-lg transition-all ${
                chartType === 'area'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <AreaChartIcon className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setChartType('bar')}
              className={`p-2 rounded-lg transition-all ${
                chartType === 'bar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Total Revenue</div>
            <div className="text-lg font-black text-green-600">
              ${(totalRevenue / 1000).toFixed(1)}k
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Average</div>
            <div className="text-lg font-black text-blue-600">
              ${(averageRevenue / 1000).toFixed(1)}k
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Growth</div>
            <div className={`text-lg font-black flex items-center space-x-1 ${
              growth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`w-4 h-4 ${growth < 0 ? 'rotate-180' : ''}`} />
              <span>{Math.abs(growth).toFixed(1)}%</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Peak</div>
            <div className="text-lg font-black text-purple-600">
              ${(maxRevenue / 1000).toFixed(1)}k
            </div>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="px-6 pt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {(['monthly', 'quarterly', 'yearly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange?.(p)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                period === p
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-200"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </motion.button>
      </div>

      {/* Chart */}
      <div className="p-6 pt-4">
        <ResponsiveContainer width="100%" height={300}>
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Footer Stats */}
      <div className="px-6 pb-6">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-600 mb-1">Total Projects</div>
              <div className="text-xl font-black text-blue-600">
                {chartData.reduce((sum, item) => sum + (item.projects || 0), 0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Avg per Project</div>
              <div className="text-xl font-black text-purple-600">
                {(() => {
                  const totalProjects = chartData.reduce((sum, item) => sum + (item.projects || 0), 0);
                  return totalProjects > 0 ? `$${(totalRevenue / totalProjects / 1000).toFixed(1)}k` : '$0';
                })()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Best Month</div>
              <div className="text-xl font-black text-green-600">
                {chartData.find(item => item.revenue === maxRevenue)?.month || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;
