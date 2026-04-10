import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DollarSign, TrendingUp, Clock, Star, Briefcase,
  CheckCircle2, AlertCircle, Award, Target, Zap,
  ArrowRight, Calendar, Loader2,
} from 'lucide-react';
import StatsCard from '@/components/developer/StatsCard';
import ProjectCard from '@/components/developer/ProjectCard';
import { Project } from '@/types/developer';
import {
  getDashboardStats,
  getMatchedProjects,
  DashboardStats,
  AIMatchedProject,
} from '@/services/developerService';
import { useAuth } from '@/contexts/AuthContext';

const DeveloperDashboard: React.FC = () => {
  const { user } = useAuth();

  // State for API data
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [matchedProjects, setMatchedProjects] = useState<AIMatchedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard stats and matched projects in parallel
        const [statsData, projectsData] = await Promise.all([
          getDashboardStats(),
          getMatchedProjects(5),
        ]);

        setDashboardStats(statsData);
        setMatchedProjects(projectsData);

        // For now, notifications come from stats or can be fetched separately
        // You can add a notifications API endpoint later
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Convert AIMatchedProject to Project type for ProjectCard
  const convertToProject = (project: AIMatchedProject): Project => ({
    id: project.id,
    title: project.title,
    description: project.description,
    clientName: project.clientName,
    clientRating: project.clientRating,
    budget: {
      min: project.budget.min,
      max: project.budget.max,
      type: (project.budget.type === 'fixed' || project.budget.type === 'hourly') ? project.budget.type : 'fixed',
    },
    duration: project.duration,
    requiredSkills: project.requiredSkills,
    matchPercentage: project.matchPercentage,
    postedDate: project.postedDate,
    proposalsCount: project.proposalsCount,
    status: project.status as 'open' | 'in_progress' | 'completed' | 'cancelled',
    category: project.category,
    experienceLevel: 'intermediate',
    projectType: 'one-time',
  });

  const handleApply = (projectId: string) => {
    console.log('Apply to project:', projectId);
    // TODO: Navigate to proposal submission page
  };

  const handleSaveProject = (projectId: string) => {
    console.log('Save project:', projectId);
    // TODO: Save to bookmarks
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-900 mb-2">Failed to Load Dashboard</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Extract data with defaults
  const earnings = dashboardStats?.earnings || {
    thisMonth: 0,
    lastMonth: 0,
    total: 0,
    pending: 0,
    growth: 0,
  };

  const stats = dashboardStats?.stats || {
    activeProjects: 0,
    completedProjects: 0,
    totalHoursTracked: 0,
    averageRating: 0,
  };

  const upcomingDeadlines = dashboardStats?.upcomingDeadlines || [];
  const skillsVerification = dashboardStats?.skillsVerification || [];
  const userName = user?.name || 'Developer';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-4">
        {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white rounded-full" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-white rounded-full" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black mb-2">Welcome back, {userName.split(' ')[0]}!</h1>
              <p className="text-white/90 text-lg">
                You have {matchedProjects.length} AI-matched projects and {stats.activeProjects} active projects
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Zap className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Earnings Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatsCard
          title="This Month"
          value={`$${earnings.thisMonth.toLocaleString()}`}
          change={earnings.growth}
          trend={earnings.growth >= 0 ? 'up' : 'down'}
          icon={DollarSign}
          gradient="from-green-500 to-emerald-500"
          subtitle="Revenue earned"
        />
        <StatsCard
          title="Total Earnings"
          value={`$${earnings.total.toLocaleString()}`}
          icon={TrendingUp}
          gradient="from-blue-500 to-cyan-500"
          subtitle="All time"
        />
        <StatsCard
          title="Pending Payment"
          value={`$${earnings.pending.toLocaleString()}`}
          icon={Clock}
          gradient="from-orange-500 to-amber-500"
          subtitle="Awaiting release"
        />
        <StatsCard
          title="Average Rating"
          value={stats.averageRating || 'N/A'}
          icon={Star}
          gradient="from-purple-500 to-pink-500"
          subtitle={`${stats.completedProjects} reviews`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column - Projects and Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI-Matched Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">AI-Matched Projects</h2>
                  <p className="text-gray-600 text-sm">Based on your skills and preferences</p>
                </div>
              </div>
              <Link to="/developer/browse-projects">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="text-blue-600 font-semibold flex items-center space-x-2"
                >
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>

            <div className="space-y-4">
              {matchedProjects.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-gray-200">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No matched projects yet</h3>
                  <p className="text-gray-600 mb-4">
                    Complete your profile to get AI-matched with projects that fit your skills
                  </p>
                  <Link to="/developer/profile">
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
                      Complete Profile
                    </button>
                  </Link>
                </div>
              ) : (
                matchedProjects.map((project, idx) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                  >
                    <ProjectCard
                      project={convertToProject(project)}
                      onApply={handleApply}
                      onSave={handleSaveProject}
                      showMatchPercentage
                    />
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                <Briefcase className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.activeProjects}</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.completedProjects}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.totalHoursTracked}h</div>
                <div className="text-sm text-gray-600">Tracked</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
                <Award className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.averageRating || 'N/A'}</div>
                <div className="text-sm text-gray-600">Rating</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Notifications and Deadlines */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Upcoming Deadlines</h3>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No upcoming deadlines</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{deadline.milestone}</div>
                        <div className="text-sm text-gray-600">{deadline.project}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Due: {new Date(deadline.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-orange-600">
                          {deadline.daysLeft}
                        </div>
                        <div className="text-xs text-gray-600">days left</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Skills Verification */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Skills Status</h3>
              <Award className="w-5 h-5 text-gray-400" />
            </div>
            {skillsVerification.length === 0 ? (
              <div className="text-center py-6">
                <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Add skills to your profile</p>
              </div>
            ) : (
              <div className="space-y-2">
                {skillsVerification.map((skill, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      {skill.verified ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">{skill.skill}</div>
                        <div className="text-xs text-gray-600">{skill.level}</div>
                      </div>
                    </div>
                    {!skill.verified && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        className="text-blue-600 text-xs font-semibold"
                      >
                        Verify
                      </motion.button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <Link to="/developer/profile">
              <motion.button
                whileHover={{ scale: 1.02 }}
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-xl font-semibold"
              >
                Manage Skills
              </motion.button>
            </Link>
          </motion.div>

          {/* Active Projects Summary */}
          {dashboardStats?.activeProjects && dashboardStats.activeProjects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Active Projects</h3>
                <Briefcase className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                {dashboardStats.activeProjects.slice(0, 3).map((project) => (
                  <div
                    key={project.id}
                    className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200"
                  >
                    <div className="font-semibold text-gray-900 text-sm">{project.name}</div>
                    <div className="text-xs text-gray-600 mb-2">{project.clientName}</div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-blue-600">{project.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default DeveloperDashboard;
