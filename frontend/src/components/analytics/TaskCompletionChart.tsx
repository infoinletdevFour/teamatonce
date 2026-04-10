import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CheckCircle2, Download, TrendingUp } from 'lucide-react';
import { TaskCompletionData } from '@/services/analyticsService';
import {
  chartColors,
  tooltipStyles,
  exportChartDataToCSV,
} from '@/utils/chartConfig';

interface TaskCompletionChartProps {
  data: TaskCompletionData[];
  groupBy?: 'status' | 'priority';
  onMilestoneClick?: (milestoneId: string) => void;
}

export const TaskCompletionChart: React.FC<TaskCompletionChartProps> = ({
  data,
  groupBy = 'status',
  onMilestoneClick,
}) => {
  const [viewMode, setViewMode] = useState<'status' | 'priority'>(groupBy);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={tooltipStyles.container}>
          <p className={tooltipStyles.title}>{label}</p>
          <div className="space-y-2">
            {viewMode === 'status' ? (
              <>
                <div className="flex items-center justify-between space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className={tooltipStyles.label}>Completed:</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">{data.completedTasks}</span>
                </div>
                <div className="flex items-center justify-between space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className={tooltipStyles.label}>In Progress:</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{data.inProgressTasks}</span>
                </div>
                <div className="flex items-center justify-between space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className={tooltipStyles.label}>Pending:</span>
                  </div>
                  <span className="text-sm font-bold text-amber-600">{data.pendingTasks}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className={tooltipStyles.label}>High Priority:</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">{data.highPriority}</span>
                </div>
                <div className="flex items-center justify-between space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className={tooltipStyles.label}>Medium Priority:</span>
                  </div>
                  <span className="text-sm font-bold text-amber-600">{data.mediumPriority}</span>
                </div>
                <div className="flex items-center justify-between space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className={tooltipStyles.label}>Low Priority:</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">{data.lowPriority}</span>
                </div>
              </>
            )}
            <div className={tooltipStyles.separator} />
            <div className="flex items-center justify-between space-x-6">
              <span className={tooltipStyles.label}>Total Tasks:</span>
              <span className="text-sm font-bold text-gray-900">{data.totalTasks}</span>
            </div>
            <div className="flex items-center justify-between space-x-6">
              <span className={tooltipStyles.label}>Completion:</span>
              <span className="text-sm font-bold text-purple-600">
                {data.completionPercentage.toFixed(0)}%
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
      Milestone: item.milestoneName,
      'Total Tasks': item.totalTasks,
      'Completed Tasks': item.completedTasks,
      'In Progress': item.inProgressTasks,
      'Pending Tasks': item.pendingTasks,
      'High Priority': item.highPriority,
      'Medium Priority': item.mediumPriority,
      'Low Priority': item.lowPriority,
      'Completion %': item.completionPercentage.toFixed(1),
    }));
    exportChartDataToCSV(exportData, 'task-completion');
  };

  // Calculate overall statistics
  const totalTasks = data.reduce((sum, item) => sum + item.totalTasks, 0);
  const completedTasks = data.reduce((sum, item) => sum + item.completedTasks, 0);
  const inProgressTasks = data.reduce((sum, item) => sum + item.inProgressTasks, 0);
  const overallCompletion = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Task Completion</h3>
              <p className="text-sm text-gray-600">Task progress by milestone</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View mode toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('status')}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                  viewMode === 'status'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                By Status
              </button>
              <button
                onClick={() => setViewMode('priority')}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                  viewMode === 'priority'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                By Priority
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
            <div className="text-xs text-gray-600 mb-1">Total Tasks</div>
            <div className="text-lg font-black text-gray-900">{totalTasks}</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Completed</div>
            <div className="text-lg font-black text-green-600">{completedTasks}</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">In Progress</div>
            <div className="text-lg font-black text-blue-600">{inProgressTasks}</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Overall Completion</div>
            <div className="text-lg font-black text-purple-600 flex items-center space-x-1">
              <span>{overallCompletion.toFixed(0)}%</span>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-lg font-semibold text-gray-500">No task data available</p>
            <p className="text-sm text-gray-400">Start adding tasks to see completion metrics</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="inProgressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#D97706" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="highPriorityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="mediumPriorityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#D97706" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="lowPriorityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis
                dataKey="milestoneName"
                stroke={chartColors.axis}
                style={{ fontSize: 12, fontWeight: 600 }}
                angle={-15}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke={chartColors.axis}
                style={{ fontSize: 12, fontWeight: 600 }}
                label={{ value: 'Number of Tasks', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, fontWeight: 600 }}
                iconType="circle"
              />
              {viewMode === 'status' ? (
                <>
                  <Bar
                    dataKey="completedTasks"
                    name="Completed"
                    fill="url(#completedGradient)"
                    radius={[8, 8, 0, 0]}
                    stackId="tasks"
                  />
                  <Bar
                    dataKey="inProgressTasks"
                    name="In Progress"
                    fill="url(#inProgressGradient)"
                    radius={[8, 8, 0, 0]}
                    stackId="tasks"
                  />
                  <Bar
                    dataKey="pendingTasks"
                    name="Pending"
                    fill="url(#pendingGradient)"
                    radius={[8, 8, 0, 0]}
                    stackId="tasks"
                  />
                </>
              ) : (
                <>
                  <Bar
                    dataKey="highPriority"
                    name="High Priority"
                    fill="url(#highPriorityGradient)"
                    radius={[8, 8, 0, 0]}
                    stackId="priority"
                  />
                  <Bar
                    dataKey="mediumPriority"
                    name="Medium Priority"
                    fill="url(#mediumPriorityGradient)"
                    radius={[8, 8, 0, 0]}
                    stackId="priority"
                  />
                  <Bar
                    dataKey="lowPriority"
                    name="Low Priority"
                    fill="url(#lowPriorityGradient)"
                    radius={[8, 8, 0, 0]}
                    stackId="priority"
                  />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Milestone Progress Breakdown */}
      {data.length > 0 && (
        <div className="px-6 pb-6">
          <h4 className="text-sm font-bold text-gray-900 mb-3">Milestone Progress</h4>
          <div className="space-y-2">
            {data.map((milestone) => (
              <div
                key={milestone.milestoneId}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onMilestoneClick?.(milestone.milestoneId)}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {milestone.milestoneName}
                    </span>
                    <span className="text-sm font-bold text-purple-600">
                      {milestone.completionPercentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300"
                      style={{ width: `${milestone.completionPercentage}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-500 min-w-[80px] text-right">
                  {milestone.completedTasks}/{milestone.totalTasks} tasks
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCompletionChart;
