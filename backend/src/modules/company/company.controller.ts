import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyService } from './company.service';
import { CompanyMemberService } from './company-member.service';
import { InvitationService } from './invitation.service';
import { ProjectService } from '../teamatonce/project/project.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  UpdateCompanySettingsDto,
  CompanyResponseDto,
  CompanyStatsDto,
} from './dto/company.dto';
import { UpdateProfileDto } from './dto/profile.dto';
import {
  UpdateMemberDto,
  CompanyMemberResponseDto,
  MemberWorkloadDto,
  TeamWorkloadDto,
} from './dto/company-member.dto';
import {
  CreateInvitationDto,
  InvitationResponseDto,
  AcceptInvitationDto,
} from './dto/invitation.dto';
import { CreateProjectDto } from '../teamatonce/project/dto/project.dto';

@ApiTags('Company Management')
@Controller('company')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly companyMemberService: CompanyMemberService,
    private readonly invitationService: InvitationService,
    private readonly projectService: ProjectService,
  ) {}

  // ============================================
  // COMPANY CRUD ENDPOINTS
  // ============================================

  @Post()
  @ApiOperation({
    summary: 'Create a new company',
    description: 'Create a new company/organization. The authenticated user will become the owner.',
  })
  @ApiResponse({
    status: 201,
    description: 'Company created successfully',
    type: CompanyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @HttpCode(HttpStatus.CREATED)
  async createCompany(
    @Request() req,
    @Body() dto: CreateCompanyDto,
  ): Promise<CompanyResponseDto> {
    const userId = req.user.sub || req.user.userId;
    return this.companyService.createCompany(userId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all companies for current user',
    description: 'Retrieve all companies where the authenticated user is a member (owner, admin, or member)',
  })
  @ApiResponse({
    status: 200,
    description: 'Companies retrieved successfully',
    type: [CompanyResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  async getUserCompanies(@Request() req): Promise<CompanyResponseDto[]> {
    const userId = req.user.sub || req.user.userId;
    return this.companyService.getUserCompanies(userId);
  }

  @Get(':companyId')
  @ApiOperation({
    summary: 'Get company by ID',
    description: 'Retrieve detailed information about a specific company',
  })
  @ApiResponse({
    status: 200,
    description: 'Company retrieved successfully',
    type: CompanyResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a member of this company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company UUID',
  })
  async getCompanyById(
    @Request() req,
    @Param('companyId') companyId: string,
  ): Promise<CompanyResponseDto> {
    const userId = req.user.sub || req.user.userId;
    return this.companyService.getCompanyById(companyId, userId);
  }

  @Put(':companyId')
  @ApiOperation({
    summary: 'Update company',
    description: 'Update company details. Only company owners and admins can update.',
  })
  @ApiResponse({
    status: 200,
    description: 'Company updated successfully',
    type: CompanyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have permission to update this company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company UUID',
  })
  async updateCompany(
    @Request() req,
    @Param('companyId') companyId: string,
    @Body() dto: UpdateCompanyDto,
  ): Promise<CompanyResponseDto> {
    const userId = req.user.sub || req.user.userId;
    return this.companyService.updateCompany(companyId, userId, dto);
  }

  @Delete(':companyId')
  @ApiOperation({
    summary: 'Delete company',
    description: 'Permanently delete a company. Only company owners can delete. This will remove all members and invitations.',
  })
  @ApiResponse({
    status: 200,
    description: 'Company deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only company owners can delete the company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company UUID',
  })
  @HttpCode(HttpStatus.OK)
  async deleteCompany(
    @Request() req,
    @Param('companyId') companyId: string,
  ): Promise<{ message: string }> {
    const userId = req.user.sub || req.user.userId;
    return this.companyService.deleteCompany(companyId, userId);
  }

  // ============================================
  // COMPANY SETTINGS & STATS ENDPOINTS
  // ============================================

  @Put(':companyId/settings')
  @ApiOperation({
    summary: 'Update company settings',
    description: 'Update company settings such as permissions, notifications, and integrations. Only owners and admins can update.',
  })
  @ApiResponse({
    status: 200,
    description: 'Company settings updated successfully',
    type: CompanyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid settings data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have permission to update settings',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company UUID',
  })
  async updateCompanySettings(
    @Request() req,
    @Param('companyId') companyId: string,
    @Body() dto: UpdateCompanySettingsDto,
  ): Promise<CompanyResponseDto> {
    const userId = req.user.sub || req.user.userId;
    return this.companyService.updateCompanySettings(companyId, userId, dto);
  }

  @Get(':companyId/stats')
  @ApiOperation({
    summary: 'Get company statistics',
    description: 'Retrieve company statistics including member count, project count, and activity metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Company statistics retrieved successfully',
    type: CompanyStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a member of this company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company UUID',
  })
  async getCompanyStats(
    @Request() req,
    @Param('companyId') companyId: string,
  ): Promise<any> {
    const userId = req.user.sub || req.user.userId;
    return this.companyService.getCompanyStats(companyId, userId);
  }

  @Get(':companyId/performance-metrics')
  @ApiOperation({
    summary: 'Get company performance metrics',
    description: 'Retrieve performance metrics including on-time delivery, code quality, client satisfaction, and average rating calculated from real project data',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics retrieved successfully',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company UUID',
  })
  async getPerformanceMetrics(
    @Request() req,
    @Param('companyId') companyId: string,
  ): Promise<any> {
    const userId = req.user.sub || req.user.userId;
    return this.companyService.getPerformanceMetrics(companyId, userId);
  }

  @Get(':companyId/activities')
  @ApiOperation({
    summary: 'Get recent company activities',
    description: 'Retrieve recent activities for the company including project updates, milestones, and team activities',
  })
  @ApiResponse({
    status: 200,
    description: 'Company activities retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a member of this company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company UUID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of activities to return (default: 10)',
    example: 10,
  })
  async getCompanyActivities(
    @Request() req,
    @Param('companyId') companyId: string,
    @Query('limit') limit?: number,
  ): Promise<any> {
    const userId = req.user.sub || req.user.userId;
    const activityLimit = limit ? parseInt(String(limit), 10) : 10;
    const activities = await this.companyService.getRecentActivities(companyId, userId, activityLimit);
    return { data: { activities } };
  }

  // ============================================
  // COMPANY MEMBERS ENDPOINTS
  // ============================================

  @Get(':companyId/members')
  @ApiOperation({
    summary: 'Get all company members',
    description: 'Retrieve all members of a company with their roles and permissions',
  })
  @ApiResponse({
    status: 200,
    description: 'Company members retrieved successfully',
    type: [CompanyMemberResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a member of this company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company UUID',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    type: String,
    description: 'Filter by member role (owner, admin, member)',
    example: 'admin',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by member status (active, inactive)',
    example: 'active',
  })
  async getCompanyMembers(
    @Request() req,
    @Param('companyId') companyId: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ): Promise<CompanyMemberResponseDto[]> {
    const userId = req.user.sub || req.user.userId;
    return this.companyMemberService.getCompanyMembers(companyId, userId, {
      role: role as any,
      status: status as any
    });
  }

  @Get(':companyId/members/me')
  @ApiOperation({
    summary: 'Get current user membership',
    description: 'Retrieve the authenticated user\'s membership details for this company',
  })
  @ApiResponse({
    status: 200,
    description: 'User membership retrieved successfully',
    type: CompanyMemberResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a member of this company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company UUID',
  })
  async getCurrentUserMembership(
    @Request() req,
    @Param('companyId') companyId: string,
  ): Promise<CompanyMemberResponseDto> {
    const userId = req.user.sub || req.user.userId;
    return this.companyMemberService.getCurrentUserMembership(companyId, userId);
  }

  @Get(':companyId/members/:memberId')
  @ApiOperation({
    summary: 'Get company member by ID',
    description: 'Retrieve detailed information about a specific company member',
  })
  @ApiResponse({
    status: 200,
    description: 'Company member retrieved successfully',
    type: CompanyMemberResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a member of this company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company or member not found',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company UUID',
  })
  @ApiParam({
    name: 'memberId',
    required: true,
    type: String,
    description: 'Member UUID',
  })
  async getCompanyMember(
    @Request() req,
    @Param('companyId') companyId: string,
    @Param('memberId') memberId: string,
  ): Promise<CompanyMemberResponseDto> {
    const userId = req.user.sub || req.user.userId;
    return this.companyMemberService.getCompanyMember(companyId, memberId);
  }

  @Put(':companyId/members/:memberId')
  @ApiOperation({
    summary: 'Update company member',
    description: 'Update member role, permissions, or status. Only owners and admins can update members.',
  })
  @ApiResponse({
    status: 200,
    description: 'Company member updated successfully',
    type: CompanyMemberResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have permission to update members',
  })
  @ApiResponse({
    status: 404,
    description: 'Company or member not found',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company UUID',
  })
  @ApiParam({
    name: 'memberId',
    required: true,
    type: String,
    description: 'Member UUID',
  })
  async updateMember(
    @Request() req,
    @Param('companyId') companyId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
  ): Promise<CompanyMemberResponseDto> {
    const userId = req.user.sub || req.user.userId;
    return this.companyMemberService.updateMember(companyId, memberId, userId, dto);
  }

  @Delete(':companyId/members/:memberId')
  @ApiOperation({
    summary: 'Remove member from company',
    description: 'Remove a member from the company. Only owners and admins can remove members. Owners cannot be removed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Member removed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have permission to remove members or attempting to remove owner',
  })
  @ApiResponse({
    status: 404,
    description: 'Company or member not found',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company UUID',
  })
  @ApiParam({
    name: 'memberId',
    required: true,
    type: String,
    description: 'Member UUID',
  })
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @Request() req,
    @Param('companyId') companyId: string,
    @Param('memberId') memberId: string,
  ): Promise<{ message: string }> {
    const userId = req.user.sub || req.user.userId;
    return this.companyMemberService.removeMember(companyId, memberId, userId);
  }

  // ============================================
  // WORKLOAD MANAGEMENT ENDPOINTS
  // ============================================

  @Get(':companyId/members/:memberId/workload')
  @ApiOperation({
    summary: 'Get member workload',
    description: 'Retrieve workload information for a specific team member including current projects and capacity',
  })
  @ApiResponse({
    status: 200,
    description: 'Member workload retrieved successfully',
    type: MemberWorkloadDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a member of this company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company or member not found',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company UUID',
  })
  @ApiParam({
    name: 'memberId',
    required: true,
    type: String,
    description: 'Member UUID',
  })
  async getMemberWorkload(
    @Request() req,
    @Param('companyId') companyId: string,
    @Param('memberId') memberId: string,
  ): Promise<any> {
    const userId = req.user.sub || req.user.userId;
    return this.companyMemberService.getMemberWorkload(companyId, memberId);
  }

  @Get(':companyId/workload')
  @ApiOperation({
    summary: 'Get team workload overview',
    description: 'Retrieve workload overview for all team members in the company',
  })
  @ApiResponse({
    status: 200,
    description: 'Team workload retrieved successfully',
    type: TeamWorkloadDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a member of this company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company UUID',
  })
  async getTeamWorkload(
    @Request() req,
    @Param('companyId') companyId: string,
  ): Promise<any> {
    const userId = req.user.sub || req.user.userId;
    return this.companyMemberService.getTeamWorkload(companyId, userId);
  }

  // ============================================
  // PROJECT ENDPOINTS
  // ============================================

  @Get(':companyId/projects')
  @ApiOperation({
    summary: 'Get all projects for a company where user is a member',
    description: 'Retrieve all projects where the user is assigned as a team member in the project_members table under this company',
  })
  @ApiResponse({
    status: 200,
    description: 'Projects retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a member of this company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company UUID',
  })
  async getCompanyProjects(
    @Request() req,
    @Param('companyId') companyId: string,
  ) {
    const userId = req.user.sub || req.user.userId;
    // Verify user is a member of this company
    await this.companyMemberService.verifyMemberAccess(companyId, userId, 'view');
    // Get projects where user is a member (filters by project_members table)
    return this.projectService.getCompanyProjects(companyId, userId);
  }

  @Post(':companyId/projects')
  @ApiOperation({
    summary: 'Create a new project for a company',
    description: 'Create a new project under a specific company',
  })
  @ApiResponse({
    status: 201,
    description: 'Project created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a member of this company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company UUID',
  })
  @HttpCode(HttpStatus.CREATED)
  async createCompanyProject(
    @Request() req,
    @Param('companyId') companyId: string,
    @Body() dto: CreateProjectDto,
  ) {
    const userId = req.user.sub || req.user.userId;
    // Verify user is a member of this company
    await this.companyMemberService.verifyMemberAccess(companyId, userId, 'view');
    // Add companyId to the project data
    const projectData = { ...dto, companyId };
    return this.projectService.createProject(userId, projectData as any);
  }

  // ============================================
  // INVITATION ENDPOINTS (COMPANY-SCOPED)
  // ============================================

  @Post(':companyId/invitations')
  @ApiOperation({
    summary: 'Create invitation',
    description: 'Invite a user to join the company by email. Only owners and admins can send invitations.',
  })
  @ApiResponse({
    status: 201,
    description: 'Invitation created successfully',
    type: InvitationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid email or user already a member',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have permission to invite members',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company UUID',
  })
  @HttpCode(HttpStatus.CREATED)
  async createInvitation(
    @Request() req,
    @Param('companyId') companyId: string,
    @Body() dto: CreateInvitationDto,
  ): Promise<any> {
    const userId = req.user.sub || req.user.userId;
    return this.invitationService.createInvitation(companyId, userId, dto);
  }

  @Get(':companyId/invitations')
  @ApiOperation({
    summary: 'Get company invitations',
    description: 'Retrieve all pending and accepted invitations for the company',
  })
  @ApiResponse({
    status: 200,
    description: 'Company invitations retrieved successfully',
    type: [InvitationResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a member of this company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company UUID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by invitation status (pending, accepted, declined, cancelled)',
    example: 'pending',
  })
  async getCompanyInvitations(
    @Request() req,
    @Param('companyId') companyId: string,
    @Query('status') status?: string,
  ): Promise<any> {
    const userId = req.user.sub || req.user.userId;
    return this.invitationService.getCompanyInvitations(companyId, userId, status);
  }

  @Delete(':companyId/invitations/:invitationId')
  @ApiOperation({
    summary: 'Cancel invitation',
    description: 'Cancel a pending invitation. Only the inviter or company admins/owners can cancel.',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation cancelled successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have permission to cancel this invitation',
  })
  @ApiResponse({
    status: 404,
    description: 'Company or invitation not found',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company UUID',
  })
  @ApiParam({
    name: 'invitationId',
    required: true,
    type: String,
    description: 'Invitation UUID',
  })
  @HttpCode(HttpStatus.OK)
  async cancelInvitation(
    @Request() req,
    @Param('companyId') companyId: string,
    @Param('invitationId') invitationId: string,
  ): Promise<{ message: string }> {
    const userId = req.user.sub || req.user.userId;
    return this.invitationService.cancelInvitation(invitationId, userId);
  }

  @Post(':companyId/invitations/:invitationId/resend')
  @ApiOperation({
    summary: 'Resend invitation',
    description: 'Resend a pending invitation email. Only the inviter or company admins/owners can resend.',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation resent successfully',
    type: InvitationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invitation is not in pending status',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have permission to resend this invitation',
  })
  @ApiResponse({
    status: 404,
    description: 'Company or invitation not found',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company UUID',
  })
  @ApiParam({
    name: 'invitationId',
    required: true,
    type: String,
    description: 'Invitation UUID',
  })
  @HttpCode(HttpStatus.OK)
  async resendInvitation(
    @Request() req,
    @Param('companyId') companyId: string,
    @Param('invitationId') invitationId: string,
  ): Promise<any> {
    const userId = req.user.sub || req.user.userId;
    return this.invitationService.resendInvitation(invitationId, userId);
  }

  // ============================================
  // PUBLIC INVITATION ENDPOINTS (TOKEN-BASED)
  // ============================================

  @Post('invitations/accept/:token')
  @ApiOperation({
    summary: 'Accept invitation',
    description: 'Accept a company invitation using the unique token from the invitation email',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation accepted successfully',
    type: CompanyMemberResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid token or invitation already processed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found',
  })
  @ApiParam({
    name: 'token',
    required: true,
    type: String,
    description: 'Unique invitation token',
  })
  @HttpCode(HttpStatus.OK)
  async acceptInvitation(
    @Request() req,
    @Param('token') token: string,
    @Body() dto: AcceptInvitationDto,
  ): Promise<any> {
    const userId = req.user.sub || req.user.userId;
    return this.invitationService.acceptInvitation(token, userId, dto);
  }

  @Post('invitations/decline/:token')
  @ApiOperation({
    summary: 'Decline invitation',
    description: 'Decline a company invitation using the unique token from the invitation email',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation declined successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid token or invitation already processed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found',
  })
  @ApiParam({
    name: 'token',
    required: true,
    type: String,
    description: 'Unique invitation token',
  })
  @HttpCode(HttpStatus.OK)
  async declineInvitation(
    @Request() req,
    @Param('token') token: string,
  ): Promise<{ message: string }> {
    const userId = req.user.sub || req.user.userId;
    return this.invitationService.declineInvitation(token, userId);
  }

  @Get('invitations/:token')
  @ApiOperation({
    summary: 'Get invitation by token',
    description: 'Retrieve invitation details using the unique token (for displaying invitation preview)',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation retrieved successfully',
    type: InvitationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid token',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found',
  })
  @ApiParam({
    name: 'token',
    required: true,
    type: String,
    description: 'Unique invitation token',
  })
  async getInvitationByToken(
    @Param('token') token: string,
  ): Promise<any> {
    return this.invitationService.getInvitationByToken(token);
  }

  // ============================================
  // PROFESSIONAL PROFILE ENDPOINTS
  // ============================================

  @Get(':companyId/profile')
  @ApiOperation({
    summary: 'Get company professional profile',
    description: 'Get the public-facing seller profile for a company'
  })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company ID'
  })
  async getCompanyProfile(
    @Param('companyId') companyId: string
  ): Promise<any> {
    try {
      const profile = await this.companyService.getCompanyProfile(companyId);
      return { data: profile };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch profile');
    }
  }

  @Put(':companyId/profile')
  @ApiOperation({
    summary: 'Create or update company professional profile',
    description: 'Update the seller profile for a company (creates if doesn\'t exist)'
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to edit this profile' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company ID'
  })
  async updateCompanyProfile(
    @Param('companyId') companyId: string,
    @Body() updateDto: UpdateProfileDto,
    @Request() req
  ): Promise<any> {
    // Verify user has access to this company (owner or admin)
    const userId = req.user.sub || req.user.userId;
    await this.companyService.verifyCompanyAccess(companyId, userId, ['owner', 'admin']);

    try {
      const profile = await this.companyService.updateCompanyProfile(companyId, updateDto);
      return {
        data: profile,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update profile');
    }
  }

  @Post(':companyId/upload-image')
  @ApiOperation({
    summary: 'Upload profile image',
    description: 'Upload cover photo, avatar, or portfolio image for company profile'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        type: {
          type: 'string',
          enum: ['cover', 'avatar', 'portfolio'],
          description: 'Image type'
        }
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or type' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiParam({
    name: 'companyId',
    required: true,
    type: String,
    description: 'Company ID'
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
        // Accept only image files
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    })
  )
  async uploadProfileImage(
    @Param('companyId') companyId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: 'cover' | 'avatar' | 'portfolio',
    @Request() req
  ): Promise<any> {
    // Verify user has access to this company (owner or admin)
    const userId = req.user.sub || req.user.userId;
    await this.companyService.verifyCompanyAccess(companyId, userId, ['owner', 'admin']);

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!type || !['cover', 'avatar', 'portfolio'].includes(type)) {
      throw new BadRequestException('Invalid image type. Must be cover, avatar, or portfolio');
    }

    try {
      const imageUrl = await this.companyService.uploadProfileImage(companyId, file, type);
      return {
        data: { url: imageUrl },
        message: 'Image uploaded successfully'
      };
    } catch (error) {
      console.error('Profile image upload error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message || 'Failed to upload image');
    }
  }
}
