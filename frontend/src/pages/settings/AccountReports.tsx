import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Ban,
  Shield,
  Calendar,
  FileText,
  RefreshCw,
  ChevronRight,
  Info,
  CheckCircle,
} from 'lucide-react';
import { reportService, Report } from '@/services/reportService';

const AccountReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getReportsAgainstMe();
      setReports(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getReasonLabel = (reason: string): string => {
    const labels: Record<string, string> = {
      spam: 'Spam',
      inappropriate: 'Inappropriate Content',
      fraud: 'Fraudulent Activity',
      harassment: 'Harassment',
      other: 'Policy Violation',
    };
    return labels[reason] || reason;
  };

  const getResolutionInfo = (resolution: string) => {
    if (resolution === 'user_warned') {
      return {
        label: 'Warning Issued',
        color: 'text-yellow-700 bg-yellow-100 border-yellow-200',
        icon: AlertTriangle,
        iconColor: 'text-yellow-600',
      };
    }
    if (resolution === 'user_banned') {
      return {
        label: 'Account Suspended',
        color: 'text-red-700 bg-red-100 border-red-200',
        icon: Ban,
        iconColor: 'text-red-600',
      };
    }
    return {
      label: resolution,
      color: 'text-gray-700 bg-gray-100 border-gray-200',
      icon: Info,
      iconColor: 'text-gray-600',
    };
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="w-7 h-7 text-blue-600" />
          Account Reports
        </h1>
        <p className="text-gray-500 mt-2">
          View any warnings or actions taken on your account
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchReports}
            className="mt-2 text-red-600 hover:underline text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {reports.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Your account is in good standing
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            You have no warnings or account actions. Keep following our community
            guidelines to maintain your good standing.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">About Account Reports</h3>
              <p className="text-sm text-blue-700 mt-1">
                These are actions taken on your account following reports from other
                users. Please review any warnings carefully and ensure you follow our
                community guidelines to avoid further action.
              </p>
            </div>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            {reports.map((report, index) => {
              const resolutionInfo = getResolutionInfo(report.resolution || '');
              const Icon = resolutionInfo.icon;

              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden"
                >
                  {/* Header */}
                  <div
                    className={`px-6 py-4 border-b-2 ${
                      report.resolution === 'user_banned'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-6 h-6 ${resolutionInfo.iconColor}`} />
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {resolutionInfo.label}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {getReasonLabel(report.reason)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${resolutionInfo.color}`}
                      >
                        {resolutionInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-4 space-y-4">
                    {/* Resolution Notes */}
                    {report.resolution_notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Admin Notes
                        </label>
                        <p className="mt-2 text-gray-700 bg-gray-50 rounded-lg p-4">
                          {report.resolution_notes}
                        </p>
                      </div>
                    )}

                    {/* Report Description */}
                    {report.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Report Details
                        </label>
                        <p className="mt-1 text-gray-600 text-sm">
                          {report.description}
                        </p>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="flex items-center gap-6 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Reported:{' '}
                          {new Date(report.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      {report.reviewed_at && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <ChevronRight className="w-4 h-4" />
                          <span>
                            Resolved:{' '}
                            {new Date(report.reviewed_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Guidelines Link */}
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <p className="text-gray-600 mb-3">
              Need to understand what behavior is expected?
            </p>
            <a
              href="/community-guidelines"
              className="inline-flex items-center gap-2 text-blue-600 hover:underline font-medium"
            >
              Read our Community Guidelines
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={fetchReports}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
    </div>
  );
};

export default AccountReports;
