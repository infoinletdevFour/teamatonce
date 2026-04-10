import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  DollarSign,
  MessageSquare,
  Target,
  Zap,
  ArrowRight,
  BarChart3,
  Flag,
  X,
  Send,
  FileText,
  Layers,
  Eye,
  Clock,
  FileCheck,
  Edit3,
  Bell,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { UserAvatar, AccessDenied, AccessLoading } from '@/components/project';
import { RejectedProjectBanner } from '@/components/project/RejectedProjectBanner';
import type { Milestone } from '@/types/milestone';
import type { TeamMember as ProjectTeamMember } from '@/lib/types/project';
import { useCompany } from '@/contexts/CompanyContext';
import { ProjectPageLayout } from '@/layouts/ProjectPageLayout';
import { getProjectStats, getProjectMilestones, endProject, fixAwardedStatus, requestMilestonePlan, getMilestonePlanRequestStatus, dismissMilestonePlanRequests } from '@/services/projectService';
import { getProjectTeam } from '@/services/teamMemberService';
import { useProjectRole } from '@/hooks/useProjectRole';
import { proposalService } from '@/services/proposalService';
import type { Proposal } from '@/types/proposal';
import { socketClient } from '@/lib/websocket-client';
import { getLatestMilestonePlan } from '@/services/milestonePlanService';
import { hireRequestService, HireRequest } from '@/services/hireRequestService';

/**
 * Project Dashboard Page
 * Comprehensive project overview with stats, milestones, activity, and team info
 */

