import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as crypto from 'crypto';
import {
  CreateInvitationDto,
  AcceptInvitationDto,
  DeclineInvitationDto,
  InvitationStatus,
  WorkspaceMemberRole,
} from './dto/invitation.dto';

/**
 * InvitationService
 * Handles workspace invitations for Deskive
 *
 * Features:
 * - Create and send workspace invitations
 * - Accept/decline invitations
 * - Resend and cancel invitations
 * - Token-based invitation validation
 * - Automatic workspace member creation on acceptance
 */
@Injectable()
export class InvitationService {
  // Invitation expiration: 7 days
  private readonly INVITATION_EXPIRY_DAYS = 7;

  constructor(private readonly db: DatabaseService) {}

  /**
   * Create and send a workspace invitation
   * @param workspaceId - Workspace ID sending the invitation
   * @param userId - User ID creating the invitation (must be owner/admin)
   * @param dto - Invitation data (email, name, role, etc.)
   * @returns Created invitation record
   */
  async createInvitation(
    workspaceId: string,
    userId: string,
    dto: CreateInvitationDto,
  ) {
    try {
      // 1. Verify workspace exists and user has permission
      await this.validateUserPermission(workspaceId, userId);

      // 2. Check for duplicate active invitation to same email
      const existingInvitation = await this.db.findOne(
        'workspace_invitations',
        {
          workspace_id: workspaceId,
          email: dto.email.toLowerCase(),
        },
      );

      if (
        existingInvitation &&
        existingInvitation.status === InvitationStatus.PENDING
      ) {
        throw new BadRequestException(
          `An active invitation already exists for ${dto.email}`,
        );
      }

      // 3. Check if user is already a workspace member
      const existingMember = await this.db.findOne('workspace_members', {
        workspace_id: workspaceId,
        email: dto.email.toLowerCase(),
      });

      if (existingMember && existingMember.status !== 'inactive') {
        throw new BadRequestException(
          `${dto.email} is already a workspace member`,
        );
      }

      // 4. Generate secure invitation token
      const token = this.generateInvitationToken();
      const expiresAt = this.getInvitationExpiration();

      // 5. Create invitation record
      const invitationData = {
        workspace_id: workspaceId,
        invited_by: userId,
        email: dto.email.toLowerCase(),
        name: dto.name || null,
        role: dto.role,
        message: dto.message || null,
        initial_permissions: dto.initialPermissions || [],
        status: InvitationStatus.PENDING,
        token,
        expires_at: expiresAt.toISOString(),
        sent_count: 1,
        last_sent_at: new Date().toISOString(),
      };

      const invitation = await this.db.insert(
        'workspace_invitations',
        invitationData,
      );

      // 6. Send invitation email
      await this.sendInvitationEmail(invitation);

      return {
        success: true,
        message: 'Invitation sent successfully',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          name: invitation.name,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expires_at,
          createdAt: invitation.created_at,
        },
      };
    } catch (error) {
      console.error('[InvitationService] Create invitation error:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create invitation: ${error.message}`,
      );
    }
  }

  /**
   * Get all invitations for a workspace
   * @param workspaceId - Workspace ID
   * @param userId - User ID requesting (must be owner/admin)
   * @param status - Optional status filter (pending, accepted, declined, expired, cancelled)
   * @returns List of invitations
   */
  async getWorkspaceInvitations(
    workspaceId: string,
    userId: string,
    status?: string,
  ) {
    try {
      // Verify user has permission
      await this.validateUserPermission(workspaceId, userId);

      // Build query conditions
      const conditions: any = {
        workspace_id: workspaceId,
      };

      if (status) {
        conditions.status = status;
      }

      // Fetch invitations
      const invitations = await this.db.findMany(
        'workspace_invitations',
        conditions,
        {
          orderBy: 'created_at',
          order: 'desc',
        },
      );

      // Enrich with inviter information
      const enrichedInvitations = await Promise.all(
        invitations.map(async (invitation) => {
          const inviter = await this.db.getUserById(invitation.invited_by);
          return {
            id: invitation.id,
            email: invitation.email,
            name: invitation.name,
            role: invitation.role,
            message: invitation.message,
            status: invitation.status,
            expiresAt: invitation.expires_at,
            invitedBy: {
              id: invitation.invited_by,
              name: inviter?.name || 'Unknown',
              email: inviter?.email || '',
            },
            sentCount: invitation.sent_count,
            lastSentAt: invitation.last_sent_at,
            createdAt: invitation.created_at,
            acceptedAt: invitation.accepted_at,
            declinedAt: invitation.declined_at,
            cancelledAt: invitation.cancelled_at,
            declineReason: invitation.decline_reason,
          };
        }),
      );

      return {
        success: true,
        invitations: enrichedInvitations,
        total: enrichedInvitations.length,
      };
    } catch (error) {
      console.error('[InvitationService] Get invitations error:', error);
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to get invitations: ${error.message}`,
      );
    }
  }

  /**
   * Get invitation details by token (public - no auth required)
   * @param token - Invitation token
   * @returns Invitation details
   */
  async getInvitationByToken(token: string) {
    try {
      const invitation = await this.db.findOne('workspace_invitations', {
        token,
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      // Check if expired
      if (this.checkInvitationExpired(invitation)) {
        // Auto-update status to expired
        await this.db.update('workspace_invitations', invitation.id, {
          status: InvitationStatus.EXPIRED,
        });
        throw new BadRequestException('This invitation has expired');
      }

      // Check status
      if (invitation.status !== InvitationStatus.PENDING) {
        throw new BadRequestException(
          `This invitation has already been ${invitation.status}`,
        );
      }

      // Get workspace details
      const workspace = await this.db.findOne('workspaces', {
        id: invitation.workspace_id,
      });

      if (!workspace) {
        throw new NotFoundException('Workspace not found');
      }

      // Get inviter details
      const inviter = await this.db.getUserById(invitation.invited_by);

      return {
        success: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          name: invitation.name,
          role: invitation.role,
          message: invitation.message,
          expiresAt: invitation.expires_at,
          workspace: {
            id: workspace.id,
            name: workspace.name,
            description: workspace.description,
          },
          invitedBy: {
            name: inviter?.name || 'Unknown',
            email: inviter?.email || '',
          },
        },
      };
    } catch (error) {
      console.error('[InvitationService] Get invitation by token error:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to get invitation: ${error.message}`,
      );
    }
  }

  /**
   * Cancel a pending invitation
   * @param invitationId - Invitation ID
   * @param userId - User ID canceling (must be owner/admin)
   * @returns Success response
   */
  async cancelInvitation(invitationId: string, userId: string) {
    try {
      // Get invitation
      const invitation = await this.db.findOne('workspace_invitations', {
        id: invitationId,
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      // Verify user has permission
      await this.validateUserPermission(invitation.workspace_id, userId);

      // Check if already cancelled or accepted
      if (invitation.status !== InvitationStatus.PENDING) {
        throw new BadRequestException(
          `Cannot cancel invitation with status: ${invitation.status}`,
        );
      }

      // Update invitation status
      await this.db.update('workspace_invitations', invitationId, {
        status: InvitationStatus.CANCELLED,
        cancelled_at: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'Invitation cancelled successfully',
      };
    } catch (error) {
      console.error('[InvitationService] Cancel invitation error:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to cancel invitation: ${error.message}`,
      );
    }
  }

  /**
   * Resend an invitation email
   * @param invitationId - Invitation ID
   * @param userId - User ID resending (must be owner/admin)
   * @returns Success response
   */
  async resendInvitation(invitationId: string, userId: string) {
    try {
      // Get invitation
      const invitation = await this.db.findOne('workspace_invitations', {
        id: invitationId,
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      // Verify user has permission
      await this.validateUserPermission(invitation.workspace_id, userId);

      // Check if still pending
      if (invitation.status !== InvitationStatus.PENDING) {
        throw new BadRequestException(
          `Cannot resend invitation with status: ${invitation.status}`,
        );
      }

      // Check if expired
      if (this.checkInvitationExpired(invitation)) {
        // Generate new token and extend expiration
        const newToken = this.generateInvitationToken();
        const newExpiresAt = this.getInvitationExpiration();

        await this.db.update('workspace_invitations', invitationId, {
          token: newToken,
          expires_at: newExpiresAt.toISOString(),
          sent_count: invitation.sent_count + 1,
          last_sent_at: new Date().toISOString(),
        });

        // Get updated invitation
        const updatedInvitation = await this.db.findOne(
          'workspace_invitations',
          { id: invitationId },
        );
        await this.sendInvitationEmail(updatedInvitation);
      } else {
        // Just increment sent count and resend with existing token
        await this.db.update('workspace_invitations', invitationId, {
          sent_count: invitation.sent_count + 1,
          last_sent_at: new Date().toISOString(),
        });

        await this.sendInvitationEmail(invitation);
      }

      return {
        success: true,
        message: 'Invitation resent successfully',
      };
    } catch (error) {
      console.error('[InvitationService] Resend invitation error:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to resend invitation: ${error.message}`,
      );
    }
  }

  /**
   * Accept an invitation and create workspace member
   * @param token - Invitation token
   * @param userId - User ID accepting the invitation
   * @param dto - Additional member data
   * @returns Created workspace member
   */
  async acceptInvitation(
    token: string,
    userId: string,
    dto: AcceptInvitationDto,
  ) {
    try {
      // 1. Get and validate invitation
      const invitation = await this.db.findOne('workspace_invitations', {
        token,
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      // Check if expired
      if (this.checkInvitationExpired(invitation)) {
        await this.db.update('workspace_invitations', invitation.id, {
          status: InvitationStatus.EXPIRED,
        });
        throw new BadRequestException('This invitation has expired');
      }

      // Check status
      if (invitation.status !== InvitationStatus.PENDING) {
        throw new BadRequestException(
          `This invitation has already been ${invitation.status}`,
        );
      }

      // 2. Get user details
      console.log('[InvitationService] Getting user by ID:', userId);
      const userResponse: any = await this.db.getUserById(userId);
      console.log('[InvitationService] User response:', userResponse);

      // database getUserById returns { user: {...} } not just the user object
      const user: any = userResponse?.user || userResponse;
      console.log(
        '[InvitationService] User retrieved:',
        user
          ? { id: user.id, email: user.email, name: user.name }
          : 'null',
      );

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if user has email
      if (!user.email) {
        throw new BadRequestException(
          'User account does not have an email address',
        );
      }

      // Verify email matches (case-insensitive)
      if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        throw new ForbiddenException(
          'This invitation was sent to a different email address',
        );
      }

      // 3. Check if already a member
      const existingMember = await this.db.findOne('workspace_members', {
        workspace_id: invitation.workspace_id,
        user_id: userId,
      });

      if (existingMember && existingMember.status === 'active') {
        throw new BadRequestException(
          'You are already a member of this workspace',
        );
      }

      // 4. Create workspace member record
      // API returns: fullName, avatarUrl (camelCase)
      // SDK types define: name, avatar_url (snake_case)
      const userName =
        user.fullName ||
        user.name ||
        invitation.name ||
        dto.name ||
        user.email.split('@')[0];
      const userAvatar = user.avatarUrl || user.avatar_url || null;

      const memberData = {
        workspace_id: invitation.workspace_id,
        user_id: userId,
        name: userName,
        email: user.email.toLowerCase(),
        avatar_url: userAvatar,
        bio: dto.bio || user.bio || null,
        role: invitation.role,
        permissions: this.getDefaultPermissions(invitation.role),
        is_owner: false,
        status: 'active',
        phone: dto.phone || user.phone || null,
        location: dto.location || user.location || null,
        timezone: dto.timezone || user.metadata?.timezone || 'UTC',
        is_online: false,
        last_seen_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
        metadata: {},
      };

      const workspaceMember = await this.db.insert(
        'workspace_members',
        memberData,
      );

      // 5. Update invitation status
      await this.db.update('workspace_invitations', invitation.id, {
        status: InvitationStatus.ACCEPTED,
        accepted_at: new Date().toISOString(),
        member_id: workspaceMember.id,
      });

      return {
        success: true,
        message: 'Invitation accepted successfully',
        workspaceMember: {
          id: workspaceMember.id,
          workspaceId: workspaceMember.workspace_id,
          userId: workspaceMember.user_id,
          name: workspaceMember.name,
          email: workspaceMember.email,
          role: workspaceMember.role,
          status: workspaceMember.status,
          joinedAt: workspaceMember.joined_at,
        },
      };
    } catch (error) {
      console.error('[InvitationService] Accept invitation error:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to accept invitation: ${error.message}`,
      );
    }
  }

  /**
   * Decline an invitation
   * @param token - Invitation token
   * @param dto - Decline invitation data
   * @returns Success response
   */
  async declineInvitation(token: string, dto: DeclineInvitationDto) {
    try {
      // Get invitation
      const invitation = await this.db.findOne('workspace_invitations', {
        token,
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      // Check status
      if (invitation.status !== InvitationStatus.PENDING) {
        throw new BadRequestException(
          `This invitation has already been ${invitation.status}`,
        );
      }

      // Update invitation status
      await this.db.update('workspace_invitations', invitation.id, {
        status: InvitationStatus.DECLINED,
        declined_at: new Date().toISOString(),
        decline_reason: dto.declineReason || null,
      });

      return {
        success: true,
        message: 'Invitation declined',
      };
    } catch (error) {
      console.error('[InvitationService] Decline invitation error:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to decline invitation: ${error.message}`,
      );
    }
  }

  /**
   * Generate a secure random token for invitation
   * @returns 64-character hex token
   */
  private generateInvitationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Calculate invitation expiration date
   * @returns Date object set to INVITATION_EXPIRY_DAYS from now
   */
  private getInvitationExpiration(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.INVITATION_EXPIRY_DAYS);
    return expiresAt;
  }

  /**
   * Check if invitation has expired
   * @param invitation - Invitation object
   * @returns true if expired, false otherwise
   */
  private checkInvitationExpired(invitation: any): boolean {
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    return now > expiresAt;
  }

  /**
   * Send invitation email
   * In production, this would use the email service
   * @param invitation - Invitation object
   */
  private async sendInvitationEmail(invitation: any): Promise<void> {
    try {
      // Get workspace details
      const workspace = await this.db.findOne('workspaces', {
        id: invitation.workspace_id,
      });
      const inviter = await this.db.getUserById(invitation.invited_by);

      const inviteUrl = `${process.env.FRONTEND_URL}/invite/${invitation.token}`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to join ${workspace?.name}!</h2>

          <p>Hi ${invitation.name || 'there'},</p>

          <p><strong>${inviter?.name || 'Someone'}</strong> has invited you to join their workspace on Deskive as a <strong>${invitation.role}</strong>.</p>

          ${invitation.message ? `<p><em>"${invitation.message}"</em></p>` : ''}

          <div style="margin: 30px 0;">
            <a href="${inviteUrl}"
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Accept Invitation
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">
            This invitation will expire in ${this.INVITATION_EXPIRY_DAYS} days.
          </p>

          <p style="color: #999; font-size: 12px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `;

      // Use database email service
      await /* TODO: use EmailService */ this.db.sendEmail(
        invitation.email,
        `You've been invited to join ${workspace?.name}`,
        emailHtml,
      );

      console.log(
        `[InvitationService] Invitation email sent to ${invitation.email}`,
      );
    } catch (error) {
      console.error(
        '[InvitationService] Failed to send invitation email:',
        error,
      );
      // Don't fail the invitation creation if email fails
    }
  }

  /**
   * Validate user has permission to manage invitations
   * @param workspaceId - Workspace ID
   * @param userId - User ID
   * @throws ForbiddenException if user doesn't have permission
   */
  private async validateUserPermission(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    // Check if user is owner
    const workspace = await this.db.findOne('workspaces', {
      id: workspaceId,
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Owner always has permission
    if (workspace.owner_id === userId) {
      return;
    }

    // Check if user is admin
    const member = await this.db.findOne('workspace_members', {
      workspace_id: workspaceId,
      user_id: userId,
    });

    if (
      !member ||
      (member.role !== WorkspaceMemberRole.ADMIN &&
        member.role !== WorkspaceMemberRole.OWNER)
    ) {
      throw new ForbiddenException(
        'You do not have permission to manage invitations',
      );
    }
  }

  /**
   * Get default permissions for a role
   * @param role - Workspace member role
   * @returns Array of permission strings
   */
  private getDefaultPermissions(role: WorkspaceMemberRole): string[] {
    const permissionMap: Record<string, string[]> = {
      owner: ['all'],
      admin: [
        'manage_workspace',
        'manage_members',
        'manage_projects',
        'view_analytics',
      ],
      member: ['view_workspace', 'manage_own_tasks', 'view_projects'],
      viewer: ['view_workspace', 'view_projects'],
    };

    return permissionMap[role] || ['view_workspace'];
  }
}
