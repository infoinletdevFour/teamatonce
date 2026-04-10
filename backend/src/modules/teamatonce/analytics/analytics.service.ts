import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  ProjectAnalyticsDto,
  TimelineEventDto,
  TaskCompletionDataDto,
  TeamPerformanceDataDto,
  CompanyAnalyticsDto,
  RevenueByMonthDataDto,
  ProjectsByStatusDataDto,
  TeamUtilizationDataDto,
  DeveloperStatsDto,
  HoursWorkedDataDto,
  TasksCompletedDataDto,
  PerformanceScoreDataDto,
  BurndownDataDto,
  TimelineEventType,
  TimelineEventStatus,
} from './dto/analytics.dto';

/**
 * Analytics Service
 * Provides comprehensive analytics and reporting for projects, companies, and developers
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly db: DatabaseService) {}

  // ============================================
  // PROJECT ANALYTICS
  // ============================================

  /**
   * Get comprehensive analytics for a specific project
   */
  async getProjectAnalytics(projectId: string): Promise<ProjectAnalyticsDto> {
    // Get project
    const project = await this.db.findOne('projects', { id: projectId });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Get all tasks for the project
    const allTasks = await this.db.findMany('project_tasks', { project_id: projectId });

    // Calculate task statistics
    // Task statuses: initialized (todo), inprogress (in progress), done
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === 'done').length;
    const inProgressTasks = allTasks.filter((t) => t.status === 'inprogress').length;
    const pendingTasks = allTasks.filter((t) => t.status === 'initialized').length;

    // Calculate overdue tasks
    const now = new Date();
    const overdueTasks = allTasks.filter((t) => {
      if (!t.due_date || t.status === 'done') return false;
      return new Date(t.due_date) < now;
    }).length;

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate average task duration
    const completedTasksWithDates = allTasks.filter(
      (t) => t.status === 'done' && t.completed_date && t.created_at
    );
    const averageTaskDuration =
      completedTasksWithDates.length > 0
        ? completedTasksWithDates.reduce((sum, t) => {
            const duration =
              (new Date(t.completed_date).getTime() - new Date(t.created_at).getTime()) /
              (1000 * 60 * 60 * 24); // days
            return sum + duration;
          }, 0) / completedTasksWithDates.length
        : 0;

    // Calculate progress
    const actualProgress = project.progress_percentage || 0;

    // Calculate planned progress (based on time elapsed)
    let plannedProgress = 0;
    if (project.start_date && project.expected_completion_date) {
      const startDate = new Date(project.start_date);
      const endDate = new Date(project.expected_completion_date);
      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      plannedProgress = totalDuration > 0 ? Math.min(100, (elapsed / totalDuration) * 100) : 0;
    }

    // Calculate team efficiency (actual vs planned)
    const teamEfficiency =
      plannedProgress > 0 ? Math.min(100, (actualProgress / plannedProgress) * 100) : 100;

    // Budget calculations
    const budgetTotal = parseFloat(project.estimated_cost || '0');
    const budgetSpent = parseFloat(project.actual_cost || '0');
    const budgetRemaining = budgetTotal - budgetSpent;

    // Estimate completion date based on current progress rate
    let estimatedCompletion = project.expected_completion_date || new Date().toISOString();
    if (project.start_date && actualProgress > 0 && actualProgress < 100) {
      const startDate = new Date(project.start_date);
      const elapsed = now.getTime() - startDate.getTime();
      const totalEstimated = (elapsed / actualProgress) * 100;
      const estimatedEnd = new Date(startDate.getTime() + totalEstimated);
      estimatedCompletion = estimatedEnd.toISOString();
    }

    return {
      projectId,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      completionRate: Math.round(completionRate * 100) / 100,
      averageTaskDuration: Math.round(averageTaskDuration * 100) / 100,
      estimatedCompletion,
      actualProgress: Math.round(actualProgress * 100) / 100,
      plannedProgress: Math.round(plannedProgress * 100) / 100,
      teamEfficiency: Math.round(teamEfficiency * 100) / 100,
      budgetSpent,
      budgetRemaining,
      budgetTotal,
    };
  }

  /**
   * Get project timeline data (Gantt chart)
   */
  async getProjectTimeline(projectId: string): Promise<TimelineEventDto[]> {
    const timeline: TimelineEventDto[] = [];

    // Get milestones
    const milestones = await this.db.findMany(
      'project_milestones',
      { project_id: projectId },
      { orderBy: 'order_index', order: 'asc' }
    );

    for (const milestone of milestones) {
      // Determine status
      let status: TimelineEventStatus = TimelineEventStatus.PENDING;
      if (milestone.status === 'completed') status = TimelineEventStatus.COMPLETED;
      else if (milestone.status === 'in_progress') status = TimelineEventStatus.IN_PROGRESS;
      else if (milestone.due_date && new Date(milestone.due_date) < new Date()) {
        status = TimelineEventStatus.DELAYED;
      }

      // Calculate progress based on tasks
      const tasks = await this.db.findMany('project_tasks', { milestone_id: milestone.id });
      const completedTasks = tasks.filter((t) => t.status === 'done').length;
      const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

      timeline.push({
        id: milestone.id,
        name: milestone.name,
        type: TimelineEventType.MILESTONE,
        startDate: milestone.start_date || milestone.created_at,
        endDate: milestone.due_date || milestone.created_at,
        progress: Math.round(progress),
        status,
      });
    }

    return timeline;
  }

  /**
   * Get task completion breakdown by milestone
   */
  async getTaskCompletion(projectId: string): Promise<TaskCompletionDataDto[]> {
    const milestones = await this.db.findMany(
      'project_milestones',
      { project_id: projectId },
      { orderBy: 'order_index', order: 'asc' }
    );

    const result: TaskCompletionDataDto[] = [];

    for (const milestone of milestones) {
      const tasks = await this.db.findMany('project_tasks', { milestone_id: milestone.id });

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => t.status === 'done').length;
      const inProgressTasks = tasks.filter((t) => t.status === 'inprogress').length;
      const pendingTasks = tasks.filter((t) => t.status === 'initialized').length;

      const highPriority = tasks.filter((t) => t.priority === 'high' || t.priority === 'urgent').length;
      const mediumPriority = tasks.filter((t) => t.priority === 'medium').length;
      const lowPriority = tasks.filter((t) => t.priority === 'low').length;

      const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      result.push({
        milestoneId: milestone.id,
        milestoneName: milestone.name,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        highPriority,
        mediumPriority,
        lowPriority,
        completionPercentage: Math.round(completionPercentage * 100) / 100,
      });
    }

    return result;
  }

  /**
   * Get team performance metrics for a project
   */
  async getTeamPerformance(projectId: string): Promise<TeamPerformanceDataDto[]> {
    const project = await this.db.findOne('projects', { id: projectId });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const assignedTeam = JSON.parse(project.assigned_team || '[]');
    const result: TeamPerformanceDataDto[] = [];

    for (const teamMemberId of assignedTeam) {
      // Get team member details
      const teamMember = await this.db.findOne('team_members', { id: teamMemberId });
      if (!teamMember) continue;

      // Get user info
      const user = await this.db.getUserById(teamMember.user_id);

      // Get tasks for this team member
      const tasks = await this.db.findMany('project_tasks', {
        project_id: projectId,
        assigned_to: teamMember.user_id,
      });

      const tasksCompleted = tasks.filter((t) => t.status === 'done').length;
      const tasksInProgress = tasks.filter((t) => t.status === 'inprogress').length;

      // Calculate average completion time
      const completedTasksWithDates = tasks.filter(
        (t) => t.status === 'done' && t.completed_date && t.created_at
      );
      const averageCompletionTime =
        completedTasksWithDates.length > 0
          ? completedTasksWithDates.reduce((sum, t) => {
              const duration =
                (new Date(t.completed_date).getTime() - new Date(t.created_at).getTime()) /
                (1000 * 60 * 60); // hours
              return sum + duration;
            }, 0) / completedTasksWithDates.length
          : 0;

      // Calculate performance score (tasks completed vs total assigned)
      const performanceScore = tasks.length > 0 ? (tasksCompleted / tasks.length) * 100 : 0;

      // Calculate hours logged
      const hoursLogged = tasks.reduce((sum, t) => sum + parseFloat(t.actual_hours || '0'), 0);

      // Calculate efficiency (actual vs estimated hours)
      const estimatedHours = tasks
        .filter((t) => t.status === 'done')
        .reduce((sum, t) => sum + parseFloat(t.estimated_hours || '0'), 0);
      const actualHours = tasks
        .filter((t) => t.status === 'done')
        .reduce((sum, t) => sum + parseFloat(t.actual_hours || '0'), 0);
      const efficiency = estimatedHours > 0 ? (estimatedHours / actualHours) * 100 : 100;

      result.push({
        userId: teamMember.user_id,
        name: user?.name || teamMember.display_name,
        avatar: (user as any)?.avatar || teamMember.profile_image,
        role: teamMember.role,
        tasksCompleted,
        tasksInProgress,
        averageCompletionTime: Math.round(averageCompletionTime * 100) / 100,
        performanceScore: Math.round(performanceScore * 100) / 100,
        hoursLogged: Math.round(hoursLogged * 100) / 100,
        efficiency: Math.round(Math.min(100, efficiency) * 100) / 100,
      });
    }

    return result;
  }

  /**
   * Get burndown chart data for sprint/milestone
   */
  async getBurndownData(projectId: string, milestoneId?: string): Promise<BurndownDataDto[]> {
    let tasks;
    let startDate: Date;
    let endDate: Date;

    if (milestoneId) {
      // Get milestone-specific burndown
      const milestone = await this.db.findOne('project_milestones', { id: milestoneId });
      if (!milestone) {
        throw new NotFoundException('Milestone not found');
      }

      tasks = await this.db.findMany('project_tasks', { milestone_id: milestoneId });
      startDate = new Date(milestone.start_date || milestone.created_at);
      endDate = new Date(milestone.due_date || Date.now());
    } else {
      // Get project-wide burndown
      const project = await this.db.findOne('projects', { id: projectId });
      if (!project) {
        throw new NotFoundException('Project not found');
      }

      tasks = await this.db.findMany('project_tasks', { project_id: projectId });
      startDate = new Date(project.start_date || project.created_at);
      endDate = new Date(project.expected_completion_date || Date.now());
    }

    // Calculate total work
    const totalWork = tasks.reduce((sum, t) => sum + parseFloat(t.estimated_hours || '1'), 0);

    // Generate daily data points
    const result: BurndownDataDto[] = [];
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = currentDate.toISOString().split('T')[0];

      // Calculate ideal remaining (linear burndown)
      const idealRemaining = totalWork * (1 - i / daysDiff);

      // Calculate actual completed work up to this date
      const completedWork = tasks
        .filter((t) => {
          if (!t.completed_date) return false;
          return new Date(t.completed_date) <= currentDate;
        })
        .reduce((sum, t) => sum + parseFloat(t.estimated_hours || '1'), 0);

      const actualRemaining = totalWork - completedWork;

      result.push({
        date: dateStr,
        idealRemaining: Math.round(idealRemaining * 100) / 100,
        actualRemaining: Math.round(actualRemaining * 100) / 100,
        totalWork: Math.round(totalWork * 100) / 100,
        completedWork: Math.round(completedWork * 100) / 100,
      });
    }

    return result;
  }

  // ============================================
  // COMPANY ANALYTICS
  // ============================================

  /**
   * Get overall company analytics
   */
  async getCompanyAnalytics(companyId?: string, userId?: string): Promise<CompanyAnalyticsDto> {
    let projects;

    if (companyId) {
      // Get projects for a specific company
      projects = await this.db.findMany('projects', { company_id: companyId });
    } else if (userId) {
      // Get projects where user is the client
      projects = await this.db.findMany('projects', { client_id: userId });
    } else {
      // Get all projects (admin view)
      projects = await this.db.findMany('projects', {});
    }

    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'in_progress').length;
    const completedProjects = projects.filter((p) => p.status === 'completed').length;
    const onHoldProjects = projects.filter((p) => p.status === 'on_hold').length;

    // Calculate revenue
    const totalRevenue = projects.reduce((sum, p) => sum + parseFloat(p.actual_cost || '0'), 0);
    const averageProjectValue =
      completedProjects > 0
        ? projects
            .filter((p) => p.status === 'completed')
            .reduce((sum, p) => sum + parseFloat(p.estimated_cost || '0'), 0) / completedProjects
        : 0;

    // Calculate client satisfaction (based on feedback ratings)
    const feedbacks = await this.db.findMany('project_feedback', {});
    const avgRating =
      feedbacks.length > 0
        ? feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length
        : 0;
    const clientSatisfaction = (avgRating / 5) * 100;

    // Calculate team utilization
    const teamMembers = await this.db.findMany('team_members', { is_active: true });
    const totalCapacity = teamMembers.reduce((sum, tm) => sum + tm.capacity_hours_per_week, 0);

    // Get activity logs to estimate utilization (simplified)
    const teamUtilization = activeProjects > 0 ? Math.min(100, (activeProjects / teamMembers.length) * 50) : 0;

    // Calculate project success rate
    const projectSuccessRate =
      totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageProjectValue: Math.round(averageProjectValue * 100) / 100,
      clientSatisfaction: Math.round(clientSatisfaction * 100) / 100,
      teamUtilization: Math.round(teamUtilization * 100) / 100,
      projectSuccessRate: Math.round(projectSuccessRate * 100) / 100,
    };
  }

  /**
   * Get revenue data by month
   */
  async getRevenueByMonth(
    companyId?: string,
    period: string = 'monthly',
    startDate?: string,
    endDate?: string
  ): Promise<RevenueByMonthDataDto[]> {
    // Set default date range (last 12 months)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);

    let projects;
    if (companyId) {
      projects = await this.db.findMany('projects', { company_id: companyId });
    } else {
      projects = await this.db.findMany('projects', {});
    }

    // Get payments
    const payments = await this.db.findMany('payments', { status: 'completed' });

    // Group by month
    const monthlyData = new Map<string, RevenueByMonthDataDto>();

    for (const payment of payments) {
      if (!payment.transaction_date) continue;

      const paymentDate = new Date(payment.transaction_date);
      if (paymentDate < start || paymentDate > end) continue;

      const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthKey,
          revenue: 0,
          projects: 0,
          expenses: 0,
          profit: 0,
        });
      }

      const data = monthlyData.get(monthKey)!;
      data.revenue += parseFloat(payment.amount || '0');
      data.profit += parseFloat(payment.net_amount || payment.amount || '0');
      data.expenses = data.revenue - data.profit;
    }

    // Count projects per month
    for (const project of projects) {
      if (!project.created_at) continue;

      const projectDate = new Date(project.created_at);
      if (projectDate < start || projectDate > end) continue;

      const monthKey = `${projectDate.getFullYear()}-${String(projectDate.getMonth() + 1).padStart(2, '0')}`;

      if (monthlyData.has(monthKey)) {
        monthlyData.get(monthKey)!.projects++;
      }
    }

    // Convert to array and sort
    const result = Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month));

    return result.map((item) => ({
      ...item,
      revenue: Math.round(item.revenue * 100) / 100,
      expenses: Math.round(item.expenses * 100) / 100,
      profit: Math.round(item.profit * 100) / 100,
    }));
  }

  /**
   * Get projects grouped by status
   */
  async getProjectsByStatus(companyId?: string): Promise<ProjectsByStatusDataDto[]> {
    let projects;
    if (companyId) {
      projects = await this.db.findMany('projects', { company_id: companyId });
    } else {
      projects = await this.db.findMany('projects', {});
    }

    const statusMap = new Map<string, { count: number; totalValue: number }>();
    const totalProjects = projects.length;

    for (const project of projects) {
      const status = project.status || 'unknown';
      if (!statusMap.has(status)) {
        statusMap.set(status, { count: 0, totalValue: 0 });
      }

      const data = statusMap.get(status)!;
      data.count++;
      data.totalValue += parseFloat(project.estimated_cost || '0');
    }

    // Status colors
    const statusColors: Record<string, string> = {
      planning: '#3b82f6',
      in_progress: '#10b981',
      review: '#f59e0b',
      completed: '#22c55e',
      on_hold: '#ef4444',
      unknown: '#6b7280',
    };

    const result: ProjectsByStatusDataDto[] = [];
    for (const [status, data] of statusMap.entries()) {
      result.push({
        status,
        count: data.count,
        percentage: totalProjects > 0 ? (data.count / totalProjects) * 100 : 0,
        totalValue: Math.round(data.totalValue * 100) / 100,
        color: statusColors[status] || '#6b7280',
      });
    }

    return result.sort((a, b) => b.count - a.count);
  }

  /**
   * Get team utilization metrics
   */
  async getTeamUtilization(
    companyId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<TeamUtilizationDataDto[]> {
    let teamMembers;
    if (companyId) {
      teamMembers = await this.db.findMany('company_team_members', {
        company_id: companyId,
        status: 'active',
      });
    } else {
      teamMembers = await this.db.findMany('team_members', { is_active: true });
    }

    const result: TeamUtilizationDataDto[] = [];

    for (const member of teamMembers) {
      const userId = member.user_id;
      if (!userId) continue;

      // Get user info
      const user = await this.db.getUserById(userId);

      // Get tasks assigned to this member
      const tasks = await this.db.findMany('project_tasks', { assigned_to: userId });

      // Filter tasks by date range if provided
      let filteredTasks = tasks;
      if (startDate || endDate) {
        filteredTasks = tasks.filter((t) => {
          const taskDate = new Date(t.created_at);
          if (startDate && taskDate < new Date(startDate)) return false;
          if (endDate && taskDate > new Date(endDate)) return false;
          return true;
        });
      }

      // Calculate hours
      const totalHours = filteredTasks.reduce((sum, t) => sum + parseFloat(t.actual_hours || '0'), 0);
      const billableHours = totalHours; // Simplified - all hours are billable
      const nonBillableHours = 0;

      const capacity = member.capacity_hours_per_week || 40;
      const utilization = capacity > 0 ? (totalHours / capacity) * 100 : 0;

      // Get project breakdown
      const projectMap = new Map<string, number>();
      for (const task of filteredTasks) {
        const projectId = task.project_id;
        if (!projectId) continue;

        const hours = parseFloat(task.actual_hours || '0');
        projectMap.set(projectId, (projectMap.get(projectId) || 0) + hours);
      }

      const projects = [];
      for (const [projectId, hours] of projectMap.entries()) {
        const project = await this.db.findOne('projects', { id: projectId });
        if (project) {
          projects.push({
            projectId,
            projectName: project.name,
            hours: Math.round(hours * 100) / 100,
          });
        }
      }

      result.push({
        userId,
        name: user?.name || member.name || 'Unknown',
        avatar: (user as any)?.avatar || member.avatar_url,
        totalHours: Math.round(totalHours * 100) / 100,
        billableHours: Math.round(billableHours * 100) / 100,
        nonBillableHours: Math.round(nonBillableHours * 100) / 100,
        capacity,
        utilization: Math.round(Math.min(100, utilization) * 100) / 100,
        projects,
      });
    }

    return result;
  }

  // ============================================
  // DEVELOPER ANALYTICS
  // ============================================

  /**
   * Get developer statistics
   */
  async getDeveloperStats(userId: string): Promise<DeveloperStatsDto> {
    // Get all tasks for this developer
    const tasks = await this.db.findMany('project_tasks', { assigned_to: userId });

    const totalTasksCompleted = tasks.filter((t) => t.status === 'done').length;
    const totalHoursWorked = tasks.reduce((sum, t) => sum + parseFloat(t.actual_hours || '0'), 0);

    // Calculate average task completion time
    const completedTasksWithDates = tasks.filter(
      (t) => t.status === 'done' && t.completed_date && t.created_at
    );
    const averageTaskCompletionTime =
      completedTasksWithDates.length > 0
        ? completedTasksWithDates.reduce((sum, t) => {
            const duration =
              (new Date(t.completed_date).getTime() - new Date(t.created_at).getTime()) /
              (1000 * 60 * 60); // hours
            return sum + duration;
          }, 0) / completedTasksWithDates.length
        : 0;

    // Calculate performance score
    const performanceScore = tasks.length > 0 ? (totalTasksCompleted / tasks.length) * 100 : 0;

    // Calculate on-time delivery rate
    const tasksWithDueDate = tasks.filter((t) => t.status === 'done' && t.due_date && t.completed_date);
    const onTimeTasks = tasksWithDueDate.filter(
      (t) => new Date(t.completed_date) <= new Date(t.due_date)
    ).length;
    const onTimeDeliveryRate =
      tasksWithDueDate.length > 0 ? (onTimeTasks / tasksWithDueDate.length) * 100 : 100;

    // Code quality score (simplified - based on efficiency)
    const completedTasks = tasks.filter((t) => t.status === 'done');
    const estimatedHours = completedTasks.reduce((sum, t) => sum + parseFloat(t.estimated_hours || '0'), 0);
    const actualHours = completedTasks.reduce((sum, t) => sum + parseFloat(t.actual_hours || '0'), 0);
    const codeQualityScore = estimatedHours > 0 ? Math.min(100, (estimatedHours / actualHours) * 100) : 100;

    // Active projects
    const projectIds = new Set(tasks.map((t) => t.project_id).filter(Boolean));
    const activeProjects = projectIds.size;

    // Calculate earnings (based on hourly rate and hours worked)
    const teamMember = await this.db.findOne('team_members', { user_id: userId });
    const hourlyRate = parseFloat(teamMember?.hourly_rate || '0');
    const earnings = totalHoursWorked * hourlyRate;

    return {
      userId,
      totalTasksCompleted,
      totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
      averageTaskCompletionTime: Math.round(averageTaskCompletionTime * 100) / 100,
      performanceScore: Math.round(performanceScore * 100) / 100,
      onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100,
      codeQualityScore: Math.round(codeQualityScore * 100) / 100,
      activeProjects,
      earnings: Math.round(earnings * 100) / 100,
    };
  }

  /**
   * Get hours worked over a period
   */
  async getHoursWorked(
    userId: string,
    period: string = 'weekly',
    startDate?: string,
    endDate?: string
  ): Promise<HoursWorkedDataDto[]> {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const tasks = await this.db.findMany('project_tasks', { assigned_to: userId });

    // Group by date
    const dailyData = new Map<string, HoursWorkedDataDto>();

    for (const task of tasks) {
      const taskDate = new Date(task.created_at);
      if (taskDate < start || taskDate > end) continue;

      const dateKey = taskDate.toISOString().split('T')[0];

      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, {
          date: dateKey,
          hours: 0,
          billableHours: 0,
          overtimeHours: 0,
          projectBreakdown: [],
        });
      }

      const data = dailyData.get(dateKey)!;
      const hours = parseFloat(task.actual_hours || '0');
      data.hours += hours;
      data.billableHours += hours;

      // Add to project breakdown
      const projectId = task.project_id;
      if (projectId) {
        const existing = data.projectBreakdown.find((p) => p.projectId === projectId);
        if (existing) {
          existing.hours += hours;
        } else {
          const project = await this.db.findOne('projects', { id: projectId });
          data.projectBreakdown.push({
            projectId,
            projectName: project?.name || 'Unknown',
            hours,
          });
        }
      }
    }

    const result = Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date));

    return result.map((item) => ({
      ...item,
      hours: Math.round(item.hours * 100) / 100,
      billableHours: Math.round(item.billableHours * 100) / 100,
      projectBreakdown: item.projectBreakdown.map((p) => ({
        ...p,
        hours: Math.round(p.hours * 100) / 100,
      })),
    }));
  }

  /**
   * Get tasks completed over a period
   */
  async getTasksCompleted(
    userId: string,
    period: string = 'weekly',
    startDate?: string,
    endDate?: string
  ): Promise<TasksCompletedDataDto[]> {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const tasks = await this.db.findMany('project_tasks', { assigned_to: userId });

    // Group by date
    const dailyData = new Map<string, TasksCompletedDataDto>();

    for (const task of tasks) {
      const taskDate = new Date(task.created_at);
      if (taskDate < start || taskDate > end) continue;

      const dateKey = taskDate.toISOString().split('T')[0];

      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, {
          date: dateKey,
          completed: 0,
          created: 0,
          inProgress: 0,
        });
      }

      const data = dailyData.get(dateKey)!;
      data.created++;

      if (task.status === 'done') {
        data.completed++;
      } else if (task.status === 'inprogress') {
        data.inProgress++;
      }
    }

    const result = Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }

  /**
   * Get performance score over time
   */
  async getPerformanceScore(
    userId: string,
    period: string = 'weekly',
    startDate?: string,
    endDate?: string
  ): Promise<PerformanceScoreDataDto[]> {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const tasks = await this.db.findMany('project_tasks', { assigned_to: userId });

    // Group by date
    const dailyData = new Map<string, { completed: number; total: number; quality: number; speed: number }>();

    for (const task of tasks) {
      const taskDate = new Date(task.created_at);
      if (taskDate < start || taskDate > end) continue;

      const dateKey = taskDate.toISOString().split('T')[0];

      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, { completed: 0, total: 0, quality: 0, speed: 0 });
      }

      const data = dailyData.get(dateKey)!;
      data.total++;

      if (task.status === 'done') {
        data.completed++;

        // Calculate quality (based on estimated vs actual hours)
        const estimated = parseFloat(task.estimated_hours || '1');
        const actual = parseFloat(task.actual_hours || '1');
        const quality = Math.min(100, (estimated / actual) * 100);
        data.quality += quality;

        // Calculate speed (based on completion time vs due date)
        if (task.due_date && task.completed_date) {
          const onTime = new Date(task.completed_date) <= new Date(task.due_date);
          data.speed += onTime ? 100 : 50;
        }
      }
    }

    // Get team average for comparison
    const allTasks = await this.db.findMany('project_tasks', {});
    const teamAverage = allTasks.length > 0 ? (allTasks.filter((t) => t.status === 'done').length / allTasks.length) * 100 : 0;

    const result: PerformanceScoreDataDto[] = [];
    for (const [date, data] of dailyData.entries()) {
      const score = data.total > 0 ? (data.completed / data.total) * 100 : 0;
      const qualityScore = data.completed > 0 ? data.quality / data.completed : 0;
      const speedScore = data.completed > 0 ? data.speed / data.completed : 0;

      result.push({
        date,
        score: Math.round(score * 100) / 100,
        qualityScore: Math.round(qualityScore * 100) / 100,
        speedScore: Math.round(speedScore * 100) / 100,
        teamAverage: Math.round(teamAverage * 100) / 100,
      });
    }

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }
}
