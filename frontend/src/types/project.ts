/**
 * Project Management Types for Team@Once
 *
 * Defines all TypeScript types and interfaces for project management,
 * matching backend DTOs and database schema
 */

import type { Milestone, MilestoneStatus, MilestoneType } from './milestone';

// Re-export Milestone types for backward compatibility
export type { Milestone, MilestoneStatus, MilestoneType };

// ============================================
// ENUMS
// ============================================

export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
}

export enum ProjectApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum TaskType {
  FEATURE = 'feature',
  BUG = 'bug',
  ENHANCEMENT = 'enhancement',
  DOCUMENTATION = 'documentation',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
}

// ============================================
// INTERFACES
// ============================================

export interface Project {
  id: string
  client_id: string
  company_id?: string
  name: string
  description?: string
  project_type: string
  template_id?: string
  status: ProjectStatus
  approval_status?: ProjectApprovalStatus
  approval_reviewed_by?: string
  approval_reviewed_at?: string
  approval_rejection_reason?: string
  requirements?: Record<string, any>
  tech_stack?: string[]
  frameworks?: string[]
  features?: string[]
  estimated_cost?: number
  budget_min?: number
  budget_max?: number
  currency: string
  estimated_duration_days?: number
  start_date?: string
  expected_completion_date?: string
  preferred_end_date?: string
  actual_completion_date?: string
  progress_percentage: number
  actual_cost: number
  assigned_team?: string[]
  team_lead_id?: string
  settings?: Record<string, any>
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Task {
  id: string
  project_id: string
  milestone_id?: string
  title: string
  description?: string
  task_type: TaskType
  priority: TaskPriority
  status: TaskStatus
  assigned_to?: string
  assigned_by?: string
  assigned_at?: string
  estimated_hours?: number
  actual_hours: number
  due_date?: string
  start_date?: string
  completed_date?: string
  tags?: string[]
  dependencies?: string[]
  attachments?: any[]
  checklist?: any[]
  created_at: string
  updated_at: string
}

export interface ProjectStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  pendingTasks: number
  taskCompletionRate: number
  totalMilestones: number
  completedMilestones: number
  milestoneCompletionRate: number
  totalEstimatedHours: number
  totalActualHours: number
  hoursVariance: number
}

export interface ProjectWithStats {
  project: Project
  stats: ProjectStats
  milestones: Milestone[]
  recentTasks: Task[]
}

export interface ProjectFile {
  id: string
  project_id: string
  milestone_id?: string | null
  file_name: string
  file_path: string
  file_url: string
  file_size: number
  mime_type: string
  file_type: string
  uploaded_by: string
  description?: string | null
  tags?: string[]
  version?: number
  is_deliverable: boolean
  deliverable_index?: number | null
  is_public: boolean
  shared_with?: string[]
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  skills?: string[]
  hourlyRate?: number
}

// ============================================
// DATA TRANSFER OBJECTS (DTOs)
// ============================================

export interface CreateProjectData {
  name: string
  description?: string
  projectType: string
  templateId?: string
  requirements?: Record<string, any>
  techStack?: string[]
  frameworks?: string[]
  features?: string[]
  estimatedCost?: number
  budgetMin?: number
  budgetMax?: number
  currency?: string
  estimatedDurationDays?: number
  startDate?: string
  expectedCompletionDate?: string
  preferredEndDate?: string
}

export interface UpdateProjectData {
  name?: string
  description?: string
  status?: ProjectStatus
  techStack?: string[]
  frameworks?: string[]
  progressPercentage?: number
  settings?: Record<string, any>
  estimatedCost?: number
  budgetMin?: number
  budgetMax?: number
  startDate?: string
  expectedCompletionDate?: string
  preferredEndDate?: string
}

export interface CreateMilestoneData {
  name: string
  description?: string
  milestoneType: MilestoneType
  orderIndex: number
  deliverables?: string[]
  acceptanceCriteria?: string[]
  estimatedHours?: number
  dueDate?: string
  milestoneAmount?: number
}

export interface ApproveMilestoneData {
  notes?: string
}

export interface CreateTaskData {
  title: string
  description?: string
  taskType: TaskType
  priority?: TaskPriority
  assignedTo?: string
  estimatedHours?: number
  dueDate?: string
  tags?: string[]
  dependencies?: string[]
}

export interface UpdateTaskData {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignedTo?: string
  actualHours?: number
}

export interface AssignTeamData {
  teamMemberIds: string[]
  teamLeadId?: string
}

export interface TaskFilters {
  milestoneId?: string
  assignedTo?: string
  status?: TaskStatus
  priority?: TaskPriority
}

// ============================================
// HELPER TYPES
// ============================================

export interface ProjectListItem {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  progress_percentage: number
  estimated_cost?: number
  currency: string
  start_date?: string
  expected_completion_date?: string
  created_at: string
}

export interface MilestoneListItem {
  id: string
  name: string
  milestone_type: MilestoneType
  status: MilestoneStatus
  order_index: number
  due_date?: string
  milestone_amount?: number
  payment_status: string
}

// ============================================
// CONSTANTS
// ============================================

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: 'Planning',
  [ProjectStatus.IN_PROGRESS]: 'In Progress',
  [ProjectStatus.REVIEW]: 'In Review',
  [ProjectStatus.COMPLETED]: 'Completed',
  [ProjectStatus.ON_HOLD]: 'On Hold',
}

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: 'blue',
  [ProjectStatus.IN_PROGRESS]: 'yellow',
  [ProjectStatus.REVIEW]: 'purple',
  [ProjectStatus.COMPLETED]: 'green',
  [ProjectStatus.ON_HOLD]: 'gray',
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'To Do',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.REVIEW]: 'In Review',
  [TaskStatus.DONE]: 'Done',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'Low',
  [TaskPriority.MEDIUM]: 'Medium',
  [TaskPriority.HIGH]: 'High',
  [TaskPriority.URGENT]: 'Urgent',
}

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'gray',
  [TaskPriority.MEDIUM]: 'blue',
  [TaskPriority.HIGH]: 'orange',
  [TaskPriority.URGENT]: 'red',
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  [TaskType.FEATURE]: 'Feature',
  [TaskType.BUG]: 'Bug',
  [TaskType.ENHANCEMENT]: 'Enhancement',
  [TaskType.DOCUMENTATION]: 'Documentation',
}
