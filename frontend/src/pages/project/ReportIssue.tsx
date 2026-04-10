import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  MessageSquareWarning,
  HelpCircle,
  Send,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Clock,
  Eye,
  User,
  Briefcase,
  Users,
  FolderKanban,
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { ProjectPageLayout } from '@/layouts/ProjectPageLayout';
import { AccessDenied, AccessLoading } from '@/components/project';
import { useProjectRole } from '@/hooks/useProjectRole';
import { RejectedProjectBanner } from '@/components/project/RejectedProjectBanner';
import { getProjectStats } from '@/services/projectService';
import { getProjectTeam } from '@/services/teamMemberService';
import type { TeamMember } from '@/types/teamMember';
import {
  reportService,
  ReportType,
  ReportReason,
  Report,
  CreateReportDto,
} from '@/services/reportService';

// Target type for what user wants to report
type ReportTargetType = 'project' | 'team_member';

interface ReportFormData {
  targetType: ReportTargetType;
  reportType: ReportType;
  targetUserId: string | null;
  reason: ReportReason;
  description: string;
  evidenceUrls: string[];
}

const REASON_OPTIONS = [
  {
    value: ReportReason.SPAM,
    label: 'Spam',
    description: 'Unwanted or repetitive content',
    icon: MessageSquareWarning,
    color: 'yellow',
  },
  {
    value: ReportReason.INAPPROPRIATE,
    label: 'Inappropriate',
    description: 'Offensive or unsuitable content',
    icon: AlertTriangle,
    color: 'orange',
  },
  {
    value: ReportReason.FRAUD,
    label: 'Fraud',
    description: 'Deceptive or fraudulent activity',
    icon: ShieldAlert,
    color: 'red',
  },
  {
    value: ReportReason.HARASSMENT,
    label: 'Harassment',
    description: 'Bullying or threatening behavior',
    icon: User,
    color: 'purple',
  },
  {
    value: ReportReason.OTHER,
    label: 'Other',
    description: 'Other issue not listed above',
    icon: HelpCircle,
    color: 'gray',
  },
];

