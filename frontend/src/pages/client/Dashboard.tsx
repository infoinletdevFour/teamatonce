import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  MessageSquare,
  Briefcase,
  DollarSign,
  Users,
  TrendingUp,
  Star,
  Calendar,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { StatsCards } from '../../components/dashboard/StatsCards';
import { RecentProjects } from '../../components/dashboard/RecentProjects';
import { ActivityFeed } from '../../components/dashboard/ActivityFeed';
import { Project, DashboardStats, Activity, Milestone } from '../../types/client';
import { dashboardService } from '../../services/dashboardService';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import { TokenManager } from '../../lib/api';
import { useCompanyStore } from '@/stores/companyStore';
import { apiClient } from '@/lib/api-client';

const ClientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { currentCompany, isLoading: companyLoading, fetchUserCompanies } = useCompanyStore();

  // State for dashboard data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Array<{
    id: string;
    name: string;
    projectName: string;
    dueDate: Date;
    daysLeft: number;
  }>>([]);

  // Load company data on mount
  useEffect(() => {
    fetchUserCompanies().catch(console.error);
  }, [fetchUserCompanies]);

  // Fetch dashboard data ONLY when user and company are loaded
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Don't fetch if still loading company
      if (companyLoading) {
        return;
      }

      // Don't fetch if no user (will be redirected by ProtectedRoute)
      if (!user || !isAuthenticated) {
        setLoading(false);
        return;
      }

      // Don't fetch if no company
      if (!currentCompany) {
        setLoading(false);
        return;
      }

      // Check token exists
      const token = TokenManager.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all dashboard data in parallel
        const [statsData, projectsData, activitiesData, unreadCountData] = await Promise.all([
          dashboardService.getClientStats(currentCompany.id),
          dashboardService.getRecentProjects(currentCompany.id, 5),
          dashboardService.getRecentActivity(currentCompany.id, 10),
          notificationService.getUnreadCount().catch(() => ({ count: 0 }))
        ]);

        setStats(statsData);
        setRecentProjects(projectsData);
        setRecentActivities(activitiesData);
        setUnreadMessages(unreadCountData.count || 0);

        // Extract upcoming deadlines from projects' milestones
        const deadlines: Array<{
          id: string;
          name: string;
          projectName: string;
          dueDate: Date;
          daysLeft: number;
        }> = [];

        const now = new Date();
        projectsData.forEach((project: Project) => {
          if (project.milestones) {
            project.milestones.forEach((milestone: Milestone) => {
              if (milestone.status !== 'completed' && milestone.status !== 'paid') {
                const dueDate = new Date(milestone.dueDate);
                const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                if (daysLeft > 0 && daysLeft <= 30) {
                  deadlines.push({
                    id: milestone.id,
                    name: milestone.name,
                    projectName: project.name,
                    dueDate,
                    daysLeft
                  });
                }
              }
            });
          }
        });

        // Sort by days left and take top 5
        deadlines.sort((a, b) => a.daysLeft - b.daysLeft);
        setUpcomingDeadlines(deadlines.slice(0, 5));
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');

        // Set empty data on error
        setStats({
          activeProjects: 0,
          totalSpent: 0,
          developersHired: 0,
          completedProjects: 0,
          averageRating: 0,
          totalHoursTracked: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, isAuthenticated, currentCompany, companyLoading]);

  // Stats configuration for display
  const statsConfig = stats ? [
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      icon: Briefcase,
      gradient: 'from-sky-700 to-sky-600',
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Total Spent',
      value: `$${(stats.totalSpent / 1000).toFixed(0)}K`,
      icon: DollarSign,
      gradient: 'from-sky-700 to-sky-600',
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Sellers Hired',
      value: stats.developersHired,
      icon: Users,
      gradient: 'from-sky-700 to-sky-600',
      trend: { value: 15, isPositive: true }
    },
    {
      title: 'Average Rating',
      value: stats.averageRating,
      icon: Star,
      gradient: 'from-sky-700 to-sky-600',
    }
  ] : [];

  return (
    <div className="min-h-screen">{/* Removed bg-gradient to avoid conflict with DashboardLayout */}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-lg text-gray-600">
            Here's what's happening with your projects today
          </p>
        </motion.div>

        {/* Error Message */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center space-x-3"
          >
            <div className="text-red-600 font-semibold">
              {error}
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        {stats && (
          <StatsCards
            statsConfig={statsConfig}
            loading={loading}
          />
        )}
        <div className="mb-8" />

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (currentCompany) {
                navigate(`/company/${currentCompany.id}/client/post-project`);
              }
            }}
            className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white p-6 rounded-2xl shadow-lg flex items-center space-x-4 hover:from-sky-900 hover:via-sky-800 hover:to-sky-700 group transition-all"
          >
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-7 h-7" />
            </div>
            <div className="text-left flex-1">
              <div className="text-lg font-bold">Post New Project</div>
              <div className="text-sm text-white/80">Find your perfect team</div>
            </div>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (currentCompany) {
                navigate(`/company/${currentCompany.id}/client/messages`);
              }
            }}
            className="bg-white border-2 border-gray-200 p-6 rounded-2xl shadow-lg flex items-center space-x-4 hover:border-sky-300 transition-colors group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-sky-800 via-sky-700 to-sky-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div className="text-left flex-1">
              <div className="text-lg font-bold text-gray-900">Messages</div>
              <div className="text-sm text-gray-600">
                {unreadMessages > 0 ? `${unreadMessages} unread message${unreadMessages > 1 ? 's' : ''}` : 'No new messages'}
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (currentCompany) {
                navigate(`/company/${currentCompany.id}/client/projects`);
              }
            }}
            className="bg-white border-2 border-gray-200 p-6 rounded-2xl shadow-lg flex items-center space-x-4 hover:border-sky-300 transition-colors group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-sky-800 via-sky-700 to-sky-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <div className="text-left flex-1">
              <div className="text-lg font-bold text-gray-900">All Projects</div>
              <div className="text-sm text-gray-600">View and manage</div>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Projects */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="text-2xl font-black text-gray-900"
              >
                Recent Projects
              </motion.h2>
            </div>

            <RecentProjects
              projects={recentProjects}
              loading={loading}
              companyId={currentCompany?.id}
              onProjectClick={(projectId) => {
                if (currentCompany) {
                  navigate(`/company/${currentCompany.id}/project/${projectId}/dashboard`);
                }
              }}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100"
            >
              <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-sky-600" />
                <span>Recent Activity</span>
              </h3>
              <ActivityFeed
                activities={recentActivities}
                maxItems={5}
                loading={loading}
                onActivityClick={(activity) => {
                  if (activity.projectId && currentCompany) {
                    navigate(`/company/${currentCompany.id}/project/${activity.projectId}/dashboard`);
                  }
                }}
              />
            </motion.div>

            {/* Upcoming Deadlines */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 shadow-lg border-2 border-orange-200"
            >
              <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center space-x-2">
                <Calendar className="w-6 h-6 text-orange-600" />
                <span>Upcoming Deadlines</span>
              </h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                  </div>
                ) : upcomingDeadlines.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No upcoming deadlines</p>
                  </div>
                ) : (
                  upcomingDeadlines.map((deadline) => (
                    <div key={deadline.id} className="bg-white rounded-xl p-4 border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900 truncate flex-1">{deadline.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ml-2 ${
                          deadline.daysLeft <= 3
                            ? 'bg-red-100 text-red-700'
                            : deadline.daysLeft <= 7
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                        }`}>
                          {deadline.daysLeft} day{deadline.daysLeft > 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{deadline.projectName}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
