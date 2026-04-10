import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Calendar, Download, Filter } from 'lucide-react';
import { TimelineEvent } from '@/services/analyticsService';
import {
  chartColors,
  tooltipStyles,
  getStatusColor,
  formatChartDate,
  exportChartDataToCSV,
} from '@/utils/chartConfig';

interface ProjectTimelineChartProps {
  data: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
  showMilestones?: boolean;
  showTasks?: boolean;
  showPhases?: boolean;
}

export const ProjectTimelineChart: React.FC<ProjectTimelineChartProps> = ({
  data,
  onEventClick,
  showMilestones = true,
  showTasks = true,
  showPhases = true,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'milestone' | 'task' | 'phase'>('all');

  // Filter data based on selections
  const filteredData = data.filter(event => {
    if (filterType !== 'all' && event.type !== filterType) return false;
    if (!showMilestones && event.type === 'milestone') return false;
    if (!showTasks && event.type === 'task') return false;
    if (!showPhases && event.type === 'phase') return false;
    return true;
  });

  // Transform data for Gantt-style visualization
  const chartData = filteredData.map(event => {
    const start = new Date(event.startDate).getTime();
    const end = new Date(event.endDate).getTime();
    const duration = (end - start) / (1000 * 60 * 60 * 24); // Duration in days

    return {
      name: event.name,
      type: event.type,
      startDate: event.startDate,
      endDate: event.endDate,
      duration,
      progress: event.progress,
      status: event.status,
      color: getStatusColor(event.status),
      event: event,
    };
  });

  // Sort by start date
  chartData.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={tooltipStyles.container}>
          <p className={tooltipStyles.title}>{data.name}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between space-x-4">
              <span className={tooltipStyles.label}>Type:</span>
              <span className="text-sm font-semibold capitalize">{data.type}</span>
            </div>
            <div className="flex items-center justify-between space-x-4">
              <span className={tooltipStyles.label}>Status:</span>
              <span
                className="text-sm font-semibold capitalize px-2 py-0.5 rounded"
                style={{ backgroundColor: data.color + '20', color: data.color }}
              >
                {data.status.replace('_', ' ')}
              </span>
            </div>
            <div className={tooltipStyles.separator} />
            <div className="flex items-center justify-between space-x-4">
              <span className={tooltipStyles.label}>Start:</span>
              <span className="text-sm font-medium">{formatChartDate(data.startDate, 'medium')}</span>
            </div>
            <div className="flex items-center justify-between space-x-4">
              <span className={tooltipStyles.label}>End:</span>
              <span className="text-sm font-medium">{formatChartDate(data.endDate, 'medium')}</span>
            </div>
            <div className="flex items-center justify-between space-x-4">
              <span className={tooltipStyles.label}>Duration:</span>
              <span className="text-sm font-medium">{data.duration.toFixed(0)} days</span>
            </div>
            <div className="flex items-center justify-between space-x-4">
              <span className={tooltipStyles.label}>Progress:</span>
              <span className="text-sm font-bold text-blue-600">{data.progress}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Handle export
  const handleExport = () => {
    const exportData = chartData.map(item => ({
      Name: item.name,
      Type: item.type,
      Status: item.status,
      'Start Date': item.startDate,
      'End Date': item.endDate,
      'Duration (days)': item.duration.toFixed(0),
      'Progress (%)': item.progress,
    }));
    exportChartDataToCSV(exportData, 'project-timeline');
  };

  // Calculate statistics
  const totalEvents = chartData.length;
  const completedEvents = chartData.filter(e => e.status === 'completed').length;
  const inProgressEvents = chartData.filter(e => e.status === 'in_progress').length;
  const delayedEvents = chartData.filter(e => e.status === 'delayed').length;
  const completionRate = totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Project Timeline</h3>
              <p className="text-sm text-gray-600">Gantt-style overview of project schedule</p>
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
            <span>Export CSV</span>
          </motion.button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Total Events</div>
            <div className="text-lg font-black text-blue-600">{totalEvents}</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Completed</div>
            <div className="text-lg font-black text-green-600">{completedEvents}</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">In Progress</div>
            <div className="text-lg font-black text-amber-600">{inProgressEvents}</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Completion Rate</div>
            <div className="text-lg font-black text-purple-600">{completionRate.toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="px-6 pt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Filter:</span>
          {(['all', 'milestone', 'task', 'phase'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                filterType === type
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-600">In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs text-gray-600">Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-gray-600">Delayed</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6 pt-4">
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-lg font-semibold text-gray-500">No timeline events</p>
            <p className="text-sm text-gray-400">No events match the current filter</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis
                type="number"
                stroke={chartColors.axis}
                style={{ fontSize: 12, fontWeight: 600 }}
                label={{ value: 'Duration (days)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke={chartColors.axis}
                style={{ fontSize: 11, fontWeight: 600 }}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
              <Bar
                dataKey="duration"
                radius={[0, 8, 8, 0]}
                onClick={(data: any) => onEventClick?.(data.event)}
                cursor="pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Info */}
      {delayedEvents > 0 && (
        <div className="px-6 pb-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-sm font-semibold text-red-900">
                {delayedEvents} {delayedEvents === 1 ? 'event is' : 'events are'} delayed
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTimelineChart;
