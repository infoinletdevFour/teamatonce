import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { InstructorsService } from './instructors.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { InstructorQueryDto } from './dto/instructor-query.dto';
import { InstructorProfileDto, PaginatedInstructorsDto } from './dto/instructor-response.dto';
import { InstructorDashboardStatsDto } from './dto/dashboard-stats.dto';
import { CreateInstructorApplicationDto, InstructorApplicationResponseDto, ReviewInstructorApplicationDto } from './dto/instructor-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Instructors')
@Controller('instructors')
export class InstructorsController {
  constructor(private readonly instructorsService: InstructorsService) {}

  // ==========================================
  // PUBLIC ENDPOINTS
  // ==========================================

  @Get()
  @ApiOperation({ summary: 'Get all instructors (public)' })
  @ApiResponse({ status: 200, description: 'Instructors retrieved successfully', type: PaginatedInstructorsDto })
  async listInstructors(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: InstructorQueryDto,
  ): Promise<PaginatedInstructorsDto> {
    return this.instructorsService.listInstructors(query);
  }

  // ==========================================
  // PROTECTED ENDPOINTS - AUTHENTICATED USERS
  // ==========================================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create instructor profile' })
  @ApiResponse({ status: 201, description: 'Instructor profile created successfully', type: InstructorProfileDto })
  @ApiResponse({ status: 400, description: 'Bad request - profile already exists or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createInstructorProfile(
    @Request() req: any,
    @Body() dto: CreateInstructorDto,
  ): Promise<InstructorProfileDto> {
    const userId = req.user.sub || req.user.userId;
    return this.instructorsService.createInstructorProfile(userId, dto);
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own instructor profile' })
  @ApiResponse({ status: 200, description: 'Instructor profile retrieved successfully', type: InstructorProfileDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Instructor profile not found' })
  async getOwnProfile(@Request() req: any): Promise<InstructorProfileDto> {
    const userId = req.user.sub || req.user.userId;
    return this.instructorsService.getInstructorByUserId(userId);
  }

  @Put('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own instructor profile' })
  @ApiResponse({ status: 200, description: 'Instructor profile updated successfully', type: InstructorProfileDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Instructor profile not found' })
  async updateOwnProfile(
    @Request() req: any,
    @Body() dto: UpdateInstructorDto,
  ): Promise<InstructorProfileDto> {
    const userId = req.user.sub || req.user.userId;
    return this.instructorsService.updateInstructorProfile(userId, dto);
  }

  // ==========================================
  // INSTRUCTOR DASHBOARD
  // ==========================================

  @Get('dashboard/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get instructor dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully', type: InstructorDashboardStatsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - instructor role required' })
  @ApiResponse({ status: 404, description: 'Instructor profile not found' })
  async getDashboardStats(@Request() req: any): Promise<InstructorDashboardStatsDto> {
    const userId = req.user.sub || req.user.userId;
    return this.instructorsService.getDashboardStats(userId);
  }

  // ==========================================
  // INSTRUCTOR ANALYTICS (To be implemented)
  // ==========================================

  @Get('analytics/students')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get student analytics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'courseId', required: false, description: 'Filter by course ID' })
  @ApiResponse({ status: 200, description: 'Student analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - instructor role required' })
  async getStudentAnalytics(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('courseId') courseId?: string,
  ): Promise<any> {
    // TODO: Implement student analytics
    return {
      message: 'Student analytics endpoint - to be implemented',
      params: { startDate, endDate, courseId },
    };
  }

  @Get('analytics/revenue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'courseId', required: false, description: 'Filter by course ID' })
  @ApiResponse({ status: 200, description: 'Revenue analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - instructor role required' })
  async getRevenueAnalytics(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('courseId') courseId?: string,
  ): Promise<any> {
    // TODO: Implement revenue analytics
    return {
      message: 'Revenue analytics endpoint - to be implemented',
      params: { startDate, endDate, courseId },
    };
  }

  @Get('analytics/performance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get course performance analytics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Performance analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - instructor role required' })
  async getPerformanceAnalytics(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    // TODO: Implement performance analytics
    return {
      message: 'Performance analytics endpoint - to be implemented',
      params: { startDate, endDate },
    };
  }

  // ==========================================
  // INSTRUCTOR EARNINGS
  // ==========================================

  @Get('earnings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get earnings history' })
  @ApiResponse({ status: 200, description: 'Earnings history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - instructor role required' })
  async getEarnings(@Request() req: any): Promise<any> {
    const userId = req.user.sub || req.user.userId;
    return this.instructorsService.getEarnings(userId);
  }

  @Get('earnings/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending payouts' })
  @ApiResponse({ status: 200, description: 'Pending payouts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - instructor role required' })
  async getPendingPayouts(@Request() req: any): Promise<any> {
    const userId = req.user.sub || req.user.userId;
    return this.instructorsService.getPendingPayouts(userId);
  }

  @Post('earnings/withdraw')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request withdrawal' })
  @ApiResponse({ status: 201, description: 'Withdrawal request created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - insufficient balance or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - instructor role required' })
  async requestWithdrawal(
    @Request() req: any,
    @Body() withdrawalData: any,
  ): Promise<any> {
    const userId = req.user.sub || req.user.userId;
    return this.instructorsService.requestWithdrawal(userId, withdrawalData);
  }

  @Get('earnings/payouts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payout history' })
  @ApiResponse({ status: 200, description: 'Payout history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - instructor role required' })
  async getPayoutHistory(@Request() req: any): Promise<any> {
    const userId = req.user.sub || req.user.userId;
    return this.instructorsService.getPayoutHistory(userId);
  }

  // ==========================================
  // VERIFICATION (To be implemented)
  // ==========================================

  @Post('me/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor', 'admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request instructor verification' })
  @ApiResponse({ status: 200, description: 'Verification request submitted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - instructor role required' })
  async requestVerification(
    @Request() req: any,
    @Body() verificationData: any,
  ): Promise<any> {
    // TODO: Implement verification request
    return {
      message: 'Verification request endpoint - to be implemented',
      data: verificationData,
    };
  }