export const ReportIssue: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { companyId, loading: companyLoading } = useCompany();

  // Check project membership
  const { hasAccess, loading: roleLoading } = useProjectRole(projectId);

  // State
  const [approvalStatus, setApprovalStatus] = useState<string>('approved');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [existingReports, setExistingReports] = useState<Report[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showExistingReports, setShowExistingReports] = useState(false);

  const isProjectRejected = approvalStatus === 'rejected';

  // Form state
  const [formData, setFormData] = useState<ReportFormData>({
    targetType: 'project',
    reportType: ReportType.PROJECT,
    targetUserId: null,
    reason: ReportReason.OTHER,
    description: '',
    evidenceUrls: [],
  });

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        setError(null);

        const [projectData, reportsData, teamData] = await Promise.all([
          getProjectStats(projectId),
          reportService.getReportsByTarget(projectId),
          getProjectTeam(projectId).catch(() => []),
        ]);

        setApprovalStatus(projectData.project?.approval_status || 'approved');
        setRejectionReason(projectData.project?.approval_rejection_reason || '');
        setProjectName(projectData.project?.name || 'Project');
        setExistingReports(reportsData);
        setTeamMembers(teamData);
      } catch (err: any) {
        console.error('Failed to load report data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId) return;

    if (!formData.description.trim()) {
      setError('Please provide a description of the issue');
      return;
    }

    // Validate team member selection when reporting a team member
    if (formData.targetType === 'team_member' && !formData.targetUserId) {
      setError('Please select a team member to report');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Get selected team member name if reporting a user
      const selectedMember = formData.targetType === 'team_member'
        ? teamMembers.find(m => m.user_id === formData.targetUserId)
        : null;

      const reportData: CreateReportDto = {
        reportType: formData.targetType === 'team_member' ? ReportType.USER : ReportType.PROJECT,
        targetId: formData.targetType === 'team_member' ? formData.targetUserId! : projectId,
        targetUserId: formData.targetType === 'team_member' ? formData.targetUserId! : undefined,
        reason: formData.reason,
        description: formData.description.trim(),
        evidenceUrls: formData.evidenceUrls.length > 0 ? formData.evidenceUrls : undefined,
        metadata: {
          projectName,
          projectId,
          reportedFrom: 'project-page',
          ...(selectedMember && {
            reportedUserName: selectedMember.name,
            reportedUserEmail: selectedMember.email,
          }),
        },
      };

      await reportService.createReport(reportData);
      setSuccess(true);

      // Refresh reports list
      const reportsData = await reportService.getReportsByTarget(projectId);
      setExistingReports(reportsData);
    } catch (err: any) {
      console.error('Failed to submit report:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form for new report
  const resetForm = () => {
    setFormData({
      targetType: 'project',
      reportType: ReportType.PROJECT,
      targetUserId: null,
      reason: ReportReason.OTHER,
      description: '',
      evidenceUrls: [],
    });
    setSuccess(false);
    setError(null);
  };

  // Handle target type change
  const handleTargetTypeChange = (targetType: ReportTargetType) => {
    setFormData({
      ...formData,
      targetType,
      reportType: targetType === 'team_member' ? ReportType.USER : ReportType.PROJECT,
      targetUserId: null,
    });
  };

  // Access check
  if (roleLoading) {
    return <AccessLoading />;
  }

  if (!hasAccess) {
    return <AccessDenied message="You don't have permission to report issues for this project." />;
  }

  // Loading state
  if (companyLoading || loading) {
    return (
      <ProjectPageLayout title="Report an Issue" subtitle="Loading...">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </ProjectPageLayout>
    );
  }

  // Success state
  if (success) {
    return (
      <ProjectPageLayout title="Report an Issue" subtitle="Report submitted successfully">
        {isProjectRejected && (
          <RejectedProjectBanner reason={rejectionReason} className="mb-6" />
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border border-green-200 rounded-xl p-8 text-center max-w-2xl mx-auto"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for reporting this issue. Our admin team will review it and take appropriate action.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={resetForm}
              className="px-6 py-3 border-2 border-green-600 text-green-700 rounded-xl font-semibold hover:bg-green-100 transition-colors"
            >
              Submit Another Report
            </button>
            <button
              onClick={() => navigate(`/company/${companyId}/project/${projectId}/dashboard`)}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </motion.div>

        {/* Show existing reports */}
        {existingReports.length > 0 && (
          <div className="mt-8 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Your Reports</h3>
            <div className="space-y-4">
              {existingReports.slice(0, 5).map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </div>
        )}
      </ProjectPageLayout>
    );
  }

  // Report form
  return (
    <ProjectPageLayout
      title="Report an Issue"
      subtitle={`Report a problem with ${projectName}`}
      headerActions={
        existingReports.length > 0 ? (
          <button
            onClick={() => setShowExistingReports(!showExistingReports)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>View Reports ({existingReports.length})</span>
          </button>
        ) : null
      }
    >
      {isProjectRejected && (
        <RejectedProjectBanner reason={rejectionReason} className="mb-6" />
      )}

      {/* Show existing reports panel */}
      {showExistingReports && existingReports.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-8 bg-gray-50 rounded-xl p-6 border border-gray-200"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">Your Previous Reports</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {existingReports.map((report) => (
              <ReportCard key={report.id} report={report} compact />
            ))}
          </div>
        </motion.div>
      )}

      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Target Type Selection */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              <span>What do you want to report?</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleTargetTypeChange('project')}
                disabled={isProjectRejected}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  formData.targetType === 'project'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <FolderKanban
                    className={`w-6 h-6 ${
                      formData.targetType === 'project' ? 'text-orange-600' : 'text-gray-400'
                    }`}
                  />
                  <div>
                    <div className="font-semibold text-gray-900">This Project</div>
                    <div className="text-sm text-gray-500">Report an issue with {projectName}</div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleTargetTypeChange('team_member')}
                disabled={isProjectRejected || teamMembers.length === 0}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  formData.targetType === 'team_member'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${teamMembers.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <Users
                    className={`w-6 h-6 ${
                      formData.targetType === 'team_member' ? 'text-orange-600' : 'text-gray-400'
                    }`}
                  />
                  <div>
                    <div className="font-semibold text-gray-900">A Team Member</div>
                    <div className="text-sm text-gray-500">
                      {teamMembers.length === 0
                        ? 'No team members available'
                        : `Report a member of this project (${teamMembers.length} members)`}
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Team Member Selection Dropdown */}
            {formData.targetType === 'team_member' && teamMembers.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Team Member
                </label>
                <select
                  value={formData.targetUserId || ''}
                  onChange={(e) => setFormData({ ...formData, targetUserId: e.target.value || null })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors bg-white"
                  required={formData.targetType === 'team_member'}
                >
                  <option value="">-- Select a team member --</option>
                  {teamMembers.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.name} ({member.email}) - {member.role}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Reason Selection */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <ShieldAlert className="w-6 h-6 text-orange-500" />
              <span>Why are you reporting?</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {REASON_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = formData.reason === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, reason: option.value })}
                    disabled={isProjectRejected}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={`w-6 h-6 ${
                          isSelected ? 'text-orange-600' : 'text-gray-400'
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Describe the Issue</h3>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Please provide detailed information about the issue you're reporting. Include specific examples, dates, or other relevant details..."
              rows={6}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
              required
              disabled={isProjectRejected}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Briefcase className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">What happens next?</h4>
                <p className="text-sm text-blue-700 mt-1">
                  {formData.targetType === 'team_member'
                    ? 'Your report about this team member will be reviewed by our admin team. We take all reports seriously and will investigate the issue. The reported user will not know who filed the report. You may be contacted for additional information.'
                    : 'Your report will be reviewed by our admin team. We take all reports seriously and will investigate the issue. You may be contacted for additional information.'}
                </p>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          {isProjectRejected ? (
            <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-gray-500">Reporting is disabled for rejected projects</p>
            </div>
          ) : (
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(`/company/${companyId}/project/${projectId}/dashboard`)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </ProjectPageLayout>
  );
};

// Report card component
const ReportCard: React.FC<{ report: Report; compact?: boolean }> = ({ report, compact = false }) => {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    reviewing: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    dismissed: 'bg-gray-100 text-gray-700',
  };

  const reasonLabels: Record<string, string> = {
    spam: 'Spam',
    inappropriate: 'Inappropriate',
    fraud: 'Fraud',
    harassment: 'Harassment',
    other: 'Other',
  };

  const reportTypeLabels: Record<string, string> = {
    user: 'Team Member',
    project: 'Project',
    job: 'Job',
    gig: 'Gig',
    message: 'Message',
  };

  const isUserReport = report.report_type === 'user';
  const reportedUserName = report.metadata?.reportedUserName;

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isUserReport ? (
            <User className="w-4 h-4 text-purple-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-gray-500" />
          )}
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">{reasonLabels[report.reason] || report.reason}</span>
            {isUserReport && reportedUserName && (
              <span className="text-xs text-purple-600">({reportedUserName})</span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[report.status]}`}>
            {report.status}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {isUserReport ? (
            <User className="w-5 h-5 text-purple-500 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
          )}
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-gray-900">{reasonLabels[report.reason] || report.reason}</h4>
              <span className={`px-2 py-0.5 rounded text-xs ${isUserReport ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {reportTypeLabels[report.report_type] || report.report_type}
              </span>
            </div>
            {isUserReport && reportedUserName && (
              <p className="text-sm text-purple-600 mt-0.5">Reported: {reportedUserName}</p>
            )}
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{report.description}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[report.status]}`}>
            {report.status}
          </span>
        </div>
      </div>
      <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>{new Date(report.created_at).toLocaleDateString()}</span>
        </div>
        {report.resolution && (
          <span className="text-green-600">Resolution: {report.resolution.replace('_', ' ')}</span>
        )}
      </div>
    </div>
  );
};

export default ReportIssue;
