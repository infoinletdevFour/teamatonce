import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, CheckCircle2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { Milestone } from '@/types/payment';
import { StatusBadge } from './StatusBadge';

interface MilestoneCardProps {
  milestone: Milestone;
  onViewDetails?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  showActions?: boolean;
}

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  onViewDetails,
  onApprove,
  onReject,
  showActions = false
}) => {
  const getProgressColor = () => {
    switch (milestone.status) {
      case 'completed':
      case 'paid':
        return 'from-green-500 to-emerald-500';
      case 'in-progress':
        return 'from-blue-500 to-cyan-500';
      case 'review':
        return 'from-purple-500 to-pink-500';
      case 'disputed':
        return 'from-red-500 to-orange-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-2">{milestone.description}</p>
        </div>
        <StatusBadge status={milestone.status} />
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: milestone.status === 'paid' ? '100%' :
                     milestone.status === 'completed' ? '90%' :
                     milestone.status === 'review' ? '75%' :
                     milestone.status === 'in-progress' ? '50%' : '0%'
            }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full bg-gradient-to-r ${getProgressColor()}`}
          />
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Amount</div>
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(milestone.amount, milestone.currency)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Due Date</div>
            <div className="text-sm font-semibold text-gray-900">
              {format(new Date(milestone.dueDate), 'MMM dd, yyyy')}
            </div>
          </div>
        </div>
      </div>

      {/* Deliverables */}
      {milestone.deliverables.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">
              Deliverables ({milestone.deliverables.length})
            </span>
          </div>
          <div className="space-y-1">
            {milestone.deliverables.slice(0, 3).map((deliverable) => (
              <div key={deliverable.id} className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span className="truncate">{deliverable.title}</span>
              </div>
            ))}
            {milestone.deliverables.length > 3 && (
              <div className="text-xs text-blue-600 font-semibold">
                +{milestone.deliverables.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && milestone.status === 'review' && (
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onApprove}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
          >
            Approve & Release Payment
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReject}
            className="px-6 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Request Changes
          </motion.button>
        </div>
      )}

      {showActions && milestone.status !== 'review' && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onViewDetails}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2.5 rounded-xl font-semibold mt-4 shadow-lg hover:shadow-xl transition-shadow"
        >
          View Details
        </motion.button>
      )}
    </motion.div>
  );
};

export default MilestoneCard;
