import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto, BurndownQueryDto, PeriodType } from './dto/analytics.dto';

/**
 * Analytics Controller
 * Provides endpoints for project, company, and developer analytics
 */
@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ============================================
  // PROJECT ANALYTICS ENDPOINTS
  // ============================================

  @Get('projects/:projectId')
  @ApiOperation({
    summary: 'Get comprehensive analytics for a specific project',
    description: 'Returns task statistics, progress metrics, budget information, and team efficiency'
  })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getProjectAnalytics(@Param('projectId') projectId: string) {
    return this.analyticsService.getProjectAnalytics(projectId);
  }

  @Get('projects/:projectId/timeline')
  @ApiOperation({
    summary: 'Get project timeline data (Gantt chart)',
    description: 'Returns milestones and tasks with start/end dates, progress, and status for timeline visualization'
  })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getProjectTimeline(@Param('projectId') projectId: string) {
    return this.analyticsService.getProjectTimeline(projectId);
  }

  @Get('projects/:projectId/task-completion')
  @ApiOperation({
    summary: 'Get task completion breakdown by milestone',
    description: 'Returns task completion statistics grouped by milestone including priority breakdown'
  })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getTaskCompletion(@Param('projectId') projectId: string) {
    return this.analyticsService.getTaskCompletion(projectId);
  }

  @Get('projects/:projectId/team-performance')
  @ApiOperation({
    summary: 'Get team performance metrics for a project',
    description: 'Returns individual team member performance including tasks completed, hours logged, and efficiency'
  })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getTeamPerformance(@Param('projectId') projectId: string) {
    return this.analyticsService.getTeamPerformance(projectId);
  }

  @Get('projects/:projectId/burndown')
  @ApiOperation({
    summary: 'Get burndown chart data for sprint/milestone',
    description: 'Returns daily burndown data showing ideal vs actual progress'
  })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'milestoneId', required: false, description: 'Optional milestone ID for milestone-specific burndown' })
  async getBurndownData(
    @Param('projectId') projectId: string,
    @Query('milestoneId') milestoneId?: string
  ) {
    return this.analyticsService.getBurndownData(projectId, milestoneId);
  }

  // ============================================
  // COMPANY ANALYTICS ENDPOINTS
  // ============================================

  @Get('company')
  @ApiOperation({
    summary: 'Get overall company analytics',
    description: 'Returns company-wide metrics including total projects, revenue, team utilization, and success rate'
  })
  async getCompanyAnalytics(@Req() req) {
    const userId = req.user.sub || req.user.userId;
    return this.analyticsService.getCompanyAnalytics(undefined, userId);
  }

  @Get('company/:companyId')
  @ApiOperation({
    summary: 'Get analytics for a specific company',
    description: 'Returns company-wide metrics for a specific company ID'
  })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  async getCompanyAnalyticsById(@Param('companyId') companyId: string) {
    return this.analyticsService.getCompanyAnalytics(companyId);
  }

  @Get('company/revenue')
  @ApiOperation({
    summary: 'Get revenue data by month',
    description: 'Returns monthly revenue, expenses, and profit data with optional period grouping'
  })
  @ApiQuery({ name: 'period', required: false, enum: PeriodType, description: 'Period grouping (monthly, quarterly, yearly)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getRevenueByMonth(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getRevenueByMonth(
      undefined,
      query.period,
      query.startDate,
      query.endDate
    );
  }

  @Get('company/:companyId/revenue')
  @ApiOperation({
    summary: 'Get revenue data by month for a specific company',
    description: 'Returns monthly revenue, expenses, and profit data for a specific company'
  })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiQuery({ name: 'period', required: false, enum: PeriodType, description: 'Period grouping (monthly, quarterly, yearly)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getRevenueByMonthForCompany(
    @Param('companyId') companyId: string,
    @Query() query: AnalyticsQueryDto
  ) {
    return this.analyticsService.getRevenueByMonth(
      companyId,
      query.period,
      query.startDate,
      query.endDate
    );
  }

  @Get('company/projects-by-status')
  @ApiOperation({
    summary: 'Get projects grouped by status',
    description: 'Returns project distribution by status with counts, percentages, and total value'
  })
  async getProjectsByStatus() {
    return this.analyticsService.getProjectsByStatus();
  }

  @Get('company/:companyId/projects-by-status')
  @ApiOperation({
    summary: 'Get projects grouped by status for a specific company',
    description: 'Returns project distribution by status for a specific company'
  })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  async getProjectsByStatusForCompany(@Param('companyId') companyId: string) {
    return this.analyticsService.getProjectsByStatus(companyId);
  }

  @Get('company/team-utilization')
  @ApiOperation({
    summary: 'Get team utilization metrics',
    description: 'Returns team member utilization including billable hours, capacity, and project breakdown'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getTeamUtilization(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getTeamUtilization(
      undefined,
      query.startDate,
      query.endDate
    );
  }

  @Get('company/:companyId/team-utilization')
  @ApiOperation({
    summary: 'Get team utilization metrics for a specific company',
    description: 'Returns team member utilization for a specific company'
  })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getTeamUtilizationForCompany(
    @Param('companyId') companyId: string,
    @Query() query: AnalyticsQueryDto
  ) {
    return this.analyticsService.getTeamUtilization(
      companyId,
      query.startDate,
      query.endDate
    );
  }

  // ============================================
  // DEVELOPER ANALYTICS ENDPOINTS
  // ============================================

  @Get('developer/:userId')
  @ApiOperation({
    summary: 'Get developer statistics',
    description: 'Returns comprehensive developer stats including tasks, hours, performance score, and earnings'
  })
  @ApiParam({ name: 'userId', description: 'Developer user ID' })
  async getDeveloperStats(@Param('userId') userId: string) {
    return this.analyticsService.getDeveloperStats(userId);
  }

  @Get('developer/:userId/hours-worked')
  @ApiOperation({
    summary: 'Get hours worked over a period',
    description: 'Returns daily/weekly/monthly hours worked with project breakdown'
  })
  @ApiParam({ name: 'userId', description: 'Developer user ID' })
  @ApiQuery({ name: 'period', required: false, enum: PeriodType, description: 'Period grouping (daily, weekly, monthly)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getHoursWorked(
    @Param('userId') userId: string,
    @Query() query: AnalyticsQueryDto
  ) {
    return this.analyticsService.getHoursWorked(
      userId,
      query.period,
      query.startDate,
      query.endDate
    );
  }

  @Get('developer/:userId/tasks-completed')
  @ApiOperation({
    summary: 'Get tasks completed over a period',
    description: 'Returns daily/weekly/monthly task completion data'
  })
  @ApiParam({ name: 'userId', description: 'Developer user ID' })
  @ApiQuery({ name: 'period', required: false, enum: PeriodType, description: 'Period grouping (daily, weekly, monthly)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getTasksCompleted(
    @Param('userId') userId: string,
    @Query() query: AnalyticsQueryDto
  ) {
    return this.analyticsService.getTasksCompleted(
      userId,
      query.period,
      query.startDate,
      query.endDate
    );
  }

  @Get('developer/:userId/performance-score')
  @ApiOperation({
    summary: 'Get performance score over time',
    description: 'Returns performance metrics over time including quality and speed scores'
  })
  @ApiParam({ name: 'userId', description: 'Developer user ID' })
  @ApiQuery({ name: 'period', required: false, enum: PeriodType, description: 'Period grouping (daily, weekly, monthly)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getPerformanceScore(
    @Param('userId') userId: string,
    @Query() query: AnalyticsQueryDto
  ) {
    return this.analyticsService.getPerformanceScore(
      userId,
      query.period,
      query.startDate,
      query.endDate
    );
  }
}
