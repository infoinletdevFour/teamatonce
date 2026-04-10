import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MilestoneAdjustmentService } from './milestone-adjustment.service';
import {
  CreateMilestoneAdjustmentDto,
  ApproveAdjustmentDto,
  RejectAdjustmentDto,
  MilestoneAdjustmentResponseDto,
} from './dto/milestone-adjustment.dto';

@ApiTags('milestone-adjustments')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class MilestoneAdjustmentController {
  constructor(private readonly milestoneAdjustmentService: MilestoneAdjustmentService) {}

  @Post('milestones/:milestoneId/adjustment-requests')
  @ApiOperation({ summary: 'Create milestone adjustment request (Developer)' })
  @ApiResponse({ status: 201, description: 'Adjustment request created successfully', type: MilestoneAdjustmentResponseDto })
  async createAdjustmentRequest(
    @Req() req,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: CreateMilestoneAdjustmentDto,
  ): Promise<{ data: MilestoneAdjustmentResponseDto; message: string }> {
    const userId = req.user.sub || req.user.userId;

    // Ensure milestoneId from path matches dto
    dto.milestoneId = milestoneId;

    const request = await this.milestoneAdjustmentService.createAdjustmentRequest(dto, userId);
    return {
      data: request,
      message: 'Adjustment request created successfully',
    };
  }

  @Post('adjustment-requests/:requestId/approve')
  @ApiOperation({ summary: 'Approve adjustment request (Client)' })
  @ApiResponse({ status: 200, description: 'Adjustment request approved', type: MilestoneAdjustmentResponseDto })
  async approveAdjustmentRequest(
    @Req() req,
    @Param('requestId') requestId: string,
    @Body() dto: ApproveAdjustmentDto,
  ): Promise<{ data: MilestoneAdjustmentResponseDto; message: string }> {
    const userId = req.user.sub || req.user.userId;
    const request = await this.milestoneAdjustmentService.approveAdjustmentRequest(requestId, dto, userId);
    return {
      data: request,
      message: 'Adjustment request approved. Changes have been applied to the milestone.',
    };
  }

  @Post('adjustment-requests/:requestId/reject')
  @ApiOperation({ summary: 'Reject adjustment request (Client)' })
  @ApiResponse({ status: 200, description: 'Adjustment request rejected', type: MilestoneAdjustmentResponseDto })
  async rejectAdjustmentRequest(
    @Req() req,
    @Param('requestId') requestId: string,
    @Body() dto: RejectAdjustmentDto,
  ): Promise<{ data: MilestoneAdjustmentResponseDto; message: string }> {
    const userId = req.user.sub || req.user.userId;
    const request = await this.milestoneAdjustmentService.rejectAdjustmentRequest(requestId, dto, userId);
    return {
      data: request,
      message: 'Adjustment request rejected. Developer has been notified.',
    };
  }

  @Get('adjustment-requests/:requestId')
  @ApiOperation({ summary: 'Get adjustment request by ID' })
  @ApiResponse({ status: 200, description: 'Adjustment request retrieved successfully', type: MilestoneAdjustmentResponseDto })
  async getAdjustmentRequest(
    @Req() req,
    @Param('requestId') requestId: string,
  ): Promise<{ data: MilestoneAdjustmentResponseDto; message: string }> {
    const userId = req.user.sub || req.user.userId;
    const request = await this.milestoneAdjustmentService.getAdjustmentRequest(requestId, userId);
    return {
      data: request,
      message: 'Adjustment request retrieved successfully',
    };
  }

  @Get('milestones/:milestoneId/adjustment-requests')
  @ApiOperation({ summary: 'Get all adjustment requests for a milestone' })
  @ApiResponse({ status: 200, description: 'Adjustment requests retrieved', type: [MilestoneAdjustmentResponseDto] })
  async getAdjustmentRequestsByMilestone(
    @Req() req,
    @Param('milestoneId') milestoneId: string,
  ): Promise<{ data: MilestoneAdjustmentResponseDto[]; message: string }> {
    const userId = req.user.sub || req.user.userId;
    const requests = await this.milestoneAdjustmentService.getAdjustmentRequestsByMilestone(milestoneId, userId);
    return {
      data: requests,
      message: 'Adjustment requests retrieved successfully',
    };
  }

  @Get('projects/:projectId/adjustment-requests')
  @ApiOperation({ summary: 'Get all adjustment requests for a project' })
  @ApiResponse({ status: 200, description: 'Adjustment requests retrieved', type: [MilestoneAdjustmentResponseDto] })
  async getAdjustmentRequestsByProject(
    @Req() req,
    @Param('projectId') projectId: string,
  ): Promise<{ data: MilestoneAdjustmentResponseDto[]; message: string }> {
    const userId = req.user.sub || req.user.userId;
    const requests = await this.milestoneAdjustmentService.getAdjustmentRequestsByProject(projectId, userId);
    return {
      data: requests,
      message: 'Adjustment requests retrieved successfully',
    };
  }

  @Post('adjustment-requests/:requestId/withdraw')
  @ApiOperation({ summary: 'Withdraw/cancel adjustment request (Developer)' })
  @ApiResponse({ status: 200, description: 'Adjustment request withdrawn' })
  async withdrawAdjustmentRequest(
    @Req() req,
    @Param('requestId') requestId: string,
  ): Promise<{ message: string }> {
    const userId = req.user.sub || req.user.userId;
    await this.milestoneAdjustmentService.withdrawAdjustmentRequest(requestId, userId);
    return {
      message: 'Adjustment request withdrawn successfully',
    };
  }
}
