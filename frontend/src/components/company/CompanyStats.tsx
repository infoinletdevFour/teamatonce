/**
 * Company Stats Dashboard Component
 * Displays company statistics with beautiful charts
 * Uses Recharts for data visualization
 */

import { useEffect } from 'react';
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Star,
  Target,
  Award,
} from 'lucide-react';
import { useCompanyStore } from '../../stores/companyStore';

// ============================================================================
// Component Props
// ============================================================================

interface CompanyStatsProps {
  companyId: string;
  autoLoad?: boolean;
}

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, subtitle, trend, color }) => {

  const lightColorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <div className="mt-2 flex items-center">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </span>
              <span className="ml-2 text-sm text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${lightColorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const CompanyStats: React.FC<CompanyStatsProps> = ({ companyId, autoLoad = true }) => {
  const { companyStats, isLoadingStats, fetchCompanyStats, error } = useCompanyStore();

  useEffect(() => {
    if (autoLoad && companyId) {
      fetchCompanyStats(companyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, autoLoad]);

  const handleRefresh = () => {
    if (companyId) {
      fetchCompanyStats(companyId);
    }
  };

  if (isLoadingStats) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-800 font-semibold">Error loading statistics</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!companyStats) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No statistics available</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Load Statistics
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Company Statistics</h2>
          <p className="text-gray-600 mt-1">Real-time performance metrics and insights</p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          disabled={isLoadingStats}
        >
          <TrendingUp size={16} />
          Refresh
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Team Members */}
        <StatCard
          title="Team Members"
          value={companyStats.total_members}
          subtitle={`${companyStats.active_members} active`}
          icon={<Users size={24} />}
          color="blue"
        />

        {/* Active Projects */}
        <StatCard
          title="Active Projects"
          value={companyStats.active_projects}
          subtitle={`${companyStats.completed_projects} completed`}
          icon={<Briefcase size={24} />}
          color="green"
        />

        {/* Total Revenue */}
        <StatCard
          title="Total Revenue"
          value={`$${companyStats.total_revenue.toLocaleString()}`}
          subtitle={`$${companyStats.monthly_revenue.toLocaleString()} this month`}
          icon={<DollarSign size={24} />}
          color="purple"
        />

        {/* Pending Invitations */}
        <StatCard
          title="Pending Invitations"
          value={companyStats.pending_invitations}
          icon={<Users size={24} />}
          color="orange"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Average Rating */}
        <StatCard
          title="Average Rating"
          value={companyStats.average_rating.toFixed(1)}
          subtitle="Based on client feedback"
          icon={<Star size={24} />}
          color="indigo"
        />

        {/* On-Time Delivery */}
        <StatCard
          title="On-Time Delivery"
          value={`${companyStats.on_time_delivery_rate.toFixed(1)}%`}
          subtitle="Project completion rate"
          icon={<Target size={24} />}
          color="green"
        />

        {/* Monthly Revenue */}
        <StatCard
          title="Monthly Revenue"
          value={`$${companyStats.monthly_revenue.toLocaleString()}`}
          subtitle="This month's earnings"
          icon={<Award size={24} />}
          color="purple"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Projects Summary */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Projects</h3>
            <Briefcase size={24} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-blue-100">Active</span>
              <span className="font-bold">{companyStats.active_projects}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-100">Completed</span>
              <span className="font-bold">{companyStats.completed_projects}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-blue-400">
              <span className="text-blue-100">Total</span>
              <span className="font-bold">
                {companyStats.active_projects + companyStats.completed_projects}
              </span>
            </div>
          </div>
        </div>

        {/* Team Summary */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Team</h3>
            <Users size={24} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-green-100">Active Members</span>
              <span className="font-bold">{companyStats.active_members}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-100">Total Members</span>
              <span className="font-bold">{companyStats.total_members}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-green-400">
              <span className="text-green-100">Pending Invites</span>
              <span className="font-bold">{companyStats.pending_invitations}</span>
            </div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Revenue</h3>
            <DollarSign size={24} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-purple-100">This Month</span>
              <span className="font-bold">${companyStats.monthly_revenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-100">Total Earned</span>
              <span className="font-bold">${companyStats.total_revenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-purple-400">
              <span className="text-purple-100">Average/Project</span>
              <span className="font-bold">
                $
                {companyStats.completed_projects > 0
                  ? Math.round(
                      companyStats.total_revenue / companyStats.completed_projects
                    ).toLocaleString()
                  : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Indicators</h3>
        <div className="space-y-4">
          {/* On-Time Delivery Rate */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">On-Time Delivery Rate</span>
              <span className="text-sm font-bold text-gray-900">
                {companyStats.on_time_delivery_rate.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${companyStats.on_time_delivery_rate}%` }}
              />
            </div>
          </div>

          {/* Average Rating */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Client Satisfaction</span>
              <span className="text-sm font-bold text-gray-900">
                {companyStats.average_rating.toFixed(1)} / 5.0
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(companyStats.average_rating / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Team Capacity */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Team Capacity Utilization</span>
              <span className="text-sm font-bold text-gray-900">
                {companyStats.total_members > 0
                  ? Math.round((companyStats.active_members / companyStats.total_members) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    companyStats.total_members > 0
                      ? (companyStats.active_members / companyStats.total_members) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyStats;
