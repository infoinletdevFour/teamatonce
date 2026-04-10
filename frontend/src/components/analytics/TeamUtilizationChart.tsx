import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Cell,
} from 'recharts';
import { Users, Download, TrendingUp } from 'lucide-react';
import { TeamUtilizationData } from '@/services/analyticsService';
import {
  chartColors,
  tooltipStyles,
  exportChartDataToCSV,
} from '@/utils/chartConfig';

interface TeamUtilizationChartProps {
  data: TeamUtilizationData[];
  showCapacityLine?: boolean;
}

export const TeamUtilizationChart: React.FC<TeamUtilizationChartProps> = ({
  data,
  showCapacityLine = true,
}) => {
  const [viewMode, setViewMode] = useState<'hours' | 'utilization'>('hours');

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={tooltipStyles.container}>
          <div className="flex items-center space-x-2 mb-2">
            {data.avatar && (
              <img
                src={data.avatar}
                alt={data.name}
                className="w-8 h-8 rounded-full border-2 border-white shadow"
              />
            )}
            <p className={tooltipStyles.title}>{label}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className={tooltipStyles.label}>Billable Hours:</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{data.billableHours}h</span>
            </div>
            <div className="flex items-center justify-between space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className={tooltipStyles.label}>Non-Billable:</span>
              </div>
              <span className="text-sm font-bold text-purple-600">{data.nonBillableHours}h</span>
            </div>
            <div className={tooltipStyles.separator} />
            <div className="flex items-center justify-between space-x-6">
              <span className={tooltipStyles.label}>Total Hours:</span>
              <span className="text-sm font-bold text-gray-900">{data.totalHours}h</span>
            </div>
            <div className="flex items-center justify-between space-x-6">
              <span className={tooltipStyles.label}>Capacity:</span>
              <span className="text-sm font-bold text-gray-900">{data.capacity}h</span>
            </div>
            <div className="flex items-center justify-between space-x-6">
              <span className={tooltipStyles.label}>Utilization:</span>
              <span
                className={`text-sm font-bold ${
                  data.utilization >= 90
                    ? 'text-red-600'
                    : data.utilization >= 70
                    ? 'text-green-600'
                    : 'text-amber-600'
                }`}
              >
                {data.utilization.toFixed(0)}%
              </span>
            </div>
            {data.projects && data.projects.length > 0 && (
              <>
                <div className={tooltipStyles.separator} />
                <div className="text-xs font-semibold text-gray-700 mb-1">Active Projects:</div>
                {data.projects.map((project: any) => (
                  <div key={project.projectId} className="flex items-center justify-between space-x-4">
                    <span className="text-xs text-gray-600 truncate max-w-[120px]">
                      {project.projectName}
                    </span>
                    <span className="text-xs font-semibold text-gray-900">{project.hours}h</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Handle export
  const handleExport = () => {
    const exportData = data.map(item => ({
      Name: item.name,
      'Total Hours': item.totalHours,
      'Billable Hours': item.billableHours,
      'Non-Billable Hours': item.nonBillableHours,
      Capacity: item.capacity,
      'Utilization %': item.utilization.toFixed(1),
      Projects: item.projects?.length || 0,
    }));
    exportChartDataToCSV(exportData, 'team-utilization');
  };

  // Calculate statistics
  const totalBillable = data.reduce((sum, item) => sum + item.billableHours, 0);
  const totalNonBillable = data.reduce((sum, item) => sum + item.nonBillableHours, 0);
  const avgUtilization = data.length > 0
    ? data.reduce((sum, item) => sum + item.utilization, 0) / data.length
    : 0;
  const overUtilized = data.filter(item => item.utilization > 100).length;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Team Utilization</h3>
              <p className="text-sm text-gray-600">Hours worked and capacity analysis</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View mode toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('hours')}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                  viewMode === 'hours'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Hours
              </button>
              <button
                onClick={() => setViewMode('utilization')}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                  viewMode === 'utilization'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Utilization
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
            <div className="text-xs text-gray-600 mb-1">Total Billable</div>
            <div className="text-lg font-black text-blue-600">{totalBillable}h</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Non-Billable</div>
            <div className="text-lg font-black text-purple-600">{totalNonBillable}h</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Avg Utilization</div>
            <div className="text-lg font-black text-green-600 flex items-center space-x-1">
              <span>{avgUtilization.toFixed(0)}%</span>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Team Members</div>
            <div className="text-lg font-black text-gray-900">{data.length}</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Users className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-lg font-semibold text-gray-500">No team data available</p>
            <p className="text-sm text-gray-400">Add team members to see utilization metrics</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <defs>
                <linearGradient id="billableGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="nonBillableGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333EA" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis
                dataKey="name"
                stroke={chartColors.axis}
                style={{ fontSize: 11, fontWeight: 600 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis
                stroke={chartColors.axis}
                style={{ fontSize: 12, fontWeight: 600 }}
                label={{
                  value: viewMode === 'hours' ? 'Hours' : 'Utilization %',
                  angle: -90,
                  position: 'insideLeft',
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, fontWeight: 600 }}
                iconType="circle"
                verticalAlign="top"
              />
              {viewMode === 'hours' ? (
                <>
                  <Bar
                    dataKey="billableHours"
                    name="Billable Hours"
                    fill="url(#billableGradient)"
                    radius={[8, 8, 0, 0]}
                    stackId="hours"
                  />
                  <Bar
                    dataKey="nonBillableHours"
                    name="Non-Billable Hours"
                    fill="url(#nonBillableGradient)"
                    radius={[8, 8, 0, 0]}
                    stackId="hours"
                  />
                  {showCapacityLine && (
                    <Line
                      type="monotone"
                      dataKey="capacity"
                      name="Capacity"
                      stroke="#EF4444"
                      strokeWidth={2}
                      dot={{ fill: '#EF4444', r: 4 }}
                      strokeDasharray="5 5"
                    />
                  )}
                </>
              ) : (
                <Bar
                  dataKey="utilization"
                  name="Utilization %"
                  radius={[8, 8, 0, 0]}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.utilization >= 100
                          ? '#EF4444'
                          : entry.utilization >= 90
                          ? '#F59E0B'
                          : entry.utilization >= 70
                          ? '#10B981'
                          : '#3B82F6'
                      }
                    />
                  ))}
                </Bar>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Warnings */}
      {overUtilized > 0 && (
        <div className="px-6 pb-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-sm font-semibold text-red-900">
                {overUtilized} team {overUtilized === 1 ? 'member is' : 'members are'} over-utilized (100%+)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamUtilizationChart;
