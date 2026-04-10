/**
 * Project Service for Team@Once
 *
 * Handles all API calls related to projects, milestones, and tasks
 */

import { apiClient } from '@/lib/api-client'
import type { Milestone, MilestoneStatus } from '@/types/milestone'
import type {
  Project,
  Task,
  ProjectWithStats,
  ProjectFile,
  CreateProjectData,
  UpdateProjectData,
  CreateMilestoneData,
  ApproveMilestoneData,
  CreateTaskData,
  UpdateTaskData,
  AssignTeamData,
  TaskFilters,
} from '@/types/project'

// ============================================
// PROJECT CRUD OPERATIONS
// ============================================

/**
 * Create a new project
 */
export const createProject = async (companyId: string, data: CreateProjectData): Promise<Project> => {
  const response = await apiClient.post(`/company/${companyId}/projects`, data)
  return response.data
}

/**
 * Get all projects for the current user (client)
 */
export const getClientProjects = async (companyId: string): Promise<Project[]> => {
  const response = await apiClient.get(`/company/${companyId}/projects`)
  return response.data
}

/**
 * Get a specific project by ID
 */
export const getProject = async (projectId: string): Promise<Project> => {
  const response = await apiClient.get(`/projects/${projectId}`)
  return response.data
}

/**
 * Update a project
 * @param projectId - Project ID
 * @param data - Update data
 * @param enforceplanningOnly - If true, only allow updates for planning stage projects
 */
export const updateProject = async (
  projectId: string,
  data: UpdateProjectData,
  enforceplanningOnly: boolean = false
): Promise<Project> => {
  const url = enforceplanningOnly
    ? `/projects/${projectId}?enforceplanningOnly=true`
    : `/projects/${projectId}`
  const response = await apiClient.put(url, data)
  return response.data
}

/**
 * Delete a project (soft delete)
 * @param projectId - Project ID
 * @param enforceplanningOnly - If true, only allow deletion for planning stage projects
 */
export const deleteProject = async (
  projectId: string,
  enforceplanningOnly: boolean = false
): Promise<{ success: boolean; message: string }> => {
  const url = enforceplanningOnly
    ? `/projects/${projectId}?enforceplanningOnly=true`
    : `/projects/${projectId}`
  const response = await apiClient.delete(url)
  return response.data
}

/**
 * Get project statistics and analytics
 */
export const getProjectStats = async (projectId: string): Promise<ProjectWithStats> => {
  const response = await apiClient.get(`/projects/${projectId}/stats`)
  return response.data
}

/**
 * Check if user has access to a project
 * Returns access status, role, member type, and permissions
 */
export interface ProjectAccessResponse {
  hasAccess: boolean
  role: string | null
  memberType: 'client' | 'developer' | null
  permissions: string[]
}

export const checkProjectAccess = async (projectId: string): Promise<ProjectAccessResponse> => {
  const response = await apiClient.get(`/projects/${projectId}/access`)
  return response.data
}

/**
 * Fix project status to 'awarded' if proposal is accepted but status is still 'planning'
 * This is a utility function to fix existing projects that were accepted before the status change was implemented
 */
export const fixAwardedStatus = async (projectId: string): Promise<{
  message: string
  updated: boolean
  previousStatus?: string
  newStatus?: string
  currentStatus?: string
}> => {
  const response = await apiClient.post(`/projects/${projectId}/fix-awarded-status`, {})
  return response.data
}

/**
 * Send milestone plan reminder from client to developer
 */
export const requestMilestonePlan = async (projectId: string): Promise<{
  success: boolean
  message: string
  sentTo: string
}> => {
  const response = await apiClient.post(`/projects/${projectId}/request-milestone-plan`, {})
  return response.data
}

/**
 * Get milestone plan request status (checks if client has requested)
 */
export const getMilestonePlanRequestStatus = async (projectId: string): Promise<{
  hasRequested: boolean
  requestCount: number
  lastRequestedAt: string | null
  unreadCount: number
  isClient: boolean
  isDeveloper: boolean
}> => {
  const response = await apiClient.get(`/projects/${projectId}/milestone-plan-request-status`)
  return response.data
}

/**
 * Dismiss milestone plan request notifications (mark as read)
 */
