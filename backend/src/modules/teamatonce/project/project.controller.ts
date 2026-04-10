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
  Req,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ProjectService } from './project.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  CreateMilestoneDto,
  ApproveMilestoneDto,
  SubmitMilestoneDto,
  RequestMilestoneFeedbackDto,
  CreateTaskDto,
  UpdateTaskDto,
  MilestoneStatus,
  TaskStatus,
  TasksListResponseDto,
  ProjectStatsResponseDto,
  MilestonesResponseDto,
} from './dto/project.dto';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('client')
  @ApiOperation({ summary: 'Create a new project (clients only)' })
  async createProject(@Req() req, @Body() dto: CreateProjectDto) {
    const userId = req.user.sub || req.user.userId;
    return this.projectService.createProject(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects for current user (owned and member projects)' })
  async getProjects(@Req() req) {
    const userId = req.user.sub || req.user.userId;
    return this.projectService.getUserProjects(userId);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get all projects for a company' })
  async getCompanyProjects(@Param('companyId') companyId: string) {
    return this.projectService.getCompanyProjects(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  async getProject(@Param('id') id: string) {
    return this.projectService.getProject(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get project members with their details' })
  @ApiResponse({ status: 200, description: 'Returns list of project members with user info' })
  async getProjectMembers(@Param('id') id: string) {
    return this.projectService.getProjectMembers(id);
  }

  @Get(':id/access')
  @ApiOperation({ summary: 'Check if current user has access to the project' })
  @ApiResponse({
    status: 200,
    description: 'Returns user access status and role in the project',
    schema: {
      type: 'object',
      properties: {
        hasAccess: { type: 'boolean', description: 'Whether user has access to the project' },
        role: { type: 'string', enum: ['owner', 'admin', 'developer', 'viewer', 'client'], nullable: true },
        memberType: { type: 'string', enum: ['client', 'developer'], nullable: true },
        permissions: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async checkProjectAccess(@Req() req, @Param('id') projectId: string) {
    const userId = req.user.sub || req.user.userId;
    return this.projectService.checkProjectAccess(projectId, userId);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member from a project' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({ status: 404, description: 'Project or member not found' })
  async removeProjectMember(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.projectService.removeProjectMember(projectId, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update project (planning stage only for clients)' })
  async updateProject(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Query('enforceplanningOnly') enforceplanningOnly?: string
  ) {
    // Convert string query param to boolean
    const enforce = enforceplanningOnly === 'true';
    return this.projectService.updateProject(id, dto, enforce);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project (planning stage only for clients)' })
  async deleteProject(
    @Req() req,
    @Param('id') id: string,
    @Query('enforceplanningOnly') enforceplanningOnly?: string
  ) {
    // Convert string query param to boolean
    const enforce = enforceplanningOnly === 'true';
    return this.projectService.deleteProject(id, enforce);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get real-time project statistics calculated from database' })
  @ApiResponse({
    status: 200,
    description: 'Project statistics calculated from actual database data',
    type: ProjectStatsResponseDto
  })
  async getProjectStats(@Param('id') id: string): Promise<ProjectStatsResponseDto> {
    return this.projectService.getProjectStats(id);
  }

  @Put(':id/assign-team')
  @ApiOperation({ summary: 'Assign team to project' })
  async assignTeam(
    @Param('id') id: string,
    @Body() body: { teamMemberIds: string[]; teamLeadId?: string; projectRole?: string }
  ) {
    return this.projectService.assignTeam(id, body.teamMemberIds, body.teamLeadId, body.projectRole);
  }

  @Get(':id/team')
  @ApiOperation({
    summary: 'Get project team members',
    description: 'Fetches all team members assigned to this project from the database with complete member details'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved project team members',
    schema: {
      type: 'object',
      properties: {
        members: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              userId: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              role: {
                type: 'string',
                enum: ['project_manager', 'developer', 'designer', 'qa', 'client']
              },
              avatar: { type: 'string' },
              skills: { type: 'array', items: { type: 'string' } },
              joinedAt: { type: 'string', format: 'date-time' },
              status: { type: 'string', enum: ['active', 'inactive'] },
              availability: { type: 'string' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  async getProjectTeamMembers(@Param('id') projectId: string) {
    return this.projectService.getProjectTeamMembers(projectId);
  }

  // MILESTONES
  @Post(':id/milestones')
  @ApiOperation({ summary: 'Create milestone' })
  async createMilestone(@Req() req, @Param('id') projectId: string, @Body() dto: CreateMilestoneDto) {
    const userId = req.user.sub || req.user.userId;

    // Check if project is rejected
    await this.projectService.validateProjectNotRejected(projectId);

    // Both clients and developers can create milestones
    const isTeamMember = await this.projectService.isProjectTeamMember(userId, projectId);
    if (!isTeamMember) {
      throw new ForbiddenException('Only project team members can create milestones');
    }

    return this.projectService.createMilestone(projectId, dto, userId);
  }

  @Get(':id/milestones')
  @ApiOperation({
    summary: 'Get project milestones with progress tracking',
    description: 'Fetches all milestones for a project from the database with calculated progress based on task completion'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved project milestones',
    type: MilestonesResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  async getMilestones(@Param('id') projectId: string): Promise<MilestonesResponseDto> {
    return this.projectService.getProjectMilestones(projectId);
  }

  @Get('milestones/:milestoneId')
  @ApiOperation({ summary: 'Get milestone by ID' })
  async getMilestone(@Param('milestoneId') milestoneId: string) {
    return this.projectService.getMilestone(milestoneId);
  }

  @Put('milestones/:milestoneId')
  @ApiOperation({ summary: 'Update milestone' })
  async updateMilestone(
    @Req() req,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: CreateMilestoneDto
  ) {
    const userId = req.user.sub || req.user.userId;

    // Get project ID from milestone
    const projectId = await this.projectService.getProjectIdFromMilestone(milestoneId);

    // Check if project is rejected
    await this.projectService.validateProjectNotRejected(projectId);

    // Both clients and developers can edit milestones
    const isTeamMember = await this.projectService.isProjectTeamMember(userId, projectId);
    if (!isTeamMember) {
      throw new ForbiddenException('Only project team members can edit milestones');
    }

    return this.projectService.updateMilestone(milestoneId, dto, userId);
  }

  @Put('milestones/:milestoneId/status')
  @ApiOperation({ summary: 'Update milestone status' })
  async updateMilestoneStatus(
    @Req() req,
    @Param('milestoneId') milestoneId: string,
    @Body() body: { status: MilestoneStatus }
  ) {
    const userId = req.user.sub || req.user.userId;

    const projectId = await this.projectService.getProjectIdFromMilestone(milestoneId);

    // Check if project is rejected
    await this.projectService.validateProjectNotRejected(projectId);

    const isTeamMember = await this.projectService.isProjectTeamMember(userId, projectId);

    if (!isTeamMember) {
      throw new ForbiddenException('Only team members can update milestone status');
    }

    return this.projectService.updateMilestoneStatus(milestoneId, body.status);
  }

  @Put('milestones/:milestoneId/approve')
  @ApiOperation({ summary: 'Approve milestone' })
  async approveMilestone(
    @Req() req,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: ApproveMilestoneDto
  ) {
    const userId = req.user.sub || req.user.userId;

    const projectId = await this.projectService.getProjectIdFromMilestone(milestoneId);

    // Check if project is rejected
    await this.projectService.validateProjectNotRejected(projectId);

    const isClient = await this.projectService.isProjectClient(userId, projectId);

    if (!isClient) {
      throw new ForbiddenException('Only project owner can approve milestones');
    }

    return this.projectService.approveMilestone(milestoneId, userId, dto);
  }

  @Put('milestones/:milestoneId/submit')
  @ApiOperation({ summary: 'Submit milestone for client review (Developer only) - Accepts in_progress or feedback_required status' })
  async submitMilestone(
    @Req() req,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: SubmitMilestoneDto
  ) {
    const userId = req.user.sub || req.user.userId;

    // Get project ID and validate not rejected
    const projectId = await this.projectService.getProjectIdFromMilestone(milestoneId);
    await this.projectService.validateProjectNotRejected(projectId);

    return this.projectService.submitMilestone(milestoneId, userId, dto);
  }

  @Post(':id/milestones/:milestoneId/deliverables/upload')
  @ApiOperation({ summary: 'Submit milestone with file upload for client review (Developer only) - Accepts in_progress or feedback_required status' })
  @UseInterceptors(FileInterceptor('file'))
  async submitMilestoneWithFile(
    @Req() req,
    @Param('id') projectId: string,
    @Param('milestoneId') milestoneId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any
  ) {
    const userId = req.user.sub || req.user.userId;

    // Check if project is rejected
    await this.projectService.validateProjectNotRejected(projectId);

    return this.projectService.submitMilestoneWithFile(projectId, milestoneId, userId, { ...body, file });
  }

  @Put('milestones/:milestoneId/request-feedback')
  @ApiOperation({ summary: 'Request changes on milestone (Client only)' })
  async requestMilestoneFeedback(
    @Req() req,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: RequestMilestoneFeedbackDto
  ) {
    const userId = req.user.sub || req.user.userId;

    // Get project ID and validate not rejected
    const projectId = await this.projectService.getProjectIdFromMilestone(milestoneId);
    await this.projectService.validateProjectNotRejected(projectId);

    return this.projectService.requestMilestoneFeedback(milestoneId, userId, dto);
  }

  @Put('milestones/:milestoneId/payment')
  @ApiOperation({ summary: 'Update milestone payment status' })
  async updateMilestonePayment(
    @Param('milestoneId') milestoneId: string,
    @Body() body: { paymentStatus: string; paymentDate?: string }
  ) {
    // Get project ID and validate not rejected
    const projectId = await this.projectService.getProjectIdFromMilestone(milestoneId);
    await this.projectService.validateProjectNotRejected(projectId);

    return this.projectService.updateMilestonePayment(
      milestoneId,
      body.paymentStatus,
      body.paymentDate
    );
  }

  @Delete('milestones/:milestoneId')
  @ApiOperation({ summary: 'Delete milestone' })
  async deleteMilestone(@Req() req, @Param('milestoneId') milestoneId: string) {
    const userId = req.user.sub || req.user.userId;

    const projectId = await this.projectService.getProjectIdFromMilestone(milestoneId);

    // Check if project is rejected
    await this.projectService.validateProjectNotRejected(projectId);

    // Both clients and developers can delete milestones
    const isTeamMember = await this.projectService.isProjectTeamMember(userId, projectId);
    if (!isTeamMember) {
      throw new ForbiddenException('Only project team members can delete milestones');
    }

    return this.projectService.deleteMilestone(milestoneId, userId);
  }

  // TASKS
  @Post(':id/tasks')
  @ApiOperation({ summary: 'Create task' })
  async createTask(
    @Req() req,
    @Param('id') projectId: string,
    @Query('milestoneId') milestoneId: string,
    @Body() dto: CreateTaskDto
  ) {
    const userId = req.user.sub || req.user.userId;

    // Check if project is rejected
    await this.projectService.validateProjectNotRejected(projectId);

    return this.projectService.createTask(projectId, milestoneId || null, dto, userId);
  }

  @Get(':id/tasks')
  @ApiOperation({ summary: 'Get project tasks with enriched assignee data' })
  async getTasks(@Param('id') projectId: string): Promise<TasksListResponseDto> {
    return this.projectService.getProjectTasksEnriched(projectId);
  }

  @Get(':id/milestones/:milestoneId/tasks')
  @ApiOperation({ summary: 'Get tasks for a specific milestone' })
  async getMilestoneTasks(
    @Param('id') projectId: string,
    @Param('milestoneId') milestoneId: string
  ) {
    const tasks = await this.projectService.getProjectTasks(projectId, { milestoneId });
    return tasks;
  }

  @Get(':id/tasks/filtered')
  @ApiOperation({ summary: 'Get project tasks with filters (raw)' })
  async getTasksFiltered(
    @Param('id') projectId: string,
    @Query('milestoneId') milestoneId?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: string
  ) {
    return this.projectService.getProjectTasks(projectId, {
      milestoneId,
      assignedTo,
      status,
      priority,
    });
  }

  @Get('tasks/:taskId')
  @ApiOperation({ summary: 'Get task by ID' })
  async getTask(@Param('taskId') taskId: string) {
    return this.projectService.getTask(taskId);
  }

  @Put('tasks/:taskId')
  @ApiOperation({ summary: 'Update task' })
  async updateTask(@Req() req, @Param('taskId') taskId: string, @Body() dto: UpdateTaskDto) {
    const userId = req.user.sub || req.user.userId;

    // Get task to find project ID
    const task = await this.projectService.getTask(taskId);

    // Check if project is rejected
    await this.projectService.validateProjectNotRejected(task.project_id);

    // Check if user is a team member
    const isTeamMember = await this.projectService.isProjectTeamMember(userId, task.project_id);
    if (!isTeamMember) {
      throw new ForbiddenException('Only team members can update tasks');
    }

    return this.projectService.updateTask(taskId, dto, userId);
  }

  @Put(':id/tasks/:taskId')
  @ApiOperation({ summary: 'Update task with project context' })
  async updateTaskWithProject(
    @Req() req,
    @Param('id') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto
  ) {
    const userId = req.user.sub || req.user.userId;

    // Check if project is rejected
    await this.projectService.validateProjectNotRejected(projectId);

    // Check if user is a team member
    const isTeamMember = await this.projectService.isProjectTeamMember(userId, projectId);
    if (!isTeamMember) {
      throw new ForbiddenException('Only team members can update tasks');
    }

    return this.projectService.updateTask(taskId, dto, userId);
  }

  @Put(':id/tasks/:taskId/status')
  @ApiOperation({ summary: 'Update task status (for drag and drop)' })
  async updateTaskStatus(
    @Req() req,
    @Param('id') projectId: string,
    @Param('taskId') taskId: string,
    @Body() body: { status: TaskStatus }
  ) {
    const userId = req.user.sub || req.user.userId;

    // Check if project is rejected
    await this.projectService.validateProjectNotRejected(projectId);

    // Check if user is a team member
    const isTeamMember = await this.projectService.isProjectTeamMember(userId, projectId);
    if (!isTeamMember) {
      throw new ForbiddenException('Only team members can update task status');
    }

    return this.projectService.updateTask(taskId, { status: body.status }, userId);
  }

  @Delete('tasks/:taskId')
  @ApiOperation({ summary: 'Delete task' })
  async deleteTask(@Req() req, @Param('taskId') taskId: string) {
    const userId = req.user.sub || req.user.userId;

    // Get task to find project ID
    const task = await this.projectService.getTask(taskId);

    // Check if project is rejected
    await this.projectService.validateProjectNotRejected(task.project_id);

    // Check if user is a team member
    const isTeamMember = await this.projectService.isProjectTeamMember(userId, task.project_id);
    if (!isTeamMember) {
      throw new ForbiddenException('Only team members can delete tasks');
    }

    return this.projectService.deleteTask(taskId, userId);
  }

  @Delete(':id/tasks/:taskId')
  @ApiOperation({ summary: 'Delete task with project context' })
  async deleteTaskWithProject(
    @Req() req,
    @Param('id') projectId: string,
    @Param('taskId') taskId: string
  ) {
    const userId = req.user.sub || req.user.userId;

    // Check if project is rejected
    await this.projectService.validateProjectNotRejected(projectId);

    // Check if user is a team member
    const isTeamMember = await this.projectService.isProjectTeamMember(userId, projectId);
    if (!isTeamMember) {
      throw new ForbiddenException('Only team members can delete tasks');
    }

    return this.projectService.deleteTask(taskId, userId);
  }

  @Put('tasks/:taskId/assign')
  @ApiOperation({ summary: 'Assign task to team member' })
  async assignTask(
    @Req() req,
    @Param('taskId') taskId: string,
    @Body() body: { assignedTo: string }
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.projectService.assignTask(taskId, body.assignedTo, userId);
  }

  // PROJECT COMPLETION & FEEDBACK
  @Put(':id/end')
  @ApiOperation({ summary: 'End/Complete a project' })
  @ApiResponse({ status: 200, description: 'Project ended successfully' })
  async endProject(@Req() req, @Param('id') projectId: string) {
    const userId = req.user.sub || req.user.userId;
    return this.projectService.endProject(projectId, userId);
  }

  @Post(':id/feedback')
  @ApiOperation({ summary: 'Submit feedback for a completed project' })
  @ApiResponse({ status: 201, description: 'Feedback submitted successfully' })
  async submitProjectFeedback(
    @Req() req,
    @Param('id') projectId: string,
    @Body() body: {
      rating: number;
      title?: string;
      content: string;
      positiveAspects?: string[];
      areasOfImprovement?: string[];
      isPublic?: boolean;
    }
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.projectService.submitProjectFeedback(projectId, userId, body);
  }

  @Get(':id/feedback')
  @ApiOperation({ summary: 'Get all feedback for a project' })
  @ApiResponse({ status: 200, description: 'Returns project feedback' })
  async getProjectFeedback(@Req() req, @Param('id') projectId: string) {
    const userId = req.user.sub || req.user.userId;
    return this.projectService.getProjectFeedback(projectId, userId);
  }

  @Get(':id/feedback/status')
  @ApiOperation({ summary: 'Check if user has pending feedback to submit' })
  @ApiResponse({ status: 200, description: 'Returns feedback submission status' })
  async getFeedbackStatus(@Req() req, @Param('id') projectId: string) {
    const userId = req.user.sub || req.user.userId;
    return this.projectService.getFeedbackStatus(projectId, userId);
  }

  @Post(':id/fix-awarded-status')
  @ApiOperation({ summary: 'Fix project status to awarded if proposal is accepted but status is still planning' })
  @ApiResponse({ status: 200, description: 'Project status updated' })
  async fixAwardedStatus(@Param('id') projectId: string) {
    return this.projectService.fixAwardedStatus(projectId);
  }

  @Post(':id/request-milestone-plan')
  @ApiOperation({ summary: 'Client requests developer to create milestone plan' })
  @ApiResponse({ status: 200, description: 'Reminder sent successfully' })
  async requestMilestonePlan(@Req() req, @Param('id') projectId: string) {
    const userId = req.user.sub || req.user.userId;
    return this.projectService.sendMilestonePlanReminder(projectId, userId);
  }

  @Get(':id/milestone-plan-request-status')
  @ApiOperation({ summary: 'Get milestone plan request status for a project' })
  @ApiResponse({ status: 200, description: 'Returns request status' })
  async getMilestonePlanRequestStatus(@Req() req, @Param('id') projectId: string) {
    const userId = req.user.sub || req.user.userId;
    return this.projectService.getMilestonePlanRequestStatus(projectId, userId);
  }

  @Post(':id/dismiss-milestone-plan-requests')
  @ApiOperation({ summary: 'Mark milestone plan request notifications as read' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read' })
  async dismissMilestonePlanRequests(@Req() req, @Param('id') projectId: string) {
    const userId = req.user.sub || req.user.userId;
    return this.projectService.dismissMilestonePlanRequests(projectId, userId);
  }
}
