import { IsString, IsOptional, IsNumber, IsArray, IsObject, IsEnum, IsUUID, IsDate, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProjectStatus {
  PLANNING = 'planning',
  AWARDED = 'awarded',           // Proposal accepted, awaiting milestone plan
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
}

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  projectType: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  requirements?: Record<string, any>;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  techStack?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  frameworks?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  budgetMin?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  budgetMax?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  estimatedDurationDays?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  expectedCompletionDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  preferredEndDate?: string;
}

export class UpdateProjectDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  techStack?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  frameworks?: string[];

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  progressPercentage?: number;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  budgetMin?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  budgetMax?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  expectedCompletionDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  preferredEndDate?: string;
}

export enum MilestoneType {
  PLANNING = 'planning',
  DESIGN = 'design',
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  DEPLOYMENT = 'deployment',
  MAINTENANCE = 'maintenance',
}

export enum MilestoneStatus {
  PENDING = 'pending',              // Not started
  IN_PROGRESS = 'in_progress',      // Developer working on it
  SUBMITTED = 'submitted',          // Developer submitted for client review
  FEEDBACK_REQUIRED = 'feedback_required', // Client requested changes
  COMPLETED = 'completed',          // Work complete, ready for final approval
  APPROVED = 'approved',            // Client approved, payment released
}

export class CreateMilestoneDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsEnum(MilestoneType)
  milestoneType: MilestoneType;

  @ApiProperty()
  @IsNumber()
  orderIndex: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  deliverables?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  acceptanceCriteria?: string[];

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ description: 'Milestone payment amount (required)' })
  @IsNumber()
  @Min(0.01, { message: 'Milestone amount must be greater than 0' })
  milestoneAmount: number;
}

export class ApproveMilestoneDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class SubmitMilestoneDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RequestMilestoneFeedbackDto {
  @ApiProperty()
  @IsString()
  feedback: string;
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
  INITIALIZED = 'initialized',
  INPROGRESS = 'inprogress',
  DONE = 'done',
}

export class CreateTaskDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsEnum(TaskType)
  taskType: TaskType;

  @ApiPropertyOptional()
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  dependencies?: string[];

  @ApiPropertyOptional({ description: 'Parent task ID for creating subtasks' })
  @IsString()
  @IsOptional()
  parentTaskId?: string;
}

export class UpdateTaskDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  taskType?: string;

  @ApiPropertyOptional()
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional()
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  actualHours?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  dependencies?: string[];

  @ApiPropertyOptional({ description: 'Parent task ID for subtasks' })
  @IsString()
  @IsOptional()
  parentTaskId?: string;
}

// Response DTOs for enriched task data
export class TaskAssigneeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  avatar: string;
}

export class TaskResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: TaskStatus })
  status: TaskStatus;

  @ApiProperty({ type: TaskAssigneeDto, nullable: true })
  assignee: TaskAssigneeDto | null;

  @ApiProperty()
  dueDate: string;

  @ApiProperty({ enum: TaskPriority })
  priority: TaskPriority;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class TasksListResponseDto {
  @ApiProperty({ type: [TaskResponseDto] })
  tasks: TaskResponseDto[];
}

// Response DTOs for Milestones
export class MilestoneResponseDto {
  @ApiProperty({ description: 'Milestone unique identifier' })
  id: string;

  @ApiProperty({ description: 'Milestone title/name' })
  title: string;

  @ApiProperty({ description: 'Milestone description' })
  description: string;

  @ApiProperty({ enum: MilestoneStatus, description: 'Current milestone status' })
  status: MilestoneStatus;

  @ApiProperty({ description: 'Milestone due date', nullable: true })
  dueDate: string | null;

  @ApiProperty({ description: 'Progress percentage (0-100)' })
  progress: number;

  @ApiProperty({ description: 'Milestone payment amount', nullable: true })
  amount: number | null;

  @ApiProperty({ type: [String], description: 'List of deliverable descriptions' })
  deliverables: string[];

  @ApiProperty({ type: [String], description: 'List of acceptance criteria' })
  acceptanceCriteria: string[];

  @ApiPropertyOptional({ description: 'Estimated hours to complete', nullable: true })
  estimatedHours?: number | null;

  @ApiProperty({ description: 'Milestone creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Milestone last update timestamp' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Milestone type' })
  milestoneType?: string;

  @ApiPropertyOptional({ description: 'Order index' })
  orderIndex?: number;

  @ApiPropertyOptional({ description: 'Payment status' })
  paymentStatus?: string;

  @ApiPropertyOptional({ description: 'Client feedback when changes requested', nullable: true })
  feedback?: string | null;

  @ApiPropertyOptional({ description: 'Number of times submitted for review' })
  submissionCount?: number;

  @ApiPropertyOptional({ description: 'Developer who submitted milestone', nullable: true })
  submittedBy?: string | null;

  @ApiPropertyOptional({ description: 'Timestamp when milestone was submitted', nullable: true })
  submittedAt?: string | null;

  @ApiPropertyOptional({ description: 'Client who reviewed milestone', nullable: true })
  reviewedBy?: string | null;

  @ApiPropertyOptional({ description: 'Timestamp when milestone was reviewed', nullable: true })
  reviewedAt?: string | null;
}

export class MilestonesResponseDto {
  @ApiProperty({ type: [MilestoneResponseDto], description: 'List of project milestones' })
  milestones: MilestoneResponseDto[];
}

// Project Summary DTO (for stats response)
export class ProjectSummaryDto {
  @ApiProperty({ description: 'Project ID' })
  id: string;

  @ApiProperty({ description: 'Project name' })
  name: string;

  @ApiProperty({ description: 'Project status' })
  status: string;

  @ApiProperty({ description: 'Progress percentage', required: false })
  progress_percentage?: string;

  @ApiProperty({ description: 'Start date', required: false })
  start_date?: string;

  @ApiProperty({ description: 'Expected completion date', required: false })
  expected_completion_date?: string;

  @ApiProperty({ description: 'Actual completion date', required: false })
  actual_completion_date?: string;
}

// Project Stats DTO (nested stats object)
export class ProjectStatsDto {
  @ApiProperty({ description: 'Total number of tasks in the project' })
  totalTasks: number;

  @ApiProperty({ description: 'Number of completed tasks' })
  completedTasks: number;

  @ApiProperty({ description: 'Number of tasks currently in progress' })
  inProgressTasks: number;

  @ApiProperty({ description: 'Total number of milestones' })
  totalMilestones: number;

  @ApiProperty({ description: 'Number of completed milestones' })
  completedMilestones: number;

  @ApiProperty({ description: 'Overall project completion percentage (0-100)' })
  completionPercentage: number;

  @ApiProperty({ description: 'Number of team members assigned to the project' })
  teamMembers: number;

  @ApiProperty({ description: 'Total number of files uploaded to the project' })
  filesCount: number;

  @ApiProperty({ description: 'Total budget spent on completed milestones' })
  budgetSpent: number;

  @ApiProperty({ description: 'Total estimated budget for the project' })
  totalBudget: number;
}

// Project Statistics Response DTO
export class ProjectStatsResponseDto {
  @ApiProperty({ description: 'Project summary with status', type: ProjectSummaryDto })
  project: ProjectSummaryDto;

  @ApiProperty({ description: 'Project statistics', type: ProjectStatsDto })
  stats: ProjectStatsDto;
}