  // ==========================================
  // INSTRUCTOR APPLICATION WORKFLOW
  // ==========================================

  @Post('applications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit instructor application (Become Instructor)' })
  @ApiResponse({ status: 201, description: 'Application submitted successfully', type: InstructorApplicationResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation error or duplicate application' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitApplication(
    @Request() req: any,
    @Body() dto: CreateInstructorApplicationDto,
  ): Promise<InstructorApplicationResponseDto> {
    const userId = req.user.sub || req.user.userId;
    return this.instructorsService.submitInstructorApplication(userId, dto);
  }

  @Get('applications/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my instructor application status' })
  @ApiResponse({ status: 200, description: 'Application status retrieved successfully', type: InstructorApplicationResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No application found' })
  async getMyApplication(@Request() req: any): Promise<InstructorApplicationResponseDto> {
    const userId = req.user.sub || req.user.userId;
    return this.instructorsService.getMyApplication(userId);
  }

  @Get('applications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all instructor applications (Admin only)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'Applications retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async getAllApplications(@Query('status') status?: string): Promise<any[]> {
    return this.instructorsService.getAllApplications(status);
  }

  @Put('applications/:applicationId/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Review instructor application (Admin only)' })
  @ApiParam({ name: 'applicationId', description: 'Application ID' })
  @ApiResponse({ status: 200, description: 'Application reviewed successfully', type: InstructorApplicationResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - already reviewed or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async reviewApplication(
    @Request() req: any,
    @Param('applicationId') applicationId: string,
    @Body() dto: ReviewInstructorApplicationDto,
  ): Promise<InstructorApplicationResponseDto> {
    const adminUserId = req.user.sub || req.user.userId;
    return this.instructorsService.reviewInstructorApplication(applicationId, adminUserId, dto);
  }

  // ==========================================
  // PUBLIC WILDCARD ROUTE (MUST BE LAST)
  // ==========================================

  @Get(':id')
  @ApiOperation({ summary: 'Get instructor profile by ID (public)' })
  @ApiParam({ name: 'id', description: 'Instructor ID' })
  @ApiResponse({ status: 200, description: 'Instructor profile retrieved successfully', type: InstructorProfileDto })
  @ApiResponse({ status: 404, description: 'Instructor not found' })
  async getInstructorProfile(@Param('id') id: string): Promise<InstructorProfileDto> {
    return this.instructorsService.getInstructorProfile(id);
  }
}
