import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Clock,
  DollarSign,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { Milestone } from '../../types/client';

interface MilestoneTrackerProps {
  milestones: Milestone[];
  compact?: boolean;
}

const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({ milestones, compact = false }) => {
  const getStatusConfig = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return {
          color: 'from-green-500 to-emerald-500',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          icon: CheckCircle2,
          label: 'Completed'
        };
      case 'approved':
        return {
          color: 'from-blue-500 to-cyan-500',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          icon: CheckCircle2,
          label: 'Approved'
        };
      case 'paid':
        return {
          color: 'from-purple-500 to-pink-500',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-700',
          icon: DollarSign,
          label: 'Paid'
        };
      case 'in_progress':
        return {
          color: 'from-yellow-500 to-orange-500',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          icon: Clock,
          label: 'In Progress'
        };
      case 'pending':
        return {
          color: 'from-gray-500 to-slate-500',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          icon: Circle,
          label: 'Pending'
        };
      default:
        return {
          color: 'from-gray-500 to-slate-500',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          icon: Circle,
          label: 'Unknown'
        };
    }
  };

  return (
    <div className="space-y-4">
      {milestones.map((milestone, index) => {
        const statusConfig = getStatusConfig(milestone.status);
        const StatusIcon = statusConfig.icon;
        const isLast = index === milestones.length - 1;

        return (
          <div key={milestone.id} className="relative">
            {/* Connecting Line */}
            {!isLast && !compact && (
              <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gray-200 -mb-4" />
            )}

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`bg-white rounded-xl p-${compact ? '4' : '6'} border-2 border-gray-100 hover:border-blue-200 transition-all relative z-10`}
            >
              <div className="flex items-start space-x-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${statusConfig.color} flex items-center justify-center flex-shrink-0`}>
                  <StatusIcon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">
                        {milestone.name}
                      </h4>
                      {!compact && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bgColor} ${statusConfig.textColor} flex items-center space-x-1 ml-2`}>
                      <StatusIcon className="w-3 h-3" />
                      <span>{statusConfig.label}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {!compact && milestone.status === 'in_progress' && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-600">Progress</span>
                        <span className="text-xs font-bold text-gray-900">{milestone.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${milestone.progress}%` }}
                          transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                          className={`h-1.5 rounded-full bg-gradient-to-r ${statusConfig.color}`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="text-xs text-gray-500">Amount</div>
                        <div className="text-sm font-bold text-gray-900">
                          ${milestone.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="text-xs text-gray-500">Due Date</div>
                        <div className="text-sm font-bold text-gray-900">
                          {new Date(milestone.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>

                    {!compact && milestone.deliverables.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-xs text-gray-500">Deliverables</div>
                          <div className="text-sm font-bold text-gray-900">
                            {milestone.deliverables.length} items
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Deliverables List */}
                  {!compact && milestone.deliverables.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs font-semibold text-gray-700 mb-2">Deliverables:</div>
                      <ul className="space-y-1">
                        {milestone.deliverables.slice(0, 3).map((deliverable, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-center space-x-2">
                            <ArrowRight className="w-3 h-3 text-blue-500" />
                            <span>{deliverable}</span>
                          </li>
                        ))}
                        {milestone.deliverables.length > 3 && (
                          <li className="text-sm text-blue-600 font-semibold">
                            +{milestone.deliverables.length - 3} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

export default MilestoneTracker;