export const dismissMilestonePlanRequests = async (projectId: string): Promise<{
  success: boolean
  message: string
  count: number
}> => {
  const response = await apiClient.post(`/projects/${projectId}/dismiss-milestone-plan-requests`, {})
  return response.data
}

/**
 * Assign team members to a project
 */
export const assignTeamToProject = async (
  projectId: string,
  data: AssignTeamData
): Promise<Project> => {
  const response = await apiClient.put(`/projects/${projectId}/assign-team`, data)
  return response.data
}

/**
 * Get files associated with a project
 */
export const getProjectFiles = async (
  projectId: string,
  params?: {
    milestoneId?: string
    fileType?: string
    uploadedBy?: string
    isDeliverable?: boolean
  }
): Promise<{ files: ProjectFile[]; total: number }> => {
  const response = await apiClient.get(`/projects/${projectId}/files`, { params })
  return response.data
}

// ============================================
// MILESTONE OPERATIONS
// ============================================

/**
 * Create a new milestone for a project
 */
export const createMilestone = async (
  projectId: string,
  data: CreateMilestoneData
): Promise<Milestone> => {
  const response = await apiClient.post(`/projects/${projectId}/milestones`, data)
  return response.data
}

/**
 * Get all milestones for a project
 * Backend returns { milestones: Milestone[] }
 */
export const getProjectMilestones = async (projectId: string): Promise<{ milestones: Milestone[] }> => {
  const response = await apiClient.get(`/projects/${projectId}/milestones`)
  return response.data
}

/**
 * Get a specific milestone by ID
 */
export const getMilestone = async (milestoneId: string): Promise<Milestone> => {
  const response = await apiClient.get(`/projects/milestones/${milestoneId}`)
  return response.data
}

/**
 * Update milestone status
 */
export const updateMilestoneStatus = async (
  milestoneId: string,
  status: MilestoneStatus
): Promise<Milestone> => {
  const response = await apiClient.put(`/projects/milestones/${milestoneId}/status`, { status })
  return response.data
}

/**
 * Approve a milestone
 */
export const approveMilestone = async (
  milestoneId: string,
  data: ApproveMilestoneData
): Promise<Milestone> => {
  const response = await apiClient.put(`/projects/milestones/${milestoneId}/approve`, data)
  return response.data
}

/**
 * Submit milestone for client review (Developer/Team Lead only)
 * Backend: PUT /projects/milestones/:milestoneId/submit
 */
export const submitMilestone = async (
  milestoneId: string,
  notes?: string
): Promise<Milestone> => {
  const response = await apiClient.put(`/projects/milestones/${milestoneId}/submit`, {
    notes
  })
  return response.data
}

/**
 * Request changes on submitted milestone (Client only)
 * Backend: PUT /projects/milestones/:milestoneId/request-feedback
 */
export const requestMilestoneFeedback = async (
  milestoneId: string,
  feedback: string
): Promise<Milestone> => {
  const response = await apiClient.put(
    `/projects/milestones/${milestoneId}/request-feedback`,
    { feedback }
  )
  return response.data
}

/**
 * Update milestone payment status
 */
export const updateMilestonePayment = async (
  milestoneId: string,
  paymentStatus: string,
  paymentDate?: string
): Promise<Milestone> => {
  const response = await apiClient.put(`/projects/milestones/${milestoneId}/payment`, {
    paymentStatus,
    paymentDate,
  })
  return response.data
}

/**
 * Update an existing milestone
 */
export const updateMilestone = async (
  milestoneId: string,
  data: Partial<CreateMilestoneData>
): Promise<Milestone> => {
  const response = await apiClient.put(`/projects/milestones/${milestoneId}`, data)
  return response.data
}

/**
 * Delete a milestone
 */
export const deleteMilestone = async (milestoneId: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`/projects/milestones/${milestoneId}`)
  return response.data
}

// ============================================
// TASK OPERATIONS
// ============================================

/**
 * Create a new task
 */
export const createTask = async (
  projectId: string,
  data: CreateTaskData,
  milestoneId?: string
): Promise<Task> => {
  const url = milestoneId
    ? `/projects/${projectId}/tasks?milestoneId=${milestoneId}`
    : `/projects/${projectId}/tasks`
  const response = await apiClient.post(url, data)
  return response.data
}

