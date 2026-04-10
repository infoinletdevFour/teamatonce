import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvitationService } from './invitation.service';
import {
  CreateInvitationDto,
  AcceptInvitationDto,
  DeclineInvitationDto,
  InvitationResponseDto,
} from './dto/invitation.dto';

@ApiTags('Workspace Management')
@Controller('workspace')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkspaceController {
  constructor(private readonly invitationService: InvitationService) {}

  // ============================================
  // WORKSPACE INVITATION ENDPOINTS
  // ============================================

  @Post(':workspaceId/invitations')
  @ApiOperation({
    summary: 'Create workspace invitation',
    description:
      'Invite a user to join the workspace by email. Only workspace owners and admins can send invitations.',
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
    description: 'Workspace not found',
  })
  @ApiParam({
    name: 'workspaceId',
    required: true,
    type: String,
    description: 'Workspace UUID',
  })
  @HttpCode(HttpStatus.CREATED)
  async createInvitation(
    @Request() req,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateInvitationDto,
  ): Promise<any> {
    const userId = req.user.sub || req.user.userId;
    return this.invitationService.createInvitation(workspaceId, userId, dto);
  }

  @Get(':workspaceId/invitations')
  @ApiOperation({
    summary: 'Get workspace invitations',
    description:
      'Retrieve all pending and processed invitations for the workspace',
  })
  @ApiResponse({
    status: 200,
    description: 'Workspace invitations retrieved successfully',
    type: [InvitationResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a member of this workspace',
  })
  @ApiResponse({
    status: 404,
    description: 'Workspace not found',
  })
  @ApiParam({
    name: 'workspaceId',
    required: true,
    type: String,
    description: 'Workspace UUID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description:
      'Filter by invitation status (pending, accepted, declined, cancelled)',
    example: 'pending',
  })
  async getWorkspaceInvitations(
    @Request() req,
    @Param('workspaceId') workspaceId: string,
    @Query('status') status?: string,
  ): Promise<any> {
    const userId = req.user.sub || req.user.userId;
    return this.invitationService.getWorkspaceInvitations(
      workspaceId,
      userId,
      status,
    );
  }


  @Post(':workspaceId/invitations/:invitationId/resend')
  @ApiOperation({
    summary: 'Resend invitation',
    description:
      'Resend a pending invitation email. Only the inviter or workspace admins/owners can resend.',
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
    description:
      'Forbidden - User does not have permission to resend this invitation',
  })
  @ApiResponse({
    status: 404,
    description: 'Workspace or invitation not found',
  })
  @ApiParam({
    name: 'workspaceId',
    required: true,
    type: String,
    description: 'Workspace UUID',
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
    @Param('workspaceId') workspaceId: string,
    @Param('invitationId') invitationId: string,
  ): Promise<any> {
    const userId = req.user.sub || req.user.userId;
    return this.invitationService.resendInvitation(invitationId, userId);
  }

  @Delete(':workspaceId/invitations/:invitationId')
  @ApiOperation({
    summary: 'Cancel invitation',
    description:
      'Cancel a pending invitation. Only the inviter or workspace admins/owners can cancel.',
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
    description:
      'Forbidden - User does not have permission to cancel this invitation',
  })
  @ApiResponse({
    status: 404,
    description: 'Workspace or invitation not found',
  })
  @ApiParam({
    name: 'workspaceId',
    required: true,
    type: String,
    description: 'Workspace UUID',
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
    @Param('workspaceId') workspaceId: string,
    @Param('invitationId') invitationId: string,
  ): Promise<{ message: string }> {
    const userId = req.user.sub || req.user.userId;
    return this.invitationService.cancelInvitation(invitationId, userId);
  }
}
