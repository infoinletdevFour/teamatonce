import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Flag,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Ban,
  Trash2,
  FileWarning,
  Loader2,
  RefreshCw,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { getReport, reviewReport } from '@/services/adminService';
import { Report } from '@/types/admin';
import { toast } from 'sonner';

const AdminReportDetail: React.FC = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedResolution, setSelectedResolution] = useState<string | null>(null);

  const fetchReport = async () => {
    if (!reportId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getReport(reportId);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const handleResolve = async (resolution: string) => {
    if (!reportId) return;
    try {
      setSubmitting(true);
      await reviewReport(reportId, {
        resolution: resolution as any,
        notes: resolutionNotes || `Resolved as: ${resolution.replace('_', ' ')}`,
      });
      toast.success('Report resolved successfully');
      fetchReport();
      setSelectedResolution(null);
      setResolutionNotes('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve report');
    } finally {
      setSubmitting(false);
    }
  };

  const getReasonColor = (reason: string) => {
    const colors: Record<string, string> = {
      spam: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      inappropriate: 'bg-orange-100 text-orange-700 border-orange-200',
      fraud: 'bg-red-100 text-red-700 border-red-200',
      harassment: 'bg-purple-100 text-purple-700 border-purple-200',
      other: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[reason] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      reviewing: 'bg-blue-100 text-blue-700',
      resolved: 'bg-green-100 text-green-700',
      dismissed: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      user: 'User Report',
      job: 'Job Report',
      project: 'Project Report',
      gig: 'Gig Report',
      message: 'Message Report',
    };
    return labels[type] || type;
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      spam: 'Spam',
      inappropriate: 'Inappropriate Content',
      fraud: 'Fraud',
      harassment: 'Harassment',
      other: 'Other',
    };
    return labels[reason] || reason;
  };

  const resolutionOptions = [
    {
      value: 'no_action',
      label: 'No Action Needed',
      description: 'The report does not require any action',
      icon: CheckCircle,
      color: 'text-gray-600 bg-gray-50 hover:bg-gray-100 border-gray-200',
    },
    {
      value: 'content_removed',
      label: 'Remove Content',
      description: 'The reported content will be removed',
      icon: Trash2,
      color: 'text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-200',
    },
    {
      value: 'user_warned',
      label: 'Warn User',
      description: 'Send a warning to the reported user',
      icon: FileWarning,
      color: 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
    },
    {
      value: 'user_banned',
      label: 'Ban User',
      description: 'Ban the reported user from the platform',
      icon: Ban,
      color: 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/reports')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Report Details</h1>
        </div>
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/reports')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Report Details</h1>
        </div>
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Report not found'}</p>
          <button onClick={fetchReport} className="text-blue-600 hover:underline">
            Try Again
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
          <button onClick={() => navigate('/admin/reports')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Report Details</h1>
            <p className="text-gray-500 text-sm">ID: {report.id}</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Flag className="w-5 h-5 text-orange-500" />
              Report Information
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm text-gray-500">Report Type</label>
                <p className="font-medium text-gray-900">{getTypeLabel(report.reportType)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Reason</label>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium border ${getReasonColor(report.reason)}`}>
                  {getReasonLabel(report.reason)}
                </span>
              </div>
              <div>
                <label className="text-sm text-gray-500">Target ID</label>
                <p className="font-mono text-sm text-gray-900">{report.targetId}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Submitted</label>
                <p className="font-medium text-gray-900 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(report.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-gray-100 pt-4">
              <label className="text-sm text-gray-500 block mb-2">Description</label>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {report.description || 'No description provided'}
                </p>
              </div>
            </div>

            {/* Evidence URLs */}
            {report.evidenceUrls && report.evidenceUrls.length > 0 && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <label className="text-sm text-gray-500 block mb-2">Evidence</label>
                <div className="space-y-2">
                  {report.evidenceUrls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Evidence {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Resolution Section (only for pending reports) */}
          {report.status === 'pending' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                Take Action
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {resolutionOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedResolution === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSelectedResolution(isSelected ? null : option.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected ? 'border-blue-500 bg-blue-50' : `border-gray-200 ${option.color}`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : ''}`} />
                        <div>
                          <p className="font-semibold text-gray-900">{option.label}</p>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedResolution && (
                <div className="border-t border-gray-100 pt-4">
                  <label className="text-sm text-gray-500 block mb-2">Resolution Notes (Optional)</label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Add any notes about this resolution..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                  />
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={() => {
                        setSelectedResolution(null);
                        setResolutionNotes('');
                      }}
                      className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleResolve(selectedResolution)}
                      disabled={submitting}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Confirm Resolution
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Already Resolved */}
          {report.status === 'resolved' && report.resolution && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-green-50 rounded-xl p-6 border border-green-200"
            >
              <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Resolution
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-green-600">Action Taken</label>
                  <p className="font-medium text-green-900">
                    {report.resolution.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </p>
                </div>
                {report.resolutionNotes && (
                  <div>
                    <label className="text-sm text-green-600">Notes</label>
                    <p className="text-green-800">{report.resolutionNotes}</p>
                  </div>
                )}
                {report.reviewedAt && (
                  <div>
                    <label className="text-sm text-green-600">Resolved On</label>
                    <p className="text-green-800">
                      {new Date(report.reviewedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reporter Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Reporter
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Name</label>
                <p className="font-medium text-gray-900">{report.reporterName || 'Unknown'}</p>
              </div>
              {report.reporterEmail && (
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="text-gray-700">{report.reporterEmail}</p>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-500">Reporter ID</label>
                <p className="font-mono text-xs text-gray-500">{report.reporterId}</p>
              </div>
            </div>
          </motion.div>

          {/* Target User Info (for user reports OR project reports with owner) */}
          {report.targetUserId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                {report.reportType === 'user' ? 'Reported User' : 'Content Owner'}
              </h2>
              <div className="space-y-3">
                {report.targetUserName && (
                  <div>
                    <label className="text-sm text-gray-500">Name</label>
                    <p className="font-medium text-gray-900">{report.targetUserName}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-500">User ID</label>
                  <p className="font-mono text-xs text-gray-500">{report.targetUserId}</p>
                </div>
                {report.reportType !== 'user' && (
                  <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    This is the owner of the reported {report.reportType}. Actions like "Warn User" or "Ban User" will affect this user.
                  </p>
                )}
                <button
                  onClick={() => navigate(`/admin/users/${report.targetUserId}`)}
                  className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" />
                  View User Profile
                </button>
              </div>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={fetchReport}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Report
              </button>
              <button
                onClick={() => navigate('/admin/reports')}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Reports
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportDetail;
