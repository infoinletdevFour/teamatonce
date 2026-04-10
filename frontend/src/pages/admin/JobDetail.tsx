import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Briefcase,
  User,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Globe,
  Lock,
  Tag,
  FileText,
  AlertTriangle,
  X,
} from 'lucide-react';
import { getAdminJob, approveJob, rejectJob } from '@/services/adminService';
import { toast } from 'sonner';

interface JobDetail {
  id: string;
  name: string;
  description: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  companyId?: string;
  companyName?: string;
  assignedCompanyId?: string;
  assignedCompanyName?: string;
  projectType: string;
  status: string;
  approvalStatus: string;
  approvalReviewedBy?: string;
  approvalReviewedAt?: string;
  approvalRejectionReason?: string;
  budgetMin?: number;
  budgetMax?: number;
  estimatedCost?: number;
  actualCost?: number;
  currency: string;
  estimatedDurationDays?: number;
  startDate?: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  progressPercentage: number;
  isPublic: boolean;
  requirements?: Record<string, unknown>;
  techStack?: string[];
  frameworks?: string[];
  features?: string[];
  forceClosedAt?: string;
  forceClosedBy?: string;
  forceCloseReason?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminJobDetail: React.FC = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const fetchJob = async () => {
    if (!jobId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminJob(jobId);
      setJob(data as JobDetail);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load job';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const handleApprove = async () => {
    if (!job) return;
    try {
      await approveJob(job.id);
      toast.success('Job approved successfully');
      fetchJob();
    } catch {
      toast.error('Failed to approve job');
    }
  };

  const openRejectModal = () => {
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!job || !rejectReason.trim()) return;
    try {
      setRejecting(true);
      await rejectJob(job.id, rejectReason.trim());
      toast.success('Job rejected successfully');
      setShowRejectModal(false);
      setRejectReason('');
      fetchJob();
    } catch {
      toast.error('Failed to reject job');
    } finally {
      setRejecting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      review: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700',
      on_hold: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getApprovalBadge = (status: string) => {
    const colors: Record<string, string> = {
      approved: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount?: number, currency: string = 'USD') => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/jobs')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Job Details</h1>
        </div>
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Job not found'}</p>
          <button onClick={fetchJob} className="text-blue-600 hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/jobs')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.name}</h1>
            <p className="text-gray-500">{job.projectType}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {job.approvalStatus === 'rejected' && (
            <button
              onClick={handleApprove}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Re-approve
            </button>
          )}
          {job.approvalStatus === 'approved' && (
            <button
              onClick={openRejectModal}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          )}
          {job.approvalStatus === 'pending' && (
            <>
              <button
                onClick={handleApprove}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={openRejectModal}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Status</span>
            <Briefcase className="w-5 h-5 text-gray-400" />
          </div>
          <div className="mt-2">{getStatusBadge(job.status)}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Approval</span>
            {job.approvalStatus === 'approved' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : job.approvalStatus === 'rejected' ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : (
              <Clock className="w-5 h-5 text-yellow-500" />
            )}
          </div>
          <div className="mt-2">{getApprovalBadge(job.approvalStatus)}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Visibility</span>
            {job.isPublic ? (
              <Globe className="w-5 h-5 text-green-500" />
            ) : (
              <Lock className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div className="mt-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${job.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {job.isPublic ? 'Public' : 'Private'}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Progress</span>
            <span className="text-sm font-semibold text-gray-900">{job.progressPercentage}%</span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${job.progressPercentage}%` }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Rejection Reason Alert */}
      {job.approvalStatus === 'rejected' && job.approvalRejectionReason && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">Rejection Reason</h3>
              <p className="text-sm text-red-600 mt-1">{job.approvalRejectionReason}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              Description
            </h2>
            <div
              className="prose prose-sm max-w-none text-gray-600"
              dangerouslySetInnerHTML={{ __html: job.description || 'No description provided' }}
            />
          </motion.div>

          {/* Requirements */}
          {job.requirements && Object.keys(job.requirements).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
              <div className="space-y-3">
                {Object.entries(job.requirements).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Skills / Tech Stack */}
          {job.techStack && job.techStack.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-gray-400" />
                Skills Required
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.techStack.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              Client
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Name</span>
                <p className="font-medium text-gray-900">{job.clientName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email</span>
                <p className="font-medium text-gray-900">{job.clientEmail}</p>
              </div>
              <Link
                to={`/admin/users/${job.clientId}`}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                View Client Profile
              </Link>
            </div>
          </motion.div>

          {/* Company Info */}
          {(job.companyName || job.assignedCompanyName) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gray-400" />
                Company
              </h2>
              <div className="space-y-3">
                {job.companyName && (
                  <div>
                    <span className="text-sm text-gray-500">Client Company</span>
                    <p className="font-medium text-gray-900">{job.companyName}</p>
                  </div>
                )}
                {job.assignedCompanyName && (
                  <div>
                    <span className="text-sm text-gray-500">Assigned To</span>
                    <p className="font-medium text-gray-900">{job.assignedCompanyName}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Budget & Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-400" />
              Budget & Timeline
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Budget Range</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(job.budgetMin, job.currency)} - {formatCurrency(job.budgetMax, job.currency)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Estimated Cost</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(job.estimatedCost, job.currency)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Duration</span>
                <span className="text-sm font-medium text-gray-900">
                  {job.estimatedDurationDays ? `${job.estimatedDurationDays} days` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Start Date</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(job.startDate)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500">Expected Completion</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(job.expectedCompletionDate)}</span>
              </div>
            </div>
          </motion.div>

          {/* Dates */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              Timeline
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Created</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(job.createdAt)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Updated</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(job.updatedAt)}</span>
              </div>
              {job.approvalReviewedAt && (
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-500">Reviewed</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(job.approvalReviewedAt)}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowRejectModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Reject Job</h3>
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Please provide a reason for rejecting "{job.name}". This will be visible to the client.
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                  autoFocus
                />
                <div className="flex items-center justify-end gap-3 mt-4">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={!rejectReason.trim() || rejecting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {rejecting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Reject Job
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminJobDetail;
