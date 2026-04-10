import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Code,
  TrendingUp,
  CheckCircle,
  Star,
  DollarSign,
  Calendar,
  ArrowRight,
  Award,
  Target,
  Users,
  Briefcase,
  Activity,
  Building2,
  Send,
  Clock,
  Eye,
} from 'lucide-react';
import { TeamWorkloadWidget } from '@/components/dashboard/TeamWorkloadWidget';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { useCompany } from '@/contexts/CompanyContext';
import {
  getCompanyStats,
  getTeamWorkload,
  getRevenueStats,
  getActiveProjects,
  getRecentActivities,
  getTeamPerformanceMetrics,
  type CompanyStats,
  type RevenueData,
  type ActiveProject,
  type Activity as ActivityType,
} from '@/services/companyService';
import { type MemberWorkload } from '@/types/company';
import { proposalService } from '@/services/proposalService';
import type { Proposal } from '@/types/proposal';

export const DeveloperDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { companyId, company, loading: companyLoading } = useCompany();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [teamMembers, setTeamMembers] = useState<MemberWorkload[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [revenuePeriod, setRevenuePeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [activeProjects, setActiveProjects] = useState<ActiveProject[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityType[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [appliedProjects, setAppliedProjects] = useState<Proposal[]>([]);

  useEffect(() => {
    if (companyId) {
      loadDashboardData();
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      loadRevenueData();
    }
  }, [revenuePeriod, companyId]);

  const loadDashboardData = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const [
        statsData,
        teamData,
        revenueDataRes,
        projectsData,
        activitiesData,
        performanceData,
        proposalsData,
      ] = await Promise.all([
        getCompanyStats(companyId),
        getTeamWorkload(companyId),
        getRevenueStats(companyId, 'monthly'),
        getActiveProjects(companyId),
        getRecentActivities(companyId, 5),
        getTeamPerformanceMetrics(companyId),
        proposalService.getCompanyProposals(companyId),
      ]);

      setStats(statsData);
      setTeamMembers(teamData?.members || []);
      setRevenueData(revenueDataRes?.data || []);
      setActiveProjects(projectsData);
      setRecentActivities(activitiesData);
      setPerformanceMetrics(performanceData);
      setAppliedProjects(proposalsData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRevenueData = async () => {
    if (!companyId) return;

    try {
      const response = await getRevenueStats(companyId, revenuePeriod);
      setRevenueData(response?.data || []);
    } catch (error) {
      console.error('Error loading revenue data:', error);
    }
  };

  const handleMemberClick = (memberId: string) => {
    console.log('Member clicked:', memberId);
    // Navigate to member details or open modal
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project':
        return Briefcase;
      case 'milestone':
        return Target;
      case 'payment':
        return DollarSign;
      case 'team':
        return Users;
      case 'task':
        return CheckCircle;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'project':
        return 'bg-blue-100 text-blue-600';
      case 'milestone':
        return 'bg-purple-100 text-purple-600';
      case 'payment':
        return 'bg-green-100 text-green-600';
      case 'team':
        return 'bg-orange-100 text-orange-600';
      case 'task':
        return 'bg-cyan-100 text-cyan-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  if (companyLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading company information...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Company Selected</h2>
          <p className="text-gray-600 mb-6">
            You need to select or create a company to view your dashboard.
          </p>
          <button
            onClick={() => navigate('/onboarding/company')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Create Company
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Active Projects',
      value: stats?.active_projects || 0,
      change: `${stats?.completed_projects || 0} completed`,
      icon: Code,
      color: 'from-blue-600 to-blue-500',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Total Revenue',
      value: `$${((stats?.total_revenue || 0) / 1000).toFixed(1)}k`,
      change: `$${((stats?.monthly_revenue || 0) / 1000).toFixed(1)}k this month`,
      icon: DollarSign,
      color: 'from-green-600 to-green-500',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Team Members',
      value: stats?.total_members || 0,
      change: `${stats?.active_members || 0} active`,
      icon: Users,
      color: 'from-purple-600 to-purple-500',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'On-Time Delivery',
      value: `${stats?.on_time_delivery_rate || 0}%`,
      change: `Rating: ${stats?.average_rating?.toFixed(1) || '0.0'}`,
      icon: TrendingUp,
      color: 'from-yellow-600 to-yellow-500',
      bgColor: 'bg-yellow-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-4">
        {/* Page Header */}
        <div>
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Developer Dashboard
        </h1>
        <p className="text-gray-600 text-lg">
          Real-time overview of projects, team, and performance metrics.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {statCards.map((stat, index) => {
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

      {/* Revenue Chart & Team Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <RevenueChart
          data={revenueData}
          period={revenuePeriod}
          onPeriodChange={setRevenuePeriod}
        />
        <TeamWorkloadWidget
          teamMembers={teamMembers}
          onMemberClick={handleMemberClick}
        />
      </div>

      {/* Projects and Activities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Active Projects</h2>
                <Link
                  to="/developer/projects"
                  className="text-blue-600 hover:text-purple-600 font-semibold text-sm flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {activeProjects.slice(0, 3).map((project) => (
                <Link
                  key={project.id}
                  to={`/project/${project.id}/dashboard`}
                  className="block"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">{project.name}</h3>
                        <p className="text-sm text-gray-600">Client: {project.client}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            project.status === 'active' ? 'bg-green-100 text-green-700' :
                            project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Budget</div>
                        <div className="font-bold text-gray-900">${(project.budget / 1000).toFixed(0)}k</div>
                        <div className="text-xs text-green-600">${(project.spent / 1000).toFixed(0)}k spent</div>
                      </div>
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
                          <span>{project.teamMembers.length} team members</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Due {new Date(project.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Performance */}
          {performanceMetrics && (
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-2xl">
              <div className="flex items-center space-x-2 mb-4">
                <Award className="w-6 h-6" />
                <h3 className="text-xl font-bold">Team Performance</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/80">On-Time Delivery</span>
                    <span className="font-bold">{performanceMetrics.onTimeDelivery}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white"
                      style={{ width: `${performanceMetrics.onTimeDelivery}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/80">Code Quality</span>
                    <span className="font-bold">{performanceMetrics.codeQuality}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white"
                      style={{ width: `${performanceMetrics.codeQuality}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/80">Client Satisfaction</span>
                    <span className="font-bold">{performanceMetrics.clientSatisfaction}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white"
                      style={{ width: `${performanceMetrics.clientSatisfaction}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm">Average Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-lg">{performanceMetrics.averageRating}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6 space-y-4">
              {recentActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const colorClass = getActivityColor(activity.type);

                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Applied Projects Section */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Send className="w-6 h-6 text-blue-600" />
              <span>Applied Projects</span>
              <span className="text-sm font-normal text-gray-500">
                ({appliedProjects.length})
              </span>
            </h2>
            {appliedProjects.length > 3 && (
              <Link
                to={`/company/${companyId}/seller/proposals`}
                className="text-blue-600 hover:text-purple-600 font-semibold text-sm flex items-center space-x-1"
              >
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
        <div className="p-6">
          {appliedProjects.length === 0 ? (
            <div className="text-center py-12">
              <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Applied Projects Yet</h3>
              <p className="text-gray-600 mb-4">
                Start browsing available projects and submit proposals to grow your business.
              </p>
              <Link
                to={`/company/${companyId}/seller/browse-projects`}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-shadow font-semibold"
              >
                <Eye className="w-5 h-5" />
                <span>Browse Projects</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appliedProjects.slice(0, 6).map((proposal) => (
                <motion.div
                  key={proposal.id}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="p-5 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all cursor-pointer"
                  onClick={() => {
                    // If proposal is accepted, seller should have access to project dashboard
                    // Otherwise, navigate to browse projects page
                    if (proposal.status === 'accepted' && proposal.projectId) {
                      navigate(`/company/${companyId}/project/${proposal.projectId}/dashboard`);
                    } else {
                      navigate(`/company/${companyId}/seller/browse-projects`);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">
                        {proposal.project?.name || 'Untitled Project'}
                      </h4>
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(proposal.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        proposal.status === 'accepted'
                          ? 'bg-green-100 text-green-700'
                          : proposal.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {proposal.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Your Proposal</span>
                      <span className="font-bold text-blue-600">
                        ${proposal.proposedCost?.toLocaleString() || '0'}
                      </span>
                    </div>
                    {proposal.proposedDurationDays && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Delivery</span>
                        <span className="font-semibold text-gray-900">
                          {proposal.proposedDurationDays} days
                        </span>
                      </div>
                    )}
                  </div>

                  {proposal.coverLetter && (
                    <p className="text-xs text-gray-600 line-clamp-2 mt-3 pt-3 border-t border-gray-200">
                      {proposal.coverLetter}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default DeveloperDashboard;