/**
 * Get all tasks for a project with optional filters
 * Backend returns { tasks: Task[] }
 */
export const getProjectTasks = async (
  projectId: string,
  filters?: TaskFilters
): Promise<{ tasks: Task[] }> => {
  const params = new URLSearchParams()

  if (filters?.milestoneId) params.append('milestoneId', filters.milestoneId)
  if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo)
  if (filters?.status) params.append('status', filters.status)
  if (filters?.priority) params.append('priority', filters.priority)

  const queryString = params.toString()
  const url = queryString ? `/projects/${projectId}/tasks?${queryString}` : `/projects/${projectId}/tasks`

  const response = await apiClient.get(url)
  return response.data
}

/**
 * Get a specific task by ID
 */
export const getTask = async (taskId: string): Promise<Task> => {
  const response = await apiClient.get(`/projects/tasks/${taskId}`)
  return response.data
}

/**
 * Update a task
 */
export const updateTask = async (taskId: string, data: UpdateTaskData): Promise<Task> => {
  const response = await apiClient.put(`/projects/tasks/${taskId}`, data)
  return response.data
}

/**
 * Delete a task
 */
export const deleteTask = async (taskId: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`/projects/tasks/${taskId}`)
  return response.data
}

/**
 * Assign a task to a team member
 */
