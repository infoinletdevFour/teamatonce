import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Send,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Download,
  Search,
  Filter,
  PlayCircle,
  Package,
  CheckSquare,
  Lock,
  Settings,
} from 'lucide-react';

// API Service
import {
  getProjectMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  getProject,
  approveMilestone,
  requestMilestoneFeedback,
  updateMilestoneStatus,
} from '@/services/projectService';

// Types
import type { Milestone, MilestoneStatus, CreateMilestoneData } from '@/types/milestone';

// Components
import { MilestoneFormModal } from '@/components/milestone/MilestoneFormModal';
import { SubmitMilestoneModal } from '@/components/milestone/SubmitMilestoneModal';
import { FeedbackModal } from '@/components/milestone/FeedbackModal';
import { ApprovePaymentModal } from '@/components/milestone/ApprovePaymentModal';
import { MilestoneAdjustmentRequestModal } from '@/components/MilestoneAdjustmentRequestModal';
import { MilestoneAdjustmentReviewModal } from '@/components/MilestoneAdjustmentReviewModal';
import { ProjectPageLayout } from '@/layouts/ProjectPageLayout';
import { AccessDenied, AccessLoading } from '@/components/project';
import { RejectedProjectBanner } from '@/components/project/RejectedProjectBanner';

// Services
import { getProjectStats } from '@/services/projectService';
import {
  getAdjustmentRequestsByMilestone,
  MilestoneAdjustmentRequest,
  withdrawAdjustmentRequest,
} from '@/services/milestoneAdjustmentService';

// Contexts
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';

// Hooks
import { useProjectRole } from '@/hooks/useProjectRole';

// WebSocket
import { socketClient } from '@/lib/websocket-client';

/**
 * Dynamic Milestone Approval Page
 *
 * Features:
 * - Real API integration (NO mock data)
 * - Role-based permissions (client vs developer)
 * - Full CRUD operations
 * - Status filtering and search
 * - Complete modal integrations
 * - Loading states and error handling
 * - Toast notifications
 */

type FilterStatus = 'all' | MilestoneStatus;

interface ModalState {
  form: { isOpen: boolean; editingMilestone: Milestone | null };
  submit: { isOpen: boolean; milestone: Milestone | null };
  feedback: { isOpen: boolean; milestone: Milestone | null };
  approve: { isOpen: boolean; milestone: Milestone | null };
}

