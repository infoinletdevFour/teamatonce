import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import {
  Calendar, CheckCircle2, Clock, Download, MessageSquare,
  AlertTriangle, Eye, ThumbsUp, ThumbsDown, X, FileText,
  DollarSign, Loader2, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { StatusBadge, SecurityIndicator } from '@/components/payment';
import { milestoneService } from '@/services/milestoneService';
import { escrowService } from '@/services/escrowService';
import { useCompany } from '@/contexts/CompanyContext';
import type { Milestone as PaymentMilestone } from '@/types/payment';
import type { Milestone, DeliverableFile } from '@/types/milestone';

const MilestoneManagement: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { company } = useCompany();
  const companyId = company?.id || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<PaymentMilestone | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    if (projectId && companyId) {
      loadMilestones();
    }
  }, [projectId, companyId]);

  const loadMilestones = async () => {
    if (!projectId || !companyId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await milestoneService.getProjectMilestones(companyId, projectId);

      // Convert to payment milestone format
      const convertedMilestones: PaymentMilestone[] = (data.milestones || []).map((m: Milestone) => ({
        id: m.id,
        projectId: m.id, // Use milestone id as projectId for now
        title: m.title,
        description: m.description || '',
        amount: Number(m.amount) || 0, // Parse string to number (milestones stored in dollars)
        currency: 'USD' as const,
        status: convertMilestoneStatus(m.status),
        dueDate: m.dueDate ? new Date(m.dueDate) : new Date(),
        completedDate: m.status === 'completed' ? new Date() : undefined,
        deliverables: (m.deliverables || []).map((d, idx) => {
          const isFileObject = typeof d === 'object' && 'title' in d;
          return {
            id: `d-${m.id}-${idx}`,
            milestoneId: m.id,
            title: isFileObject ? (d as DeliverableFile).title : (d as string),
            description: isFileObject ? ((d as DeliverableFile).description || '') : '',
            fileName: isFileObject ? (d as DeliverableFile).fileName : undefined,
            fileSize: isFileObject ? (d as DeliverableFile).fileSize : undefined,
            fileUrl: isFileObject ? (d as DeliverableFile).fileUrl : undefined,
            uploadedAt: isFileObject ? new Date((d as DeliverableFile).uploadedAt) : undefined,
          };
        }),
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt),
      }));

      setMilestones(convertedMilestones);
    } catch (err) {
      console.error('Error loading milestones:', err);
      setError('Failed to load milestones. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const convertMilestoneStatus = (status: string): 'pending' | 'in-progress' | 'review' | 'completed' | 'paid' | 'disputed' => {
    switch (status) {
      case 'pending': return 'pending';
      case 'in_progress': return 'in-progress';
      case 'submitted': return 'review';
      case 'feedback_required': return 'review';
      case 'completed': return 'completed';
      case 'approved': return 'paid';
      default: return 'pending';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleApprove = async () => {
    if (!selectedMilestone || !companyId) return;

    try {
      setProcessingAction(true);

      // Use escrowService to approve deliverable and release payment in one call
      // This captures the Stripe payment and transfers funds to developer
      await escrowService.approveDeliverable(selectedMilestone.id, approvalNotes || undefined);

      setShowApprovalModal(false);
      setApprovalNotes('');
      setSelectedMilestone(null);
      loadMilestones(); // Refresh data
    } catch (err: any) {
      console.error('Error approving milestone and releasing payment:', err);
      alert(err.message || 'Failed to approve milestone and release payment. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async () => {
    if (!selectedMilestone || !companyId || !approvalNotes.trim()) {
      alert('Please explain what needs to be changed');
      return;
    }

    try {
      setProcessingAction(true);

      // Use escrowService to request changes - this extends the deadline and keeps funds in escrow
      await escrowService.requestChanges(selectedMilestone.id, approvalNotes, 7);

      setShowApprovalModal(false);
      setApprovalNotes('');
      setSelectedMilestone(null);
      loadMilestones(); // Refresh data
    } catch (err: any) {
      console.error('Error requesting changes:', err);
      alert(err.message || 'Failed to request changes. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDispute = async () => {
    if (!selectedMilestone || !disputeReason.trim()) {
      alert('Please provide a reason for the dispute');
      return;
    }

    try {
      setProcessingAction(true);

      // Use escrowService to open a dispute - this pauses the payment and starts resolution process
      await escrowService.openDispute({
        milestoneId: selectedMilestone.id,
        reason: 'quality_issue', // Default reason, could be made selectable
        description: disputeReason,
      });

      alert('Dispute raised successfully. Our team will review within 24 hours.');
      setShowDisputeModal(false);
      setDisputeReason('');
      setSelectedMilestone(null);
      loadMilestones(); // Refresh data
    } catch (err: any) {
      console.error('Error opening dispute:', err);
      alert(err.message || 'Failed to open dispute. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading milestones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Milestones</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadMilestones}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">Milestone Management</h1>
              <p className="text-gray-600 mt-1">Track progress, review deliverables, and approve payments</p>
            </div>
          </div>
          <SecurityIndicator level="high" text="All deliverables are verified and secure" />
        </motion.div>

        {/* Timeline View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Timeline</h2>

          {milestones.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-gray-200">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Milestones Yet</h3>
              <p className="text-gray-600">Milestones will appear here once they are created for this project.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 via-purple-600 to-pink-600" />

              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative pl-20"
                  >
                    {/* Timeline Dot */}
                    <div className="absolute left-4 top-6 w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-4 border-white shadow-lg flex items-center justify-center z-10">
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>

                    {/* Milestone Card */}
                    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900">{milestone.title}</h3>
                              <StatusBadge status={milestone.status} />
                            </div>
                            <p className="text-gray-600 mb-3">{milestone.description}</p>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                              {formatCurrency(milestone.amount, milestone.currency)}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">
                              Due: {format(milestone.dueDate, 'MMM dd, yyyy')}
                            </span>
                          </div>
                          {milestone.completedDate && (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <span className="text-gray-600">
                                Completed: {format(milestone.completedDate, 'MMM dd, yyyy')}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">
                              {milestone.deliverables.length} Deliverable{milestone.deliverables.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        {/* Deliverables */}
                        {milestone.deliverables.length > 0 && (
                          <div className="bg-gray-50 rounded-xl p-4 mb-4">
                            <div className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <FileText className="w-5 h-5 text-blue-600" />
                              Deliverables
                            </div>
                            <div className="space-y-3">
                              {milestone.deliverables.map((deliverable) => (
                                <motion.div
                                  key={deliverable.id}
                                  whileHover={{ scale: 1.01 }}
                                  className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-300 transition-colors"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-900 mb-1">{deliverable.title}</h4>
                                      {deliverable.description && (
                                        <p className="text-sm text-gray-600 mb-2">{deliverable.description}</p>
                                      )}
                                      {deliverable.fileName && (
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                          <span className="flex items-center gap-1">
                                            <FileText className="w-3 h-3" />
                                            {deliverable.fileName}
                                          </span>
                                          <span>{formatFileSize(deliverable.fileSize || 0)}</span>
                                          {deliverable.uploadedAt && (
                                            <span>{format(deliverable.uploadedAt, 'MMM dd, yyyy')}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    {deliverable.fileUrl && (
                                      <div className="flex gap-2 ml-4">
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                          title="Preview"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                                          title="Download"
                                        >
                                          <Download className="w-4 h-4" />
                                        </motion.button>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                          {milestone.status === 'review' && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setSelectedMilestone(milestone);
                                  setShowApprovalModal(true);
                                }}
                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
                              >
                                <ThumbsUp className="w-5 h-5" />
                                Approve & Release Payment
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setSelectedMilestone(milestone);
                                  setShowApprovalModal(true);
                                }}
                                className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
                              >
                                <ThumbsDown className="w-5 h-5" />
                                Request Changes
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setSelectedMilestone(milestone);
                                  setShowDisputeModal(true);
                                }}
                                className="px-6 bg-red-100 text-red-700 py-3 rounded-xl font-semibold hover:bg-red-200 transition-colors flex items-center gap-2"
                              >
                                <AlertTriangle className="w-5 h-5" />
                                Dispute
                              </motion.button>
                            </>
                          )}
                          {milestone.status === 'in-progress' && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2"
                            >
                              <MessageSquare className="w-5 h-5" />
                              Message Developer
                            </motion.button>
                          )}
                          {milestone.status === 'completed' && (
                            <div className="flex-1 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-green-700 font-semibold">
                              <CheckCircle2 className="w-5 h-5" />
                              Milestone Completed
                            </div>
                          )}
                          {milestone.status === 'paid' && (
                            <div className="flex-1 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-emerald-700 font-semibold">
                              <DollarSign className="w-5 h-5" />
                              Payment Released
                            </div>
                          )}
                          {milestone.status === 'pending' && (
                            <div className="flex-1 bg-gray-50 border-2 border-gray-200 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-gray-600 font-semibold">
                              <Clock className="w-5 h-5" />
                              Awaiting Start
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Approval Modal */}
        <AnimatePresence>
          {showApprovalModal && selectedMilestone && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowApprovalModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Review Milestone</h3>
                  <button
                    onClick={() => setShowApprovalModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200 mb-4">
                    <h4 className="font-bold text-gray-900 mb-2">{selectedMilestone.title}</h4>
                    <div className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {formatCurrency(selectedMilestone.amount, selectedMilestone.currency)}
                    </div>
                  </div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Feedback / Approval Notes
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none h-32 resize-none"
                    placeholder="Provide feedback on the deliverables..."
                  />
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleApprove}
                    disabled={processingAction}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processingAction ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ThumbsUp className="w-5 h-5" />
                    )}
                    Approve & Release Payment
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReject}
                    disabled={processingAction}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 disabled:opacity-50"
                  >
                    <ThumbsDown className="w-5 h-5 inline mr-2" />
                    Request Changes
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dispute Modal */}
        <AnimatePresence>
          {showDisputeModal && selectedMilestone && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDisputeModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="w-7 h-7 text-red-600" />
                    Raise Dispute
                  </h3>
                  <button
                    onClick={() => setShowDisputeModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-800">
                    Raising a dispute will pause payments and notify our mediation team.
                    Please provide detailed information to help resolve the issue.
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason for Dispute
                  </label>
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-red-500 focus:outline-none h-32 resize-none"
                    placeholder="Explain the issue in detail..."
                  />
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDispute}
                    disabled={processingAction}
                    className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processingAction ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Dispute'
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDisputeModal(false)}
                    disabled={processingAction}
                    className="px-8 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 disabled:opacity-50"
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MilestoneManagement;
