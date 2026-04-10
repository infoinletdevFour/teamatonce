import { Injectable, BadRequestException, NotFoundException, ForbiddenException, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EmailService } from '../../services/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../notifications/dto';
import * as crypto from 'crypto';
import {
  CreateInvitationDto,
  AcceptInvitationDto,
  DeclineInvitationDto,
  InvitationStatus,
} from './dto/invitation.dto';

/**
 * InvitationService
 * Handles team invitations for developer companies
 *
 * Features:
 * - Create and send team invitations
 * - Accept/decline invitations
 * - Resend and cancel invitations
 * - Token-based invitation validation
 * - Automatic team member creation on acceptance
 */
@Injectable()
export class InvitationService {
  // Invitation expiration: 7 days
  private readonly INVITATION_EXPIRY_DAYS = 7;

  constructor(
    private readonly db: DatabaseService,
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Create and send a team invitation
   * @param companyId - Company ID sending the invitation
   * @param userId - User ID creating the invitation (must be owner/admin)
   * @param dto - Invitation data (email, name, role, etc.)
   * @returns Created invitation record
   */
  async createInvitation(companyId: string, userId: string, dto: CreateInvitationDto) {
    try {
      // 1. Verify company exists and user has permission
      await this.validateUserPermission(companyId, userId);

      // 2. Check for duplicate active invitation to same email
      const existingInvitation = await this.db.findOne('team_invitations', {
        company_id: companyId,
        email: dto.email.toLowerCase(),
      });

      if (existingInvitation && existingInvitation.status === 'pending') {
        throw new BadRequestException(`An active invitation already exists for ${dto.email}`);
      }

      // 3. Check if user is already a team member
      const existingMember = await this.db.findOne('company_team_members', {
        company_id: companyId,
        email: dto.email.toLowerCase(),
      });

      if (existingMember && existingMember.status !== 'inactive') {
        throw new BadRequestException(`${dto.email} is already a team member`);
      }

      // 4. Generate secure invitation token
      const token = this.generateInvitationToken();
      const expiresAt = this.getInvitationExpiration();

      // 5. Create invitation record
      const invitationData = {
        company_id: companyId,
        invited_by: userId,
        email: dto.email.toLowerCase(),
        name: dto.name || null,
        role: dto.role,
        message: dto.message || null,
        initial_skills: dto.initial_skills || [],
        hourly_rate: dto.hourly_rate || null,
        initial_projects: dto.initial_projects || [],
        status: 'pending',
        token,
        expires_at: expiresAt.toISOString(),
        sent_count: 1,
        last_sent_at: new Date().toISOString(),
      };

      const invitation = await this.db.insert('team_invitations', invitationData);

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
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create invitation: ${error.message}`);
    }
  }

  /**
   * Get all invitations for a company
   * @param companyId - Company ID
   * @param userId - User ID requesting (must be owner/admin)
   * @param status - Optional status filter (pending, accepted, declined, expired, cancelled)
   * @returns List of invitations
   */
  async getCompanyInvitations(companyId: string, userId: string, status?: string) {
    try {
      // Verify user has permission
      await this.validateUserPermission(companyId, userId);

      // Build query conditions
      const conditions: any = {
        company_id: companyId,
      };

      if (status) {
        conditions.status = status;
      }

      // Fetch invitations
      const invitations = await this.db.findMany('team_invitations', conditions, {
        orderBy: 'created_at',
        order: 'desc',
      });

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
        })
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
      throw new BadRequestException(`Failed to get invitations: ${error.message}`);
    }
  }

  /**
   * Get invitation details by token (public - no auth required)
   * @param token - Invitation token
   * @returns Invitation details
   */
  async getInvitationByToken(token: string) {
    try {
      const invitation = await this.db.findOne('team_invitations', { token });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      // Check if expired
      if (this.checkInvitationExpired(invitation)) {
        // Auto-update status to expired
        await this.db.update('team_invitations', invitation.id, {
          status: 'expired',
        });
        throw new BadRequestException('This invitation has expired');
      }

      // Check status
      if (invitation.status !== 'pending') {
        throw new BadRequestException(`This invitation has already been ${invitation.status}`);
      }

      // Get company details
      const company = await this.db.findOne('developer_companies', { id: invitation.company_id });

      if (!company) {
        throw new NotFoundException('Company not found');
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
          company: {
            id: company.id,
            name: company.company_name || company.display_name,
            logo: company.logo_url,
            accountType: company.account_type,
          },
          invitedBy: {
            name: inviter?.name || 'Unknown',
            email: inviter?.email || '',
          },
        },
      };
    } catch (error) {
      console.error('[InvitationService] Get invitation by token error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to get invitation: ${error.message}`);
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
      const invitation = await this.db.findOne('team_invitations', { id: invitationId });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      // Verify user has permission
      await this.validateUserPermission(invitation.company_id, userId);

      // Check if already cancelled or accepted
      if (invitation.status !== 'pending') {
        throw new BadRequestException(`Cannot cancel invitation with status: ${invitation.status}`);
      }

      // Update invitation status
      await this.db.update('team_invitations', invitationId, {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'Invitation cancelled successfully',
      };
    } catch (error) {
      console.error('[InvitationService] Cancel invitation error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to cancel invitation: ${error.message}`);
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
      const invitation = await this.db.findOne('team_invitations', { id: invitationId });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      // Verify user has permission
      await this.validateUserPermission(invitation.company_id, userId);

      // Check if still pending
      if (invitation.status !== 'pending') {
        throw new BadRequestException(`Cannot resend invitation with status: ${invitation.status}`);
      }

      // Check if expired
      if (this.checkInvitationExpired(invitation)) {
        // Generate new token and extend expiration
        const newToken = this.generateInvitationToken();
        const newExpiresAt = this.getInvitationExpiration();

        await this.db.update('team_invitations', invitationId, {
          token: newToken,
          expires_at: newExpiresAt.toISOString(),
          sent_count: invitation.sent_count + 1,
          last_sent_at: new Date().toISOString(),
        });

        // Get updated invitation
        const updatedInvitation = await this.db.findOne('team_invitations', { id: invitationId });
        await this.sendInvitationEmail(updatedInvitation);
      } else {
        // Just increment sent count and resend with existing token
        await this.db.update('team_invitations', invitationId, {
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
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to resend invitation: ${error.message}`);
    }
  }

  /**
   * Accept an invitation and create team member
   * @param token - Invitation token
   * @param userId - User ID accepting the invitation
   * @param dto - Additional member data
   * @returns Created team member
   */
  async acceptInvitation(token: string, userId: string, dto: AcceptInvitationDto) {
    try {
      // 1. Get and validate invitation
      const invitation = await this.db.findOne('team_invitations', { token });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      // Check if expired
      if (this.checkInvitationExpired(invitation)) {
        await this.db.update('team_invitations', invitation.id, {
          status: 'expired',
        });
        throw new BadRequestException('This invitation has expired');
      }

      // Check status
      if (invitation.status !== 'pending') {
        throw new BadRequestException(`This invitation has already been ${invitation.status}`);
      }

      // 2. Get user details
      console.log('[InvitationService] Getting user by ID:', userId);
      const userResponse: any = await this.db.getUserById(userId);
      console.log('[InvitationService] User response:', userResponse);

      // database getUserById returns { user: {...} } not just the user object
      const user: any = userResponse?.user || userResponse;
      console.log('[InvitationService] User retrieved:', user ? { id: user.id, email: user.email, name: user.name } : 'null');

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if user has email
      if (!user.email) {
        throw new BadRequestException('User account does not have an email address');
      }

      // Verify email matches (case-insensitive)
      if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        throw new ForbiddenException('This invitation was sent to a different email address');
      }

      // 3. Check if already a member
      const existingMember = await this.db.findOne('company_team_members', {
        company_id: invitation.company_id,
        user_id: userId,
      });

      if (existingMember && existingMember.status === 'active') {
        throw new BadRequestException('You are already a member of this team');
      }

      // 4. Create team member record
      // API returns: fullName, avatarUrl (camelCase)
      // SDK types define: name, avatar_url (snake_case)
      const userName = user.fullName || user.name || invitation.name || dto.name || user.email.split('@')[0];
      const userAvatar = user.avatarUrl || user.avatar_url || null;

      const memberData = {
        company_id: invitation.company_id,
        user_id: userId,
        name: userName,
        email: user.email.toLowerCase(),
        avatar_url: userAvatar,
        title: null,
        bio: dto.bio || user.bio || null,
        role: invitation.role,
        permissions: this.getDefaultPermissions(invitation.role),
        is_owner: false,
        skills: dto.skills || invitation.initial_skills || [],
        specializations: [],
        technologies: dto.technologies || [],
        expertise: [],
        experience_years: 0,
        hourly_rate: invitation.hourly_rate || null,
        currency: 'USD',
        availability: 'available',
        status: 'active',
        workload_percentage: 0,
        capacity_hours_per_week: 40,
        current_projects: 0,
        current_project_ids: invitation.initial_projects || [],
        hours_this_week: 0,
        hours_this_month: 0,
        phone: dto.phone || user.phone || null,
        location: dto.location || user.location || null,
        timezone: dto.timezone || user.metadata?.timezone || 'UTC',
        social_links: {},
        rating: null,
        projects_completed: 0,
        total_hours_worked: 0,
        on_time_delivery_rate: null,
        is_online: false,
        last_seen_at: new Date().toISOString(),
        joined_date: new Date().toISOString().split('T')[0],
        activated_at: new Date().toISOString(),
        deactivated_at: null,
        metadata: {},
      };

      const teamMember = await this.db.insert('company_team_members', memberData);

      // 5. Update invitation status
      await this.db.update('team_invitations', invitation.id, {
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        team_member_id: teamMember.id,
      });

      // 6. Update company team member count if needed
      // This could be done via a trigger or manually here

      // 7. Notify the inviter and company owner about the accepted invitation
      try {
        const company = await this.db.findOne('developer_companies', { id: invitation.company_id });
        const notifyUserIds = new Set<string>();

        // Notify the inviter
        notifyUserIds.add(invitation.invited_by);

        // Also notify the company owner if different from inviter
        if (company?.owner_id && company.owner_id !== invitation.invited_by) {
          notifyUserIds.add(company.owner_id);
        }

        if (notifyUserIds.size > 0) {
          await this.notificationsService.sendNotification({
            user_ids: Array.from(notifyUserIds),
            type: NotificationType.SOCIAL,
            title: 'Team Invitation Accepted',
            message: `${userName} has accepted your invitation and joined ${company?.company_name || company?.display_name || 'the team'} as ${invitation.role}.`,
            priority: NotificationPriority.NORMAL,
            action_url: `/company/${invitation.company_id}/team`,
            data: {
              companyId: invitation.company_id,
              teamMemberId: teamMember.id,
              memberName: userName,
              memberEmail: user.email,
              role: invitation.role,
            },
            send_push: true,
          });
        }
      } catch (notifError) {
        console.error('[InvitationService] Failed to send acceptance notification:', notifError);
      }

      return {
        success: true,
        message: 'Invitation accepted successfully',
        teamMember: {
          id: teamMember.id,
          companyId: teamMember.company_id,
          userId: teamMember.user_id,
          name: teamMember.name,
          email: teamMember.email,
          role: teamMember.role,
          status: teamMember.status,
          joinedDate: teamMember.joined_date,
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
      throw new BadRequestException(`Failed to accept invitation: ${error.message}`);
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
      const invitation = await this.db.findOne('team_invitations', { token });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      // Check status
      if (invitation.status !== 'pending') {
        throw new BadRequestException(`This invitation has already been ${invitation.status}`);
      }

      // Update invitation status
      await this.db.update('team_invitations', invitation.id, {
        status: 'declined',
        declined_at: new Date().toISOString(),
        decline_reason: dto.decline_reason || null,
      });

      // Notify the inviter about the declined invitation
      try {
        const company = await this.db.findOne('developer_companies', { id: invitation.company_id });
        await this.notificationsService.sendNotification({
          user_id: invitation.invited_by,
          type: NotificationType.UPDATE,
          title: 'Invitation Declined',
          message: `${invitation.name || invitation.email} has declined your invitation to join ${company?.company_name || company?.display_name || 'the team'}.${dto.decline_reason ? ` Reason: ${dto.decline_reason}` : ''}`,
          priority: NotificationPriority.NORMAL,
          action_url: `/company/${invitation.company_id}/team/invitations`,
          data: {
            companyId: invitation.company_id,
            invitationId: invitation.id,
            email: invitation.email,
            declineReason: dto.decline_reason,
          },
        });
      } catch (notifError) {
        console.error('[InvitationService] Failed to send decline notification:', notifError);
      }

      return {
        success: true,
        message: 'Invitation declined',
      };
    } catch (error) {
      console.error('[InvitationService] Decline invitation error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to decline invitation: ${error.message}`);
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
   * Send invitation email using professional email template
   * @param invitation - Invitation object
   */
  private async sendInvitationEmail(invitation: any): Promise<void> {
    try {
      console.log(`[InvitationService] Preparing to send invitation email to ${invitation.email}`);

      // Get company details
      const company = await this.db.findOne('developer_companies', { id: invitation.company_id });

      if (!company) {
        throw new Error('Company not found');
      }

      console.log(`[InvitationService] Company found: ${company.company_name || company.display_name}`);

      // Get inviter details
      const inviterResponse: any = await this.db.getUserById(invitation.invited_by);
      const inviter = inviterResponse?.user || inviterResponse;

      console.log(`[InvitationService] Inviter found: ${inviter?.fullName || inviter?.name || 'Unknown'}`);

      // Determine company account type display name
      const accountTypeMap: Record<string, string> = {
        freelancer: 'Freelancer',
        agency: 'Agency',
        company: 'Company',
        enterprise: 'Enterprise',
      };
      const accountType = accountTypeMap[company.account_type] || 'Team';

      // Send templated email
      console.log(`[InvitationService] Calling emailService.sendWorkspaceInvitation...`);
      const emailSent = await this.emailService.sendWorkspaceInvitation({
        to: invitation.email,
        inviteeName: invitation.name || invitation.email.split('@')[0],
        inviteeEmail: invitation.email,
        inviterName: inviter?.fullName || inviter?.name || 'A team member',
        inviterEmail: inviter?.email || '',
        companyName: company.company_name || company.display_name || 'the team',
        companyLogo: company.logo_url,
        accountType,
        role: invitation.role,
        message: invitation.message,
        inviteToken: invitation.token,
        expiresAt: invitation.expires_at,
      });

      if (emailSent) {
        console.log(`[InvitationService] ✅ Invitation email sent successfully to ${invitation.email}`);
      } else {
        console.warn(`[InvitationService] ⚠️ Failed to send invitation email to ${invitation.email} - emailService returned false`);
      }
    } catch (error) {
      console.error('[InvitationService] ❌ Failed to send invitation email:', error);
      console.error('[InvitationService] Error message:', error.message);
      console.error('[InvitationService] Error stack:', error.stack);
      // Don't fail the invitation creation if email fails
      // Email failures should be logged but not block the invitation
    }
  }

  /**
   * Validate user has permission to manage invitations
   * @param companyId - Company ID
   * @param userId - User ID
   * @throws ForbiddenException if user doesn't have permission
   */
  private async validateUserPermission(companyId: string, userId: string): Promise<void> {
    // Check if user is owner
    const company = await this.db.findOne('developer_companies', { id: companyId });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Owner always has permission
    if (company.owner_id === userId) {
      return;
    }

    // Check if user is admin
    const member = await this.db.findOne('company_team_members', {
      company_id: companyId,
      user_id: userId,
    });

    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      throw new ForbiddenException('You do not have permission to manage invitations');
    }
  }

  /**
   * Get default permissions for a role
   * @param role - Team member role
   * @returns Array of permission strings
   */
  private getDefaultPermissions(role: string): string[] {
    const permissionMap: Record<string, string[]> = {
      owner: ['all'],
      admin: ['manage_team', 'manage_projects', 'manage_billing', 'view_analytics'],
      developer: ['view_projects', 'manage_tasks', 'view_team'],
      designer: ['view_projects', 'manage_design', 'view_team'],
      qa: ['view_projects', 'manage_testing', 'report_bugs'],
    };

    return permissionMap[role] || ['view_projects'];
  }
}
