import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, DollarSign, CheckCircle2, Upload, MessageSquare,
  Calendar, FileText, Play, Pause, Download, Send,
  TrendingUp, AlertCircle, Award, Loader2
} from 'lucide-react';
import { ActiveProject, Milestone } from '@/types/developer';
import { getDeveloperAssignedProjects, getProjectMilestones } from '@/services/projectService';
import { useAuth } from '@/contexts/AuthContext';

const ActiveProjects: React.FC = () => {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [trackingTime] = useState(0);
  const [activeProjects, setActiveProjects] = useState<ActiveProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveProjects = async () => {
      if (!user?.teamMemberId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch developer's assigned projects
        const assignments = await getDeveloperAssignedProjects(user.teamMemberId);

        // Transform assignments to ActiveProject format
        const projects: ActiveProject[] = await Promise.all(
          assignments
            .filter((a: any) => a.project?.status === 'in_progress')
            .map(async (assignment: any) => {
              const project = assignment.project;

              // Fetch milestones for each project
              let milestones: Milestone[] = [];
              try {
                const milestonesResponse = await getProjectMilestones(project.id);
                milestones = (milestonesResponse.milestones || []).map((m: any) => ({
                  id: m.id,
                  title: m.name,
                  description: m.description || '',
                  amount: Number(m.milestone_amount) || 0, // Parse string to number (milestones stored in dollars)
                  status: m.status === 'approved' ? 'approved'
                    : m.status === 'submitted' ? 'submitted'
                    : m.status === 'in_progress' ? 'in_progress'
                    : m.payment_status === 'paid' ? 'released'
                    : 'pending',
                  dueDate: m.due_date || '',
                  completedDate: m.completed_date,
                }));
              } catch (e) {
                console.error('Error fetching milestones:', e);
              }

              // Calculate paid amount from released milestones
              const paidAmount = milestones
                .filter(m => m.status === 'released')
                .reduce((sum, m) => sum + m.amount, 0);

              return {
                id: project.id,
                title: project.name,
                description: project.description || '',
                clientName: project.client?.name || 'Client',
                clientAvatar: project.client?.avatar,
                clientRating: 4.5, // Default rating
                budget: {
                  min: project.estimated_cost || 0,
                  max: project.estimated_cost || 0,
                  type: 'fixed' as const,
                },
                duration: project.estimated_duration_days
                  ? `${Math.ceil(project.estimated_duration_days / 30)} months`
                  : 'TBD',
                requiredSkills: project.tech_stack || [],
                postedDate: project.created_at,
                proposalsCount: 0,
                status: project.status,
                category: project.project_type || 'Development',
                experienceLevel: 'intermediate' as const,
                projectType: 'one-time' as const,
                startDate: project.start_date || project.created_at,
                totalBudget: project.estimated_cost || 0,
                paidAmount,
                timeTracked: 0, // Would come from time tracking service
                filesShared: 0, // Would come from files service
                messagesCount: 0, // Would come from messages service
                milestones,
              };
            })
        );

        setActiveProjects(projects);
      } catch (err: any) {
        console.error('Error fetching active projects:', err);
        setError(err.message || 'Failed to load active projects');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveProjects();
  }, [user?.teamMemberId]);

  const getMilestoneStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'released':
        return 'from-green-500 to-emerald-500';
      case 'approved':
        return 'from-blue-500 to-cyan-500';
      case 'submitted':
        return 'from-orange-500 to-amber-500';
      case 'in_progress':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const getMilestoneStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'released':
      case 'approved':
        return CheckCircle2;
      case 'submitted':
        return Upload;
      case 'in_progress':
        return Clock;
      default:
        return AlertCircle;
    }
  };

  const calculateProgress = (project: ActiveProject) => {
    const completed = project.milestones.filter(m => m.status === 'released').length;
    return Math.round((completed / project.milestones.length) * 100);
  };

  const toggleTimeTracking = () => {
    setIsTracking(!isTracking);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Projects</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-4xl font-black text-gray-900 mb-2">Active Projects</h1>
        <p className="text-gray-600">
          Manage your ongoing projects and track progress • {activeProjects.length} active
        </p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
      >
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8" />
            <div className="text-3xl font-black">{activeProjects.length}</div>
          </div>
          <div className="text-white/90 font-semibold">Active Projects</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8" />
            <div className="text-3xl font-black">
              ${activeProjects.reduce((sum, p) => sum + p.paidAmount, 0).toLocaleString()}
            </div>
          </div>
          <div className="text-white/90 font-semibold">Earned</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8" />
            <div className="text-3xl font-black">
              {activeProjects.reduce((sum, p) => sum + p.timeTracked, 0)}h
            </div>
          </div>
          <div className="text-white/90 font-semibold">Tracked</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8" />
            <div className="text-3xl font-black">
              {Math.round(
                activeProjects.reduce((sum, p) => sum + calculateProgress(p), 0) /
                  activeProjects.length
              )}%
            </div>
          </div>
          <div className="text-white/90 font-semibold">Avg Progress</div>
        </div>
      </motion.div>

      {/* Time Tracker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Time Tracker</h3>
              <p className="text-gray-600 text-sm">
                {isTracking ? 'Currently tracking time' : 'Start tracking your work time'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-3xl font-black text-gray-900">
                {formatTime(trackingTime)}
              </div>
              <div className="text-sm text-gray-600">Today's work</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTimeTracking}
              className={`p-4 rounded-xl font-bold flex items-center space-x-2 ${
                isTracking
                  ? 'bg-red-500 text-white'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              }`}
            >
              {isTracking ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Start</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Projects List */}
      <div className="space-y-6">
        {activeProjects.map((project, idx) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * idx }}
            className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden"
          >
            {/* Project Header */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-gray-600 mb-3">{project.description}</p>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                        {project.clientName[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{project.clientName}</div>
                        <div className="text-sm text-gray-600">Client</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                    ${project.paidAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    of ${project.totalBudget.toLocaleString()}
                  </div>
                  <div className="w-48 bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
                      style={{ width: `${calculateProgress(project)}%` }}
                    />
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {calculateProgress(project)}% Complete
                  </div>
                </div>
              </div>

              {/* Project Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-gray-600">Time Tracked</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{project.timeTracked}h</div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-gray-600">Files Shared</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{project.filesShared}</div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <span className="text-xs text-gray-600">Messages</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{project.messagesCount}</div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-orange-600" />
                    <span className="text-xs text-gray-600">Milestones</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {project.milestones.filter(m => m.status === 'released').length}/{project.milestones.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div className="p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Milestones</h4>
              <div className="space-y-4">
                {project.milestones.map((milestone) => {
                  const StatusIcon = getMilestoneStatusIcon(milestone.status);
                  const statusColor = getMilestoneStatusColor(milestone.status);

                  return (
                    <motion.div
                      key={milestone.id}
                      whileHover={{ scale: 1.01 }}
                      className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border-2 border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`w-10 h-10 bg-gradient-to-br ${statusColor} rounded-lg flex items-center justify-center`}>
                              <StatusIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h5 className="font-bold text-gray-900">{milestone.title}</h5>
                              <p className="text-sm text-gray-600">{milestone.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 ml-13 text-sm">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">
                                Due: {new Date(milestone.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                            {milestone.completedDate && (
                              <div className="flex items-center space-x-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span className="text-green-600">
                                  Completed: {new Date(milestone.completedDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          <div className="text-2xl font-black text-gray-900 mb-1">
                            ${milestone.amount.toLocaleString()}
                          </div>
                          <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            milestone.status === 'released'
                              ? 'bg-green-100 text-green-700'
                              : milestone.status === 'approved'
                              ? 'bg-blue-100 text-blue-700'
                              : milestone.status === 'submitted'
                              ? 'bg-orange-100 text-orange-700'
                              : milestone.status === 'in_progress'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {milestone.status.replace('_', ' ')}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {milestone.status === 'in_progress' && (
                        <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-200">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Submit Work</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-semibold"
                          >
                            <Send className="w-4 h-4" />
                            <span>Message Client</span>
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Project Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center space-x-2 text-blue-600 font-semibold"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat with Client</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center space-x-2 text-purple-600 font-semibold"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Files</span>
                </motion.button>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-xl font-semibold shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Generate Invoice</span>
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ActiveProjects;