export const MilestoneApproval: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { companyId } = useCompany();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check project membership
  const { hasAccess, loading: roleLoading } = useProjectRole(projectId);

  // State
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [approvalStatus, setApprovalStatus] = useState<string>(''); // Project approval status (admin)
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [projectStatus, setProjectStatus] = useState<string>(''); // Project workflow status
  const [planApprovedAt, setPlanApprovedAt] = useState<string | null>(null); // Milestone plan approval timestamp
  const [isPlanApproved, setIsPlanApproved] = useState<boolean>(false); // Whether milestone plan is approved

  // Check if project is rejected
  const isProjectRejected = approvalStatus === 'rejected';

  // Modal states
  const [modals, setModals] = useState<ModalState>({
    form: { isOpen: false, editingMilestone: null },
    submit: { isOpen: false, milestone: null },
    feedback: { isOpen: false, milestone: null },
    approve: { isOpen: false, milestone: null },
  });

  // Adjustment Request Modal
  const [adjustmentModal, setAdjustmentModal] = useState<{ isOpen: boolean; milestone: Milestone | null }>({
    isOpen: false,
    milestone: null,
  });

  // Track pending adjustment requests for each milestone
  const [pendingAdjustments, setPendingAdjustments] = useState<Record<string, MilestoneAdjustmentRequest>>({});

  // Track ALL adjustment requests (pending, approved, rejected) for history display
  const [allAdjustments, setAllAdjustments] = useState<Record<string, MilestoneAdjustmentRequest[]>>({});

  // Adjustment Review Modal (for client)
  const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; request: MilestoneAdjustmentRequest | null }>({
    isOpen: false,
    request: null,
  });

  // Permissions
  const isClient = user?.role === 'client';
  const isDeveloper = ['seller', 'developer', 'designer', 'project-manager'].includes(user?.role || '');

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchMilestones = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const response = await getProjectMilestones(projectId);
      const fetchedMilestones = response.milestones || [];
      setMilestones(fetchedMilestones);

      // Load ALL adjustment requests for each milestone
      const adjustmentPromises = fetchedMilestones.map(async (milestone) => {
        try {
          const requests = await getAdjustmentRequestsByMilestone(milestone.id);
          return { milestoneId: milestone.id, requests };
        } catch (err) {
          return { milestoneId: milestone.id, requests: [] };
        }
      });

      const adjustmentResults = await Promise.all(adjustmentPromises);

      // Separate pending adjustments and all adjustments
      const pendingMap: Record<string, MilestoneAdjustmentRequest> = {};
      const allMap: Record<string, MilestoneAdjustmentRequest[]> = {};

      adjustmentResults.forEach(result => {
        // Store all requests for history
        allMap[result.milestoneId] = result.requests;

        // Store pending request separately for quick access
        const pending = result.requests.find(r => r.status === 'pending');
        if (pending) {
          pendingMap[result.milestoneId] = pending;
        }
      });

      setPendingAdjustments(pendingMap);
      setAllAdjustments(allMap);
    } catch (error: any) {
      console.error('Failed to fetch milestones:', error);
      toast.error('Failed to load milestones', {
        description: error.message || 'Please try again later',
      });
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  // Fetch project approval status and workflow status
  useEffect(() => {
    if (projectId) {
      // Get project stats for approval status
      getProjectStats(projectId).then((data) => {
        setApprovalStatus(data.project?.approval_status || '');
        setRejectionReason(data.project?.approval_rejection_reason || '');
      }).catch(console.error);

      // Get full project data for workflow status and plan approval timestamp
      getProject(projectId).then((projectData) => {
        setProjectStatus(projectData.status || '');
        const approvedAt = projectData.milestone_plan_approved_at || projectData.milestonePlanApprovedAt || null;
        setPlanApprovedAt(approvedAt);
        setIsPlanApproved(!!approvedAt); // Plan is approved if timestamp exists
      }).catch(console.error);
    }
  }, [projectId]);

  // ============================================
  // WEBSOCKET REAL-TIME UPDATES
  // ============================================

  useEffect(() => {
    if (!projectId || !user?.id) return;

    // Connect to WebSocket and join project room
    socketClient.connect(user.id, projectId);
    socketClient.joinRoom(`project-${projectId}`);

    // Handle milestone created
    socketClient.onMilestoneCreated((data) => {
      if (data.milestone?.projectId === projectId) {
        setMilestones((prev) => {
          // Check if milestone already exists
          const exists = prev.some((m) => m.id === data.milestone.id);
          if (exists) return prev;
          return [...prev, data.milestone];
        });

        // Show toast if created by someone else
        if (data.userId !== user.id) {
          toast.info('New milestone created', {
            description: `"${data.milestone.title}" was added`,
          });
        }
      }
    });

    // Handle milestone updated
    socketClient.onMilestoneUpdated((data) => {
      if (data.milestone?.projectId === projectId) {
        setMilestones((prev) =>
          prev.map((m) => (m.id === data.milestone.id ? { ...m, ...data.milestone } : m))
        );

        if (data.userId !== user.id) {
          toast.info('Milestone updated', {
            description: `"${data.milestone.title}" was modified`,
          });
        }
      }
    });

    // Handle milestone deleted
    socketClient.onMilestoneDeleted((data) => {
      setMilestones((prev) => prev.filter((m) => m.id !== data.milestoneId));

      if (data.userId !== user.id) {
        toast.info('Milestone deleted', {
          description: 'A milestone was removed',
        });
      }
    });

    // Handle milestone submitted for approval
    socketClient.onMilestoneSubmitted((data) => {
      if (data.milestone?.projectId === projectId) {
        setMilestones((prev) =>
          prev.map((m) => (m.id === data.milestone.id ? { ...m, ...data.milestone } : m))
        );

        if (data.userId !== user.id) {
          toast.info('Milestone submitted for review', {
            description: `"${data.milestone.title}" is ready for approval`,
          });
        }
      }
    });

    // Handle milestone approved
    socketClient.onMilestoneApproved((data) => {
      if (data.milestone?.projectId === projectId) {
        setMilestones((prev) =>
          prev.map((m) => (m.id === data.milestone.id ? { ...m, ...data.milestone } : m))
        );

        if (data.userId !== user.id) {
          toast.success('Milestone approved!', {
            description: `"${data.milestone.title}" has been approved`,
          });
        }
      }
    });

    // Handle milestone feedback required
    socketClient.onMilestoneFeedbackRequired((data) => {
      if (data.milestone?.projectId === projectId) {
        setMilestones((prev) =>
          prev.map((m) => (m.id === data.milestone.id ? { ...m, ...data.milestone } : m))
        );

        if (data.userId !== user.id) {
          toast.warning('Changes requested', {
            description: `Feedback was requested for "${data.milestone.title}"`,
          });
        }
      }
    });

    // Cleanup on unmount
    return () => {
      socketClient.leaveRoom(`project-${projectId}`);
      socketClient.offMilestoneEvents();
    };
  }, [projectId, user?.id]);

  // ============================================
  // FILE DOWNLOAD HANDLER
  // ============================================

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      toast.error('Failed to download file', {
        description: 'Please try again later',
      });
    }
  };

  // ============================================
  // FILTERED & SEARCHED DATA
  // ============================================

  const filteredMilestones = milestones.filter((milestone) => {
    // After plan approval:
    // - Show all milestones (in_progress, submitted, completed, etc.) - they're locked and being worked on
    // - Also show NEW pending milestones added by client (for developer review)

    // No filtering needed when plan is approved - show all milestones
    // The action buttons will handle what the user can do based on status

    // Filter by status
    const statusMatch = filterStatus === 'all' || milestone.status === filterStatus;

    // Filter by search query
    const searchMatch =
      !searchQuery ||
      milestone.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      milestone.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && searchMatch;
  });

  // ============================================
  // STATS CALCULATIONS
  // ============================================

  const stats = {
    total: milestones.length,
    pending: milestones.filter((m) => m.status === 'pending').length,
    inProgress: milestones.filter((m) => m.status === 'in_progress').length,
    submitted: milestones.filter((m) => m.status === 'submitted').length,
    approved: milestones.filter((m) => m.status === 'approved').length,
    totalBudget: milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0), // Parse string to number
    releasedBudget: milestones
      .filter((m) => m.status === 'approved')
      .reduce((sum, m) => sum + (Number(m.amount) || 0), 0), // Parse string to number
  };

  // ============================================
  // MODAL HANDLERS
  // ============================================

  const openModal = (type: keyof ModalState, milestone?: Milestone) => {
    setModals((prev) => ({
      ...prev,
      [type]: {
        isOpen: true,
        milestone: milestone || null,
        editingMilestone: milestone || null,
      },
    }));
  };

  const closeModal = (type: keyof ModalState) => {
    setModals((prev) => ({
      ...prev,
      [type]: { isOpen: false, milestone: null, editingMilestone: null },
    }));
  };

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  const handleCreateMilestone = async (data: CreateMilestoneData) => {
    if (!projectId) return;

    try {
      setActionLoading(true);
      await createMilestone(projectId, data);
      toast.success('Milestone created successfully!');
      await fetchMilestones();
      closeModal('form');
    } catch (error: any) {
      console.error('Failed to create milestone:', error);
      toast.error('Failed to create milestone', {
        description: error.message || 'Please try again',
      });
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateMilestone = async (data: CreateMilestoneData) => {
    const milestone = modals.form.editingMilestone;
    if (!milestone) return;

    try {
      setActionLoading(true);
      await updateMilestone(milestone.id, data);
      toast.success('Milestone updated successfully!');
      await fetchMilestones();
      closeModal('form');
    } catch (error: any) {
      console.error('Failed to update milestone:', error);
      toast.error('Failed to update milestone', {
        description: error.message || 'Please try again',
      });
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      await deleteMilestone(milestoneId);
      toast.success('Milestone deleted successfully');
      await fetchMilestones();
    } catch (error: any) {
      console.error('Failed to delete milestone:', error);
      toast.error('Failed to delete milestone', {
        description: error.message || 'Please try again',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // STATUS OPERATIONS
  // ============================================

  const handleMarkInProgress = async (milestoneId: string) => {
    try {
      setActionLoading(true);
      await updateMilestoneStatus(milestoneId, 'in_progress');
      toast.success('Milestone marked as in progress');
      await fetchMilestones();
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status', {
        description: error.message || 'Please try again',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitMilestone = async (notes?: string, file?: File) => {
    const milestone = modals.submit.milestone;
    if (!milestone || !projectId) return;

    try {
      setActionLoading(true);

      // Use the new API with file upload
      const { milestoneService } = await import('@/services/milestoneService');
      await milestoneService.submitMilestoneWithFile(projectId, milestone.id, notes, file);

      toast.success('Milestone submitted for review!', {
        description: 'The client will be notified',
      });
      await fetchMilestones();
      closeModal('submit');
    } catch (error: any) {
      console.error('Failed to submit milestone:', error);
      toast.error('Failed to submit milestone', {
        description: error.message || 'Please try again',
      });
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestFeedback = async (feedback: string) => {
    const milestone = modals.feedback.milestone;
    if (!milestone) return;

    try {
      setActionLoading(true);
      await requestMilestoneFeedback(milestone.id, feedback);
      toast.success('Feedback sent to developer', {
        description: 'They will be notified about the requested changes',
      });
      await fetchMilestones();
      closeModal('feedback');
    } catch (error: any) {
      console.error('Failed to send feedback:', error);
      toast.error('Failed to send feedback', {
        description: error.message || 'Please try again',
      });
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveMilestone = async (notes?: string) => {
    const milestone = modals.approve.milestone;
    if (!milestone) return;

    try {
      setActionLoading(true);
      await approveMilestone(milestone.id, { notes });
      toast.success('Milestone approved!', {
        description: `Payment of $${milestone.amount?.toLocaleString()} will be released`,
      });
      await fetchMilestones();
      closeModal('approve');
    } catch (error: any) {
      console.error('Failed to approve milestone:', error);
      toast.error('Failed to approve milestone', {
        description: error.message || 'Please try again',
      });
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const getStatusColor = (status: MilestoneStatus) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'feedback_required':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending':
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return CheckCircle;
      case 'feedback_required':
        return AlertCircle;
      case 'submitted':
        return Clock;
      case 'in_progress':
        return TrendingUp;
      case 'pending':
      default:
        return Target;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderActionButtons = (milestone: Milestone) => {
    const actions = [];

    // Developer Actions
    if (isDeveloper) {
      // Show "Start Work" only if plan is NOT approved OR if it's not a newly added milestone
      // Newly added milestones after approval will show "Accept & Start" button instead
      if (milestone.status === 'pending' && !isPlanApproved) {
        actions.push(
          <button
            key="start"
            onClick={() => handleMarkInProgress(milestone.id)}
            disabled={actionLoading}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-semibold hover:bg-blue-200 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Start Work</span>
          </button>
        );
      }

      // Submit button - show for in_progress or feedback_required milestones
      if (milestone.status === 'in_progress' || milestone.status === 'feedback_required') {
        actions.push(
          <button
            key="submit"
            onClick={() => openModal('submit', milestone)}
            disabled={actionLoading}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Submit for Review</span>
          </button>
        );
      }

      // Only allow editing if milestone plan is NOT approved yet
      if (
        !isPlanApproved &&
        (milestone.status === 'pending' || milestone.status === 'in_progress')
      ) {
        actions.push(
          <button
            key="edit"
            onClick={() => openModal('form', milestone)}
            disabled={actionLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Edit milestone"
          >
            <Edit2 className="w-4 h-4 text-gray-600" />
          </button>
        );
      }
    }

    // Client Actions
    if (isClient && milestone.status === 'submitted') {
      actions.push(
        <button
          key="feedback"
          onClick={() => openModal('feedback', milestone)}
          disabled={actionLoading}
          className="px-4 py-2 bg-orange-100 text-orange-700 rounded-xl font-semibold hover:bg-orange-200 transition-colors flex items-center space-x-2 disabled:opacity-50"
        >
          <ThumbsDown className="w-4 h-4" />
          <span>Request Changes</span>
        </button>,
        <button
          key="approve"
          onClick={() => openModal('approve', milestone)}
          disabled={actionLoading}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          <ThumbsUp className="w-4 h-4" />
          <span>Approve & Release Payment</span>
        </button>
      );
    }

    // Delete button (only if milestone plan is NOT approved yet)
    if (
      (isDeveloper || isClient) &&
      !isPlanApproved &&
      (milestone.status === 'pending' || milestone.status === 'in_progress')
    ) {
      actions.push(
        <button
          key="delete"
          onClick={() => handleDeleteMilestone(milestone.id)}
          disabled={actionLoading}
          className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
          title="Delete milestone"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      );
    }

    // Handle newly added milestones after plan approval (status: pending)
    // These need developer review before being added to project
    if (isPlanApproved && milestone.status === 'pending') {
      if (isDeveloper) {
        actions.push(
          <div key="pending-review" className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-md text-sm font-medium border border-red-200">
              <AlertCircle className="w-4 h-4" />
              <span>New - Awaiting Your Review</span>
            </div>
            <button
              onClick={() => handleMarkInProgress(milestone.id)}
              disabled={actionLoading}
              className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Accept & Start</span>
            </button>
            <button
              onClick={() => setAdjustmentModal({ isOpen: true, milestone })}
              disabled={actionLoading}
              className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-md text-sm font-medium hover:bg-orange-200 transition-colors flex items-center gap-1.5"
            >
              <Settings className="w-4 h-4" />
              <span>Request Adjustment</span>
            </button>
          </div>
        );
      } else if (isClient) {
        actions.push(
          <div key="pending-review" className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-md text-sm font-medium border border-yellow-200">
            <Clock className="w-4 h-4" />
            <span>Awaiting Developer Review</span>
          </div>
        );
      }
    }
    // Show locked indicator and adjustment button for locked milestones (when plan is approved)
    // Only for non-pending, non-submitted, non-approved, non-completed milestones
    if (
      isPlanApproved &&
      milestone.status !== 'pending' &&
      milestone.status !== 'submitted' &&
      milestone.status !== 'approved' &&
      milestone.status !== 'completed'
    ) {
      if (isDeveloper || isClient) {
        const hasPendingAdjustment = pendingAdjustments[milestone.id];

        actions.push(
          <div key="locked" className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md text-sm">
              <Lock className="w-4 h-4" />
              <span>Locked</span>
            </div>
            {hasPendingAdjustment ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-md text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  <span>Adjustment Pending</span>
                </div>
                {/* Show withdraw button only to the requester */}
                {hasPendingAdjustment.requestedBy === user?.id && (
                  <button
                    onClick={async () => {
                      if (confirm('Withdraw this adjustment request?')) {
                        try {
                          await withdrawAdjustmentRequest(hasPendingAdjustment.id);
                          toast.success('Adjustment request withdrawn');
                          fetchMilestones();
                        } catch (err: any) {
                          toast.error(err.message || 'Failed to withdraw request');
                        }
                      }
                    }}
                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                    title="Withdraw adjustment request"
                  >
                    Withdraw
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAdjustmentModal({ isOpen: true, milestone })}
                className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-md text-sm font-medium hover:bg-orange-200 transition-colors flex items-center gap-1.5"
                title="Request changes or removal of this milestone"
              >
                <Settings className="w-4 h-4" />
                <span>Request Adjustment</span>
              </button>
            )}
          </div>
        );
      }
    }

    // Show just locked badge for approved/completed milestones (no adjustment button)
    if (
      isPlanApproved &&
      (milestone.status === 'approved' || milestone.status === 'completed')
    ) {
      actions.push(
        <div key="locked" className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          <span>Completed & Locked</span>
        </div>
      );
    }

    return actions;
  };

  // ============================================
  // ACCESS CHECK
  // ============================================

  if (roleLoading) {
    return <AccessLoading />;
  }

  if (!hasAccess) {
    return <AccessDenied message="You don't have permission to access milestone approval for this project." />;
  }

  // ============================================
  // LOADING STATE
  // ============================================

  if (loading) {
    return (
      <ProjectPageLayout title="Milestone Approval" subtitle="Review and approve project milestones">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
            />
            <p className="text-gray-600 font-semibold">Loading milestones...</p>
          </div>
        </div>
      </ProjectPageLayout>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <ProjectPageLayout
      title="Milestone Approval"
      subtitle="Track progress and manage milestone payments"
      headerActions={
        isClient && !isProjectRejected && projectStatus !== 'awarded' ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openModal('form')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>{isPlanApproved ? 'Add New Milestone' : 'Create Milestone'}</span>
          </motion.button>
        ) : null
      }
    >
      {/* Rejected Project Banner */}
      {isProjectRejected && (
        <RejectedProjectBanner
          reason={rejectionReason}
          className="mb-6"
        />
      )}

      {/* Pending Adjustment Requests - For Both Roles */}
      {(() => {
        // Filter pending adjustments to only show requests from OTHER party
        const reviewableAdjustments = Object.entries(pendingAdjustments).filter(([_, request]) => {
          return request.requestedBy !== user?.id; // Only show if someone else requested
        });

        if (reviewableAdjustments.length === 0) return null;

        return (
          <div className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-orange-700" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-orange-900 mb-2 flex items-center gap-2">
                  Milestone Adjustment Requests
                </h3>
                <p className="text-orange-800 mb-4">
                  {reviewableAdjustments.length} milestone{reviewableAdjustments.length > 1 ? 's have' : ' has'} pending adjustment request{reviewableAdjustments.length > 1 ? 's' : ''} that need{reviewableAdjustments.length === 1 ? 's' : ''} your review.
                </p>
                <div className="space-y-3">
                  {reviewableAdjustments.map(([milestoneId, request]) => {
                    const milestone = milestones.find(m => m.id === milestoneId);
                    if (!milestone) return null;

                    return (
                      <div key={milestoneId} className="bg-white rounded-lg p-4 border border-orange-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">{milestone.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Requested {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => setReviewModal({ isOpen: true, request })}
                            className="ml-4 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                          >
                            Review Request
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          {
            label: 'Total Milestones',
            value: stats.total,
            icon: Target,
            color: 'blue',
          },
          {
            label: 'In Progress',
            value: stats.inProgress,
            icon: TrendingUp,
            color: 'blue',
          },
          {
            label: 'Pending Review',
            value: stats.submitted,
            icon: Clock,
            color: 'yellow',
          },
          {
            label: 'Budget Released',
            value: formatCurrency(stats.releasedBudget),
            icon: DollarSign,
            color: 'green',
          },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-gray-900">{stat.value}</p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}
              >
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search milestones..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="feedback_required">Needs Changes</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Milestones List */}
      {filteredMilestones.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border-2 border-gray-200 shadow-lg text-center">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {isPlanApproved ? 'No new milestones to review' : 'No milestones found'}
          </h3>
          <p className="text-gray-600 mb-6">
            {isPlanApproved
              ? 'All milestones are approved and being worked on. New milestones added by client will appear here for your review.'
              : projectStatus === 'awarded'
              ? 'Waiting for developer to submit milestone plan for approval'
              : searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first milestone'}
          </p>
          {isClient && !searchQuery && filterStatus === 'all' && projectStatus !== 'awarded' && (
            <button
              onClick={() => openModal('form')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              {isPlanApproved ? 'Add New Milestone' : 'Create First Milestone'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredMilestones.map((milestone, idx) => {
            const StatusIcon = getStatusIcon(milestone.status);

            const isCompleted = milestone.status === 'approved' || milestone.status === 'completed';

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`rounded-2xl p-6 border-2 shadow-lg hover:shadow-xl transition-all ${
                  isCompleted
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                    : 'bg-white border-gray-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h2
                        onClick={() => navigate(`/company/${companyId}/project/${projectId}/milestone/${milestone.id}/tasks`)}
                        className="text-2xl font-black text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                      >
                        {milestone.title}
                      </h2>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1 ${getStatusColor(
                          milestone.status
                        )}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{milestone.status.replace('_', ' ').toUpperCase()}</span>
                      </span>
                    </div>
                    {milestone.description && (
                      <div
                        className="text-gray-600 mb-3 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: milestone.description }}
                      />
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {formatDate(milestone.dueDate)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>{formatCurrency(milestone.amount)}</span>
                      </div>
                      {milestone.estimatedHours && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{milestone.estimatedHours}h estimated</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-gray-700">Progress</span>
                    <span className="font-bold text-blue-600">{milestone.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${milestone.progress}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                      className={`h-full ${milestone.status === 'approved'
                          ? 'bg-green-500'
                          : milestone.status === 'feedback_required'
                            ? 'bg-red-500'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500'
                        }`}
                    />
                  </div>
                </div>

                {/* Deliverables */}
                {milestone.deliverables && milestone.deliverables.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center space-x-2">
                      <Package className="w-4 h-4" />
                      <span>Deliverables ({milestone.deliverables.length})</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {milestone.deliverables.map((deliverable, idx) => {
                        // Handle both string format (old) and object format (new)
                        const displayName = typeof deliverable === 'string'
                          ? deliverable
                          : (deliverable.title || deliverable.fileName || 'Deliverable');
                        const fileUrl = typeof deliverable === 'object' ? deliverable.fileUrl : null;

                        return (
                          <button
                            key={idx}
                            onClick={() => fileUrl && handleDownloadFile(fileUrl, displayName)}
                            className={`px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200 flex items-center gap-2 ${fileUrl ? 'hover:bg-blue-100 cursor-pointer' : ''} transition-colors`}
                            disabled={!fileUrl}
                            title={fileUrl ? 'Click to download' : undefined}
                          >
                            <FileText className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{displayName}</span>
                            {fileUrl && (
                              <Download className="w-4 h-4 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Acceptance Criteria */}
                {milestone.acceptanceCriteria && milestone.acceptanceCriteria.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center space-x-2">
                      <CheckSquare className="w-4 h-4" />
                      <span>Acceptance Criteria ({milestone.acceptanceCriteria.length})</span>
                    </h3>
                    <div className="space-y-1">
                      {milestone.acceptanceCriteria.map((criteria, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{criteria}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback */}
                {milestone.feedback && (
                  <div className="mb-4 p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
                    <h3 className="font-bold text-orange-900 mb-2 flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Client Feedback</span>
                    </h3>
                    <p className="text-sm text-orange-800">{milestone.feedback}</p>
                  </div>
                )}

                {/* Adjustment History */}
                {(() => {
                  const milestoneAdjustments = allAdjustments[milestone.id] || [];
                  // Filter to show approved and rejected requests (not pending)
                  const completedAdjustments = milestoneAdjustments.filter(
                    req => req.status === 'approved' || req.status === 'rejected'
                  );

                  if (completedAdjustments.length === 0) return null;

                  return (
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-1.5">
                        <Settings className="w-3.5 h-3.5" />
                        <span>Adjustment History ({completedAdjustments.length})</span>
                      </h3>
                      <div className="space-y-2">
                        {completedAdjustments.map((request) => (
                          <div
                            key={request.id}
                            className={`p-3 rounded-lg border ${
                              request.status === 'approved'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                {request.status === 'approved' ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <ThumbsDown className="w-4 h-4 text-red-600" />
                                )}
                                <span
                                  className={`font-semibold text-sm ${
                                    request.status === 'approved' ? 'text-green-900' : 'text-red-900'
                                  }`}
                                >
                                  {request.status === 'approved' ? 'Approved' : 'Rejected'}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(request.reviewedAt || request.updatedAt).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Requested Changes & Response in single line when possible */}
                            <div className="text-xs space-y-1">
                              <div>
                                <span className="font-semibold text-gray-600">Requested: </span>
                                <span
                                  className={request.status === 'approved' ? 'text-green-800' : 'text-red-800'}
                                >
                                  {request.reason}
                                </span>
                              </div>
                              {request.clientResponse && (
                                <div>
                                  <span className="font-semibold text-gray-600">
                                    {request.status === 'approved' ? 'Notes: ' : 'Reason: '}
                                  </span>
                                  <span
                                    className={`font-medium ${
                                      request.status === 'approved' ? 'text-green-800' : 'text-red-800'
                                    }`}
                                  >
                                    {request.clientResponse}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    onClick={() => navigate(`/company/${companyId}/project/${projectId}/milestone/${milestone.id}/tasks`)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>View Tasks</span>
                  </button>
                  <div className="flex items-center space-x-3">
                    {renderActionButtons(milestone)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <MilestoneFormModal
        isOpen={modals.form.isOpen}
        onClose={() => closeModal('form')}
        onSubmit={modals.form.editingMilestone ? handleUpdateMilestone : handleCreateMilestone}
        initialData={
          modals.form.editingMilestone
            ? {
              name: modals.form.editingMilestone.title,
              description: modals.form.editingMilestone.description,
              milestoneType: (modals.form.editingMilestone.milestoneType as any) || 'development',
              orderIndex: modals.form.editingMilestone.orderIndex || 1,
              deliverables: (modals.form.editingMilestone.deliverables || []).map((d) =>
                typeof d === 'string' ? d : (d.title || d.fileName || 'Deliverable')
              ),
              acceptanceCriteria: modals.form.editingMilestone.acceptanceCriteria || [],
              estimatedHours: modals.form.editingMilestone.estimatedHours || undefined,
              dueDate: modals.form.editingMilestone.dueDate || undefined,
              milestoneAmount: modals.form.editingMilestone.amount || undefined,
            }
            : undefined
        }
        isLoading={actionLoading}
        existingMilestones={milestones.length}
      />

      {modals.submit.milestone && (
        <SubmitMilestoneModal
          isOpen={modals.submit.isOpen}
          onClose={() => closeModal('submit')}
          onSubmit={handleSubmitMilestone}
          milestone={modals.submit.milestone}
          loading={actionLoading}
        />
      )}

      {modals.feedback.milestone && (
        <FeedbackModal
          isOpen={modals.feedback.isOpen}
          onClose={() => closeModal('feedback')}
          onSubmit={handleRequestFeedback}
          milestone={modals.feedback.milestone}
          loading={actionLoading}
        />
      )}

      {modals.approve.milestone && (
        <ApprovePaymentModal
          isOpen={modals.approve.isOpen}
          onClose={() => closeModal('approve')}
          onApprove={handleApproveMilestone}
          milestone={modals.approve.milestone}
          loading={actionLoading}
        />
      )}

      {/* Adjustment Request Modal */}
      {adjustmentModal.milestone && (
        <MilestoneAdjustmentRequestModal
          isOpen={adjustmentModal.isOpen}
          onClose={() => setAdjustmentModal({ isOpen: false, milestone: null })}
          milestone={{
            id: adjustmentModal.milestone.id,
            name: adjustmentModal.milestone.title,
            description: adjustmentModal.milestone.description,
            estimatedHours: adjustmentModal.milestone.estimatedHours || 0,
            milestoneAmount: adjustmentModal.milestone.amount || 0,
            dueDate: adjustmentModal.milestone.dueDate || undefined,
            deliverables: Array.isArray(adjustmentModal.milestone.deliverables)
              ? adjustmentModal.milestone.deliverables.map(d => typeof d === 'string' ? d : d.title || d.fileName || 'Deliverable')
              : [],
            acceptanceCriteria: adjustmentModal.milestone.acceptanceCriteria || [],
          }}
          onSuccess={() => {
            setAdjustmentModal({ isOpen: false, milestone: null });
            fetchMilestones();
            toast.success('Adjustment request submitted successfully!');
          }}
        />
      )}

      {/* Adjustment Review Modal (Client) */}
      {reviewModal.request && (() => {
        const apiMilestone = milestones.find(m => m.id === reviewModal.request?.milestoneId);
        if (!apiMilestone) return null;

        // Map API milestone to modal's expected format
        const currentMilestone = {
          id: apiMilestone.id,
          name: apiMilestone.title, // API uses 'title', modal expects 'name'
          description: apiMilestone.description,
          estimatedHours: apiMilestone.estimatedHours || 0,
          milestoneAmount: apiMilestone.amount || 0, // API uses 'amount', modal expects 'milestoneAmount'
          dueDate: apiMilestone.dueDate || undefined,
          deliverables: apiMilestone.deliverables.map(d => typeof d === 'string' ? d : d.title),
          acceptanceCriteria: apiMilestone.acceptanceCriteria,
        };

        return (
          <MilestoneAdjustmentReviewModal
            isOpen={reviewModal.isOpen}
            onClose={() => setReviewModal({ isOpen: false, request: null })}
            adjustmentRequest={reviewModal.request}
            currentMilestone={currentMilestone}
            onSuccess={() => {
              setReviewModal({ isOpen: false, request: null });
              fetchMilestones();
              toast.success('Adjustment request reviewed successfully!');
            }}
          />
        );
      })()}
    </ProjectPageLayout>
  );
};

export default MilestoneApproval;