export const assignTask = async (taskId: string, assignedTo: string): Promise<Task> => {
  const response = await apiClient.put(`/projects/tasks/${taskId}/assign`, { assignedTo })
  return response.data
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get developer projects (for company view)
 * This would typically be a separate endpoint on the backend
 */
export const getDeveloperProjects = async (companyId: string): Promise<Project[]> => {
  // For now, using the same endpoint as client projects
  // Backend should have a separate endpoint for company/developer view
  const response = await apiClient.get(`/company/${companyId}/projects`)
  return response.data
}

/**
 * Get developer's assigned projects from backend
 * Returns all projects assigned to a specific team member
 * @param teamMemberId - The UUID of the team member
 * @returns Array of assignments with project details
 */
export const getDeveloperAssignedProjects = async (teamMemberId: string): Promise<any[]> => {
  try {
    const response = await apiClient.get(
      `/teamatonce/team/assignments/member/${teamMemberId}?activeOnly=true`
    )
    // Backend returns array of assignments with project details
    return response.data || []
  } catch (error: any) {
    console.error('Error fetching developer assigned projects:', error)
    // Return empty array if no assignments found
    if (error.response?.status === 404) {
      return []
    }
    throw new Error(error.response?.data?.message || 'Failed to fetch assigned projects')
  }
}

/**
 * Get team members assigned to a project
 * Returns developers, designers, and project managers for a project
 * @param projectId - The UUID of the project
 * @returns Object with members array
 */
export const getProjectTeamMembers = async (projectId: string): Promise<{ members: any[] }> => {
  try {
    const response = await apiClient.get(`/projects/${projectId}/team`)
    return response.data || { members: [] }
  } catch (error: any) {
    console.error('Error fetching project team members:', error)
    if (error.response?.status === 404) {
      return { members: [] }
    }
    throw new Error(error.response?.data?.message || 'Failed to fetch team members')
  }
}

/**
 * Get all project members (clients and developers)
 * Returns all users who have access to the project with their details
 * @param projectId - The UUID of the project
 * @returns Object with projectId, members array, and total count
 */
export interface ProjectMember {
  id: string
  userId: string
  memberType: 'client' | 'developer'
  companyId: string | null
  role: string
  permissions: string[]
  joinedAt: string
  isActive: boolean
  user: {
    id: string
    name: string
    email: string
    avatar: string | null
  } | null
}

export interface ProjectMembersResponse {
  projectId: string
  members: ProjectMember[]
  total: number
}

export const getProjectMembers = async (projectId: string): Promise<ProjectMembersResponse> => {
  try {
    const response = await apiClient.get(`/projects/${projectId}/members`)
    return response.data || { projectId, members: [], total: 0 }
  } catch (error: any) {
    console.error('Error fetching project members:', error)
    if (error.response?.status === 404) {
      return { projectId, members: [], total: 0 }
    }
    throw new Error(error.response?.data?.message || 'Failed to fetch project members')
  }
}

/**
 * Calculate project progress based on tasks
 */
export const calculateProjectProgress = (tasks: Task[]): number => {
  if (!tasks || tasks.length === 0) return 0

  const completedTasks = tasks.filter(task => task.status === 'done').length
  return Math.round((completedTasks / tasks.length) * 100)
}

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

/**
 * Format date for display
 */
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A'

  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

/**
 * Calculate days remaining until deadline
 */
export const getDaysRemaining = (dueDate: string | undefined): number | null => {
  if (!dueDate) return null

  const today = new Date()
  const deadline = new Date(dueDate)
  const diffTime = deadline.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Check if project is overdue
 */
export const isProjectOverdue = (project: Project): boolean => {
  if (!project.expected_completion_date) return false

  const today = new Date()
  const deadline = new Date(project.expected_completion_date)

  return deadline < today && project.status !== 'completed'
}

/**
 * Get project health status
 */
export const getProjectHealth = (project: Project, stats?: any): 'good' | 'warning' | 'critical' => {
  if (project.status === 'completed') return 'good'
  if (project.status === 'on_hold') return 'warning'

  if (isProjectOverdue(project)) return 'critical'

  const daysRemaining = getDaysRemaining(project.expected_completion_date)
  if (daysRemaining !== null && daysRemaining < 7) return 'warning'

  if (stats && stats.taskCompletionRate < 30 && project.status === 'in_progress') {
    return 'warning'
  }

  return 'good'
}

// ============================================
// PROJECT COMPLETION & FEEDBACK
// ============================================

/**
 * End/Complete a project
 */
export const endProject = async (projectId: string): Promise<{
  success: boolean;
  message: string;
  feedbackUrl: string;
}> => {
  const response = await apiClient.put(`/projects/${projectId}/end`);
  return response.data;
};

/**
 * Submit feedback for a completed project
 */
export const submitProjectFeedback = async (
  projectId: string,
  data: {
    rating: number;
    title?: string;
    content: string;
    positiveAspects?: string[];
    areasOfImprovement?: string[];
    isPublic?: boolean;
  }
): Promise<{ success: boolean; message: string; feedback: any }> => {
  const response = await apiClient.post(`/projects/${projectId}/feedback`, data);
  return response.data;
};

/**
 * Get all feedback for a project
 */
export const getProjectFeedback = async (projectId: string): Promise<{
  projectId: string;
  projectName: string;
  feedback: Array<{
    id: string;
    reviewerId: string;
    rating: number;
    title: string;
    content: string;
    positiveAspects: string[];
    areasOfImprovement: string[];
    isPublic: boolean;
    createdAt: string;
  }>;
}> => {
  const response = await apiClient.get(`/projects/${projectId}/feedback`);
  return response.data;
};

/**
 * Get feedback submission status for current user
 */
export const getFeedbackStatus = async (projectId: string): Promise<{
  projectId: string;
  projectStatus: string;
  isCompleted: boolean;
  hasSubmittedFeedback: boolean;
  canSubmitFeedback: boolean;
  userRole: 'client' | 'developer';
}> => {
  const response = await apiClient.get(`/projects/${projectId}/feedback/status`);
  return response.data;
};

// Export all as default
export default {
  // Projects
  createProject,
  getClientProjects,
  getProject,
  updateProject,
  deleteProject,
  getProjectStats,
  assignTeamToProject,
  getProjectFiles,
  getDeveloperProjects,

  // Milestones
  createMilestone,
  getProjectMilestones,
  getMilestone,
  updateMilestone,
  deleteMilestone,
  updateMilestoneStatus,
  approveMilestone,
  submitMilestone,
  requestMilestoneFeedback,
  updateMilestonePayment,

  // Developer Projects
  getDeveloperAssignedProjects,
  getProjectTeamMembers,
  getProjectMembers,

  // Tasks
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  deleteTask,
  assignTask,

  // Helpers
  calculateProjectProgress,
  formatCurrency,
  formatDate,
  getDaysRemaining,
  isProjectOverdue,
  getProjectHealth,

  // Project Completion & Feedback
  endProject,
  submitProjectFeedback,
  getProjectFeedback,
  getFeedbackStatus,
}