export const Dashboard: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { companyId, company, loading: companyLoading } = useCompany();

  // Check project membership and role
  const { hasAccess, loading: roleLoading, isClient, isDeveloper } = useProjectRole(projectId);

  // State for end project modal
  const [showEndProjectModal, setShowEndProjectModal] = useState(false);
  const [endingProject, setEndingProject] = useState(false);

  // State for real data
  const [projectStats, setProjectStats] = useState<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    filesCount: number;
  } | null>(null);
  const [projectStatus, setProjectStatus] = useState<string>('active');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [proposalsError, setProposalsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<string>('approved');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [reminderReceived, setReminderReceived] = useState(false);
  const [reminderReceivedAt, setReminderReceivedAt] = useState<string | null>(null);
  const [hasRequestedOnce, setHasRequestedOnce] = useState(false);
  const [milestonePlan, setMilestonePlan] = useState<any>(null);
  const [milestonePlanLoading, setMilestonePlanLoading] = useState(false);

  // Hire requests state
  const [hireRequests, setHireRequests] = useState<HireRequest[]>([]);
  const [hireRequestsLoading, setHireRequestsLoading] = useState(false);

  // Check if project is completed/ended
  const isProjectCompleted = projectStatus === 'completed' || projectStatus === 'ended';

  // Check if project is rejected
  const isProjectRejected = approvalStatus === 'rejected';

  // Fetch all data on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch project stats, milestones, and team in parallel
        const [statsData, milestonesData, teamData] = await Promise.all([
          getProjectStats(projectId),
          getProjectMilestones(projectId),
          getProjectTeam(projectId),
        ]);

        // Extract stats from ProjectWithStats response
        setProjectStats({
          totalTasks: statsData.stats?.totalTasks || 0,
          completedTasks: statsData.stats?.completedTasks || 0,
          inProgressTasks: statsData.stats?.inProgressTasks || 0,
          filesCount: 0, // Will be fetched separately if needed
        });
        // Set project status and approval status
        setProjectStatus(statsData.project?.status || 'active');
        setApprovalStatus(statsData.project?.approval_status || 'approved');
        setRejectionReason(statsData.project?.approval_rejection_reason || '');
        setMilestones(milestonesData.milestones || []);

        // Transform TeamMember to ProjectTeamMember format
        const transformedTeam: ProjectTeamMember[] = (teamData || []).map((member: any) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          avatar: member.avatar,
          role: (['client', 'developer', 'designer', 'project-manager'].includes(member.role)
            ? member.role
            : 'developer') as 'client' | 'developer' | 'designer' | 'project-manager',
          status: (member.availability === 'available'
            ? (member.online_status ? 'online' : 'offline')
            : member.availability === 'busy' ? 'busy' : 'offline') as 'online' | 'away' | 'busy' | 'offline',
          timezone: member.timezone,
        }));
        setTeamMembers(transformedTeam);
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [projectId]);

  // Fetch proposals separately with better error handling (CLIENT ONLY)
  useEffect(() => {
    const fetchProposals = async () => {
      // Only fetch proposals if user is client
      if (!projectId || !isClient) {
        setProposalsLoading(false);
        return;
      }

      try {
        setProposalsLoading(true);
        setProposalsError(null);
        console.log('Fetching proposals for project:', projectId);

        const proposalsData = await proposalService.getProjectProposals(projectId);
        console.log('Proposals fetched:', proposalsData);

        setProposals(proposalsData || []);
      } catch (err: any) {
        console.error('Error fetching proposals:', err);
        setProposalsError(err.message || 'Failed to load proposals');
        setProposals([]);
      } finally {
        setProposalsLoading(false);
      }
    };

    fetchProposals();
  }, [projectId, isClient]);

  // Fetch milestone plan for awarded projects
  useEffect(() => {
    const fetchMilestonePlan = async () => {
      if (!projectId || projectStatus !== 'awarded') return;

      try {
        setMilestonePlanLoading(true);
        const plan = await getLatestMilestonePlan(projectId);
        setMilestonePlan(plan);
        console.log('Milestone plan fetched:', plan);
      } catch (err: any) {
        console.error('Error fetching milestone plan:', err);
        setMilestonePlan(null);
      } finally {
        setMilestonePlanLoading(false);
      }
    };

    fetchMilestonePlan();
  }, [projectId, projectStatus]);

  // Fetch hire requests for this project (clients only)
  useEffect(() => {
    const fetchHireRequests = async () => {
      if (!projectId || !isClient) return;

      try {
        setHireRequestsLoading(true);
        const allHireRequests = await hireRequestService.getClientHireRequests();
        // Filter by this project ID
        const projectHireRequests = allHireRequests.filter(hr => hr.projectId === projectId);
        setHireRequests(projectHireRequests);
      } catch (err: any) {
        console.error('Error fetching hire requests:', err);
      } finally {
        setHireRequestsLoading(false);
      }
    };

    fetchHireRequests();
  }, [projectId, isClient]);

  // Auto-fix project status if it has accepted proposal but status is still 'planning'
  useEffect(() => {
    const autoFixStatus = async () => {
      if (!projectId || !proposals || proposals.length === 0) return;

      // Check if there's an accepted proposal
      const hasAcceptedProposal = proposals.some(p => p.status === 'accepted');

      // If status is 'planning' but has accepted proposal, fix it
      if (projectStatus === 'planning' && hasAcceptedProposal) {
        console.log('🔧 Auto-fixing project status from planning to awarded...');
        try {
          const result = await fixAwardedStatus(projectId);
          console.log('✅ Status fix result:', result);

          if (result.updated) {
            // Reload the project data to get the updated status
            const statsData = await getProjectStats(projectId);
            setProjectStatus(statsData.project?.status || 'active');
            console.log('✅ Project status updated to:', statsData.project?.status);
          }
        } catch (error) {
          console.error('❌ Failed to fix project status:', error);
        }
      }
    };

    autoFixStatus();
  }, [projectId, proposals, projectStatus]);

  // Load milestone plan request status from database
  useEffect(() => {
    const loadRequestStatus = async () => {
      if (!projectId || projectStatus !== 'awarded') return;

      try {
        const status = await getMilestonePlanRequestStatus(projectId);

        // For client: set hasRequestedOnce if they've sent a request before
        if (status.isClient && status.hasRequested) {
          setHasRequestedOnce(true);
        }

        // For developer: show badge if there are unread notifications
        if (status.isDeveloper && status.unreadCount > 0) {
          setReminderReceived(true);
          if (status.lastRequestedAt) {
            setReminderReceivedAt(status.lastRequestedAt);
          }
        }
      } catch (error) {
        console.error('Failed to load request status:', error);
      }
    };

    loadRequestStatus();
  }, [projectId, projectStatus]);

  // Setup WebSocket listeners for real-time milestone updates
  useEffect(() => {
    if (!projectId) return;

    // Connect to WebSocket and join project room
    socketClient.connect(undefined, projectId);

    // Listen for milestone updates
    const handleMilestoneUpdate = (data: any) => {
      console.log('Milestone updated via WebSocket:', data);
      const updatedMilestone = data.milestone;

      // Update the milestone in the local state
      setMilestones((prevMilestones) =>
        prevMilestones.map((m) =>
          m.id === updatedMilestone.id ? updatedMilestone : m
        )
      );
    };

    socketClient.onMilestoneUpdated(handleMilestoneUpdate);

    // Listen for milestone plan reminders (for developers)
    const handleMilestonePlanReminder = (data: any) => {
      console.log('Milestone plan reminder received:', data);
      if (isDeveloper) {
        setReminderReceived(true);
        setReminderReceivedAt(data.timestamp || new Date().toISOString());
      }
    };

    socketClient.on('milestone_plan:reminder', handleMilestonePlanReminder);

    // Listen for milestone plan submissions (for clients)
    const handleMilestonePlanSubmitted = async (data: any) => {
      console.log('Milestone plan submitted:', data);
      if (isClient && projectId) {
        // Fetch the latest milestone plan
        try {
          const plan = await getLatestMilestonePlan(projectId);
          setMilestonePlan(plan);
        } catch (err) {
          console.error('Error fetching milestone plan after submission:', err);
        }
      }
    };

    socketClient.on('milestone_plan:submitted', handleMilestonePlanSubmitted);

    // Listen for milestone plan status updates (approvals, rejections, etc.)
    const handleMilestonePlanStatusUpdate = async (data: any) => {
      console.log('Milestone plan status updated:', data);
      if (projectId) {
        // Refresh milestone plan data
        try {
          const plan = await getLatestMilestonePlan(projectId);
          setMilestonePlan(plan);
        } catch (err) {
          console.error('Error fetching milestone plan after status update:', err);
        }
      }
    };

    socketClient.on('milestone_plan:status_updated', handleMilestonePlanStatusUpdate);

    // Cleanup on unmount
    return () => {
      socketClient.off('milestone-updated', handleMilestoneUpdate);
      socketClient.off('milestone_plan:reminder', handleMilestonePlanReminder);
      socketClient.off('milestone_plan:submitted', handleMilestonePlanSubmitted);
      socketClient.off('milestone_plan:status_updated', handleMilestonePlanStatusUpdate);
      socketClient.leaveProject(projectId);
    };
  }, [projectId, isDeveloper, isClient]);

  // Helper function to get milestone status display
  // Status values from backend: 'pending' | 'in_progress' | 'submitted' | 'feedback_required' | 'completed' | 'approved'
  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in_progress':
      case 'submitted':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'feedback_required':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getMilestoneStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'submitted':
        return 'Submitted';
      case 'feedback_required':
        return 'Feedback Required';
      case 'approved':
        return 'Approved';
      case 'completed':
        return 'Completed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Calculate overall progress as average of milestone progress
  const calculateOverallProgress = (): number => {
    if (!milestones || milestones.length === 0) return 0;

    const totalProgress = milestones.reduce((sum, milestone) => {
      return sum + (milestone.progress || 0);
    }, 0);

    return Math.round(totalProgress / milestones.length);
  };

  // Calculate completed milestones (status is completed or approved)
  const calculateCompletedMilestones = (): number => {
    if (!milestones || milestones.length === 0) return 0;
    return milestones.filter((milestone) =>
      milestone.status === 'completed' || milestone.status === 'approved'
    ).length;
  };

  // Calculate in-progress milestones (not completed or approved)
  const calculateInProgressMilestones = (): number => {
    if (!milestones || milestones.length === 0) return 0;
    return milestones.filter((milestone) =>
      milestone.status !== 'completed' && milestone.status !== 'approved'
    ).length;
  };

  // Calculate project health metrics
  const calculateProgressHealth = (): { percentage: number; status: string; label: string } => {
    const progress = calculateOverallProgress();
    if (progress >= 80) return { percentage: progress, status: 'excellent', label: 'Excellent' };
    if (progress >= 60) return { percentage: progress, status: 'good', label: 'Good' };
    if (progress >= 40) return { percentage: progress, status: 'fair', label: 'Fair' };
    return { percentage: progress, status: 'poor', label: 'Needs Attention' };
  };

  const calculateBudgetHealth = (): { percentage: number; status: string; label: string } => {
    // Calculate total budget from milestones
    const totalBudget = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
    const totalSpent = milestones
      .filter(m => m.status === 'completed' || m.status === 'approved')
      .reduce((sum, m) => sum + (m.amount || 0), 0);

    if (totalBudget === 0) return { percentage: 0, status: 'unknown', label: 'No Budget' };

    const spentPercentage = (totalSpent / totalBudget) * 100;
    const progressPercentage = calculateOverallProgress();

    // Good: Spent is less than or equal to progress
    if (spentPercentage <= progressPercentage + 10) {
      return { percentage: 100 - spentPercentage, status: 'good', label: 'On Track' };
    }
    // Fair: Spent is slightly more than progress
    if (spentPercentage <= progressPercentage + 20) {
      return { percentage: 100 - spentPercentage, status: 'fair', label: 'Watch Budget' };
    }
    // Poor: Spent is much more than progress
    return { percentage: 100 - spentPercentage, status: 'poor', label: 'Over Budget' };
  };

  const calculateTimelineHealth = (): { percentage: number; status: string; label: string } => {
    const now = new Date();
    const incompleteMilestones = milestones.filter(
      m => m.status !== 'completed' && m.status !== 'approved'
    );

    if (incompleteMilestones.length === 0) {
      return { percentage: 100, status: 'excellent', label: 'All Complete' };
    }

    // Calculate how many milestones are on schedule
    const onSchedule = incompleteMilestones.filter(m => {
      if (!m.dueDate) return true;
      const dueDate = new Date(m.dueDate);
      return dueDate >= now;
    }).length;

    const onSchedulePercentage = (onSchedule / incompleteMilestones.length) * 100;

    if (onSchedulePercentage >= 80) {
      return { percentage: onSchedulePercentage, status: 'excellent', label: 'On Schedule' };
    }
    if (onSchedulePercentage >= 60) {
      return { percentage: onSchedulePercentage, status: 'good', label: 'Mostly On Track' };
    }
    if (onSchedulePercentage >= 40) {
      return { percentage: onSchedulePercentage, status: 'fair', label: 'Some Delays' };
    }
    return { percentage: onSchedulePercentage, status: 'poor', label: 'Behind Schedule' };
  };

  // Calculate display stats from API data
  const displayStats = projectStats
    ? {
        progress: calculateOverallProgress(),
        budget: milestones.reduce((sum, m) => sum + (m.amount || 0), 0),
        spent: milestones
          .filter(m => m.status === 'completed' || m.status === 'approved')
          .reduce((sum, m) => sum + (m.amount || 0), 0),
        timeRemaining: 0, // TODO: Calculate from project expected_completion_date when we fetch project
        tasksTotal: projectStats.totalTasks || 0,
        tasksCompleted: projectStats.completedTasks || 0,
        completedTasks: projectStats.completedTasks || 0, // Keep for backward compatibility
        teamSize: teamMembers.length, // Use actual fetched team members count
        activeMembers: teamMembers.filter((m) => m.status === 'online').length,
      }
    : {
        progress: 0,
        budget: 0,
        spent: 0,
        timeRemaining: 0,
        tasksTotal: 0,
        tasksCompleted: 0,
        completedTasks: 0,
        teamSize: 0,
        activeMembers: 0,
      };

  // Handle end project
  const handleEndProject = async () => {
    if (!projectId) return;

    try {
      setEndingProject(true);
      const result = await endProject(projectId);

      if (result.success) {
        setShowEndProjectModal(false);
        // Navigate to feedback page
        navigate(`/company/${companyId}/project/${projectId}/feedback`);
      }
    } catch (err: any) {
      console.error('Failed to end project:', err);
      setError(err.message || 'Failed to end project');
    } finally {
      setEndingProject(false);
    }
  };

  // Handle sending reminder to developer to create milestone plan
  const handleSendReminder = async () => {
    if (!projectId) return;

    try {
      setSendingReminder(true);

      // Send reminder through API (creates notification + WebSocket event)
      const result = await requestMilestonePlan(projectId);

      if (result.success) {
        setReminderSent(true);
        setHasRequestedOnce(true);

        // Reset the reminder sent state after 5 seconds
        setTimeout(() => {
          setReminderSent(false);
        }, 5000);
      }
    } catch (err: any) {
      console.error('Failed to send reminder:', err);
      setError(err.message || 'Failed to send reminder');
    } finally {
      setSendingReminder(false);
    }
  };

  // Handle dismissing the reminder banner/badge
  const handleDismissReminder = async () => {
    if (!projectId) return;

    try {
      // Mark notifications as read in database
      await dismissMilestonePlanRequests(projectId);

      // Hide the UI elements
      setReminderReceived(false);
      setReminderReceivedAt(null);
    } catch (err: any) {
      console.error('Failed to dismiss reminder:', err);
    }
  };

  // Loading and error states
  if (companyLoading || loading) {
    return (
      <ProjectPageLayout title="Project Overview" subtitle="Loading...">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </ProjectPageLayout>
    );
  }

  if (error) {
    return (
      <ProjectPageLayout title="Project Overview" subtitle="Error loading dashboard">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </ProjectPageLayout>
    );
  }

  if (!company || !companyId) {
    return (
      <ProjectPageLayout title="Project Overview" subtitle="No company selected">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">No company selected</p>
        </div>
      </ProjectPageLayout>
    );
  }

  // Access check
  if (roleLoading) {
    return <AccessLoading />;
  }

  if (!hasAccess) {
    return <AccessDenied message="You don't have permission to access this project dashboard." />;
  }

  return (
    <ProjectPageLayout
      title={
        <div className="flex items-center space-x-3">
          <span>Project Overview</span>
          {isProjectCompleted && (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full border border-green-200 flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>Completed</span>
            </span>
          )}
        </div>
      }
      subtitle={isClient ? "Manage your project and team" : "Track your tasks and deliverables"}
    >
      {/* Rejected Project Banner */}
      {isProjectRejected && (
        <RejectedProjectBanner
          reason={rejectionReason}
          className="mb-6"
        />
      )}

      {/* Key Metrics - Different for Client vs Developer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {(isClient ? [
          {
            label: 'Overall Progress',
            value: `${displayStats.progress}%`,
            icon: TrendingUp,
            color: 'blue',
            trend: `${displayStats.completedTasks || 0} tasks completed`,
          },
          {
            label: 'Budget Spent',
            value: displayStats.budget > 0 ? `$${displayStats.spent.toLocaleString()}` : 'N/A',
            icon: DollarSign,
            color: 'green',
            trend: displayStats.budget > 0 ? `of $${displayStats.budget.toLocaleString()}` : 'No budget set',
          },
          {
            label: 'Tasks Completed',
            value: `${displayStats.tasksCompleted}/${displayStats.tasksTotal}`,
            icon: CheckCircle,
            color: 'purple',
            trend: displayStats.tasksTotal > 0 ? `${Math.round((displayStats.tasksCompleted / displayStats.tasksTotal) * 100)}% done` : 'No tasks yet',
          },
          {
            label: 'Team Members',
            value: `${displayStats.teamSize}`,
            icon: Users,
            color: 'orange',
            trend: `${displayStats.activeMembers} active`,
          },
        ] : [
          // Developer View - Focus on their work
          {
            label: 'Overall Progress',
            value: `${displayStats.progress}%`,
            icon: TrendingUp,
            color: 'blue',
            trend: `${calculateCompletedMilestones()} milestones completed`,
          },
          {
            label: 'My Tasks',
            value: `${displayStats.tasksCompleted}/${displayStats.tasksTotal}`,
            icon: CheckCircle,
            color: 'green',
            trend: displayStats.tasksTotal > 0 ? `${Math.round((displayStats.tasksCompleted / displayStats.tasksTotal) * 100)}% complete` : 'No tasks assigned',
          },
          {
            label: 'Milestones',
            value: `${calculateCompletedMilestones()}/${milestones.length}`,
            icon: Target,
            color: 'purple',
            trend: `${calculateInProgressMilestones()} in progress`,
          },
          {
            label: 'Team Members',
            value: `${displayStats.teamSize}`,
            icon: Users,
            color: 'orange',
            trend: `${displayStats.activeMembers} active now`,
          },
        ]).map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
            <p className="text-sm text-gray-500">{stat.trend}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Milestones & Progress */}
        <div className="lg:col-span-2 space-y-8">
          {/* Milestones */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900 flex items-center space-x-2">
                <Target className="w-6 h-6 text-blue-600" />
                <span>Project Milestones</span>
              </h2>
              {/* Only show View All link when milestones exist and project is not in awarded status */}
              {milestones.length > 0 && projectStatus !== 'awarded' && (
                <Link
                  to={`/company/${companyId}/project/${projectId}/milestone-approval`}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            <div className="space-y-4">
              {/* Notification banner for developer when client sends reminder */}
              {isDeveloper && reminderReceived && projectStatus === 'awarded' && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-blue-700 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-bold text-blue-900">Client Reminder</p>
                      <p className="text-sm text-blue-700">Client is requesting milestone plan submission</p>
                      {reminderReceivedAt && (
                        <p className="text-xs text-blue-600 mt-1">
                          {new Date(reminderReceivedAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleDismissReminder}
                    className="text-blue-600 hover:text-blue-800 p-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {milestones.length === 0 ? (
                projectStatus === 'awarded' ? (
                  // ROLE-SPECIFIC VIEWS when project is awarded
                  isDeveloper ? (
                    // DEVELOPER VIEW: Check milestone plan status
                    milestonePlan && milestonePlan.status === 'changes_requested' ? (
                      // Client requested changes - action required
                      <div className="relative text-center py-10 px-6 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border-2 border-yellow-400">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-yellow-200 flex items-center justify-center animate-pulse">
                          <Edit3 className="w-10 h-10 text-yellow-700" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-3">
                          📝 Client Requested Changes
                        </h3>
                        <p className="text-lg text-yellow-800 font-semibold mb-2">
                          Please review and update your milestone plan
                        </p>

                        {/* Client Feedback */}
                        {milestonePlan.clientFeedback && (
                          <div className="max-w-lg mx-auto mb-4 p-4 bg-white rounded-lg border-2 border-yellow-300">
                            <p className="text-sm font-bold text-gray-700 mb-2">Client Feedback:</p>
                            <p className="text-gray-800 text-left">{milestonePlan.clientFeedback}</p>
                          </div>
                        )}

                        <p className="text-yellow-700 mb-6 max-w-md mx-auto">
                          Update your milestone plan based on the client's feedback and resubmit for approval.
                        </p>

                        <Link
                          to={`/company/${companyId}/project/${projectId}/milestone-planning`}
                          className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-600 to-amber-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                        >
                          <Edit3 className="w-6 h-6" />
                          Update Milestone Plan
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      </div>
                    ) : milestonePlan && milestonePlan.status === 'pending_review' ? (
                      // Plan submitted - waiting for client review
                      <div className="relative text-center py-10 px-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-300">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-200 flex items-center justify-center">
                          <CheckCircle className="w-10 h-10 text-blue-600 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-3">
                          ✅ Milestone Plan Submitted!
                        </h3>
                        <p className="text-lg text-blue-800 font-semibold mb-2">
                          Awaiting client review and approval
                        </p>
                        <p className="text-blue-700 mb-4 max-w-md mx-auto">
                          Your detailed milestone plan has been submitted to the client for review. You'll be notified once they approve or request changes.
                        </p>
                        <p className="text-sm text-blue-600 font-medium mb-6">
                          📋 {milestonePlan.milestones?.length || 0} milestones • Submitted {new Date(milestonePlan.submittedAt || milestonePlan.createdAt).toLocaleDateString()}
                        </p>

                        <Link
                          to={`/company/${companyId}/project/${projectId}/milestone-planning`}
                          className="inline-flex items-center gap-3 px-6 py-3 bg-blue-100 text-blue-700 rounded-xl font-bold text-base hover:bg-blue-200 transition-all border-2 border-blue-300"
                        >
                          <Eye className="w-5 h-5" />
                          View Submitted Plan
                        </Link>
                      </div>
                    ) : (
                      // No plan submitted yet - action required
                      <div className="relative py-12 px-8 bg-white rounded-lg border border-gray-200 shadow-sm">
                        {/* Client Reminder Badge */}
                        {reminderReceived && (
                          <div className="absolute top-4 right-4 flex items-center gap-2 bg-sky-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Client Requested</span>
                          </div>
                        )}

                        <div className="max-w-2xl mx-auto text-center">
                          {/* Icon Badge */}
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-100 rounded-lg mb-6">
                            <Layers className="w-8 h-8 text-sky-600" />
                          </div>

                          {/* Heading */}
                          <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Action Required: Create Milestone Plan
                          </h3>

                          {/* Subheading */}
                          <p className="text-lg text-gray-700 font-medium mb-2">
                            Client accepted your proposal
                          </p>

                          {/* Description */}
                          <p className="text-gray-600 mb-8 leading-relaxed">
                            Create a detailed technical breakdown with milestones, deliverables, and timeline for client approval.
                          </p>

                          {/* CTA Button */}
                          <Link
                            to={`/company/${companyId}/project/${projectId}/milestone-planning`}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-colors"
                          >
                            <FileCheck className="w-5 h-5" />
                            Create Milestone Plan Now
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    )
                  ) : (
                    // CLIENT VIEW: Check milestone plan status
                    milestonePlan && milestonePlan.status === 'pending_review' ? (
                      // Plan is ready for review!
                      <div className="py-12 px-8 bg-white rounded-lg border border-green-200 shadow-sm">
                        <div className="max-w-2xl mx-auto text-center">
                          {/* Icon Badge */}
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-lg mb-6">
                            <FileCheck className="w-8 h-8 text-green-600" />
                          </div>

                          {/* Heading */}
                          <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Milestone Plan Ready for Review
                          </h3>

                          {/* Subheading */}
                          <p className="text-lg text-gray-700 font-medium mb-2">
                            Developer has submitted a detailed technical breakdown
                          </p>

                          {/* Description */}
                          <p className="text-gray-600 mb-6 leading-relaxed">
                            Review the proposed milestones, deliverables, timeline, and budget allocation before approving.
                          </p>

                          {/* Meta Info */}
                          <div className="flex items-center justify-center gap-4 text-sm text-gray-600 mb-8">
                            <span className="flex items-center gap-1.5">
                              <Layers className="w-4 h-4" />
                              {milestonePlan.milestones?.length || 0} milestones
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              Submitted {new Date(milestonePlan.submittedAt || milestonePlan.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* CTA Button */}
                          <Link
                            to={`/company/${companyId}/project/${projectId}/milestone-plan-review`}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                          >
                            <Eye className="w-5 h-5" />
                            Review & Approve Plan
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    ) : (
                      // Still waiting for developer to submit
                      <div className="py-12 px-8 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="max-w-2xl mx-auto text-center">
                          {/* Icon Badge */}
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-lg mb-6">
                            <Clock className="w-8 h-8 text-gray-600" />
                          </div>

                          {/* Heading */}
                          <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Waiting for Technical Breakdown
                          </h3>

                          {/* Subheading */}
                          <p className="text-lg text-gray-700 font-medium mb-2">
                            Developer is preparing milestone plan
                          </p>

                          {/* Description */}
                          <p className="text-gray-600 mb-6 leading-relaxed">
                            The developer is creating a detailed technical breakdown with milestones, deliverables, budget allocation, and timeline.
                          </p>

                          {/* Info Badge */}
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium mb-8">
                            <Bell className="w-4 h-4" />
                            You'll be notified when it's ready for your review and approval
                          </div>

                          {/* Request/Reminder Button for Client */}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSendReminder}
                            disabled={sendingReminder || reminderSent}
                            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                              reminderSent
                                ? 'bg-green-600 text-white cursor-not-allowed'
                                : 'bg-sky-600 text-white hover:bg-sky-700'
                            }`}
                          >
                          {sendingReminder ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Sending...
                            </>
                          ) : reminderSent ? (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              Reminder Sent!
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5" />
                              {hasRequestedOnce ? 'Request Again' : 'Request Milestone Plan'}
                            </>
                          )}
                        </motion.button>

                        {/* Show message after first request */}
                        {hasRequestedOnce && !reminderSent && (
                          <p className="text-sm text-gray-600 mt-3 font-medium">
                            ✓ Request sent. You can send another reminder if needed.
                          </p>
                        )}
                        </div>
                      </div>
                    )
                  )
                ) : (
                  // Default empty state (other statuses)
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No milestones created yet</p>
                  </div>
                )
              ) : (
                milestones.slice(0, 3).map((milestone, idx) => {
                  // Use 'progress' field from backend (0-100)
                  const milestoneProgress = milestone.progress || 0;

                  return (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-1">{milestone.title}</h3>
                          {milestone.dueDate && (
                            <p className="text-sm text-gray-600">
                              Due: {new Date(milestone.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${getMilestoneStatusColor(
                            milestone.status
                          )}`}
                        >
                          {getMilestoneStatusLabel(milestone.status)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-bold text-blue-600">{milestoneProgress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${milestoneProgress}%` }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className={`h-full ${
                              milestone.status === 'completed' || milestone.status === 'approved'
                                ? 'bg-green-500'
                                : 'bg-gradient-to-r from-blue-500 to-purple-500'
                            }`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Proposals Section - CLIENT ONLY */}
          {isClient && (
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900 flex items-center space-x-2">
                <Send className="w-6 h-6 text-purple-600" />
                <span>Proposals Received</span>
                {!proposalsLoading && proposals.length > 0 && (
                  <span className="text-sm font-normal text-gray-500">
                    ({proposals.length})
                  </span>
                )}
              </h2>
            </div>

            {/* Loading State */}
            {proposalsLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-600">Loading proposals...</span>
              </div>
            )}

            {/* Error State */}
            {!proposalsLoading && proposalsError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">{proposalsError}</span>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!proposalsLoading && !proposalsError && proposals.length === 0 && (
              <div className="text-center py-8">
                <Send className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No proposals received yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Sellers will be able to submit proposals for this project
                </p>
              </div>
            )}

            {/* Proposals List - 2x2 Grid */}
            {!proposalsLoading && !proposalsError && proposals.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {proposals.slice(0, 4).map((proposal, idx) => {
                    const StatusIcon = proposal.status === 'accepted' ? CheckCircle : proposal.status === 'rejected' ? X : Clock;

                    return (
                      <motion.div
                        key={proposal.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-4 bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all group"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                              {proposal.company?.name || proposal.company_name || 'Company'}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {new Date(proposal.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
                              proposal.status === 'accepted'
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : proposal.status === 'rejected'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                            }`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            <span className="capitalize">{proposal.status}</span>
                          </span>
                        </div>

                        {/* Cost and Duration */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="p-2 bg-green-50 rounded-lg border border-green-100">
                            <p className="text-xs text-gray-600 mb-0.5">Cost</p>
                            <p className="font-bold text-gray-900 text-sm flex items-center">
                              <DollarSign className="w-3 h-3 text-green-600 mr-0.5" />
                              {proposal.proposedCost.toLocaleString()}
                            </p>
                          </div>
                          <div className="p-2 bg-sky-50 rounded-lg border border-sky-100">
                            <p className="text-xs text-gray-600 mb-0.5">Duration</p>
                            <p className="font-bold text-gray-900 text-sm flex items-center">
                              <Calendar className="w-3 h-3 text-sky-600 mr-0.5" />
                              {proposal.proposedDurationDays}d
                            </p>
                          </div>
                        </div>

                        {/* Cover Letter Preview */}
                        {proposal.coverLetter && (
                          <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                            {proposal.coverLetter}
                          </p>
                        )}

                        {/* View Button */}
                        <button
                          onClick={() => navigate(`/company/${companyId}/project/${projectId}/proposals`)}
                          className="w-full flex items-center justify-center space-x-1.5 py-2 text-sm font-semibold text-purple-600 hover:text-white bg-white hover:bg-purple-600 border-2 border-purple-200 hover:border-purple-600 rounded-lg transition-all"
                        >
                          <FileText className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* View All Button */}
                {proposals.length > 4 && (
                  <button
                    onClick={() => navigate(`/company/${companyId}/project/${projectId}/proposals`)}
                    className="w-full py-3 text-center text-purple-600 hover:text-white bg-white hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 font-bold text-sm border-2 border-purple-300 hover:border-purple-600 rounded-xl transition-all shadow-sm hover:shadow-md"
                  >
                    View All {proposals.length} Proposals →
                  </button>
                )}
              </div>
            )}
          </div>
          )}

          {/* Project Statistics */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900 flex items-center space-x-2">
                <BarChart3 className="w-6 h-6 text-purple-600" />
                <span>Project Statistics</span>
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-semibold text-gray-600">Total Milestones</span>
                <span className="text-lg font-black text-gray-900">
                  {milestones.length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-semibold text-gray-600">Completed Milestones</span>
                <span className="text-lg font-black text-green-600">
                  {calculateCompletedMilestones()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-semibold text-gray-600">In Progress Milestones</span>
                <span className="text-lg font-black text-blue-600">
                  {calculateInProgressMilestones()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-semibold text-gray-600">Project Files</span>
                <span className="text-lg font-black text-purple-600">
                  {projectStats?.filesCount || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Team & Quick Actions */}
        <div className="space-y-8">
          {/* Team Members */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-600" />
                <span>Team</span>
              </h2>
              <Link
                to={`/company/${companyId}/project/${projectId}/team`}
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center space-x-1"
              >
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3 mb-4">
              {teamMembers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No team members assigned yet</p>
                </div>
              ) : (
                teamMembers.slice(0, 4).map((member, idx) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <UserAvatar user={member} size="md" showStatus />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{member.name}</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {member.role?.replace('_', ' ') || 'Team Member'}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Active Members</span>
                <span className="font-bold text-green-600">
                  {displayStats.activeMembers}/{displayStats.teamSize}
                </span>
              </div>
            </div>
          </div>

          {/* Hire Requests - CLIENT ONLY */}
          {isClient && hireRequests.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-gray-900 flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-sky-600" />
                  <span>Hire Requests</span>
                </h2>
                <span className="text-sm text-gray-600">{hireRequests.length} sent</span>
              </div>

              <div className="space-y-3">
                {hireRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-lg border-2 border-gray-200 hover:border-sky-300 hover:bg-sky-50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {request.company?.logo ? (
                            <img
                              src={request.company.logo}
                              alt={request.company.name}
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-bold text-xs">
                                {request.company?.name?.charAt(0) || 'C'}
                              </span>
                            </div>
                          )}
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {request.company?.name || 'Unknown Company'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              request.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : request.status === 'negotiating'
                                ? 'bg-blue-100 text-blue-800'
                                : request.status === 'accepted'
                                ? 'bg-green-100 text-green-800'
                                : request.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {request.status}
                          </span>
                          <span className="text-xs text-gray-600">
                            ${request.totalBudget?.toLocaleString()}
                          </span>
                        </div>
                        {request.responseMessage && (
                          <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                            {request.responseMessage}
                          </p>
                        )}
                      </div>
                      {request.status === 'pending' && (
                        <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      )}
                      {request.status === 'negotiating' && (
                        <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                      {request.status === 'accepted' && (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      )}
                      {request.status === 'rejected' && (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to={`/client/hire-requests?projectId=${projectId}`}
                className="mt-4 flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold text-sky-700 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition-all"
              >
                View All Project Hire Requests
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              <span>Quick Actions</span>
            </h2>

            <div className="space-y-3">
              {[
                {
                  label: 'Messages',
                  icon: MessageSquare,
                  path: `/company/${companyId}/project/${projectId}/messages`,
                  color: 'blue',
                },
                {
                  label: 'Team',
                  icon: Users,
                  path: `/company/${companyId}/project/${projectId}/team`,
                  color: 'green',
                },
                {
                  label: 'Milestones',
                  icon: Target,
                  path: `/company/${companyId}/project/${projectId}/milestones`,
                  color: 'purple',
                },
                {
                  label: 'Calendar',
                  icon: Calendar,
                  path: `/company/${companyId}/project/${projectId}/calendar`,
                  color: 'pink',
                },
              ].map((action, idx) => (
                <Link
                  key={idx}
                  to={action.path}
                  className="flex items-center justify-between p-3 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg bg-${action.color}-100 flex items-center justify-center`}>
                      <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                    </div>
                    <span className="font-semibold text-gray-900 group-hover:text-blue-600">
                      {action.label}
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </Link>
              ))}

              {/* Milestone Planning Link - DEVELOPER ONLY, when project awarded */}
              {isDeveloper && projectStatus === 'awarded' && (
                <Link
                  to={`/company/${companyId}/project/${projectId}/milestone-planning`}
                  className="flex items-center justify-between p-3 rounded-xl border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="font-semibold text-orange-700 group-hover:text-orange-800">
                      Plan Milestones
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-orange-400 group-hover:text-orange-600 transition-colors" />
                </Link>
              )}

              {/* Milestone Plan Review Link - CLIENT ONLY, when plan submitted */}
              {isClient && projectStatus === 'awarded' && (
                <Link
                  to={`/company/${companyId}/project/${projectId}/milestone-plan-review`}
                  className="flex items-center justify-between p-3 rounded-xl border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="font-semibold text-indigo-700 group-hover:text-indigo-800">
                      Review Milestone Plan
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                </Link>
              )}

              {/* End Project Button - CLIENT ONLY, for active projects */}
              {isClient && !isProjectCompleted && (
                <button
                  onClick={() => setShowEndProjectModal(true)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <Flag className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="font-semibold text-red-700 group-hover:text-red-800">
                      End Project
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-red-400 group-hover:text-red-600 transition-colors" />
                </button>
              )}

              {/* Feedback Link - Show for completed projects */}
              {isProjectCompleted && (
                <Link
                  to={`/company/${companyId}/project/${projectId}/feedback`}
                  className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-semibold text-green-700 group-hover:text-green-800">
                      Give Feedback
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-green-400 group-hover:text-green-600 transition-colors" />
                </Link>
              )}
            </div>
          </div>

          {/* Project Health */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <h2 className="text-xl font-black mb-4 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Project Health</span>
            </h2>
            <div className="space-y-4">
              {/* Progress Health */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="opacity-90">Progress</span>
                  <span className="font-bold">{calculateProgressHealth().label}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${calculateProgressHealth().percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-white"
                  />
                </div>
              </div>

              {/* Budget Health */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="opacity-90">Budget</span>
                  <span className="font-bold">{calculateBudgetHealth().label}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(0, calculateBudgetHealth().percentage)}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                    className="h-full bg-white"
                  />
                </div>
                {displayStats.budget > 0 && (
                  <div className="flex justify-between text-xs opacity-75 mt-1">
                    <span>Spent: ${displayStats.spent.toLocaleString()}</span>
                    <span>Budget: ${displayStats.budget.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Timeline Health */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="opacity-90">Timeline</span>
                  <span className="font-bold">{calculateTimelineHealth().label}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${calculateTimelineHealth().percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                    className="h-full bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* End Project Confirmation Modal */}
      <AnimatePresence>
        {showEndProjectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !endingProject && setShowEndProjectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-gray-900">End Project</h3>
                <button
                  onClick={() => setShowEndProjectModal(false)}
                  disabled={endingProject}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Flag className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-gray-600 text-center">
                  Are you sure you want to end this project? This action will mark the project as completed and notify all team members.
                </p>
                <p className="text-sm text-gray-500 text-center mt-2">
                  You will be redirected to provide feedback about the project.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEndProjectModal(false)}
                  disabled={endingProject}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndProject}
                  disabled={endingProject}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {endingProject ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Ending...</span>
                    </>
                  ) : (
                    <>
                      <Flag className="w-5 h-5" />
                      <span>End Project</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ProjectPageLayout>
  );
};

export default Dashboard;
