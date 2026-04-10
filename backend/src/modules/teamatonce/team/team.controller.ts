import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TeamMembersService } from './team-members.service';
import { TeamAssignmentService } from './team-assignment.service';
import { MemberStatusService } from './member-status.service';
import {
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
  TeamMemberFilterDto,
} from './dto/team-member.dto';
import {
  AssignTeamMemberDto,
  UpdateTeamAssignmentDto,
} from './dto/team-assignment.dto';
import {
  UpdateMemberStatusDto,
  OnlineStatus,
  BulkStatusUpdateDto,
} from './dto/member-status.dto';

@ApiTags('Team Management')
@Controller('teamatonce/team')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamController {
  constructor(
    private readonly teamMembersService: TeamMembersService,
    private readonly teamAssignmentService: TeamAssignmentService,
    private readonly memberStatusService: MemberStatusService,
  ) {}

  // ============================================
  // TEAM MEMBERS ENDPOINTS
  // ============================================

  @Get('members')
  @ApiOperation({
    summary: 'Get all team members',
    description: 'Browse available developers in the marketplace with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'List of team members retrieved successfully',
  })
  @ApiQuery({ type: TeamMemberFilterDto, required: false })
  async getAllTeamMembers(@Query() filters: TeamMemberFilterDto) {
    return this.teamMembersService.getAllTeamMembers(filters);
  }

  @Get('members/available')
  @ApiOperation({
    summary: 'Get available team members',
    description: 'Get all developers currently available for hire',
  })
  @ApiResponse({
    status: 200,
    description: 'Available team members retrieved successfully',
  })
  async getAvailableTeamMembers() {
    return this.teamMembersService.getAvailableTeamMembers();
  }

  @Get('members/search')
  @ApiOperation({
    summary: 'Search team members',
    description: 'Search developers by name, role, or bio',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search term',
    example: 'React developer',
  })
  async searchTeamMembers(@Query('q') searchTerm: string) {
    return this.teamMembersService.searchTeamMembers(searchTerm);
  }

  @Get('members/by-skill/:skill')
  @ApiOperation({
    summary: 'Filter team members by skill',
    description: 'Find developers with a specific skill (e.g., React, Node.js)',
  })
  @ApiResponse({
    status: 200,
    description: 'Team members with the specified skill retrieved successfully',
  })
  @ApiParam({
    name: 'skill',
    required: true,
    type: String,
    description: 'Skill name',
    example: 'React',
  })
  async filterTeamMembersBySkill(@Param('skill') skill: string) {
    return this.teamMembersService.filterTeamMembersBySkill(skill);
  }

  @Get('members/:id')
  @ApiOperation({
    summary: 'Get team member by ID',
    description: 'Get developer profile with skills, portfolio, and current projects',
  })
  @ApiResponse({
    status: 200,
    description: 'Team member retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Team member not found',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Team member UUID',
  })
  async getTeamMemberById(@Param('id') id: string) {
    return this.teamMembersService.getTeamMemberById(id);
  }

  @Post('members')
  @ApiOperation({
    summary: 'Create team member',
    description: 'Onboard a new developer to the platform',
  })
  @ApiResponse({
    status: 201,
    description: 'Team member created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Team member with this user_id already exists',
  })
  @HttpCode(HttpStatus.CREATED)
  async createTeamMember(@Body() data: CreateTeamMemberDto) {
    return this.teamMembersService.createTeamMember(data);
  }

  @Put('members/:id')
  @ApiOperation({
    summary: 'Update team member',
    description: 'Update developer profile, skills, rates, or availability',
  })
  @ApiResponse({
    status: 200,
    description: 'Team member updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Team member not found',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Team member UUID',
  })
  async updateTeamMember(
    @Param('id') id: string,
    @Body() data: UpdateTeamMemberDto,
  ) {
    return this.teamMembersService.updateTeamMember(id, data);
  }

  @Delete('members/:id')
  @ApiOperation({
    summary: 'Delete team member',
    description: 'Soft delete a team member (sets is_active = false)',
  })
  @ApiResponse({
    status: 200,
    description: 'Team member deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Team member not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete - team member has active assignments',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Team member UUID',
  })
  async deleteTeamMember(@Param('id') id: string) {
    return this.teamMembersService.deleteTeamMember(id);
  }

  // ============================================
  // TEAM ASSIGNMENTS ENDPOINTS
  // ============================================

  @Get('assignments/project/:projectId')
  @ApiOperation({
    summary: 'Get project team',
    description: 'Get all developers assigned to a specific project',
  })
  @ApiResponse({
    status: 200,
    description: 'Project team retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  @ApiParam({
    name: 'projectId',
    required: true,
    type: String,
    description: 'Project UUID',
  })
  async getProjectTeam(@Param('projectId') projectId: string) {
    return this.teamAssignmentService.getProjectTeam(projectId);
  }

  @Get('assignments/member/:teamMemberId')
  @ApiOperation({
    summary: 'Get team member assignments',
    description: 'Get all project assignments for a specific team member',
  })
  @ApiResponse({
    status: 200,
    description: 'Team member assignments retrieved successfully',
  })
  @ApiParam({
    name: 'teamMemberId',
    required: true,
    type: String,
    description: 'Team member UUID',
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Filter active assignments only',
    example: true,
  })
  async getTeamMemberAssignments(
    @Param('teamMemberId') teamMemberId: string,
    @Query('activeOnly') activeOnly?: boolean,
  ) {
    return this.teamAssignmentService.getTeamMemberAssignments(
      teamMemberId,
      activeOnly !== false, // Default to true
    );
  }

  @Post('assignments/project/:projectId')
  @ApiOperation({
    summary: 'Assign team member to project',
    description: 'Assign a developer to a client project with role, allocation, and hourly rate',
  })
  @ApiResponse({
    status: 201,
    description: 'Team member assigned successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Project or team member not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Team member already assigned to this project',
  })
  @ApiParam({
    name: 'projectId',
    required: true,
    type: String,
    description: 'Project UUID',
  })
  @HttpCode(HttpStatus.CREATED)
  async assignTeamMember(
    @Param('projectId') projectId: string,
    @Body() data: AssignTeamMemberDto,
  ) {
    return this.teamAssignmentService.assignTeamMember(projectId, data);
  }

  @Put('assignments/:assignmentId')
  @ApiOperation({
    summary: 'Update assignment',
    description: 'Update project role, allocation percentage, or other assignment details',
  })
  @ApiResponse({
    status: 200,
    description: 'Assignment updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Assignment not found',
  })
  @ApiParam({
    name: 'assignmentId',
    required: true,
    type: String,
    description: 'Assignment UUID',
  })
  async updateAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body() data: UpdateTeamAssignmentDto,
  ) {
    return this.teamAssignmentService.updateAssignment(assignmentId, data);
  }

  @Delete('assignments/:assignmentId')
  @ApiOperation({
    summary: 'Remove team member from project',
    description: 'Remove a developer from a project (soft delete)',
  })
  @ApiResponse({
    status: 200,
    description: 'Team member removed from project successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Assignment not found',
  })
  @ApiParam({
    name: 'assignmentId',
    required: true,
    type: String,
    description: 'Assignment UUID',
  })
  async removeTeamMember(@Param('assignmentId') assignmentId: string) {
    return this.teamAssignmentService.removeTeamMember(assignmentId);
  }

  // ============================================
  // MEMBER STATUS ENDPOINTS
  // ============================================

  @Get('status/online')
  @ApiOperation({
    summary: 'Get all online members',
    description: 'Get all developers currently online across all projects',
  })
  @ApiResponse({
    status: 200,
    description: 'Online members retrieved successfully',
  })
  async getAllOnlineMembers() {
    return this.memberStatusService.getAllOnlineMembers();
  }

  @Get('status/member/:memberId')
  @ApiOperation({
    summary: 'Get member status',
    description: 'Check if a specific developer is online',
  })
  @ApiResponse({
    status: 200,
    description: 'Member status retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Team member not found',
  })
  @ApiParam({
    name: 'memberId',
    required: true,
    type: String,
    description: 'Team member UUID',
  })
  async getMemberStatus(@Param('memberId') memberId: string) {
    return this.memberStatusService.getMemberStatus(memberId);
  }

  @Get('status/project/:projectId')
  @ApiOperation({
    summary: 'Get project team status',
    description: 'Get online status of all team members assigned to a project',
  })
  @ApiResponse({
    status: 200,
    description: 'Project team status retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  @ApiParam({
    name: 'projectId',
    required: true,
    type: String,
    description: 'Project UUID',
  })
  async getProjectTeamStatus(@Param('projectId') projectId: string) {
    return this.memberStatusService.getProjectTeamStatus(projectId);
  }

  @Post('status/update')
  @ApiOperation({
    summary: 'Update member status',
    description: 'Update online/offline status of a team member (broadcasts via WebSocket)',
  })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Team member not found',
  })
  async updateMemberStatus(@Body() data: UpdateMemberStatusDto) {
    return this.memberStatusService.updateMemberStatus(
      data.member_id,
      data.status,
      data.device_info,
    );
  }

  @Post('status/bulk-update')
  @ApiOperation({
    summary: 'Bulk update member statuses',
    description: 'Update statuses for multiple team members at once (for reconnection scenarios)',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk status update completed',
  })
  async bulkUpdateStatuses(@Body() data: BulkStatusUpdateDto) {
    return this.memberStatusService.bulkUpdateStatuses(data.updates);
  }
}
