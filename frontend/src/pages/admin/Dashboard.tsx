import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users,
  FolderKanban,
  Flag,
  DollarSign,
  TrendingUp,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { getAdminDashboard } from '@/services/adminService';
import { AdminDashboardStats } from '@/types/admin';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminDashboard();
      setStats(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      link: '/admin/users',
    },
    {
      title: 'Active Projects',
      value: stats?.activeProjects || 0,
      icon: FolderKanban,
      gradient: 'from-purple-500 to-pink-500',
      link: '/admin/projects',
    },
    {
      title: 'Open Reports',
      value: stats?.openReports || 0,
      icon: Flag,
      gradient: 'from-red-500 to-rose-500',
      link: '/admin/reports',
      urgent: (stats?.openReports || 0) > 0,
    },
    {
      title: 'Monthly Revenue',
      value: `$${(stats?.monthlyRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-500',
      link: '/admin/analytics',
    },
  ];

  const quickActions = [
    { label: 'Resolve Reports', link: '/admin/reports', icon: Flag, count: stats?.openReports },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of platform activity and pending actions</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={card.link}
              className="block bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 group"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center`}
                >
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                {card.urgent && (
                  <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full animate-pulse">
                    Action Needed
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className="mt-4 flex items-center text-sm text-blue-600 group-hover:text-blue-700">
                View Details
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.link}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <action.icon className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-700">{action.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {action.count !== undefined && action.count > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-sm font-medium rounded-full">
                    {action.count}
                  </span>
                )}
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Link to="/admin/activity-logs" className="text-sm text-blue-600 hover:text-blue-700">
            View All
          </Link>
        </div>
        <div className="text-center py-8 text-gray-500">
          <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p>Activity feed coming soon</p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
