import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  Send,
  Video,
  Edit,
  Trash2,
  Mail,
  Loader2,
  AlertCircle,
  Plus,
  X,
  Eye,
  Power
} from 'lucide-react';
import { MilestoneList } from '@/components/milestone/MilestoneList';
import { MilestoneFormModal, MilestoneFormData } from '@/components/milestone/MilestoneFormModal';
import { SubmitMilestoneModal } from '@/components/milestone/SubmitMilestoneModal';
import { FeedbackModal } from '@/components/milestone/FeedbackModal';
import { AssignTeamMemberModal } from '@/components/team/AssignTeamMemberModal';
import { ConfirmModal } from '@/components/ui/Modal';
import { AccessDenied, AccessLoading } from '@/components/project';
import { Milestone } from '@/types/milestone';
import { useProjectRole } from '@/hooks/useProjectRole';
import {
  Project as ClientProject,
  Milestone as ClientMilestone,
  Message as ClientMessage,
  FileAttachment
} from '../../types/client';
import {
  Project as BackendProject,
  Milestone as BackendMilestone,
  ProjectFile
} from '@/types/project';
import {
  getProject,
  getProjectMilestones,
  getProjectFiles,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  updateMilestoneStatus,
  approveMilestone,
  submitMilestone,
  requestMilestoneFeedback,
  updateProject,
  deleteProject,
  endProject
} from '@/services/projectService';
import { getProjectTeam, removeMemberFromProject } from '@/services/teamMemberService';
import { getUserCompanies } from '@/services/companyService';
import messageService from '@/services/messageService';
import { toast } from 'sonner';
import { proposalService } from '@/services/proposalService';
import type { Proposal } from '@/types/proposal';

const WEEK_IN_MS = 1000 * 60 * 60 * 24 * 7;

