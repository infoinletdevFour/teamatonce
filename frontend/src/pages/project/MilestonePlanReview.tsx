import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  ArrowLeft,
  DollarSign,
  Clock,
  Calendar,
  Package,
  Target,
  FileCheck,
  TrendingUp,
  AlertCircle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Edit3,
} from 'lucide-react';
import { ProjectPageLayout } from '@/layouts/ProjectPageLayout';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { socketClient } from '@/lib/websocket-client';
import { useAuth } from '@/contexts/AuthContext';
import {
  approveMilestonePlan,
  requestMilestonePlanChanges,
  rejectMilestonePlan,
  getLatestMilestonePlan,
  type MilestonePlan,
  type ProposedMilestone,
} from '@/services/milestonePlanService';
import { getProject } from '@/services/projectService';

const MILESTONE_TYPES = [
  { value: 'planning', label: 'Planning', icon: Target, color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700' },
  { value: 'design', label: 'Design', icon: Package, color: 'purple', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-700' },
  { value: 'development', label: 'Development', icon: FileCheck, color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700' },
  { value: 'testing', label: 'Testing', icon: CheckCircle, color: 'orange', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-700' },
  { value: 'deployment', label: 'Deployment', icon: TrendingUp, color: 'pink', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', textColor: 'text-pink-700' },
  { value: 'maintenance', label: 'Maintenance', icon: Clock, color: 'gray', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-700' },
];

export const MilestonePlanReview: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { company } = useCompany();
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [plan, setPlan] = useState<MilestonePlan | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null);

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Form data
  const [approvalNotes, setApprovalNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Load project and plan
  useEffect(() => {
    const loadData = async () => {
      if (!projectId || !company?.id) return;

      try {
        setLoading(true);

        // Load project details
        const projectData = await getProject(projectId);
        setProject(projectData);

        // Load milestone plan
        const planData = await getLatestMilestonePlan(projectId);
        setPlan(planData);

        if (!planData) {
          toast.error('No milestone plan found for this project');
        }
      } catch (error: any) {
        console.error('Failed to load data:', error);
        toast.error(error.message || 'Failed to load milestone plan');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId, company?.id]);

  // WebSocket Integration for Real-Time Updates
  useEffect(() => {
    if (!projectId || !user?.id || !company?.id) return;

    // Connect to WebSocket and join project room
    socketClient.connect(user.id, projectId);
    socketClient.joinProject(projectId, user.id);

    // Listen for plan submitted event (developer submitted plan)
    const handlePlanSubmitted = (data: any) => {
      console.log('Milestone plan submitted:', data);
      toast.success('Developer submitted a new milestone plan for review');

      // Reload the plan
      getLatestMilestonePlan(projectId).then(planData => {
        setPlan(planData);
        if (!planData) {
          toast.error('No milestone plan found');
        }
      });
    };

    // Listen for plan updated event (developer made changes)
    const handlePlanUpdated = (data: any) => {
      console.log('Milestone plan updated:', data);
      toast.info('Developer updated the milestone plan');

      // Reload the plan
      getLatestMilestonePlan(projectId).then(planData => {
        setPlan(planData);
      });
    };

    // Register event listeners
    socketClient.onMilestonePlanSubmitted(handlePlanSubmitted);
    socketClient.onMilestonePlanUpdated(handlePlanUpdated);

    // Cleanup on unmount
    return () => {
      socketClient.offMilestonePlanEvents();
      socketClient.leaveProject(projectId);
    };
  }, [projectId, user?.id, company?.id]);

  // Calculate totals
  const totalBudget = plan?.milestones.reduce((sum, m) => sum + (m.milestoneAmount || 0), 0) || 0;
  const totalHours = plan?.milestones.reduce((sum, m) => sum + (m.estimatedHours || 0), 0) || 0;

  // Handle approve
  const handleApprove = async () => {
    if (!plan) return;

    try {
      setProcessing(true);

      await approveMilestonePlan(plan.id, approvalNotes);

      toast.success('Milestone plan approved! Project can now begin.');
      setShowApproveModal(false);

      // Navigate to project dashboard
      setTimeout(() => {
        navigate(`/company/${company?.id}/project/${projectId}/dashboard`);
      }, 1500);
    } catch (error: any) {
      console.error('Failed to approve:', error);
      toast.error(error.message || 'Failed to approve milestone plan');
    } finally {
      setProcessing(false);
    }
  };

  // Handle request changes
  const handleRequestChanges = async () => {
    if (!plan || !feedback.trim()) {
      toast.error('Please provide feedback');
      return;
    }

    try {
      setProcessing(true);

      await requestMilestonePlanChanges(plan.id, feedback);

      toast.success('Changes requested. Developer has been notified.');
      setShowChangesModal(false);

      // Reload plan
      const updatedPlan = await getLatestMilestonePlan(projectId!);
      setPlan(updatedPlan);
    } catch (error: any) {
      console.error('Failed to request changes:', error);
      toast.error(error.message || 'Failed to request changes');
    } finally {
      setProcessing(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!plan || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(true);

      await rejectMilestonePlan(plan.id, rejectionReason);

      toast.success('Milestone plan rejected. Developer has been notified.');
      setShowRejectModal(false);

      // Navigate back to project dashboard
      setTimeout(() => {
        navigate(`/company/${company?.id}/project/${projectId}/dashboard`);
      }, 1500);
    } catch (error: any) {
      console.error('Failed to reject:', error);
      toast.error(error.message || 'Failed to reject milestone plan');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <ProjectPageLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </ProjectPageLayout>
    );
  }

  if (!plan) {
    return (
      <ProjectPageLayout>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Milestone Plan Found</h2>
          <p className="text-gray-600 mb-4">
            The developer hasn't submitted a milestone plan yet.
          </p>
          <button
            onClick={() => navigate(`/company/${company?.id}/project/${projectId}/dashboard`)}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </button>
        </div>
      </ProjectPageLayout>
    );
  }

  const canReview = plan.status === 'pending_review';

  return (
    <ProjectPageLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/company/${company?.id}/project/${projectId}/dashboard`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Milestone Plan Review
              </h1>
              <p className="text-gray-600">
                Review the milestone plan submitted by the developer
              </p>
              <div className="mt-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  plan.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                  plan.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700' :
                  plan.status === 'changes_requested' ? 'bg-orange-100 text-orange-700' :
                  plan.status === 'approved' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {plan.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            {canReview && (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => setShowChangesModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Request Changes
                </button>
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Plan
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Total Budget</span>
            </div>
            <p className="text-3xl font-bold text-blue-900">${totalBudget.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Total Hours</span>
            </div>
            <p className="text-3xl font-bold text-purple-900">{totalHours}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Avg Rate</span>
            </div>
            <p className="text-3xl font-bold text-green-900">
              ${totalHours > 0 ? Math.round(totalBudget / totalHours) : 0}/hr
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Milestones</span>
            </div>
            <p className="text-3xl font-bold text-orange-900">{plan.milestones.length}</p>
          </div>
        </motion.div>

        {/* Alert if changes requested */}
        {plan.status === 'changes_requested' && plan.clientFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900 mb-1">Changes Requested</p>
                <p className="text-sm text-orange-700">{plan.clientFeedback}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Milestones */}
        <div className="space-y-4">
          {plan.milestones.map((milestone, index) => {
            const typeInfo = MILESTONE_TYPES.find(t => t.value === milestone.milestoneType) || MILESTONE_TYPES[2];
            const Icon = typeInfo.icon;
            const isExpanded = expandedMilestone === index;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Milestone Header */}
                <div
                  className={`p-5 cursor-pointer hover:bg-gray-50 transition-colors ${typeInfo.bgColor} border-b ${typeInfo.borderColor}`}
                  onClick={() => setExpandedMilestone(isExpanded ? null : index)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${typeInfo.bgColor} border ${typeInfo.borderColor}`}>
                      <Icon className={`w-6 h-6 ${typeInfo.textColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-500">Milestone {index + 1}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.bgColor} ${typeInfo.textColor} font-medium`}>
                          {typeInfo.label}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {milestone.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {milestone.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-6 text-center">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Budget</p>
                        <p className="text-lg font-bold text-gray-900">${milestone.milestoneAmount?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Hours</p>
                        <p className="text-lg font-bold text-gray-900">{milestone.estimatedHours}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Rate</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${milestone.estimatedHours ? Math.round(milestone.milestoneAmount / milestone.estimatedHours) : 0}/hr
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Milestone Details (Expanded) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-200"
                    >
                      <div className="p-6 space-y-6">
                        {/* Full Description */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                          <p className="text-gray-700 leading-relaxed">{milestone.description}</p>
                        </div>

                        {/* Due Date */}
                        {milestone.dueDate && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Expected Completion</h4>
                            <div className="flex items-center gap-2 text-gray-700">
                              <Calendar className="w-4 h-4" />
                              {new Date(milestone.dueDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        )}

                        {/* Deliverables */}
                        {milestone.deliverables && milestone.deliverables.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Deliverables</h4>
                            <ul className="space-y-2">
                              {milestone.deliverables.filter(d => d.trim()).map((deliverable, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-700">{deliverable}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Acceptance Criteria */}
                        {milestone.acceptanceCriteria && milestone.acceptanceCriteria.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Acceptance Criteria</h4>
                            <ul className="space-y-2">
                              {milestone.acceptanceCriteria.filter(c => c.trim()).map((criterion, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <Target className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-700">{criterion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Payment Info */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Payment Amount</p>
                            <p className="text-2xl font-bold text-gray-900">${milestone.milestoneAmount?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Estimated Effort</p>
                            <p className="text-2xl font-bold text-gray-900">{milestone.estimatedHours} hours</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Timeline Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-6 bg-white rounded-xl border-2 border-gray-200 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900">Project Timeline</h3>
          </div>
          <div className="space-y-4">
            {plan.milestones.map((milestone, index) => {
              const colors = [
                'from-blue-500 to-blue-600',
                'from-purple-500 to-purple-600',
                'from-pink-500 to-pink-600',
                'from-orange-500 to-orange-600',
                'from-green-500 to-green-600',
                'from-indigo-500 to-indigo-600',
              ];
              const gradient = colors[index % colors.length];

              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-20 text-right">
                    <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                      Phase {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className={`h-12 bg-gradient-to-r ${gradient} rounded-xl flex items-center px-5 shadow-md hover:shadow-lg transition-shadow`}>
                      <span className="text-white font-bold text-base">
                        {milestone.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-24 text-right">
                    <div className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-lg">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-bold text-gray-700">{milestone.estimatedHours}h</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Approve Modal */}
        <AnimatePresence>
          {showApproveModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowApproveModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl p-6 max-w-md w-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <ThumbsUp className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Approve Milestone Plan
                  </h3>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Ready to start?</strong> By approving this plan, actual milestones will be created and the developer can begin work on the project.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Approval Notes (Optional)
                    </label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Add any notes or feedback..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowApproveModal(false)}
                    disabled={processing}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Request Changes Modal */}
        <AnimatePresence>
          {showChangesModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowChangesModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl p-6 max-w-md w-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Edit3 className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Request Changes
                  </h3>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-800">
                      Provide specific feedback on what needs to be changed. The developer will be notified and can resubmit an updated plan.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feedback *
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Please be specific about what needs to change..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowChangesModal(false)}
                    disabled={processing}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestChanges}
                    disabled={processing || !feedback.trim()}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        Send Feedback
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reject Modal */}
        <AnimatePresence>
          {showRejectModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowRejectModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl p-6 max-w-md w-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-red-100 rounded-full">
                    <ThumbsDown className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Reject Milestone Plan
                  </h3>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Warning:</strong> Rejecting this plan means the developer will need to create an entirely new milestone plan from scratch.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason *
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why you're rejecting this plan..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    disabled={processing}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={processing || !rejectionReason.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Reject Plan
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProjectPageLayout>
  );
};

export default MilestonePlanReview;
