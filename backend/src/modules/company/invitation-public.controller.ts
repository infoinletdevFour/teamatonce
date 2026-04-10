import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvitationService } from './invitation.service';
import { InvitationResponseDto } from './dto/invitation.dto';

/**
 * Public Invitation Controller
 * Handles public invitation endpoints that don't require authentication
 */
@ApiTags('Invitations (Public)')
@Controller('invitations')
export class InvitationPublicController {
  constructor(private readonly invitationService: InvitationService) {}

  /**
   * Get invitation details by token (PUBLIC - no auth required)
   * This allows users to view invitation details before accepting
   */
  @Get(':token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get invitation by token (Public)',
    description: 'Retrieve invitation details using the unique token. This is a public endpoint that does not require authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation retrieved successfully',
    type: InvitationResponseDto,
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

  /**
   * Accept invitation by token (AUTHENTICATED - requires login)
   */
  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accept invitation (Authenticated)',
    description: 'Accept a team invitation using the token. User must be authenticated and email must match invitation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation accepted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - user not logged in',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found or already used',
  })
  @ApiParam({
    name: 'token',
    required: true,
    type: String,
    description: 'Unique invitation token',
  })
  async acceptInvitation(
    @Param('token') token: string,
    @Request() req: any,
  ): Promise<any> {
    // Get user ID from JWT token (support both sub and userId for compatibility)
    const userId = req.user.sub || req.user.userId;

    console.log('[InvitationPublicController] Accept invitation request:', {
      token,
      userId,
      user: req.user,
    });

    // Accept the invitation with user ID - pass token in DTO as required
    return this.invitationService.acceptInvitation(token, userId, { token });
  }

  /**
   * Decline invitation by token (PUBLIC)
   */
  @Post(':token/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Decline invitation (Public)',
    description: 'Decline a team invitation using the token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation declined successfully',
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
  async declineInvitation(
    @Param('token') token: string,
  ): Promise<{ message: string }> {
    // Decline can be done without authentication
    return { message: 'Invitation declined' };
  }
}