const ProjectDetail: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'team' | 'proposals' | 'end-project'>('overview');
  const [newMessage, setNewMessage] = useState('');
  const [project, setProject] = useState<ClientProject | null>(null);
  const [backendProject, setBackendProject] = useState<BackendProject | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);

  // Milestone modal state
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isMilestoneLoading, setIsMilestoneLoading] = useState(false);

  // Submit milestone modal state
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [milestoneToSubmit, setMilestoneToSubmit] = useState<Milestone | null>(null);

  // Feedback modal state
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [milestoneForFeedback, setMilestoneForFeedback] = useState<Milestone | null>(null);

  // Team assignment modal state
  const [assignTeamModalOpen, setAssignTeamModalOpen] = useState(false);
  const [removeTeamMemberId, setRemoveTeamMemberId] = useState<string | null>(null);
  const [removeTeamModalOpen, setRemoveTeamModalOpen] = useState(false);

  // Project edit/delete modal state
  const [editProjectModalOpen, setEditProjectModalOpen] = useState(false);
  const [deleteProjectModalOpen, setDeleteProjectModalOpen] = useState(false);
  const [isProjectActionLoading, setIsProjectActionLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    budgetMin: 0,
    budgetMax: 0,
    startDate: '',
    preferredEndDate: '',
  });

  // End project state
  const [endProjectModalOpen, setEndProjectModalOpen] = useState(false);
  const [isEndingProject, setIsEndingProject] = useState(false);

  // Get user role and permissions for this project
  const {
    role,
    isClient,
    isDeveloper,
    isTeamLead,
    hasAccess,
    canCreateMilestone,
    canEditMilestone,
    canDeleteMilestone,
    canApproveMilestone,
    canRequestFeedback,
    canUpdateMilestoneStatus,
    loading: roleLoading,
    error: roleError,
  } = useProjectRole(projectId);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
      loadUserCompany();
    }
  }, [projectId]);

  // Load proposals when switching to proposals tab
  useEffect(() => {
    if (activeTab === 'proposals' && projectId && !loadingProposals && proposals.length === 0) {
      loadProjectProposals(projectId);
    }
  }, [activeTab]);

  const loadUserCompany = async () => {
    try {
      const companies = await getUserCompanies();
      if (companies && companies.length > 0) {
        setCompanyId(companies[0].id);
      }
    } catch (err) {
      console.error('Failed to load user company:', err);
    }
  };

  const loadProjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load project, milestones, and team in parallel
      const [projectData, milestonesData, teamData] = await Promise.all([
        getProject(projectId!),
        getProjectMilestones(projectId!),
        getProjectTeam(projectId!)
      ]);

      setBackendProject(projectData);
      setTeamMembers(teamData || []);

      // Backend returns { milestones: [] }
      const milestonesArray = milestonesData?.milestones || [];

      // Store milestones directly - NO MAPPING NEEDED
      setMilestones(milestonesArray);

      const convertedProject = convertBackendProjectToFrontend(projectData, milestonesArray, teamData || []);
      setProject(convertedProject);

      // Load files, messages, and proposals in parallel (non-blocking)
      await Promise.all([
        loadProjectFiles(projectId!),
        loadProjectMessages(projectId!),
        loadProjectProposals(projectId!)
      ]);
    } catch (err: any) {
      console.error('Error loading project:', err);
      setError(err?.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectFiles = async (id: string) => {
    try {
      setLoadingFiles(true);
      const response = await getProjectFiles(id);
      const attachments = (response?.files || []).map(convertProjectFileToAttachment);
      setFiles(attachments);
    } catch (err) {
      console.error('Error loading project files:', err);
      setFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  const loadProjectMessages = async (id: string) => {
    try {
      setLoadingMessages(true);
      const projectMessages = await messageService.getProjectMessages('', id);
      const normalizedMessages = (projectMessages || []).map(convertLegacyMessageToClient);
      setMessages(normalizedMessages);
    } catch (err) {
      console.error('Error loading project messages:', err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadProjectProposals = async (id: string) => {
    try {
      setLoadingProposals(true);
      const projectProposals = await proposalService.getProjectProposals(id);
      setProposals(projectProposals || []);
    } catch (err) {
      console.error('Error loading project proposals:', err);
      setProposals([]);
    } finally {
      setLoadingProposals(false);
    }
  };

  const convertBackendProjectToFrontend = (
    backendProj: BackendProject,
    backendMilestones: BackendMilestone[],
    teamData: any[] = []
  ): ClientProject => {
    const budget = Number(backendProj.estimated_cost ?? 0);
    const spentAmount = Number(backendProj.actual_cost ?? 0);
    const progress = Number(backendProj.progress_percentage ?? 0);
    const startDate = backendProj.start_date
      ? new Date(backendProj.start_date)
      : new Date(backendProj.created_at);
    const estimatedDurationDays = Number(backendProj.estimated_duration_days ?? 0);
    const defaultEndDate = estimatedDurationDays
      ? new Date(startDate.getTime() + estimatedDurationDays * 24 * 60 * 60 * 1000)
      : startDate;
    // Priority: preferred_end_date > expected_completion_date > calculated default
    const endDate = backendProj.preferred_end_date
      ? new Date(backendProj.preferred_end_date)
      : backendProj.expected_completion_date
        ? new Date(backendProj.expected_completion_date)
        : defaultEndDate;

    const technologies = Array.isArray(backendProj.tech_stack) ? backendProj.tech_stack : [];

    return {
      id: backendProj.id,
      name: backendProj.name || 'Untitled Project',
      description: backendProj.description || 'No description provided yet.',
      status: mapProjectStatus(backendProj.status),
      budget,
      spentAmount,
      startDate,
      endDate,
      progress: Math.max(0, Math.min(100, progress)),
      technologies: technologies.map((tech) => ({
        name: tech,
        category: 'technology'
      })),
      team: teamData.map((member: any) => ({
        id: member.id || member.member_id || member.user_id,
        name: member.name || member.full_name || 'Team Member',
        role: member.role || member.project_role || 'Developer',
        avatar: member.avatar_url || member.profile_picture_url || '',
        email: member.email || '',
        skills: member.skills || [],
        hourlyRate: member.hourly_rate || 0,
        availability: member.availability || member.available_status || 'available'
      })),
      milestones: backendMilestones.map(mapBackendMilestoneToClient),
      category: backendProj.project_type || 'Uncategorized',
      createdAt: new Date(backendProj.created_at),
      updatedAt: new Date(backendProj.updated_at)
    };
  };

  const mapBackendMilestoneToClient = (milestone: BackendMilestone): ClientMilestone => {
    const status = mapMilestoneStatus(milestone.status);
    const startDate = new Date();
    const dueDate = startDate;
    const completedDate = undefined;
    const amount = 0;
    const progress =
      status === 'completed' || status === 'approved' || status === 'paid'
        ? 100
        : status === 'in_progress'
          ? 50
          : 0;

    return {
      id: milestone.id,
      name: milestone.title || 'Milestone',
      description: milestone.description || 'No description provided.',
      status,
      amount,
      startDate,
      dueDate,
      completedDate,
      progress,
      deliverables: normalizeDeliverables(milestone.deliverables)
    };
  };

  const mapProjectStatus = (status: BackendProject['status'] | string): ClientProject['status'] => {
    switch (status) {
      case 'in_progress':
      case 'active':
        return 'active';
      case 'completed':
        return 'completed';
      case 'cancelled':
      case 'canceled':
      case 'archived':
        return 'cancelled';
      default:
        return 'pending';
    }
  };

  const mapMilestoneStatus = (
    status: BackendMilestone['status'] | string
  ): ClientMilestone['status'] => {
    switch (status) {
      case 'in_progress':
        return 'in_progress';
      case 'completed':
        return 'completed';
      case 'approved':
        return 'approved';
      case 'paid':
        return 'paid';
      default:
        return 'pending';
    }
  };

  const normalizeDeliverables = (deliverables: unknown): string[] => {
    if (!deliverables) return [];
    if (Array.isArray(deliverables)) {
      return deliverables.map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const candidate = (item as any).title || (item as any).name || (item as any).description;
          return candidate ? String(candidate) : JSON.stringify(item);
        }
        return String(item);
      });
    }
    return [];
  };

  const convertProjectFileToAttachment = (file: ProjectFile): FileAttachment => ({
    id: file.id,
    name: file.file_name,
    url: file.file_url,
    type: file.mime_type,
    size: Number(file.file_size ?? 0),
    uploadedBy: file.uploaded_by || 'Unknown user',
    uploadedAt: new Date(file.created_at),
    projectId: file.project_id
  });

  const convertLegacyMessageToClient = (message: any): ClientMessage => {
    const attachments = Array.isArray(message.attachments)
      ? message.attachments.map((attachment: any, idx: number) => ({
          id: attachment?.id || `${message.id}-attachment-${idx}`,
          name: attachment?.name || attachment?.file_name || 'Attachment',
          url: attachment?.url || attachment?.file_url || '#',
          type: attachment?.type || attachment?.mime_type || 'file',
          size: Number(attachment?.size ?? 0)
        }))
      : undefined;

    return {
      id: message.id,
      senderId: message.sender_id || 'unknown',
      senderName:
        message.sender?.full_name ||
        message.sender?.name ||
        message.sender_id ||
        'Unknown user',
      content: message.content || '',
      timestamp: message.created_at ? new Date(message.created_at) : new Date(),
      attachments
    };
  };


  // Loading state - wait for both project data and role permissions
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-600">
            {loading ? 'Loading project details...' : 'Checking permissions...'}
          </p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error || roleError || !project) {
    const errorMessage = error || roleError?.message || 'Project not found';
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-2 border-red-200 rounded-2xl p-12 text-center max-w-md"
        >
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-900 mb-2">
            {roleError ? 'Permission Error' : 'Error Loading Project'}
          </h2>
          <p className="text-red-700 mb-6">{errorMessage}</p>
          <div className="flex space-x-4 justify-center">
            <button
              onClick={loadProjectData}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/client/projects')}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl font-bold hover:bg-gray-700 transition-colors"
            >
              Back to Projects
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  // ============================================
  // TEAM HANDLERS
  // ============================================

  const handleAssignTeamSuccess = async () => {
    try {
      setLoadingTeam(true);
      const teamData = await getProjectTeam(projectId!);
      setTeamMembers(teamData || []);

      // Update converted project
      if (backendProject) {
        const convertedProject = convertBackendProjectToFrontend(backendProject, milestones, teamData || []);
        setProject(convertedProject);
      }

      toast.success('Team member assigned successfully');
    } catch (err: any) {
      console.error('Failed to reload team:', err);
      toast.error('Failed to reload team members');
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleOpenRemoveModal = (memberId: string) => {
    setRemoveTeamMemberId(memberId);
    setRemoveTeamModalOpen(true);
  };

  const handleRemoveTeamMember = async () => {
    if (!removeTeamMemberId) return;

    try {
      setLoadingTeam(true);
      await removeMemberFromProject(removeTeamMemberId);

      // Reload team
      const teamData = await getProjectTeam(projectId!);
      setTeamMembers(teamData || []);

      // Update converted project
      if (backendProject) {
        const convertedProject = convertBackendProjectToFrontend(backendProject, milestones, teamData || []);
        setProject(convertedProject);
      }

      toast.success('Team member removed successfully');
      setRemoveTeamModalOpen(false);
      setRemoveTeamMemberId(null);
    } catch (err: any) {
      console.error('Failed to remove team member:', err);
      toast.error(err.message || 'Failed to remove team member');
    } finally {
      setLoadingTeam(false);
    }
  };

  // ============================================
  // PROJECT EDIT/DELETE HANDLERS
  // ============================================

  const canEditProject = backendProject?.status === 'planning';

  const handleOpenEditProject = () => {
    if (!project || !backendProject) return;

    // Format dates for input fields (YYYY-MM-DD)
    const formatDateForInput = (dateValue: string | Date | undefined | null): string => {
      if (!dateValue) return '';
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    };

    setEditFormData({
      name: project.name,
      description: project.description || '',
      budgetMin: Number(backendProject.budget_min) || 0,
      budgetMax: Number(backendProject.budget_max) || 0,
      startDate: formatDateForInput(backendProject.start_date),
      preferredEndDate: formatDateForInput(backendProject.preferred_end_date),
    });
    setEditProjectModalOpen(true);
  };

  const handleEditProject = async () => {
    if (!projectId) return;

    // Validate budget range
    if (editFormData.budgetMin > 0 && editFormData.budgetMax > 0 && editFormData.budgetMax <= editFormData.budgetMin) {
      toast.error('Maximum budget must be greater than minimum budget');
      return;
    }

    // Validate dates
    if (editFormData.startDate && editFormData.preferredEndDate) {
      const start = new Date(editFormData.startDate);
      const end = new Date(editFormData.preferredEndDate);
      if (end < start) {
        toast.error('Preferred end date cannot be earlier than start date');
        return;
      }
    }

    try {
      setIsProjectActionLoading(true);
      await updateProject(projectId, {
        name: editFormData.name,
        description: editFormData.description,
        budgetMin: editFormData.budgetMin || undefined,
        budgetMax: editFormData.budgetMax || undefined,
        startDate: editFormData.startDate || undefined,
        preferredEndDate: editFormData.preferredEndDate || undefined,
      }, true); // enforceplanningOnly = true

      // Reload project data
      await loadProjectData();
      toast.success('Project updated successfully');
      setEditProjectModalOpen(false);
    } catch (err: any) {
      console.error('Failed to update project:', err);
      toast.error(err.response?.data?.message || 'Failed to update project');
    } finally {
      setIsProjectActionLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId || !companyId) return;

    try {
      setIsProjectActionLoading(true);
      await deleteProject(projectId, true); // enforceplanningOnly = true

      toast.success('Project deleted successfully');
      setDeleteProjectModalOpen(false);
      // Navigate back to projects list
      navigate(`/company/${companyId}/client/projects`);
    } catch (err: any) {
      console.error('Failed to delete project:', err);
      toast.error(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setIsProjectActionLoading(false);
    }
  };

  // ============================================
  // MILESTONE HANDLERS
  // ============================================

  const handleCreateMilestone = () => {
    setSelectedMilestone(null);
    setIsMilestoneModalOpen(true);
  };

  const handleEditMilestone = (milestone: Milestone) => {
    console.log('Editing milestone:', milestone);
    console.log('Milestone fields:', {
      title: milestone.title,
      description: milestone.description,
      milestoneType: milestone.milestoneType,
      orderIndex: milestone.orderIndex,
      deliverables: milestone.deliverables,
      acceptanceCriteria: milestone.acceptanceCriteria,
      estimatedHours: milestone.estimatedHours,
      dueDate: milestone.dueDate,
      amount: milestone.amount,
    });
    setSelectedMilestone(milestone);
    setIsMilestoneModalOpen(true);
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    try {
      setIsMilestoneLoading(true);
      setError(null); // Clear any previous errors
      await deleteMilestone(milestoneId);

      // Refresh milestones after successful delete
      const milestonesData = await getProjectMilestones(projectId!);
      setMilestones(milestonesData?.milestones || []);

      // Update converted project
      if (backendProject) {
        const convertedProject = convertBackendProjectToFrontend(backendProject, milestonesData?.milestones || [], teamMembers);
        setProject(convertedProject);
      }
    } catch (err: any) {
      console.error('Failed to delete milestone:', err);
      // Set error but don't crash the page
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete milestone';
      setError(errorMessage);
      // Show error to user without navigating away
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsMilestoneLoading(false);
    }
  };

  const handleUpdateMilestoneStatus = async (milestoneId: string, status?: 'pending' | 'in_progress' | 'completed' | 'approved' | 'submitted') => {
    try {
      setIsMilestoneLoading(true);

      // If no status provided, determine next status based on current status and role
      if (!status) {
        const milestone = milestones.find(m => m.id === milestoneId);
        if (!milestone) return;

        // Developers/Team leads transition: pending/feedback_required -> in_progress -> submitted
        if (isTeamLead || isDeveloper) {
          if (milestone.status === 'pending' || milestone.status === 'feedback_required') {
            status = 'in_progress';
          } else if (milestone.status === 'in_progress') {
            // Open submit modal instead of directly changing status
            setIsMilestoneLoading(false);
            handleOpenSubmitModal(milestone);
            return;
          }
        }
      }

      if (!status) return;

      await updateMilestoneStatus(milestoneId, status);

      // Refresh milestones
      const milestonesData = await getProjectMilestones(projectId!);
      setMilestones(milestonesData?.milestones || []);

      // Update converted project
      if (backendProject) {
        const convertedProject = convertBackendProjectToFrontend(backendProject, milestonesData?.milestones || [], teamMembers);
        setProject(convertedProject);
      }
    } catch (err: any) {
      console.error('Failed to update milestone status:', err);
      setError(err.message || 'Failed to update milestone status');
    } finally {
      setIsMilestoneLoading(false);
    }
  };

  const handleApproveMilestone = async (milestoneId: string) => {
    try {
      setIsMilestoneLoading(true);
      setError(null); // Clear any previous errors
      await approveMilestone(milestoneId, {});

      // Refresh milestones
      const milestonesData = await getProjectMilestones(projectId!);
      setMilestones(milestonesData?.milestones || []);

      // Update converted project
      if (backendProject) {
        const convertedProject = convertBackendProjectToFrontend(backendProject, milestonesData?.milestones || [], teamMembers);
        setProject(convertedProject);
      }
    } catch (err: any) {
      console.error('Failed to approve milestone:', err);
      // Set error but don't crash the page
      const errorMessage = err.response?.data?.message || err.message || 'Failed to approve milestone';
      setError(errorMessage);
      // Show error to user without navigating away
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsMilestoneLoading(false);
    }
  };

  const handleOpenSubmitModal = (milestone: Milestone) => {
    setMilestoneToSubmit(milestone);
    setSubmitModalOpen(true);
  };

  const handleSubmitMilestone = async (notes?: string) => {
    if (!milestoneToSubmit) return;

    try {
      setIsMilestoneLoading(true);
      setError(null);

      await submitMilestone(milestoneToSubmit.id, notes);

      // Refresh milestones
      const milestonesData = await getProjectMilestones(projectId!);
      setMilestones(milestonesData?.milestones || []);

      // Update converted project
      if (backendProject) {
        const convertedProject = convertBackendProjectToFrontend(
          backendProject,
          milestonesData?.milestones || []
        );
        setProject(convertedProject);
      }

      setSubmitModalOpen(false);
      setMilestoneToSubmit(null);
    } catch (err: any) {
      console.error('Failed to submit milestone:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit milestone';
      setError(errorMessage);
      throw err; // Let modal handle error display
    } finally {
      setIsMilestoneLoading(false);
    }
  };

  const handleOpenFeedbackModal = (milestoneId: string) => {
    const milestone = milestones.find(m => m.id === milestoneId);
    if (!milestone) return;

    setMilestoneForFeedback(milestone);
    setFeedbackModalOpen(true);
  };

  const handleFeedbackSubmit = async (feedback: string) => {
    if (!milestoneForFeedback) return;

    try {
      setIsMilestoneLoading(true);
      setError(null);

      await requestMilestoneFeedback(milestoneForFeedback.id, feedback);

      // Refresh milestones
      const milestonesData = await getProjectMilestones(projectId!);
      setMilestones(milestonesData?.milestones || []);

      // Update converted project
      if (backendProject) {
        const convertedProject = convertBackendProjectToFrontend(
          backendProject,
          milestonesData?.milestones || []
        );
        setProject(convertedProject);
      }

      setFeedbackModalOpen(false);
      setMilestoneForFeedback(null);
    } catch (err: any) {
      console.error('Failed to submit feedback:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit feedback';
      setError(errorMessage);
      throw err; // Let modal handle error display
    } finally {
      setIsMilestoneLoading(false);
    }
  };

  const handleMilestoneSubmit = async (data: MilestoneFormData) => {
    try {
      setIsMilestoneLoading(true);

      if (selectedMilestone) {
        // Update existing milestone
        await updateMilestone(selectedMilestone.id, data);
      } else {
        // Create new milestone
        await createMilestone(projectId!, data);
      }

      // Refresh milestones
      const milestonesData = await getProjectMilestones(projectId!);
      setMilestones(milestonesData?.milestones || []);

      // Update converted project
      if (backendProject) {
        const convertedProject = convertBackendProjectToFrontend(backendProject, milestonesData?.milestones || [], teamMembers);
        setProject(convertedProject);
      }

      setIsMilestoneModalOpen(false);
      setSelectedMilestone(null);
    } catch (err: any) {
      console.error('Failed to save milestone:', err);
      throw new Error(err.message || 'Failed to save milestone');
    } finally {
      setIsMilestoneLoading(false);
    }
  };

  const renderOverview = () => {
    if (!project) {
      return null;
    }

    const budgetMin = Number(backendProject?.budget_min ?? 0);
    const budgetMax = Number(backendProject?.budget_max ?? 0);
    const budget = budgetMax || budgetMin || Number(project.budget ?? 0);
    const spentAmount = Number(project.spentAmount ?? 0);
    const spentPercent = budget > 0 ? Math.min(100, Math.round((spentAmount / budget) * 100)) : 0;
    const progress = Number.isFinite(project.progress)
      ? Math.max(0, Math.min(100, project.progress))
      : 0;
    const durationWeeks =
      project.startDate && project.endDate
        ? Math.max(0, Math.ceil((project.endDate.getTime() - project.startDate.getTime()) / WEEK_IN_MS))
        : null;

    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: value >= 1000 ? 0 : 2
      }).format(value || 0);

    const description = project.description?.trim() || 'No description provided yet.';

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-blue-700 font-semibold">Budget</div>
                <div className="text-xl font-black text-blue-900">
                  {budgetMin > 0 && budgetMax > 0
                    ? `${formatCurrency(budgetMin)} - ${formatCurrency(budgetMax)}`
                    : formatCurrency(budget)
                  }
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-300">
              <div className="text-xs text-blue-700">
                {`Spent: ${formatCurrency(spentAmount)}`}
                {budget > 0 ? ` (${spentPercent}%)` : ''}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-purple-700 font-semibold">Progress</div>
                <div className="text-2xl font-black text-purple-900">{progress}%</div>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-green-700 font-semibold">Duration</div>
                <div className="text-2xl font-black text-green-900">
                  {durationWeeks !== null ? `${durationWeeks}w` : 'TBD'}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-green-300 text-xs text-green-700">
              {project.endDate
                ? `Ends: ${project.endDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}`
                : 'End date not set'}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-orange-700 font-semibold">Team Size</div>
                <div className="text-2xl font-black text-orange-900">{project.team.length}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-orange-300">
              {project.team.length > 0 ? (
                <div className="flex -space-x-2">
                  {project.team.slice(0, 3).map((member) => (
                    <div
                      key={member.id}
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                      title={member.name}
                    >
                      {member.name.charAt(0)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-orange-700">No team members assigned yet.</div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100"
        >
          <h3 className="text-xl font-black text-gray-900 mb-4">Project Description</h3>
          <div
            className="text-gray-700 leading-relaxed mb-4 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }}
          />

          <div className="mt-6">
            <h4 className="text-sm font-bold text-gray-700 mb-3">Technology Stack</h4>
            {project.technologies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-200"
                  >
                    {tech.name}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No technologies selected yet.</div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <button
            onClick={() => navigate(`/project/${projectId}/communication-hub`)}
            className="bg-white border-2 border-gray-200 hover:border-purple-300 p-4 rounded-xl flex items-center space-x-3 transition-colors group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <div className="font-bold text-gray-900">Schedule Meeting</div>
              <div className="text-sm text-gray-600">Plan a video call</div>
            </div>
          </button>

          <button
            onClick={() => navigate(`/contract/${projectId}/view`)}
            className="bg-white border-2 border-gray-200 hover:border-green-300 p-4 rounded-xl flex items-center space-x-3 transition-colors group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <div className="font-bold text-gray-900">View Contract</div>
              <div className="text-sm text-gray-600">Open the latest agreement</div>
            </div>
          </button>
        </motion.div>
      </div>
    );
  };

  const renderMilestones = () => {
    if (!project) {
      return null;
    }

    return (
      <div className="space-y-6">
        {/* Header with Add Button (only for clients) */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Project Milestones</h2>
            <p className="text-sm text-gray-600 mt-1">
              {role === 'client' && 'You can create and manage milestones for this project'}
              {role === 'team_lead' && 'You can submit completed milestones for approval'}
              {role === 'developer' && 'View project milestones and track progress'}
              {role === 'none' && 'You have view-only access to this project'}
            </p>
          </div>
          {canCreateMilestone && (
            <button
              onClick={handleCreateMilestone}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Milestone</span>
            </button>
          )}
        </div>

        {/* Milestones List */}
        {milestones.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 shadow-lg border-2 border-dashed border-gray-200 text-center"
          >
            <p className="text-gray-600 mb-4">No milestones have been created for this project yet.</p>
            {canCreateMilestone && (
              <button
                onClick={handleCreateMilestone}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create First Milestone</span>
              </button>
            )}
          </motion.div>
        ) : (
          <MilestoneList
            milestones={milestones}
            onEdit={canEditMilestone ? handleEditMilestone : undefined}
            onDelete={canDeleteMilestone ? handleDeleteMilestone : undefined}
            onApprove={canApproveMilestone ? handleApproveMilestone : undefined}
            onSubmit={canUpdateMilestoneStatus ? handleUpdateMilestoneStatus : undefined}
            onRequestFeedback={canRequestFeedback ? handleOpenFeedbackModal : undefined}
            canEdit={canEditMilestone}
            canDelete={canDeleteMilestone}
            canApprove={canApproveMilestone}
            canSubmit={canUpdateMilestoneStatus}
            canRequestFeedback={canRequestFeedback}
            userRole={role}
            showProgress={true}
          />
        )}

        {/* Milestone Form Modal */}
        <MilestoneFormModal
          isOpen={isMilestoneModalOpen}
          onClose={() => {
            setIsMilestoneModalOpen(false);
            setSelectedMilestone(null);
          }}
          onSubmit={handleMilestoneSubmit}
          initialData={selectedMilestone ? {
            name: selectedMilestone.title,
            description: selectedMilestone.description,
            milestoneType: selectedMilestone.milestoneType as any,
            orderIndex: selectedMilestone.orderIndex || 1,
            deliverables: (selectedMilestone.deliverables || []).map((d) =>
              typeof d === 'string' ? d : (d.title || d.fileName || 'Deliverable')
            ),
            acceptanceCriteria: selectedMilestone.acceptanceCriteria,
            estimatedHours: selectedMilestone.estimatedHours || undefined,
            dueDate: selectedMilestone.dueDate || undefined,
            milestoneAmount: selectedMilestone.amount || undefined,
          } : undefined}
          isLoading={isMilestoneLoading}
          existingMilestones={milestones.length}
        />

        {/* Submit Milestone Modal */}
        {milestoneToSubmit && (
          <SubmitMilestoneModal
            isOpen={submitModalOpen}
            onClose={() => {
              setSubmitModalOpen(false);
              setMilestoneToSubmit(null);
            }}
            onSubmit={handleSubmitMilestone}
            milestone={milestoneToSubmit}
            loading={isMilestoneLoading}
          />
        )}

        {/* Feedback Modal */}
        {milestoneForFeedback && (
          <FeedbackModal
            isOpen={feedbackModalOpen}
            onClose={() => {
              setFeedbackModalOpen(false);
              setMilestoneForFeedback(null);
            }}
            onSubmit={handleFeedbackSubmit}
            milestone={milestoneForFeedback}
            loading={isMilestoneLoading}
          />
        )}
      </div>
    );
  };

  const renderTeam = () => {
    if (!project) {
      return null;
    }

    const canManageTeam = isClient || isTeamLead;
    const assignedMemberIds = project.team.map(m => m.id);

    return (
      <div className="space-y-6">
        {/* Header with Assign Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Project Team</h2>
            <p className="text-sm text-gray-600 mt-1">
              {canManageTeam
                ? 'Manage team members assigned to this project'
                : 'View team members working on this project'}
            </p>
          </div>
          {canManageTeam && companyId && (
            <button
              onClick={() => setAssignTeamModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Assign Member</span>
            </button>
          )}
        </div>

        {/* Team Members List */}
        {loadingTeam ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-gray-100 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading team members...</p>
          </div>
        ) : project.team.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 shadow-lg border-2 border-dashed border-gray-200 text-center"
          >
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No team members have been assigned to this project yet.</p>
            {canManageTeam && companyId && (
              <button
                onClick={() => setAssignTeamModalOpen(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Assign First Member</span>
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {project.team.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100 hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-black text-gray-900 mb-1">{member.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{member.role}</p>
                      {member.skills && member.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {member.skills.slice(0, 4).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold"
                            >
                              {skill}
                            </span>
                          ))}
                          {member.skills.length > 4 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                              +{member.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {member.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{member.email}</span>
                          </div>
                        )}
                        {member.hourlyRate && member.hourlyRate > 0 && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>${member.hourlyRate}/hr</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {member.availability && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          member.availability === 'available'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {member.availability === 'available' ? 'Available' : 'Busy'}
                      </span>
                    )}
                    {canManageTeam && (
                      <button
                        onClick={() => handleOpenRemoveModal(member.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove from project"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Assign Team Member Modal */}
        {companyId && (
          <AssignTeamMemberModal
            isOpen={assignTeamModalOpen}
            onClose={() => setAssignTeamModalOpen(false)}
            onSuccess={handleAssignTeamSuccess}
            projectId={projectId!}
            assignedMemberIds={assignedMemberIds}
            companyId={companyId}
          />
        )}

        {/* Remove Team Member Confirmation Modal */}
        <ConfirmModal
          isOpen={removeTeamModalOpen}
          onClose={() => {
            setRemoveTeamModalOpen(false);
            setRemoveTeamMemberId(null);
          }}
          title="Remove Team Member"
          message="Are you sure you want to remove this team member from the project? This action cannot be undone."
          confirmText="Remove Member"
          confirmVariant="danger"
          onConfirm={handleRemoveTeamMember}
        />
      </div>
    );
  };

  const renderCommunication = () => {
    const currentUserId = backendProject?.client_id;

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 max-h-[500px] overflow-y-auto">
          {loadingMessages ? (
            <div className="py-12 text-center text-gray-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No messages yet. Use the communication hub to start the conversation.
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isCurrentUser = currentUserId && message.senderId === currentUserId;
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isCurrentUser ? 'order-2' : ''}`}>
                      <div className="flex items-center space-x-2 mb-1">
                        {!isCurrentUser && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {message.senderName.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm font-semibold text-gray-700">{message.senderName}</span>
                        <span className="text-xs text-gray-500">
                          {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`rounded-xl p-4 ${
                          isCurrentUser
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p>{message.content}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.attachments.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center space-x-2 bg-white/20 rounded-lg p-2"
                              >
                                <FileText className="w-4 h-4" />
                                <span className="text-sm">{file.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
          <h4 className="text-lg font-black text-gray-900 mb-2">Send a Message</h4>
          <p className="text-xs text-gray-500 mb-4">
            Sending messages from this preview is read-only. Open the communication hub to post updates.
          </p>
          <div className="flex space-x-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Messaging is disabled in this preview"
              rows={2}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
              disabled
            />
            <button
              onClick={handleSendMessage}
              disabled
              className="p-3 bg-gray-200 text-gray-500 rounded-xl cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFiles = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black text-gray-900">Project Files</h3>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
          </button>
        </div>

        {loadingFiles ? (
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-100 text-center text-gray-500">
            Loading files...
          </div>
        ) : files.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-dashed border-gray-200 text-center text-gray-600">
            No files uploaded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100 hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{file.name}</h4>
                      <p className="text-sm text-gray-600">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Download className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  <div>
                    Uploaded by <span className="font-semibold">{file.uploadedBy}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {file.uploadedAt.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderProposals = () => {
    const handleAcceptProposal = async (proposalId: string) => {
      try {
        await proposalService.reviewProposal(proposalId, { status: 'accepted' });
        toast.success('Proposal accepted successfully');
        loadProjectProposals(projectId!);
      } catch (err: any) {
        console.error('Error accepting proposal:', err);
        toast.error(err.message || 'Failed to accept proposal');
      }
    };

    const handleRejectProposal = async (proposalId: string) => {
      try {
        await proposalService.reviewProposal(proposalId, { status: 'rejected' });
        toast.success('Proposal rejected');
        loadProjectProposals(projectId!);
      } catch (err: any) {
        console.error('Error rejecting proposal:', err);
        toast.error(err.message || 'Failed to reject proposal');
      }
    };

    // Type-safe accessor for proposal properties
    const getCompanyName = (proposal: any): string => {
      return proposal.company_name || proposal.companyName || 'Developer Company';
    };

    const getProposedCost = (proposal: any): number | undefined => {
      return proposal.proposedCost || proposal.proposed_cost;
    };

    const getProposedDuration = (proposal: any): number | undefined => {
      return proposal.proposedDurationDays || proposal.proposed_duration_days;
    };

    const getCoverLetter = (proposal: any): string | undefined => {
      return proposal.coverLetter || proposal.cover_letter;
    };

    const getMilestonesBreakdown = (proposal: any): string | undefined => {
      return proposal.milestonesBreakdown || proposal.milestones_breakdown;
    };

    const getCreatedAt = (proposal: any): string => {
      return proposal.createdAt || proposal.created_at;
    };

    const getCompanyId = (proposal: any): string | undefined => {
      return proposal.companyId || proposal.company_id;
    };

    const handleViewSeller = (proposal: any) => {
      const sellerId = getCompanyId(proposal);
      if (sellerId) {
        navigate(`/developer/${sellerId}`);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Project Proposals</h2>
            <p className="text-sm text-gray-600 mt-1">
              Review and manage proposals submitted by developers
            </p>
          </div>
        </div>

        {loadingProposals ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-gray-100 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading proposals...</p>
          </div>
        ) : proposals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-12 shadow-lg border-2 border-dashed border-gray-200 text-center"
          >
            <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Proposals Yet</h3>
            <p className="text-gray-600">
              No developers have submitted proposals for this project yet.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal, index) => (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100 hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                      {getCompanyName(proposal).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {getCompanyName(proposal)}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Submitted {new Date(getCreatedAt(proposal)).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-bold text-green-600">
                            ${getProposedCost(proposal)?.toLocaleString() || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{getProposedDuration(proposal) || 'N/A'} days</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                            proposal.status === 'accepted'
                              ? 'bg-green-100 text-green-700'
                              : proposal.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {proposal.status === 'pending' ? 'Pending Review' : proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                        </span>
                        <button
                          onClick={() => handleViewSeller(proposal)}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold hover:bg-blue-200 transition-colors"
                          title="View seller profile"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Seller</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* AI Match Score */}
                  {proposal.matchScore !== undefined && (
                    <div className="ml-auto flex flex-col items-end">
                      <div className="text-xs font-semibold text-gray-500 mb-1">AI Match</div>
                      <div className={`text-2xl font-black ${
                        proposal.matchScore >= 80 ? 'text-green-600' :
                        proposal.matchScore >= 60 ? 'text-blue-600' :
                        proposal.matchScore >= 40 ? 'text-yellow-600' :
                        'text-red-500'
                      }`}>
                        {proposal.matchScore}%
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            proposal.matchScore >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            proposal.matchScore >= 60 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                            proposal.matchScore >= 40 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                            'bg-gradient-to-r from-red-500 to-pink-500'
                          }`}
                          style={{ width: `${proposal.matchScore}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Matched & Missing Skills */}
                {(proposal.matchedSkills?.length || proposal.missingSkills?.length || proposal.sellerSkills?.length) && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                    {proposal.sellerSkills && proposal.sellerSkills.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-bold text-gray-600 mb-2">Seller Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {proposal.sellerSkills.slice(0, 8).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {proposal.sellerSkills.length > 8 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              +{proposal.sellerSkills.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-6">
                      {proposal.matchedSkills && proposal.matchedSkills.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-green-700 mb-2">Matched Skills</h4>
                          <div className="flex flex-wrap gap-1">
                            {proposal.matchedSkills.slice(0, 5).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                              >
                                ✓ {skill}
                              </span>
                            ))}
                            {proposal.matchedSkills.length > 5 && (
                              <span className="px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs">
                                +{proposal.matchedSkills.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {proposal.missingSkills && proposal.missingSkills.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-red-700 mb-2">Missing Skills</h4>
                          <div className="flex flex-wrap gap-1">
                            {proposal.missingSkills.slice(0, 5).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium"
                              >
                                ✗ {skill}
                              </span>
                            ))}
                            {proposal.missingSkills.length > 5 && (
                              <span className="px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs">
                                +{proposal.missingSkills.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Cover Letter */}
                {getCoverLetter(proposal) && (
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Cover Letter</h4>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-lg">
                      {getCoverLetter(proposal)}
                    </p>
                  </div>
                )}

                {/* Milestones Breakdown */}
                {getMilestonesBreakdown(proposal) && (
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Milestones Breakdown</h4>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-lg">
                      {getMilestonesBreakdown(proposal)}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {proposal.status === 'pending' && (
                  <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleAcceptProposal(proposal.id)}
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Accept Proposal</span>
                    </button>
                    <button
                      onClick={() => handleRejectProposal(proposal.id)}
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                    >
                      <X className="w-5 h-5" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleEndProject = async () => {
    if (!projectId) return;

    try {
      setIsEndingProject(true);
      const result = await endProject(projectId);
      toast.success(result.message || 'Project ended successfully');
      setEndProjectModalOpen(false);

      // Reload project data to reflect the new status
      loadProjectData();

      // Navigate to feedback page if URL is provided
      if (result.feedbackUrl) {
        window.open(result.feedbackUrl, '_blank');
      }
    } catch (err: any) {
      console.error('Error ending project:', err);
      toast.error(err.message || 'Failed to end project');
    } finally {
      setIsEndingProject(false);
    }
  };

  const renderEndProject = () => {
    const completedMilestones = milestones.filter(m => m.status === 'completed' || m.status === 'approved').length;
    const totalMilestones = milestones.length;
    const progressPercentage = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    const projectStatus = backendProject?.status || project?.status || 'active';
    const isAlreadyEnded = projectStatus === 'completed' || projectStatus === 'cancelled';

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">End Project</h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete or close this project
            </p>
          </div>
        </div>

        {isAlreadyEnded ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 rounded-2xl p-8 shadow-lg border-2 border-green-200 text-center"
          >
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Project Already Completed</h3>
            <p className="text-gray-600">
              This project has been marked as {projectStatus}. No further action is required.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100"
          >
            {/* Project Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Milestones</p>
                    <p className="text-xl font-bold text-gray-900">
                      {completedMilestones}/{totalMilestones}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Progress</p>
                    <p className="text-xl font-bold text-gray-900">{progressPercentage}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Team Members</p>
                    <p className="text-xl font-bold text-gray-900">{teamMembers.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Overall Progress</span>
                <span className="font-bold text-gray-900">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    progressPercentage === 100
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {progressPercentage < 100 && (
              <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200 mb-6">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800">Incomplete Milestones</p>
                  <p className="text-sm text-yellow-700">
                    {totalMilestones - completedMilestones} milestone(s) are still pending. You can still end the project, but this may affect final payments.
                  </p>
                </div>
              </div>
            )}

            {/* End Project Button */}
            <button
              onClick={() => setEndProjectModalOpen(true)}
              className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all"
            >
              <Power className="w-6 h-6" />
              <span>End Project</span>
            </button>

            <p className="text-sm text-gray-500 mt-3 text-center">
              You will be redirected to provide feedback after ending the project
            </p>

            {/* Confirmation Modal */}
            <ConfirmModal
              isOpen={endProjectModalOpen}
              onClose={() => setEndProjectModalOpen(false)}
              title="End Project"
              message={`Are you sure you want to end "${project?.name}"? This action will mark the project as completed and you will be redirected to provide feedback.`}
              confirmText={isEndingProject ? 'Ending...' : 'Yes, End Project'}
              confirmVariant="danger"
              onConfirm={handleEndProject}
            />
          </motion.div>
        )}
      </div>
    );
  };

  // Access check
  if (roleLoading) {
    return <AccessLoading />;
  }

  if (!hasAccess) {
    return <AccessDenied message="You don't have permission to access this project." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0  shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/client/projects')}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-gray-900">{project.name}</h1>
                <p className="text-sm text-gray-600">{project.category}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {canEditProject && (
                <>
                  <button
                    onClick={handleOpenEditProject}
                    className="p-2 hover:bg-blue-100 rounded-xl transition-colors group"
                    title="Edit Project (Planning stage only)"
                  >
                    <Edit className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                  </button>
                  <button
                    onClick={() => setDeleteProjectModalOpen(true)}
                    className="p-2 hover:bg-red-100 rounded-xl transition-colors group"
                    title="Delete Project (Planning stage only)"
                  >
                    <Trash2 className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: FileText },
              { key: 'milestones', label: 'Milestones', icon: CheckCircle2 },
              { key: 'team', label: 'Team', icon: Users },
              { key: 'proposals', label: 'Proposals', icon: Send },
              { key: 'end-project', label: 'End Project', icon: Power }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors font-semibold ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'milestones' && renderMilestones()}
        {activeTab === 'team' && renderTeam()}
        {activeTab === 'proposals' && renderProposals()}
        {activeTab === 'end-project' && renderEndProject()}
      </div>

      {/* Edit Project Modal */}
      {editProjectModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setEditProjectModalOpen(false)} />
            <div className="relative inline-block w-full max-w-lg p-6 overflow-hidden text-left align-middle transition-all transform bg-white rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Edit Project</h3>
                <button
                  onClick={() => setEditProjectModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Enter project description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Budget Range (USD)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={editFormData.budgetMin || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, budgetMin: Number(e.target.value) || 0 })}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Min budget"
                          min="0"
                          step="100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={editFormData.budgetMax || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, budgetMax: Number(e.target.value) || 0 })}
                          className={`w-full pl-8 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            editFormData.budgetMin > 0 && editFormData.budgetMax > 0 && editFormData.budgetMax <= editFormData.budgetMin
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300'
                          }`}
                          placeholder="Max budget"
                          min="0"
                          step="100"
                        />
                      </div>
                    </div>
                  </div>
                  {editFormData.budgetMin > 0 && editFormData.budgetMax > 0 && editFormData.budgetMax <= editFormData.budgetMin && (
                    <p className="text-xs text-red-500 mt-1">Maximum budget must be greater than minimum</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={editFormData.startDate}
                      onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Preferred End Date
                    </label>
                    <input
                      type="date"
                      value={editFormData.preferredEndDate}
                      onChange={(e) => setEditFormData({ ...editFormData, preferredEndDate: e.target.value })}
                      min={editFormData.startDate || undefined}
                      className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        editFormData.startDate && editFormData.preferredEndDate &&
                        new Date(editFormData.preferredEndDate) < new Date(editFormData.startDate)
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300'
                      }`}
                    />
                    {editFormData.startDate && editFormData.preferredEndDate &&
                      new Date(editFormData.preferredEndDate) < new Date(editFormData.startDate) && (
                      <p className="text-xs text-red-500 mt-1">End date must be after start date</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditProjectModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditProject}
                  disabled={isProjectActionLoading || !editFormData.name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isProjectActionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteProjectModalOpen}
        onClose={() => setDeleteProjectModalOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${project?.name}"? This action cannot be undone.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        variant="danger"
        isLoading={isProjectActionLoading}
      />
    </div>
  );
};

export default ProjectDetail;
