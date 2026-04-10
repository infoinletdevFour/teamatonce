import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  DollarSign,
  Clock,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  MilestoneAdjustmentRequest,
  approveAdjustmentRequest,
  rejectAdjustmentRequest,
} from '@/services/milestoneAdjustmentService';

interface Milestone {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  milestoneAmount: number;
  dueDate?: string;
  deliverables: string[];
  acceptanceCriteria: string[];
}

interface MilestoneAdjustmentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  adjustmentRequest: MilestoneAdjustmentRequest;
  currentMilestone: Milestone;
  onSuccess?: () => void;
}

export const MilestoneAdjustmentReviewModal: React.FC<
  MilestoneAdjustmentReviewModalProps
> = ({ isOpen, onClose, adjustmentRequest, currentMilestone, onSuccess }) => {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  const { changes } = adjustmentRequest;

  const handleApprove = async () => {
    try {
      setApproving(true);
      await approveAdjustmentRequest(adjustmentRequest.id, approvalNotes);
      toast.success('Adjustment approved! Milestone has been updated.');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to approve adjustment:', error);
      toast.error(error.message || 'Failed to approve adjustment');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setRejecting(true);
      await rejectAdjustmentRequest(adjustmentRequest.id, rejectReason);
      toast.success('Adjustment rejected. Developer has been notified.');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to reject adjustment:', error);
      toast.error(error.message || 'Failed to reject adjustment');
    } finally {
      setRejecting(false);
    }
  };

  const renderChangeComparison = (
    label: string,
    icon: React.ReactNode,
    oldValue: any,
    newValue: any,
    hasChanged: boolean,
    formatter?: (val: any) => string
  ) => {
    if (!hasChanged) return null;

    const formatValue = formatter || ((val: any) => String(val));
    const isIncrease = typeof newValue === 'number' && typeof oldValue === 'number' && newValue > oldValue;
    const isDecrease = typeof newValue === 'number' && typeof oldValue === 'number' && newValue < oldValue;

    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <span className="font-semibold text-gray-900">{label}</span>
          {isIncrease && <TrendingUp className="w-4 h-4 text-red-500" />}
          {isDecrease && <TrendingDown className="w-4 h-4 text-green-500" />}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Current</p>
            <p className="text-lg font-semibold text-gray-600 line-through">
              {formatValue(oldValue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Proposed</p>
            <p className={`text-lg font-bold ${isIncrease ? 'text-red-600' : isDecrease ? 'text-green-600' : 'text-blue-600'}`}>
              {formatValue(newValue)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderArrayComparison = (
    label: string,
    icon: React.ReactNode,
    oldArray: string[],
    newArray: string[] | undefined,
    hasChanged: boolean
  ) => {
    if (!hasChanged || !newArray) return null;

    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <span className="font-semibold text-gray-900">{label}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-2">Current</p>
            <ul className="list-disc list-inside space-y-1">
              {oldArray.map((item, idx) => (
                <li key={idx} className="text-sm text-gray-600 line-through">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Proposed</p>
            <ul className="list-disc list-inside space-y-1">
              {newArray.map((item, idx) => (
                <li key={idx} className="text-sm text-blue-700 font-medium">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl max-w-4xl w-full my-8 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Review Milestone Adjustment</h2>
              <p className="text-sm text-gray-600 mt-1">
                Developer requested changes to: <span className="font-semibold">{currentMilestone.name}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Developer's Reason */}
              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-2">Developer's Reason:</p>
                    <p className="text-blue-800">{adjustmentRequest.reason}</p>
                  </div>
                </div>
              </div>

              {/* Proposed Changes */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Proposed Changes:</h3>
                <div className="space-y-4">
                  {renderChangeComparison(
                    'Milestone Name',
                    <FileText className="w-4 h-4 text-gray-600" />,
                    currentMilestone.name,
                    changes.name,
                    !!changes.name
                  )}

                  {renderChangeComparison(
                    'Description',
                    <FileText className="w-4 h-4 text-gray-600" />,
                    currentMilestone.description,
                    changes.description,
                    !!changes.description
                  )}

                  {renderChangeComparison(
                    'Estimated Hours',
                    <Clock className="w-4 h-4 text-gray-600" />,
                    currentMilestone.estimatedHours,
                    changes.estimatedHours,
                    changes.estimatedHours !== undefined,
                    (val) => `${val}h`
                  )}

                  {renderChangeComparison(
                    'Budget',
                    <DollarSign className="w-4 h-4 text-gray-600" />,
                    currentMilestone.milestoneAmount,
                    changes.milestoneAmount,
                    changes.milestoneAmount !== undefined,
                    (val) => `$${val.toLocaleString()}`
                  )}

                  {renderChangeComparison(
                    'Due Date',
                    <Calendar className="w-4 h-4 text-gray-600" />,
                    currentMilestone.dueDate || 'Not set',
                    changes.dueDate,
                    !!changes.dueDate,
                    (val) => val === 'Not set' ? val : new Date(val).toLocaleDateString()
                  )}

                  {renderArrayComparison(
                    'Deliverables',
                    <CheckCircle className="w-4 h-4 text-gray-600" />,
                    currentMilestone.deliverables,
                    changes.deliverables,
                    !!changes.deliverables
                  )}

                  {renderArrayComparison(
                    'Acceptance Criteria',
                    <CheckCircle className="w-4 h-4 text-gray-600" />,
                    currentMilestone.acceptanceCriteria,
                    changes.acceptanceCriteria,
                    !!changes.acceptanceCriteria
                  )}
                </div>
              </div>

              {/* Approve Section */}
              {!showRejectForm && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Approval Notes (Optional)
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Add any notes for the developer (optional)"
                  />
                </div>
              )}

              {/* Reject Form */}
              {showRejectForm && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border-2 border-red-200 rounded-lg"
                >
                  <label className="block text-sm font-semibold text-red-900 mb-2">
                    Reason for Rejection <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Explain why you're rejecting these changes..."
                    autoFocus
                  />
                  <p className="text-xs text-red-700 mt-2">
                    Developer will see this reason and can submit a revised request
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              disabled={approving || rejecting}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <div className="flex gap-3">
              {!showRejectForm ? (
                <>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    disabled={approving || rejecting}
                    className="px-6 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center gap-2"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={approving || rejecting}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                  >
                    {approving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <ThumbsUp className="w-4 h-4" />
                        Approve Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowRejectForm(false)}
                    disabled={rejecting}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    Cancel Rejection
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={rejecting || !rejectReason.trim()}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                  >
                    {rejecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <ThumbsDown className="w-4 h-4" />
                        Confirm Rejection
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
