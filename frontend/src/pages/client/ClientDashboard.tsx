import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  TrendingUp,
  Clock,
  AlertCircle,
  DollarSign,
  Users,
  MessageSquare,
  ArrowRight,
  Calendar,
  Loader2,
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { dashboardService } from '@/services/dashboardService';
import { notificationService } from '@/services/notificationService';
import { Project, Activity } from '@/types/client';

/**
 * ClientDashboard Page
 * Main dashboard for client users showing overview of projects and activities
 */

interface DisplayStats {
  label: string;
  value: string;
  change: string;
  icon: any;
  color: string;
  bgColor: string;
}

interface DisplayProject {
  id: string;
  name: string;
  status: string;
  progress: number;
  dueDate: string;
  team: number;
  statusColor: string;
}

interface DisplayActivity {
  id: string;
  text: string;
  time: string;
  type: 'message' | 'milestone' | 'payment' | 'team' | 'file';
}

export const ClientDashboard: React.FC = () => {
  const { company } = useCompany();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DisplayStats[]>([]);
  const [projects, setProjects] = useState<DisplayProject[]>([]);
  const [recentActivity, setRecentActivity] = useState<DisplayActivity[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!company?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch all dashboard data in parallel
        const [statsData, projectsData, activityData, unreadCountData] = await Promise.all([
          dashboardService.getClientStats(company.id),
          dashboardService.getRecentProjects(company.id, 3),
          dashboardService.getRecentActivity(company.id, 5),
          notificationService.getUnreadCount().catch(() => ({ count: 0 })),
        ]);

        // Transform stats into display format
        setStats([
          {
            label: 'Active Projects',
            value: String(statsData.activeProjects || 0),
            change: `${statsData.completedProjects || 0} completed`,
            icon: FolderKanban,
            color: 'from-blue-600 to-blue-500',
            bgColor: 'bg-blue-100',
          },
          {
            label: 'Total Spent',
            value: `$${((statsData.totalSpent || 0) / 1000).toFixed(1)}K`,
            change: `${statsData.totalHoursTracked || 0} hours tracked`,
            icon: DollarSign,
            color: 'from-green-600 to-green-500',
            bgColor: 'bg-green-100',
          },
          {
            label: 'Developers Hired',
            value: String(statsData.developersHired || 0),
            change: `${statsData.averageRating?.toFixed(1) || '0.0'} avg rating`,
            icon: Users,
            color: 'from-purple-600 to-purple-500',
            bgColor: 'bg-purple-100',
          },
          {
            label: 'Unread Messages',
            value: String(unreadCountData.count || 0),
            change: unreadCountData.count > 0 ? 'View all' : 'No new',
            icon: MessageSquare,
            color: 'from-pink-600 to-pink-500',
            bgColor: 'bg-pink-100',
          },
        ]);

        // Transform projects into display format
        const transformedProjects: DisplayProject[] = projectsData.map((project: Project) => {
          const statusDisplay = project.status === 'active' ? 'In Progress' :
                               project.status === 'completed' ? 'Completed' :
                               project.status === 'pending' ? 'Pending' : 'Review';
          const statusColor = project.status === 'active' ? 'text-blue-600 bg-blue-100' :
                             project.status === 'completed' ? 'text-green-600 bg-green-100' :
                             project.status === 'pending' ? 'text-gray-600 bg-gray-100' : 'text-yellow-600 bg-yellow-100';

          return {
            id: project.id,
            name: project.name,
            status: statusDisplay,
            progress: project.progress || 0,
            dueDate: project.endDate instanceof Date ? project.endDate.toISOString().split('T')[0] : String(project.endDate).split('T')[0],
            team: project.team?.length || 0,
            statusColor,
          };
        });
        setProjects(transformedProjects);

        // Transform activity into display format
        const transformedActivity: DisplayActivity[] = activityData.map((activity: Activity) => ({
          id: activity.id,
          text: activity.title || activity.description,
          time: formatTimeAgo(activity.timestamp),
          type: activity.type || 'message',
        }));
        setRecentActivity(transformedActivity);

      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [company?.id]);

  // Helper function to format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to load dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Welcome back!
        </h1>
        <p className="text-gray-600 text-lg">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-gray-700" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
              <div className="text-xs text-green-600 font-semibold">{stat.change}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Projects and Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Active Projects</h2>
                <Link
                  to="/client/projects"
                  className="text-blue-600 hover:text-purple-600 font-semibold text-sm flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No active projects yet</p>
                  <Link
                    to="/client/projects/new"
                    className="text-blue-600 hover:text-purple-600 font-semibold text-sm mt-2 inline-block"
                  >
                    Start your first project
                  </Link>
                </div>
              ) : (
                projects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/project/${project.id}/dashboard`}
                    className="block"
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900">{project.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${project.statusColor}`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-bold text-blue-600">{project.progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{project.team} members</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Due {new Date(project.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6 space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'milestone' ? 'bg-green-500' :
                      activity.type === 'message' ? 'bg-blue-500' :
                      activity.type === 'payment' ? 'bg-green-500' :
                      'bg-purple-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/client/projects/new">
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-2xl cursor-pointer"
          >
            <FolderKanban className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-bold mb-2">Start New Project</h3>
            <p className="text-sm text-white/80">Create a new project and get matched with developers</p>
          </motion.div>
        </Link>

        <Link to="/client/messages">
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl p-6 shadow-lg cursor-pointer"
          >
            <MessageSquare className="w-8 h-8 mb-3 text-blue-600" />
            <h3 className="text-xl font-bold mb-2 text-gray-900">View Messages</h3>
            <p className="text-sm text-gray-600">Check your messages and communications</p>
          </motion.div>
        </Link>

        <Link to="/client/payments">
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl p-6 shadow-lg cursor-pointer"
          >
            <DollarSign className="w-8 h-8 mb-3 text-green-600" />
            <h3 className="text-xl font-bold mb-2 text-gray-900">Manage Payments</h3>
            <p className="text-sm text-gray-600">View invoices and payment history</p>
          </motion.div>
        </Link>
      </div>
    </div>
  );
};

export default ClientDashboard;
