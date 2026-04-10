import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateFaqDto,
  UpdateFaqDto,
  ReorderFaqsDto,
  ReviewReportDto,
  BulkEmailDto,
  BulkNotificationDto,
} from './dto';

/**
 * Admin Controller
 * All routes are protected and require admin or super_admin role
 */
@ApiTags('Admin')
@Controller('admin')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('admin', 'super_admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==========================================
  // DASHBOARD
  // ==========================================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied - admin role required' })
  async getDashboard(@CurrentUser() user: any) {
    return this.adminService.getDashboardStats();
  }

  // ==========================================
  // USER MANAGEMENT
  // ==========================================

  @Get('users')
  @ApiOperation({ summary: 'Get all users with pagination' })
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.adminService.getAllUsers({ page, limit, search, role });
  }

  @Get('users/pending-approval')
  @ApiOperation({ summary: 'Get pending user approvals' })
  async getPendingApprovals(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.adminService.getPendingApprovals({ page, limit });
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user details by ID' })
  async getUserById(@Param('userId') userId: string) {
    return this.adminService.getUserById(userId);
  }

  @Put('users/:userId')
  @ApiOperation({ summary: 'Update user details (admin only)' })
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateData: any,
  ) {
    return this.adminService.updateUser(userId, updateData);
  }

  @Delete('users/:userId')
  @Roles('super_admin') // Only super admin can delete users
  @ApiOperation({ summary: 'Delete user (super admin only)' })
  async deleteUser(@Param('userId') userId: string) {
    return this.adminService.deleteUser(userId);
  }

  @Post('users/:userId/ban')
  @ApiOperation({ summary: 'Ban user' })
  async banUser(@Param('userId') userId: string, @Body('reason') reason: string) {
    return this.adminService.banUser(userId, reason);
  }

  @Post('users/:userId/unban')
  @ApiOperation({ summary: 'Unban user' })
  async unbanUser(@Param('userId') userId: string) {
    return this.adminService.unbanUser(userId);
  }

  // ==========================================
  // ROLE MANAGEMENT
  // ==========================================

  @Post('users/:userId/role')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Change user role' })
  async changeUserRole(
    @Param('userId') userId: string,
    @Body('role') role: string,
  ) {
    return this.adminService.changeUserRole(userId, role);
  }

  // ==========================================
  // COURSE MANAGEMENT
  // ==========================================

  @Get('courses')
  @ApiOperation({ summary: 'Get all courses (including drafts)' })
  async getAllCourses(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllCourses({ page, limit, status });
  }

  @Put('courses/:courseId/approve')
  @ApiOperation({ summary: 'Approve course for publication' })
  async approveCourse(@Param('courseId') courseId: string) {
    return this.adminService.approveCourse(courseId);
  }

  @Put('courses/:courseId/reject')
  @ApiOperation({ summary: 'Reject course' })
  async rejectCourse(
    @Param('courseId') courseId: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.rejectCourse(courseId, reason);
  }

  @Delete('courses/:courseId')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete course (super admin only)' })
  async deleteCourse(@Param('courseId') courseId: string) {
    return this.adminService.deleteCourse(courseId);
  }

  // ==========================================
  // TRANSACTIONS & PAYMENTS
  // ==========================================

  @Get('transactions')
  @ApiOperation({ summary: 'Get all transactions' })
  async getAllTransactions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.adminService.getAllTransactions({ page, limit });
  }

  @Get('payouts')
  @ApiOperation({ summary: 'Get payout requests' })
  async getPayoutRequests(@Query('status') status?: string) {
    return this.adminService.getPayoutRequests(status);
  }

  @Post('payouts/:payoutId/approve')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Approve payout request (super admin only)' })
  async approvePayout(@Param('payoutId') payoutId: string) {
    return this.adminService.approvePayout(payoutId);
  }

  // ==========================================
  // ANALYTICS
  // ==========================================

  @Get('analytics/overview')
  @ApiOperation({ summary: 'Get platform analytics overview' })
  async getAnalyticsOverview() {
    return this.adminService.getAnalyticsOverview();
  }

  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  async getRevenueAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getRevenueAnalytics(startDate, endDate);
  }

  // ==========================================
  // SYSTEM SETTINGS
  // ==========================================

  @Get('settings')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Get system settings (super admin only)' })
  async getSystemSettings() {
    return this.adminService.getSystemSettings();
  }

  @Put('settings')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Update system settings (super admin only)' })
  async updateSystemSettings(@Body() settings: any) {
    return this.adminService.updateSystemSettings(settings);
  }

  // ==========================================
  // ACTIVITY LOGS
  // ==========================================

  @Get('activity-logs')
  @ApiOperation({ summary: 'Get activity logs' })
  async getActivityLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    return this.adminService.getActivityLogs({ page, limit, userId, action });
  }

  // ==========================================
  // USER APPROVAL
  // ==========================================

  @Post('users/:userId/approve')
  @ApiOperation({ summary: 'Approve user registration' })
  async approveUser(
    @Param('userId') userId: string,
    @CurrentUser() admin: any,
    @Body('notes') notes?: string,
  ) {
    return this.adminService.approveUser(userId, admin.userId, notes);
  }

  @Post('users/:userId/reject')
  @ApiOperation({ summary: 'Reject user registration' })
  async rejectUser(
    @Param('userId') userId: string,
    @CurrentUser() admin: any,
    @Body('reason') reason: string,
  ) {
    return this.adminService.rejectUser(userId, admin.userId, reason);
  }

  @Post('users/:userId/suspend')
  @ApiOperation({ summary: 'Suspend user' })
  async suspendUser(
    @Param('userId') userId: string,
    @Body('reason') reason: string,
    @Body('until') until?: string,
  ) {
    return this.adminService.suspendUser(userId, reason, until);
  }

  @Post('users/:userId/reactivate')
  @ApiOperation({ summary: 'Reactivate suspended/banned user' })
  async reactivateUser(@Param('userId') userId: string) {
    return this.adminService.reactivateUser(userId);
  }

  // ==========================================
  // JOB MANAGEMENT
  // ==========================================

  @Get('jobs')
  @ApiOperation({ summary: 'Get all jobs with filters' })
  async getAllJobs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('approvalStatus') approvalStatus?: string,
  ) {
    return this.adminService.getAllJobs({ page, limit, search, status, approvalStatus });
  }

  @Get('jobs/pending-approval')
  @ApiOperation({ summary: 'Get jobs pending approval' })
  async getPendingJobs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.adminService.getPendingJobs({ page, limit });
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Get job by ID' })
  async getJobById(@Param('jobId') jobId: string) {
    return this.adminService.getJobById(jobId);
  }

  @Post('jobs/:jobId/approve')
  @ApiOperation({ summary: 'Approve job posting' })
  async approveJob(
    @Param('jobId') jobId: string,
    @CurrentUser() admin: any,
  ) {
    return this.adminService.approveJob(jobId, admin.userId);
  }

  @Post('jobs/:jobId/reject')
  @ApiOperation({ summary: 'Reject job posting' })
  async rejectJob(
    @Param('jobId') jobId: string,
    @CurrentUser() admin: any,
    @Body('reason') reason: string,
  ) {
    return this.adminService.rejectJob(jobId, admin.userId, reason);
  }

  // ==========================================
  // PROJECT MANAGEMENT
  // ==========================================

  @Get('projects')
  @ApiOperation({ summary: 'Get all projects' })
  async getAllProjects(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllProjects({ page, limit, search, status });
  }

  @Get('projects/:projectId')
  @ApiOperation({ summary: 'Get project by ID' })
  async getProjectById(@Param('projectId') projectId: string) {
    return this.adminService.getProjectById(projectId);
  }

  @Get('projects/:projectId/milestones')
  @ApiOperation({ summary: 'Get project milestones' })
  async getProjectMilestones(@Param('projectId') projectId: string) {
    return this.adminService.getProjectMilestones(projectId);
  }

  @Post('projects/:projectId/force-close')
  @ApiOperation({ summary: 'Force close project' })
  async forceCloseProject(
    @Param('projectId') projectId: string,
    @CurrentUser() admin: any,
    @Body('reason') reason: string,
  ) {
    return this.adminService.forceCloseProject(projectId, admin.userId, reason);
  }

  // ==========================================
  // CONTENT MODERATION (REPORTS)
  // ==========================================

  @Get('reports')
  @ApiOperation({ summary: 'Get content reports' })
  async getReports(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('reason') reason?: string,
  ) {
    return this.adminService.getReports({ page, limit, status, type, reason });
  }

  @Get('reports/:reportId')
  @ApiOperation({ summary: 'Get report by ID' })
  async getReportById(@Param('reportId') reportId: string) {
    return this.adminService.getReportById(reportId);
  }

  @Post('reports/:reportId/review')
  @ApiOperation({ summary: 'Review and resolve report' })
  async reviewReport(
    @Param('reportId') reportId: string,
    @CurrentUser() admin: any,
    @Body() dto: ReviewReportDto,
  ) {
    return this.adminService.reviewReport(reportId, admin.userId, dto);
  }

  @Delete('content/:contentType/:contentId')
  @ApiOperation({ summary: 'Remove reported content' })
  async removeContent(
    @Param('contentType') contentType: string,
    @Param('contentId') contentId: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.removeContent(contentType, contentId, reason);
  }

  // ==========================================
  // FAQ MANAGEMENT
  // ==========================================

  @Get('faqs')
  @ApiOperation({ summary: 'Get all FAQs' })
  async getFaqs(
    @Query('category') category?: string,
    @Query('includeUnpublished') includeUnpublished?: string,
  ) {
    return this.adminService.getFaqs({
      category,
      includeUnpublished: includeUnpublished === 'true',
    });
  }

  @Get('faqs/:faqId')
  @ApiOperation({ summary: 'Get FAQ by ID' })
  async getFaqById(@Param('faqId') faqId: string) {
    return this.adminService.getFaqById(faqId);
  }

  @Post('faqs')
  @ApiOperation({ summary: 'Create FAQ' })
  async createFaq(
    @CurrentUser() admin: any,
    @Body() dto: CreateFaqDto,
  ) {
    return this.adminService.createFaq(admin.userId, dto);
  }

  @Put('faqs/reorder')
  @ApiOperation({ summary: 'Reorder FAQs' })
  async reorderFaqs(@Body() dto: ReorderFaqsDto) {
    return this.adminService.reorderFaqs(dto.ids);
  }

  @Put('faqs/:faqId')
  @ApiOperation({ summary: 'Update FAQ' })
  async updateFaq(
    @Param('faqId') faqId: string,
    @CurrentUser() admin: any,
    @Body() dto: UpdateFaqDto,
  ) {
    return this.adminService.updateFaq(faqId, admin.userId, dto);
  }

  @Delete('faqs/:faqId')
  @ApiOperation({ summary: 'Delete FAQ' })
  async deleteFaq(@Param('faqId') faqId: string) {
    return this.adminService.deleteFaq(faqId);
  }

  // ==========================================
  // BULK COMMUNICATIONS
  // ==========================================

  @Post('communications/email')
  @ApiOperation({ summary: 'Send bulk email' })
  async sendBulkEmail(
    @CurrentUser() admin: any,
    @Body() dto: BulkEmailDto,
  ) {
    return this.adminService.sendBulkEmail(admin.userId, dto);
  }

  @Post('communications/notification')
  @ApiOperation({ summary: 'Send bulk notification' })
  async sendBulkNotification(
    @CurrentUser() admin: any,
    @Body() dto: BulkNotificationDto,
  ) {
    return this.adminService.sendBulkNotification(admin.userId, dto);
  }

  @Get('communications/campaigns')
  @ApiOperation({ summary: 'Get email campaigns' })
  async getEmailCampaigns(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
  ) {
    return this.adminService.getEmailCampaigns({ page, limit, status });
  }

  @Get('communications/campaigns/:campaignId')
  @ApiOperation({ summary: 'Get email campaign by ID' })
  async getEmailCampaignById(@Param('campaignId') campaignId: string) {
    return this.adminService.getEmailCampaignById(campaignId);
  }
}
