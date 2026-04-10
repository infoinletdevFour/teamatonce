import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';

// ============================================
// ENUMS
// ============================================

export enum TimelineEventType {
  MILESTONE = 'milestone',
  TASK = 'task',
  PHASE = 'phase'
}

export enum TimelineEventStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  DELAYED = 'delayed'
}

export enum PeriodType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

// ============================================
// RESPONSE DTOs
// ============================================

export class ProjectAnalyticsDto {
  @ApiProperty()
  projectId: string;

  @ApiProperty()
  totalTasks: number;

  @ApiProperty()
  completedTasks: number;

  @ApiProperty()
  inProgressTasks: number;

  @ApiProperty()
  pendingTasks: number;

  @ApiProperty()
  overdueTasks: number;

  @ApiProperty()
  completionRate: number;

  @ApiProperty()
  averageTaskDuration: number;

  @ApiProperty()
  estimatedCompletion: string;

  @ApiProperty()
  actualProgress: number;

  @ApiProperty()
  plannedProgress: number;

  @ApiProperty()
  teamEfficiency: number;

  @ApiProperty()
  budgetSpent: number;

  @ApiProperty()
  budgetRemaining: number;

  @ApiProperty()
  budgetTotal: number;
}

export class TimelineEventDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: TimelineEventType })
  type: TimelineEventType;

  @ApiProperty()
  startDate: string;

  @ApiProperty()
  endDate: string;

  @ApiProperty()
  progress: number;

  @ApiProperty({ enum: TimelineEventStatus })
  status: TimelineEventStatus;

  @ApiPropertyOptional({ type: [String] })
  assignees?: string[];

  @ApiPropertyOptional({ type: [String] })
  dependencies?: string[];
}

export class TaskCompletionDataDto {
  @ApiProperty()
  milestoneId: string;

  @ApiProperty()
  milestoneName: string;

  @ApiProperty()
  totalTasks: number;

  @ApiProperty()
  completedTasks: number;

  @ApiProperty()
  inProgressTasks: number;

  @ApiProperty()
  pendingTasks: number;

  @ApiProperty()
  highPriority: number;

  @ApiProperty()
  mediumPriority: number;

  @ApiProperty()
  lowPriority: number;

  @ApiProperty()
  completionPercentage: number;
}

export class TeamPerformanceDataDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  tasksCompleted: number;

  @ApiProperty()
  tasksInProgress: number;

  @ApiProperty()
  averageCompletionTime: number;

  @ApiProperty()
  performanceScore: number;

  @ApiProperty()
  hoursLogged: number;

  @ApiProperty()
  efficiency: number;
}

export class CompanyAnalyticsDto {
  @ApiProperty()
  totalProjects: number;

  @ApiProperty()
  activeProjects: number;

  @ApiProperty()
  completedProjects: number;

  @ApiProperty()
  onHoldProjects: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  averageProjectValue: number;

  @ApiProperty()
  clientSatisfaction: number;

  @ApiProperty()
  teamUtilization: number;

  @ApiProperty()
  projectSuccessRate: number;
}

export class RevenueByMonthDataDto {
  @ApiProperty()
  month: string;

  @ApiProperty()
  revenue: number;

  @ApiProperty()
  projects: number;

  @ApiProperty()
  expenses: number;

  @ApiProperty()
  profit: number;

  @ApiPropertyOptional()
  previousYearRevenue?: number;
}

export class ProjectsByStatusDataDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  percentage: number;

  @ApiProperty()
  totalValue: number;

  @ApiProperty()
  color: string;
}

export class ProjectBreakdownDto {
  @ApiProperty()
  projectId: string;

  @ApiProperty()
  projectName: string;

  @ApiProperty()
  hours: number;
}

export class TeamUtilizationDataDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty()
  totalHours: number;

  @ApiProperty()
  billableHours: number;

  @ApiProperty()
  nonBillableHours: number;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  utilization: number;

  @ApiProperty({ type: [ProjectBreakdownDto] })
  projects: ProjectBreakdownDto[];
}

export class DeveloperStatsDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  totalTasksCompleted: number;

  @ApiProperty()
  totalHoursWorked: number;

  @ApiProperty()
  averageTaskCompletionTime: number;

  @ApiProperty()
  performanceScore: number;

  @ApiProperty()
  onTimeDeliveryRate: number;

  @ApiProperty()
  codeQualityScore: number;

  @ApiProperty()
  activeProjects: number;

  @ApiProperty()
  earnings: number;
}

export class HoursWorkedDataDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  hours: number;

  @ApiProperty()
  billableHours: number;

  @ApiProperty()
  overtimeHours: number;

  @ApiProperty({ type: [ProjectBreakdownDto] })
  projectBreakdown: ProjectBreakdownDto[];
}

export class TasksCompletedDataDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  created: number;

  @ApiProperty()
  inProgress: number;
}

export class PerformanceScoreDataDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  score: number;

  @ApiProperty()
  qualityScore: number;

  @ApiProperty()
  speedScore: number;

  @ApiProperty()
  teamAverage: number;
}

export class BurndownDataDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  idealRemaining: number;

  @ApiProperty()
  actualRemaining: number;

  @ApiProperty()
  totalWork: number;

  @ApiProperty()
  completedWork: number;
}

// ============================================
// QUERY DTOs
// ============================================

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ enum: PeriodType })
  @IsOptional()
  @IsEnum(PeriodType)
  period?: PeriodType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class BurndownQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  milestoneId?: string;
}
