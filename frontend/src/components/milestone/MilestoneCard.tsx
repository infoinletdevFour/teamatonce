import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Upload,
  AlertCircle,
  Calendar,
  MessageSquare,
  Shield
} from 'lucide-react';

/**
 * Extended Milestone Status to include new workflow states
 */
export type ExtendedMilestoneStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'feedback_required'
  | 'completed'
  | 'approved';

export interface MilestoneCardProps {
  id: string;
  name: string;
  description?: string;
  status: ExtendedMilestoneStatus;
  amount?: number;
  currency?: string;
  dueDate?: string;
  deliverables?: string[];
  submittedAt?: string;
  feedbackNotes?: string;
  submissionCount?: number;
  escrowStatus?: 'unfunded' | 'funded' | 'released';
  autoReleaseDate?: string;
  userRole: 'client' | 'developer';
  isTeamLead?: boolean;
  onMarkInProgress?: () => void;
  onSubmit?: () => void;
  onApprove?: () => void;
  onRequestChanges?: () => void;
  onViewDetails?: () => void;
}

const statusConfig: Record<ExtendedMilestoneStatus, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  pending: {
    label: 'Pending',
    color: 'text-gray-600',
    bg: 'bg-gray-100 border-gray-300',
    icon: <Clock className="w-5 h-5" />
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-600',
    bg: 'bg-blue-100 border-blue-300',
    icon: <Clock className="w-5 h-5 animate-pulse" />
  },
  submitted: {
    label: 'Submitted for Review',
    color: 'text-purple-600',
    bg: 'bg-purple-100 border-purple-300',
    icon: <Upload className="w-5 h-5" />
  },
  feedback_required: {
    label: 'Changes Requested',
    color: 'text-orange-600',
    bg: 'bg-orange-100 border-orange-300',
    icon: <MessageSquare className="w-5 h-5" />
  },
  completed: {
    label: 'Completed',
    color: 'text-green-600',
    bg: 'bg-green-100 border-green-300',
    icon: <CheckCircle2 className="w-5 h-5" />
  },
  approved: {
    label: 'Approved & Paid',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100 border-emerald-300',
    icon: <CheckCircle2 className="w-5 h-5" />
  }
};

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  name,
  description,
  status,
  amount,
  currency = 'USD',
  dueDate,
  deliverables = [],
  submittedAt,
  feedbackNotes,
  submissionCount = 0,
  escrowStatus = 'unfunded',
  autoReleaseDate,
  userRole,
  isTeamLead = false,
  onMarkInProgress,
  onSubmit,
  onApprove,
  onRequestChanges,
  onViewDetails
}) => {
  const config = statusConfig[status];
  const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== 'approved' && status !== 'completed';

  // Calculate days until auto-release
  const daysUntilAutoRelease = autoReleaseDate
    ? Math.ceil((new Date(autoReleaseDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Permission checks
  const canMarkInProgress = userRole === 'developer' && status === 'pending';
  const canSubmit = userRole === 'developer' && isTeamLead && (status === 'in_progress' || status === 'feedback_required');
  const canApprove = userRole === 'client' && status === 'submitted';
  const canRequestChanges = userRole === 'client' && status === 'submitted';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border-2 ${config.bg} p-6 shadow-lg hover:shadow-xl transition-all`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900">{name}</h3>
            {isOverdue && (
              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                OVERDUE
              </span>
            )}
          </div>
          {description && (
            <div
              className="text-sm text-gray-600 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
        </div>

        <div className={`px-4 py-2 rounded-xl border-2 flex items-center space-x-2 ${config.bg} ${config.color}`}>
          {config.icon}
          <span className="font-bold text-sm">{config.label}</span>
        </div>
      </div>

      {/* Escrow Status (if funded) */}
      {amount && amount > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="font-bold text-green-900">Escrow Protected</span>
            </div>
            <div className="text-2xl font-black text-green-600">
              ${amount.toLocaleString()} {currency}
            </div>
          </div>
          {escrowStatus === 'funded' && daysUntilAutoRelease && daysUntilAutoRelease > 0 && (
            <div className="text-xs text-green-700">
              <Clock className="w-3 h-3 inline mr-1" />
              Auto-release in {daysUntilAutoRelease} days if no action taken
            </div>
          )}
          {escrowStatus === 'released' && (
            <div className="text-xs text-green-700 flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Payment released to developer
            </div>
          )}
        </div>
      )}

      {/* Submission Info */}
      {status === 'submitted' && submittedAt && (
        <div className="mb-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-purple-900">Submitted for Review</div>
              <div className="text-xs text-purple-700">
                {new Date(submittedAt).toLocaleString()}
              </div>
            </div>
            {submissionCount > 1 && (
              <div className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                Revision #{submissionCount}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feedback */}
      {status === 'feedback_required' && feedbackNotes && (
        <div className="mb-4 p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
          <div className="flex items-start space-x-2">
            <MessageSquare className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-bold text-orange-900 mb-1">Client Feedback</div>
              <div className="text-sm text-orange-800">{feedbackNotes}</div>
            </div>
          </div>
        </div>
      )}

      {/* Deliverables */}
      {deliverables.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-bold text-gray-700 mb-2">Deliverables</div>
          <ul className="space-y-1">
            {deliverables.map((item, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Due Date */}
      {dueDate && (
        <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Due: {new Date(dueDate).toLocaleDateString()}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-4 border-t-2 border-gray-200">
        {canMarkInProgress && onMarkInProgress && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMarkInProgress}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold text-sm shadow-md"
          >
            Mark In Progress
          </motion.button>
        )}

        {canSubmit && onSubmit && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSubmit}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold text-sm shadow-md flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>{status === 'feedback_required' ? 'Resubmit' : 'Submit for Review'}</span>
          </motion.button>
        )}

        {canApprove && onApprove && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onApprove}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold text-sm shadow-md flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve & Release Payment</span>
          </motion.button>
        )}

        {canRequestChanges && onRequestChanges && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRequestChanges}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg font-semibold text-sm shadow-md flex items-center space-x-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Request Changes</span>
          </motion.button>
        )}

        {onViewDetails && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onViewDetails}
            className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:border-gray-400 transition-colors"
          >
            View Details
          </motion.button>
        )}
      </div>

      {/* Warning for Client - Auto Release */}
      {userRole === 'client' && status === 'submitted' && daysUntilAutoRelease && daysUntilAutoRelease <= 3 && (
        <div className="mt-4 p-3 bg-amber-50 border-2 border-amber-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-800">
            <span className="font-bold">Action required:</span> Payment will auto-release in {daysUntilAutoRelease} days if you don't review the submission
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MilestoneCard;
