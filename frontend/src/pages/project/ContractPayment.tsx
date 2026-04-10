/**
 * Contract & Payment Page - Escrow System
 *
 * Fully dynamic milestone-based payment management with escrow protection.
 * Features:
 * - Real-time escrow status tracking
 * - 14-day auto-approval system with countdown
 * - Milestone payment cards with deliverables
 * - Payment history and statistics
 * - Role-based actions (client vs developer)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import {
  DollarSign,
  Clock,
  CheckCircle,
  Calendar,
  Shield,
  RefreshCw,
  Download,
  FileText,
  AlertCircle,
  CreditCard,
  Loader2,
  Eye,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ProjectPageLayout } from '@/layouts/ProjectPageLayout';
import { ApprovePaymentModal } from '@/components/milestone/ApprovePaymentModal';
import { FeedbackModal } from '@/components/milestone/FeedbackModal';
import { OpenDisputeModal } from '@/components/milestone/OpenDisputeModal';
import { PaymentMethodForm } from '@/components/subscription/PaymentMethodForm';
import { AccessDenied, AccessLoading } from '@/components/project';
import { RejectedProjectBanner } from '@/components/project/RejectedProjectBanner';
import { StripeProvider } from '@/contexts/StripeContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectRole } from '@/hooks/useProjectRole';
import { getProject, getProjectMilestones, requestMilestoneFeedback, getProjectStats } from '@/services/projectService';
import { escrowService } from '@/services/escrowService';
import { paymentService } from '@/services/paymentService';
import { socketClient } from '@/lib/websocket-client';
import { generateInvoicePDF } from '@/utils/invoiceGenerator';
import type { Milestone } from '@/types/milestone';
import type { EscrowStatus } from '@/types/escrow';
import type { PaymentResponseDto } from '@/services/paymentService';
import type { Project } from '@/types/project';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface EscrowMilestoneData {
  milestone: Milestone;
  escrowStatus: EscrowStatus;
  paymentId?: string;
  fundedAt?: string;
  autoApprovalDate?: Date;
  daysUntilAutoApproval?: number;
  deliverableFiles?: string[];
  deliverableDescription?: string;
  submittedAt?: string;
}

interface PaymentStats {
  totalBudget: number;
  inEscrow: number;
  released: number;
  pendingApprovals: number;
  nextAutoApproval?: Date;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Map milestone status to escrow status
 */
const getEscrowStatus = (milestone: Milestone, payment?: PaymentResponseDto): EscrowStatus => {
  if (!payment) return 'unfunded';

  // Check payment's escrow_status from backend
  const paymentEscrowStatus = (payment as any).escrow_status;

  if (payment.status === 'completed' && milestone.status === 'approved') {
    return 'released';
  }

  if (paymentEscrowStatus === 'released') {
    return 'released';
  }

  // Show 'submitted' status when deliverables are submitted OR escrow is held (ready for review)
  if (milestone.status === 'submitted' || paymentEscrowStatus === 'held') {
    return 'submitted';
  }

  if (milestone.status === 'feedback_required' || paymentEscrowStatus === 'changes_requested') {
    return 'changes_requested';
  }

  if (milestone.status === 'approved') {
    return 'approved';
  }

  // When payment is authorized/pending, show funded or work_in_progress
  if (payment.status === 'pending' || payment.status === 'processing' || paymentEscrowStatus === 'authorized') {
    return milestone.status === 'in_progress' ? 'work_in_progress' : 'funded';
  }

  return 'unfunded';
};

/**
 * Calculate auto-approval date (14 days from submission)
 */
const calculateAutoApprovalDate = (submittedAt: string | undefined): Date | undefined => {
  if (!submittedAt) return undefined;
  const submitted = new Date(submittedAt);
  const autoApprovalDate = new Date(submitted);
  autoApprovalDate.setDate(autoApprovalDate.getDate() + 14);
  return autoApprovalDate;
};

/**
 * Calculate days until auto-approval
 */
