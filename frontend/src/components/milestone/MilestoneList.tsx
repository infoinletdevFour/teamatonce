/**
 * Milestone List Component
 * Displays project milestones with status, payment amounts, and approval workflow
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  DollarSign,
  FileText,
  Award,
  Edit,
  Trash2,
  Package,
  CheckCircle2,
  PlayCircle,
  X,
  Send,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { Milestone, MilestoneStatus } from '@/types/milestone';

interface MilestoneListProps {
  milestones: Milestone[];
  onEdit?: (milestone: Milestone) => void;
  onDelete?: (milestoneId: string) => void;
  onApprove?: (milestoneId: string) => void;
  onSubmit?: (milestoneId: string) => void;
  onRequestFeedback?: (milestoneId: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
  canSubmit?: boolean;
  canRequestFeedback?: boolean;
  userRole?: 'client' | 'developer' | 'team_lead' | 'none';
  showProgress?: boolean;
}

export const MilestoneList: React.FC<MilestoneListProps> = ({
  milestones,
  onEdit,
  onDelete,
  onApprove,
  onSubmit,
  onRequestFeedback,
  canEdit = false,
  canDelete = false,
  canApprove = false,
  canSubmit = false,
  canRequestFeedback = false,
  userRole = 'none',
  showProgress = true,
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState<Milestone | null>(null);

  const handleDeleteClick = (milestone: Milestone) => {
    setMilestoneToDelete(milestone);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (milestoneToDelete && onDelete) {
      onDelete(milestoneToDelete.id);
      setDeleteConfirmOpen(false);
      setMilestoneToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setMilestoneToDelete(null);
  };

  const getStatusColor = (status: MilestoneStatus): string => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'submitted':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'feedback_required':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'pending':
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case 'approved':
        return Award;
      case 'completed':
        return CheckCircle2;
      case 'submitted':
        return Send;
      case 'in_progress':
        return PlayCircle;
      case 'feedback_required':
        return MessageSquare;
      case 'pending':
      default:
        return Clock;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  if (!milestones || milestones.length === 0) {
    return (
      <div className="text-center py-12">
        <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No milestones found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {milestones.map((milestone, index) => {
        const StatusIcon = getStatusIcon(milestone.status);
        const statusColor = getStatusColor(milestone.status);

        return (
          <motion.div
            key={milestone.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{milestone.title}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1 ${statusColor}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    <span>{milestone.status.replace('_', ' ').toUpperCase()}</span>
                  </span>
                  {milestone.milestoneType && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                      {milestone.milestoneType.charAt(0).toUpperCase() + milestone.milestoneType.slice(1)}
                    </span>
                  )}
                  {milestone.submissionCount !== undefined && milestone.submissionCount > 0 && (
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                      Submission #{milestone.submissionCount}
                    </span>
                  )}
                </div>
                {milestone.description && (
                  <div
                    className="text-gray-600 mb-3 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: milestone.description }}
                  />
                )}

                {/* Feedback Section */}
                {milestone.feedback && (
                  <div className="mb-3 bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-orange-900 mb-1">Client Feedback</h4>
                        <p className="text-sm text-orange-800">{milestone.feedback}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {milestone.dueDate && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {formatDate(new Date(milestone.dueDate))}</span>
                    </div>
                  )}
                  {milestone.amount && (
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span>{formatCurrency(milestone.amount)}</span>
                    </div>
                  )}
                  {milestone.estimatedHours && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{milestone.estimatedHours}h estimated</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {milestone.amount && (
                  <div className="text-right">
                    <div className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {formatCurrency(milestone.amount)}
                    </div>
                  </div>
                )}
                {/* Client Edit/Delete Actions */}
                {userRole === 'client' && (
                  <div className="flex items-center gap-2">
                    {canEdit && onEdit && (
                      <button
                        onClick={() => onEdit(milestone)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                        title="Edit milestone"
                      >
                        <Edit className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                      </button>
                    )}
                    {canDelete && onDelete && (
                      <button
                        onClick={() => handleDeleteClick(milestone)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                        title="Delete milestone"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Deliverables */}
            {milestone.deliverables && milestone.deliverables.length > 0 && (
              <div className="mb-4">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <Package className="w-4 h-4" />
                  <span>Deliverables ({milestone.deliverables.length})</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {milestone.deliverables.map((deliverable, idx) => {
                    const displayName = typeof deliverable === 'string'
                      ? deliverable
                      : (deliverable.title || deliverable.fileName || 'Deliverable');
                    return (
                      <div
                        key={idx}
                        className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-sm font-medium"
                      >
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-3 h-3" />
                          <span>{displayName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Acceptance Criteria */}
            {milestone.acceptanceCriteria && milestone.acceptanceCriteria.length > 0 && (
              <div className="mb-4">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Acceptance Criteria ({milestone.acceptanceCriteria.length})</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {milestone.acceptanceCriteria.map((criteria, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm font-medium"
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3" />
                        <span>{criteria}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {showProgress && milestone.progress !== undefined && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Progress</span>
                  <span className="text-sm font-bold text-gray-900">{milestone.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${milestone.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Role-Based Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              {/* CLIENT ACTIONS */}
              {userRole === 'client' && (
                <>
                  {/* Approve button for submitted or completed milestones */}
                  {(milestone.status === 'submitted' || milestone.status === 'completed') &&
                   canApprove && onApprove && (
                    <button
                      onClick={() => onApprove(milestone.id)}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
                    >
                      <Award className="w-4 h-4" />
                      <span>Approve Milestone</span>
                    </button>
                  )}

                  {/* Request Changes button for submitted milestones */}
                  {milestone.status === 'submitted' && canRequestFeedback && onRequestFeedback && (
                    <button
                      onClick={() => onRequestFeedback(milestone.id)}
                      className="px-6 py-2.5 bg-orange-100 text-orange-700 rounded-xl font-semibold hover:bg-orange-200 transition-colors flex items-center space-x-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Request Changes</span>
                    </button>
                  )}
                </>
              )}

              {/* DEVELOPER/TEAM_LEAD ACTIONS */}
              {(userRole === 'developer' || userRole === 'team_lead') && (
                <>
                  {/* Mark In Progress button for pending or feedback_required */}
                  {(milestone.status === 'pending' || milestone.status === 'feedback_required') &&
                   canSubmit && onSubmit && (
                    <button
                      onClick={() => onSubmit(milestone.id)}
                      className="px-6 py-2.5 bg-blue-100 text-blue-700 rounded-xl font-semibold hover:bg-blue-200 transition-colors flex items-center space-x-2"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Mark In Progress</span>
                    </button>
                  )}

                  {/* Submit for Review button for in_progress */}
                  {milestone.status === 'in_progress' && canSubmit && onSubmit && (
                    <button
                      onClick={() => onSubmit(milestone.id)}
                      className="px-6 py-2.5 bg-purple-100 text-purple-700 rounded-xl font-semibold hover:bg-purple-200 transition-colors flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit for Review</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmOpen && milestoneToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleDeleteCancel}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-red-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Delete Milestone</h2>
                </div>
                <button
                  onClick={handleDeleteCancel}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete{' '}
                  <span className="font-bold text-gray-900">"{milestoneToDelete.title}"</span>?
                </p>
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ This action cannot be undone. All milestone data, deliverables, and acceptance
                    criteria will be permanently deleted.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={handleDeleteCancel}
                  className="px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Milestone</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MilestoneList;
