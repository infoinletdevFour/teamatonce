import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  MilestoneAdjustmentRequest,
  MilestoneAdjustmentStatus,
  getAdjustmentRequestsByMilestone,
  getAdjustmentRequestsByProject,
} from '@/services/milestoneAdjustmentService';

interface MilestoneAdjustmentsListProps {
  milestoneId?: string;
  projectId?: string;
  onReviewRequest?: (request: MilestoneAdjustmentRequest) => void;
}

export const MilestoneAdjustmentsList: React.FC<MilestoneAdjustmentsListProps> = ({
  milestoneId,
  projectId,
  onReviewRequest,
}) => {
  const [requests, setRequests] = useState<MilestoneAdjustmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | MilestoneAdjustmentStatus>('all');

  useEffect(() => {
    loadRequests();
  }, [milestoneId, projectId]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      let data: MilestoneAdjustmentRequest[];

      if (milestoneId) {
        data = await getAdjustmentRequestsByMilestone(milestoneId);
      } else if (projectId) {
        data = await getAdjustmentRequestsByProject(projectId);
      } else {
        data = [];
      }

      // Sort by creation date (newest first)
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(data);
    } catch (error: any) {
      console.error('Failed to load adjustment requests:', error);
      toast.error(error.message || 'Failed to load adjustment requests');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRequests = () => {
    if (filter === 'all') return requests;
    return requests.filter(req => req.status === filter);
  };

  const getStatusBadge = (status: MilestoneAdjustmentStatus) => {
    const badges = {
      [MilestoneAdjustmentStatus.PENDING]: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-300',
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'Pending Review',
      },
      [MilestoneAdjustmentStatus.APPROVED]: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-300',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Approved',
      },
      [MilestoneAdjustmentStatus.REJECTED]: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-300',
        icon: <XCircle className="w-4 h-4" />,
        label: 'Rejected',
      },
    };

    const badge = badges[status];
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${badge.bg} ${badge.text} ${badge.border} font-medium text-sm`}
      >
        {badge.icon}
        {badge.label}
      </div>
    );
  };

  const getChangesSummary = (changes: any) => {
    const items: string[] = [];
    if (changes.estimatedHours !== undefined) items.push('Hours');
    if (changes.milestoneAmount !== undefined) items.push('Budget');
    if (changes.dueDate !== undefined) items.push('Due Date');
    if (changes.deliverables !== undefined) items.push('Deliverables');
    if (changes.name !== undefined) items.push('Name');
    if (changes.description !== undefined) items.push('Description');
    if (changes.acceptanceCriteria !== undefined) items.push('Criteria');

    return items.join(', ') || 'No changes';
  };

  const filteredRequests = getFilteredRequests();

  const pendingCount = requests.filter(r => r.status === MilestoneAdjustmentStatus.PENDING).length;
  const approvedCount = requests.filter(r => r.status === MilestoneAdjustmentStatus.APPROVED).length;
  const rejectedCount = requests.filter(r => r.status === MilestoneAdjustmentStatus.REJECTED).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">No adjustment requests yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Requests will appear here when changes are needed
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            filter === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({requests.length})
        </button>
        <button
          onClick={() => setFilter(MilestoneAdjustmentStatus.PENDING)}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            filter === MilestoneAdjustmentStatus.PENDING
              ? 'border-yellow-600 text-yellow-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter(MilestoneAdjustmentStatus.APPROVED)}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            filter === MilestoneAdjustmentStatus.APPROVED
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Approved ({approvedCount})
        </button>
        <button
          onClick={() => setFilter(MilestoneAdjustmentStatus.REJECTED)}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            filter === MilestoneAdjustmentStatus.REJECTED
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Rejected ({rejectedCount})
        </button>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request, index) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusBadge(request.status)}
                  <span className="text-xs text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Changes requested:</span> {getChangesSummary(request.changes)}
                </p>
              </div>
              {request.status === MilestoneAdjustmentStatus.PENDING && onReviewRequest && (
                <button
                  onClick={() => onReviewRequest(request)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Review
                </button>
              )}
            </div>

            {/* Reason */}
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
              <p className="text-sm text-gray-600">{request.reason}</p>
            </div>

            {/* Changes Grid */}
            <div className="grid grid-cols-3 gap-4">
              {request.changes.estimatedHours !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Hours</p>
                    <p className="font-semibold text-gray-900">{request.changes.estimatedHours}h</p>
                  </div>
                </div>
              )}
              {request.changes.milestoneAmount !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Budget</p>
                    <p className="font-semibold text-gray-900">
                      ${request.changes.milestoneAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              {request.changes.dueDate !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Due Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(request.changes.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Client Response (if rejected or approved with notes) */}
            {request.clientResponse && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">Client Response:</p>
                <p className="text-sm text-blue-800">{request.clientResponse}</p>
              </div>
            )}

            {/* Review Info */}
            {request.reviewedBy && request.reviewedAt && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Reviewed on {new Date(request.reviewedAt).toLocaleDateString()} at{' '}
                  {new Date(request.reviewedAt).toLocaleTimeString()}
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No {filter} requests found</p>
        </div>
      )}
    </div>
  );
};
