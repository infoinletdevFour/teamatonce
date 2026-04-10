import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MilestonePlanService } from './milestone-plan.service';
import {
  CreateMilestonePlanDto,
  UpdateMilestonePlanDto,
  SubmitMilestonePlanDto,
  ApproveMilestonePlanDto,
  RequestMilestonePlanChangesDto,
  RejectMilestonePlanDto,
  MilestonePlanResponseDto,
} from './dto/milestone-plan.dto';

@ApiTags('milestone-plans')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class MilestonePlanController {
  constructor(private readonly milestonePlanService: MilestonePlanService) {}

  @Post('projects/:projectId/milestone-plans')
  @ApiOperation({ summary: 'Create a new milestone plan (Developer)' })
  @ApiResponse({ status: 201, description: 'Milestone plan created successfully', type: MilestonePlanResponseDto })
  async createMilestonePlan(
    @Req() req,
    @Param('projectId') projectId: string,
    @Body() dto: CreateMilestonePlanDto,
  ): Promise<{ data: MilestonePlanResponseDto; message: string }> {
    const userId = req.user.sub || req.user.userId;

    // Ensure projectId from path matches dto
    dto.projectId = projectId;

    const plan = await this.milestonePlanService.createMilestonePlan(dto, userId);
    return {
      data: plan,
      message: 'Milestone plan created successfully',
    };
  }

  @Put('milestone-plans/:planId')
  @ApiOperation({ summary: 'Update existing milestone plan (Developer)' })
  @ApiResponse({ status: 200, description: 'Milestone plan updated successfully', type: MilestonePlanResponseDto })
  async updateMilestonePlan(
    @Req() req,
    @Param('planId') planId: string,
    @Body() dto: UpdateMilestonePlanDto,
  ): Promise<{ data: MilestonePlanResponseDto; message: string }> {
    const userId = req.user.sub || req.user.userId;
    const plan = await this.milestonePlanService.updateMilestonePlan(planId, dto, userId);
    return {
      data: plan,
      message: 'Milestone plan updated successfully',
    };
  }

  @Post('milestone-plans/:planId/submit')
  @ApiOperation({ summary: 'Submit milestone plan for client review (Developer)' })
  @ApiResponse({ status: 200, description: 'Milestone plan submitted successfully', type: MilestonePlanResponseDto })
  async submitMilestonePlan(
    @Req() req,
    @Param('planId') planId: string,
    @Body() dto: SubmitMilestonePlanDto,
  ): Promise<{ data: MilestonePlanResponseDto; message: string }> {
    const userId = req.user.sub || req.user.userId;
    const plan = await this.milestonePlanService.submitMilestonePlan(planId, dto, userId);
    return {
      data: plan,
      message: 'Milestone plan submitted for review',
    };
  }

  @Post('milestone-plans/:planId/approve')
  @ApiOperation({ summary: 'Approve milestone plan (Client)' })
  @ApiResponse({ status: 200, description: 'Milestone plan approved successfully', type: MilestonePlanResponseDto })
  async approveMilestonePlan(
    @Req() req,
    @Param('planId') planId: string,
    @Body() dto: ApproveMilestonePlanDto,
  ): Promise<{ data: MilestonePlanResponseDto; message: string }> {
    const userId = req.user.sub || req.user.userId;
    const plan = await this.milestonePlanService.approveMilestonePlan(planId, dto, userId);
    return {
      data: plan,
      message: 'Milestone plan approved. Project can now start!',
    };
  }

  @Post('milestone-plans/:planId/request-changes')
  @ApiOperation({ summary: 'Request changes to milestone plan (Client)' })
  @ApiResponse({ status: 200, description: 'Changes requested successfully', type: MilestonePlanResponseDto })
  async requestMilestonePlanChanges(
    @Req() req,
    @Param('planId') planId: string,
    @Body() dto: RequestMilestonePlanChangesDto,
  ): Promise<{ data: MilestonePlanResponseDto; message: string }> {
    const userId = req.user.sub || req.user.userId;
    const plan = await this.milestonePlanService.requestMilestonePlanChanges(planId, dto, userId);
    return {
      data: plan,
      message: 'Changes requested. Developer has been notified.',
    };
  }

  @Post('milestone-plans/:planId/reject')
  @ApiOperation({ summary: 'Reject milestone plan (Client)' })
  @ApiResponse({ status: 200, description: 'Milestone plan rejected', type: MilestonePlanResponseDto })
  async rejectMilestonePlan(
    @Req() req,
    @Param('planId') planId: string,
    @Body() dto: RejectMilestonePlanDto,
  ): Promise<{ data: MilestonePlanResponseDto; message: string }> {
    const userId = req.user.sub || req.user.userId;
    const plan = await this.milestonePlanService.rejectMilestonePlan(planId, dto, userId);
    return {
      data: plan,
      message: 'Milestone plan rejected. Developer has been notified.',
    };
  }

  @Get('milestone-plans/:planId')
  @ApiOperation({ summary: 'Get milestone plan by ID' })
  @ApiResponse({ status: 200, description: 'Milestone plan retrieved successfully', type: MilestonePlanResponseDto })
  async getMilestonePlan(
    @Req() req,
    @Param('planId') planId: string,
  ): Promise<{ data: MilestonePlanResponseDto; message: string }> {
    const userId = req.user.sub || req.user.userId;
    const plan = await this.milestonePlanService.getMilestonePlan(planId, userId);
    return {
      data: plan,
      message: 'Milestone plan retrieved successfully',
    };
  }

  @Get('projects/:projectId/milestone-plans/latest')
  @ApiOperation({ summary: 'Get latest milestone plan for a project' })
  @ApiResponse({ status: 200, description: 'Latest milestone plan retrieved', type: MilestonePlanResponseDto })
  async getLatestMilestonePlan(
    @Req() req,
    @Param('projectId') projectId: string,
  ): Promise<{ data: MilestonePlanResponseDto | null; message: string }> {
    const userId = req.user.sub || req.user.userId;
    const plan = await this.milestonePlanService.getMilestonePlanByProject(projectId, userId);
    return {
      data: plan,
      message: plan ? 'Milestone plan retrieved successfully' : 'No milestone plan found for this project',
    };
  }

  @Get('projects/:projectId/milestone-plans/history')
  @ApiOperation({ summary: 'Get milestone plan history for a project' })
  @ApiResponse({ status: 200, description: 'Milestone plan history retrieved', type: [MilestonePlanResponseDto] })
  async getMilestonePlanHistory(
    @Req() req,
    @Param('projectId') projectId: string,
  ): Promise<{ data: MilestonePlanResponseDto[]; message: string }> {
    const userId = req.user.sub || req.user.userId;
    const plans = await this.milestonePlanService.getMilestonePlanHistory(projectId, userId);
    return {
      data: plans,
      message: 'Milestone plan history retrieved successfully',
    };
  }

  @Post('projects/:projectId/milestone-plans/ai-generate')
  @ApiOperation({ summary: 'AI-generate milestone plan suggestions based on project details' })
  @ApiResponse({ status: 200, description: 'Returns AI-generated milestone suggestions' })
  async aiGenerateMilestonePlan(
    @Req() req,
    @Param('projectId') projectId: string,
  ): Promise<{ data: any; message: string }> {
    const userId = req.user.sub || req.user.userId;
    const suggestions = await this.milestonePlanService.aiGenerateMilestonePlan(projectId, userId);
    return {
      data: suggestions,
      message: 'AI milestone suggestions generated successfully',
    };
  }

  @Get('projects/:projectId/milestone-plans/accepted-proposal')
  @ApiOperation({ summary: 'Get accepted proposal ID for a project' })
  @ApiResponse({ status: 200, description: 'Returns accepted proposal ID' })
  async getAcceptedProposalId(
    @Req() req,
    @Param('projectId') projectId: string,
  ): Promise<{ data: { proposalId: string }; message: string }> {
    const userId = req.user.sub || req.user.userId;
    const proposalId = await this.milestonePlanService.getAcceptedProposalId(projectId, userId);
    return {
      data: { proposalId },
      message: 'Accepted proposal ID retrieved successfully',
    };
  }
}