const calculateDaysUntilAutoApproval = (autoApprovalDate: Date | undefined): number => {
  if (!autoApprovalDate) return 0;
  const now = new Date();
  const diffTime = autoApprovalDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

/**
 * Format countdown timer (DD:HH:MM)
 */
const formatCountdown = (autoApprovalDate: Date | undefined): string => {
  if (!autoApprovalDate) return '--:--:--';

  const now = new Date();
  const diff = autoApprovalDate.getTime() - now.getTime();

  if (diff <= 0) return '00:00:00';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${days}d ${hours}h ${minutes}m`;
};

/**
 * Get escrow status color
 */
const getStatusColor = (status: EscrowStatus): string => {
  const colors: Record<EscrowStatus, string> = {
    unfunded: 'gray',
    funded: 'blue',
    work_in_progress: 'yellow',
    submitted: 'purple',
    changes_requested: 'orange',
    approved: 'green',
    released: 'emerald',
    disputed: 'red',
    refunded: 'red',
    expired: 'gray',
  };
  return colors[status] || 'gray';
};

/**
 * Get escrow status label
 */
const getStatusLabel = (status: EscrowStatus): string => {
  const labels: Record<EscrowStatus, string> = {
    unfunded: 'Not Funded',
    funded: 'Funded',
    work_in_progress: 'In Progress',
    submitted: 'Under Review',
    changes_requested: 'Changes Requested',
    approved: 'Approved',
    released: 'Payment Released',
    disputed: 'Disputed',
    refunded: 'Refunded',
    expired: 'Expired',
  };
  return labels[status] || status;
};

/**
 * Get approval phase based on days remaining
 */
const getApprovalPhase = (days: number): { phase: string; color: string } => {
  if (days >= 10) return { phase: 'Review Period (Days 1-7)', color: 'blue' };
  if (days >= 7) return { phase: 'Decision Time (Days 8-9)', color: 'yellow' };
  if (days >= 3) return { phase: 'Final Review (Days 10-11)', color: 'orange' };
  return { phase: 'Auto-Approval Soon (Days 12-14)', color: 'red' };
};

// ============================================
// MAIN COMPONENT
// ============================================

export const ContractPayment: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { companyId } = useCompany();
  const { user } = useAuth();

  // Check project membership
  const { hasAccess, loading: roleLoading } = useProjectRole(projectId);

  const [activeTab, setActiveTab] = useState<'milestones' | 'history'>('milestones');

  // Data state
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<EscrowMilestoneData[]>([]);
  const [payments, setPayments] = useState<PaymentResponseDto[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalBudget: 0,
    inEscrow: 0,
    released: 0,
    pendingApprovals: 0,
  });

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [fundingMilestoneId, setFundingMilestoneId] = useState<string | null>(null);

  // Action loading states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Project approval state
  const [approvalStatus, setApprovalStatus] = useState<string>('approved');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Check if project is rejected
  const isProjectRejected = approvalStatus === 'rejected';

  // Determine user role based on project data
  const isClient = project?.client_id === user?.id;
  const userRole: 'client' | 'developer' = isClient ? 'client' : 'developer';

  // ============================================
  // DATA FETCHING
  // ============================================

  /**
   * Fetch all data
   */
  const fetchData = useCallback(async (showLoader = true) => {
    if (!projectId) return;

    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      // Fetch project to determine user role
      const projectData = await getProject(projectId);
      setProject(projectData);

      // Fetch milestones
      const { milestones: milestonesData } = await getProjectMilestones(projectId);

      // Fetch payments for the project
      let paymentsData: PaymentResponseDto[] = [];
      try {
        if (companyId) {
          paymentsData = await paymentService.getProjectPayments(companyId, projectId);
        }
      } catch (error) {
        // Could not fetch payments - continue with empty array
      }

      // Combine milestone and payment data
      const enrichedMilestones: EscrowMilestoneData[] = milestonesData.map((milestone) => {
        const payment = paymentsData.find((p) => p.milestone_id === milestone.id);
        const escrowStatus = getEscrowStatus(milestone, payment);
        const autoApprovalDate = calculateAutoApprovalDate(milestone.submittedAt);
        const daysUntilAutoApproval = calculateDaysUntilAutoApproval(autoApprovalDate);

        return {
          milestone,
          escrowStatus,
          paymentId: payment?.id,
          fundedAt: payment?.created_at,
          autoApprovalDate,
          daysUntilAutoApproval,
        };
      });

      setMilestones(enrichedMilestones);
      setPayments(paymentsData);

      // Calculate statistics
      const totalBudget = milestonesData.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
      // Count payments that are in escrow (pending/processing status OR escrow_status is authorized/held)
      // Note: Payment amounts are stored in dollars in the database
      const inEscrow = paymentsData
        .filter((p) => {
          const isEscrowHeld = (p as any).escrow_status === 'authorized' || (p as any).escrow_status === 'held';
          const isPendingOrProcessing = p.status === 'pending' || p.status === 'processing';
          return isEscrowHeld || isPendingOrProcessing;
        })
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const released = paymentsData
        .filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const pendingApprovals = enrichedMilestones.filter(
        (m) => m.escrowStatus === 'submitted'
      ).length;
      const nextAutoApproval = enrichedMilestones
        .filter((m) => m.autoApprovalDate)
        .sort((a, b) => {
          const dateA = a.autoApprovalDate?.getTime() || 0;
          const dateB = b.autoApprovalDate?.getTime() || 0;
          return dateA - dateB;
        })[0]?.autoApprovalDate;

      setStats({
        totalBudget,
        inEscrow,
        released,
        pendingApprovals,
        nextAutoApproval,
      });

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.message || 'Failed to load payment data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch project approval status
  useEffect(() => {
    if (projectId) {
      getProjectStats(projectId).then((data) => {
        setApprovalStatus(data.project?.approval_status || 'approved');
        setRejectionReason(data.project?.approval_rejection_reason || '');
      }).catch(console.error);
    }
  }, [projectId]);

  /**
   * Auto-refresh every 60 seconds for countdown timers
   */
  useEffect(() => {
    const interval = setInterval(() => {
      // Update countdown timers without full refresh
      setMilestones((prev) =>
        prev.map((m) => ({
          ...m,
          daysUntilAutoApproval: calculateDaysUntilAutoApproval(m.autoApprovalDate),
        }))
      );
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  // ============================================
  // WEBSOCKET REAL-TIME UPDATES
  // ============================================

  useEffect(() => {
    if (!projectId || !user?.id) return;

    // Connect to WebSocket and join project room
    socketClient.connect(user.id, projectId);
    socketClient.joinRoom(`project-${projectId}`);

    // Handle payment funded (milestone funded in escrow)
    socketClient.onPaymentFunded((data) => {
      // Refresh data to get updated milestone and payment info
      fetchData(false);

      // Show toast if funded by someone else
      if (data.userId !== user.id) {
        toast.info('Milestone Funded', {
          description: `$${data.amount?.toLocaleString()} has been deposited to escrow`,
        });
      }
    });

    // Handle payment released (milestone approved)
    socketClient.onPaymentReleased((data) => {
      fetchData(false);

      if (data.userId !== user.id) {
        toast.success('Payment Released', {
          description: `$${data.amount?.toLocaleString()} has been released${data.isAutoApproved ? ' (auto-approved)' : ''}`,
        });
      }
    });

    // Handle deliverable submitted
    socketClient.onDeliverableSubmitted((data) => {
      fetchData(false);

      if (data.userId !== user.id) {
        toast.info('Deliverables Submitted', {
          description: 'A milestone deliverable has been submitted for review',
        });
      }
    });

    // Handle changes requested
    socketClient.onChangesRequested((data) => {
      fetchData(false);

      if (data.userId !== user.id) {
        toast.warning('Changes Requested', {
          description: `Changes have been requested. New deadline extended by ${data.extendedDays} days`,
        });
      }
    });

    // Handle payment refunded
    socketClient.onPaymentRefunded((data) => {
      fetchData(false);

      if (data.userId !== user.id) {
        toast.error('Payment Refunded', {
          description: `$${data.amount?.toLocaleString()} has been refunded`,
        });
      }
    });

    // Handle general payment updates
    socketClient.onPaymentUpdated((data) => {
      fetchData(false);

      if (data.userId !== user.id) {
        toast.info('Payment Updated', {
          description: 'Payment status has been updated',
        });
      }
    });

    // Cleanup on unmount
    return () => {
      socketClient.offPaymentEvents();
    };
  }, [projectId, user?.id, fetchData]);

  // ============================================
  // ACTION HANDLERS
  // ============================================

  /**
   * Handle deposit funds to escrow
   */
  const handleDepositFunds = async (milestoneId: string) => {
    setFundingMilestoneId(milestoneId);
    setShowPaymentMethodModal(true);
  };

  /**
   * Handle payment method added and fund milestone
   */
  const handlePaymentMethodAdded = async (paymentMethodId: string) => {
    if (!fundingMilestoneId) return;

    setActionLoading('fund');
    try {
      const milestone = milestones.find((m) => m.milestone.id === fundingMilestoneId);
      if (!milestone) throw new Error('Milestone not found');

      const amount = milestone.milestone.amount || 0;

      await escrowService.fundMilestone(
        fundingMilestoneId,
        amount, // Backend handles conversion to cents
        paymentMethodId
      );

      toast.success('Funds deposited to escrow successfully');
      setShowPaymentMethodModal(false);
      setFundingMilestoneId(null);
      await fetchData(false);
    } catch (error: any) {
      console.error('Error funding milestone:', error);
      toast.error(error.message || 'Failed to deposit funds');
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Handle approve milestone and release payment
   */
  const handleApproveMilestone = async (notes?: string) => {
    if (!selectedMilestone) return;

    setActionLoading('approve');
    try {
      await escrowService.approveDeliverable(selectedMilestone.id, notes);
      toast.success('Milestone approved and payment released');
      setShowApproveModal(false);
      setSelectedMilestone(null);
      await fetchData(false);
    } catch (error: any) {
      console.error('Error approving milestone:', error);
      toast.error(error.message || 'Failed to approve milestone');
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Handle request changes
   */
  const handleRequestChanges = async (feedback: string) => {
    if (!selectedMilestone) return;

    setActionLoading('feedback');
    try {
      await requestMilestoneFeedback(selectedMilestone.id, feedback);
      toast.success('Change request sent to developer');
      setShowFeedbackModal(false);
      setSelectedMilestone(null);
      await fetchData(false);
    } catch (error: any) {
      console.error('Error requesting changes:', error);
      toast.error(error.message || 'Failed to request changes');
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Handle open dispute
   */
  const handleOpenDispute = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setShowDisputeModal(true);
  };

  /**
   * Handle submit dispute
   */
  const handleSubmitDispute = async (data: {
    reason: string;
    description: string;
    evidence?: string[];
    requestedResolution?: string;
  }) => {
    if (!selectedMilestone) return;

    setActionLoading('dispute');
    try {
      await escrowService.openDispute({
        milestoneId: selectedMilestone.id,
        reason: data.reason,
        description: data.description,
        evidence: data.evidence,
        requestedResolution: data.requestedResolution,
      });

      toast.success('Dispute opened successfully');
      setShowDisputeModal(false);
      setSelectedMilestone(null);
      await fetchData(false);
    } catch (error: any) {
      console.error('Error opening dispute:', error);
      toast.error(error.message || 'Failed to open dispute');
      throw error; // Re-throw so modal knows it failed
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    fetchData(false);
  };

  /**
   * Handle download invoice
   */
  const handleDownloadInvoice = (payment: PaymentResponseDto) => {
    const milestone = milestones.find((m) => m.milestone.id === payment.milestone_id);

    generateInvoicePDF({
      payment,
      milestoneName: milestone?.milestone.title || 'Milestone Payment',
      projectName: project?.name || 'Project',
      clientName: project?.client_name || undefined,
      companyName: 'Team@Once',
    });

    toast.success('Invoice downloaded successfully');
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  /**
   * Render stats cards
   */
  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {[
        {
          label: 'Total Budget',
          value: `$${stats.totalBudget.toLocaleString()}`,
          icon: DollarSign,
          color: 'blue',
          description: 'Project total',
        },
        {
          label: 'In Escrow',
          value: `$${stats.inEscrow.toLocaleString()}`,
          icon: Shield,
          color: 'purple',
          description: 'Held securely',
        },
        {
          label: 'Released',
          value: `$${stats.released.toLocaleString()}`,
          icon: CheckCircle,
          color: 'green',
          description: 'Completed payments',
        },
        {
          label: 'Pending Approvals',
          value: stats.pendingApprovals.toString(),
          icon: Clock,
          color: 'orange',
          description: stats.nextAutoApproval
            ? `Next: ${formatCountdown(stats.nextAutoApproval)}`
            : 'No pending',
        },
      ].map((stat, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
            </div>
          </div>
          <p className="text-xs text-gray-500">{stat.description}</p>
        </motion.div>
      ))}
    </div>
  );

  /**
   * Render milestone card
   */
  const renderMilestoneCard = (data: EscrowMilestoneData, index: number) => {
    const { milestone, escrowStatus, autoApprovalDate, daysUntilAutoApproval } = data;
    const statusColor = getStatusColor(escrowStatus);
    const phase = daysUntilAutoApproval ? getApprovalPhase(daysUntilAutoApproval) : null;

    return (
      <motion.div
        key={milestone.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
              {milestone.description && (
                <div
                  className="text-sm text-gray-600 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: milestone.description }}
                />
              )}
            </div>
            <span
              className={`px-4 py-2 rounded-full text-xs font-bold border-2 bg-${statusColor}-50 text-${statusColor}-700 border-${statusColor}-200`}
            >
              {getStatusLabel(escrowStatus)}
            </span>
          </div>

          {/* Amount & Due Date */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-bold text-gray-900">
                ${(milestone.amount || 0).toLocaleString()}
              </span>
            </div>
            {milestone.dueDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">
                  Due: {new Date(milestone.dueDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Auto-Approval Countdown */}
        {escrowStatus === 'submitted' && autoApprovalDate && phase && (
          <div className={`p-4 bg-${phase.color}-50 border-b border-${phase.color}-200`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Clock className={`w-5 h-5 text-${phase.color}-600`} />
                  <span className="font-bold text-gray-900">
                    Auto-Approval: {formatCountdown(autoApprovalDate)}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${phase.color}-100 text-${phase.color}-700`}>
                  {phase.phase}
                </span>
              </div>
              <span className="text-sm text-gray-600">
                {daysUntilAutoApproval} days remaining
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-2 bg-white rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((14 - (daysUntilAutoApproval || 0)) / 14) * 100}%` }}
                className={`h-full bg-gradient-to-r from-${phase.color}-400 to-${phase.color}-600`}
              />
            </div>
          </div>
        )}

        {/* Deliverables */}
        {milestone.deliverables && milestone.deliverables.length > 0 && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Deliverables
            </h4>
            <ul className="space-y-2">
              {milestone.deliverables.map((deliverable: any, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-gray-700">
                    {typeof deliverable === 'string' ? (
                      deliverable
                    ) : (
                      <div>
                        <span className="font-medium">{deliverable.title || deliverable.fileName || 'Deliverable'}</span>
                        {deliverable.description && (
                          <p className="text-xs text-gray-500 mt-1">{deliverable.description}</p>
                        )}
                        {deliverable.fileUrl && (
                          <a
                            href={deliverable.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-1 block"
                          >
                            View File ({deliverable.fileSize ? `${Math.round(deliverable.fileSize / 1024)} KB` : 'Download'})
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 bg-gray-50">
          <div className="flex items-center gap-3">
            {/* Client Actions */}
            {userRole === 'client' && (
              <>
                {escrowStatus === 'unfunded' && (
                  <button
                    onClick={() => handleDepositFunds(milestone.id)}
                    disabled={actionLoading === 'fund'}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    Deposit to Escrow
                  </button>
                )}

                {escrowStatus === 'submitted' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedMilestone(milestone);
                        setShowApproveModal(true);
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve & Release
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMilestone(milestone);
                        setShowFeedbackModal(true);
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <AlertCircle className="w-5 h-5" />
                      Request Changes
                    </button>
                  </>
                )}

                {(escrowStatus === 'funded' || escrowStatus === 'work_in_progress') && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedMilestone(milestone);
                        setShowApproveModal(true);
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Release Payment
                    </button>
                    <button
                      onClick={() => handleOpenDispute(milestone)}
                      className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Open Dispute
                    </button>
                  </>
                )}
              </>
            )}

            {/* Developer Status */}
            {userRole === 'developer' && (
              <>
                {(escrowStatus === 'work_in_progress' || escrowStatus === 'changes_requested') && (
                  <div className="flex-1 px-4 py-3 bg-yellow-50 border-2 border-yellow-200 rounded-xl flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-700">
                      {escrowStatus === 'changes_requested' ? 'Changes Requested' : 'In Progress'}
                    </span>
                  </div>
                )}

                {escrowStatus === 'funded' && (
                  <div className="flex-1 px-4 py-3 bg-green-50 border-2 border-green-200 rounded-xl flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-700">Funded - Awaiting Review</span>
                  </div>
                )}

                {escrowStatus === 'submitted' && (
                  <div className="flex-1 px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-center justify-center gap-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-700">Under Review</span>
                  </div>
                )}
              </>
            )}

            {/* View Status for both */}
            {(escrowStatus === 'approved' || escrowStatus === 'released') && (
              <div className="flex-1 px-4 py-3 bg-green-50 border-2 border-green-200 rounded-xl flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-700">
                  {escrowStatus === 'released' ? 'Payment Released' : 'Approved'}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  /**
   * Render payment history table
   */
  const renderPaymentHistory = () => (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Milestone
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <p className="text-gray-500">No payment history yet</p>
                </td>
              </tr>
            ) : (
              payments.map((payment) => {
                const milestone = milestones.find((m) => m.milestone.id === payment.milestone_id);
                return (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {milestone?.milestone.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.payment_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      ${Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          payment.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDownloadInvoice(payment)}
                        className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Invoice
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ============================================
  // RENDER
  // ============================================

  // Access check
  if (roleLoading) {
    return <AccessLoading />;
  }

  if (!hasAccess) {
    return <AccessDenied message="You don't have permission to access contract & payment for this project." />;
  }

  if (loading) {
    return (
      <ProjectPageLayout title="Contract & Payment" subtitle="Loading payment information...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ProjectPageLayout>
    );
  }

  return (
    <ProjectPageLayout
      title="Contract & Payment"
      subtitle="Secure milestone-based payments with escrow protection"
    >
      {/* Rejected Project Banner */}
      {isProjectRejected && (
        <RejectedProjectBanner
          reason={rejectionReason}
          className="mb-6"
        />
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-end mb-8">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {renderStats()}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="flex items-center border-b border-gray-200 bg-gray-50">
          {[
            { id: 'milestones', label: 'Milestone Payments', icon: Shield },
            { id: 'history', label: 'Payment History', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 border-b-4 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'milestones' && (
            <div className="space-y-6">
              {milestones.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No milestones found</p>
                  <p className="text-gray-400 text-sm">Create milestones to start tracking payments</p>
                </div>
              ) : (
                milestones.map((data, index) => renderMilestoneCard(data, index))
              )}
            </div>
          )}

          {activeTab === 'history' && renderPaymentHistory()}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showApproveModal && selectedMilestone && (
          <ApprovePaymentModal
            isOpen={showApproveModal}
            onClose={() => {
              setShowApproveModal(false);
              setSelectedMilestone(null);
            }}
            onApprove={handleApproveMilestone}
            milestone={selectedMilestone}
            loading={actionLoading === 'approve'}
          />
        )}

        {showFeedbackModal && selectedMilestone && (
          <FeedbackModal
            isOpen={showFeedbackModal}
            onClose={() => {
              setShowFeedbackModal(false);
              setSelectedMilestone(null);
            }}
            onSubmit={handleRequestChanges}
            milestone={selectedMilestone}
            loading={actionLoading === 'feedback'}
          />
        )}

        {showDisputeModal && selectedMilestone && (
          <OpenDisputeModal
            isOpen={showDisputeModal}
            onClose={() => {
              setShowDisputeModal(false);
              setSelectedMilestone(null);
            }}
            onSubmit={handleSubmitDispute}
            milestone={selectedMilestone}
            loading={actionLoading === 'dispute'}
          />
        )}

        {showPaymentMethodModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => {
              if (actionLoading !== 'fund') {
                setShowPaymentMethodModal(false);
                setFundingMilestoneId(null);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative"
              style={{ zIndex: 51 }}
            >
              <StripeProvider>
                <PaymentMethodForm
                  onSuccess={handlePaymentMethodAdded}
                  onCancel={() => {
                    setShowPaymentMethodModal(false);
                    setFundingMilestoneId(null);
                  }}
                  submitButtonText="Add Payment & Fund Escrow"
                />
              </StripeProvider>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ProjectPageLayout>
  );
};

export default ContractPayment;
