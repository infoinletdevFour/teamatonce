import { Injectable, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ProjectAccessService } from './project-access.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../../notifications/dto';

export enum MemberType {
  CLIENT = 'client',
  DEVELOPER = 'developer',
}

export enum MemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  VIEWER = 'viewer',
}

export interface AddProjectMemberDto {
  projectId: string;
  userId: string;
  memberType: MemberType;
  companyId?: string;
  role?: MemberRole;
  permissions?: string[];
  metadata?: Record<string, any>;
}

@Injectable()
export class ProjectMemberService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => ProjectAccessService))
    private readonly projectAccessService: ProjectAccessService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Add a member to a project
   * @param dto Member data
   * @returns Created project member record
   */
  async addProjectMember(dto: AddProjectMemberDto) {
    try {
      // Check if member already exists
      const existingMember = await this.db.findOne('project_members', {
        project_id: dto.projectId,
        user_id: dto.userId,
      });

      if (existingMember) {
        // If member exists but is inactive, reactivate them
        if (!existingMember.is_active) {
          return await this.db.update('project_members', existingMember.id, {
            is_active: true,
            left_at: null,
            role: dto.role || existingMember.role,
            permissions: dto.permissions || existingMember.permissions,
            updated_at: new Date().toISOString(),
          });
        }
        // Member already exists and is active
        return existingMember;
      }

      // Determine default role based on member type
      const defaultRole =
        dto.memberType === MemberType.CLIENT ? MemberRole.OWNER : MemberRole.DEVELOPER;

      // Determine default permissions based on member type and role
      const defaultPermissions = this.getDefaultPermissions(
        dto.memberType,
        dto.role || defaultRole,
      );

      const memberData = {
        project_id: dto.projectId,
        user_id: dto.userId,
        member_type: dto.memberType,
        company_id: dto.companyId || null,
        role: dto.role || defaultRole,
        permissions: dto.permissions || defaultPermissions,
        joined_at: new Date().toISOString(),
        is_active: true,
        metadata: dto.metadata || {},
      };

      const member = await this.db.insert('project_members', memberData);

      console.log(
        `[ProjectMemberService] Added ${dto.memberType} member ${dto.userId} to project ${dto.projectId}`,
      );

      // AUTO-SYNC: Grant access to all project features (chat, calendar, notes, etc.)
      // This runs asynchronously to not block the response
      this.projectAccessService
        .syncProjectAccess(dto.projectId, dto.userId, dto.memberType as 'client' | 'seller')
        .catch((err) => {
          console.error('[ProjectMemberService] Error syncing project access:', err);
        });

      // Send notification to the new member
      try {
        const project = await this.db.findOne('projects', { id: dto.projectId });
        const roleLabel = dto.role || (dto.memberType === MemberType.CLIENT ? 'Owner' : 'Developer');

        await this.notificationsService.sendNotification({
          user_id: dto.userId,
          type: NotificationType.UPDATE,
          title: '🎉 Added to Project',
          message: `You've been added to "${project?.name || 'a project'}" as ${roleLabel}.`,
          priority: NotificationPriority.NORMAL,
          action_url: `/projects/${dto.projectId}`,
          data: { projectId: dto.projectId, role: roleLabel, memberType: dto.memberType },
          send_push: true,
        });
      } catch (notifError) {
        console.error('[ProjectMemberService] Error sending notification:', notifError);
      }

      return member;
    } catch (error) {
      console.error('[ProjectMemberService] Error adding project member:', error);
      throw new BadRequestException(`Failed to add project member: ${error.message}`);
    }
  }

  /**
   * Add client as project member when project is created
   * @param projectId Project ID
   * @param clientUserId Client's user ID
   * @param companyId Client's company ID
   * @returns Created member record
   */
  async addClientToProject(projectId: string, clientUserId: string, companyId?: string) {
    return this.addProjectMember({
      projectId,
      userId: clientUserId,
      memberType: MemberType.CLIENT,
      companyId,
      role: MemberRole.OWNER,
    });
  }

  /**
   * Add developer as project member when proposal is approved
   * @param projectId Project ID
   * @param developerUserId Developer's user ID
   * @param companyId Developer's company ID
   * @returns Created member record
   */
  async addDeveloperToProject(projectId: string, developerUserId: string, companyId: string) {
    return this.addProjectMember({
      projectId,
      userId: developerUserId,
      memberType: MemberType.DEVELOPER,
      companyId,
      role: MemberRole.DEVELOPER,
    });
  }

  /**
   * Get all members of a project
   * @param projectId Project ID
   * @param activeOnly Only return active members
   * @returns List of project members
   */
  async getProjectMembers(projectId: string, activeOnly: boolean = true) {
    const conditions: any = { project_id: projectId };
    if (activeOnly) {
      conditions.is_active = true;
    }

    const members = await this.db.findMany('project_members', conditions);

    // Enrich with user details
    const enrichedMembers = await Promise.all(
      members.map(async (member: any) => {
        const userResponse: any = await this.db.getUserById(member.user_id);
        const user = userResponse?.user || userResponse;

        return {
          ...member,
          user: user
            ? {
                id: user.id,
                name: user.fullName || user.name,
                email: user.email,
                avatar: user.avatarUrl || user.avatar_url,
              }
            : null,
        };
      }),
    );

    return enrichedMembers;
  }

  /**
   * Check if a user is a member of a project
   * @param projectId Project ID
   * @param userId User ID
   * @returns true if user is an active member
   */
  async isProjectMember(projectId: string, userId: string): Promise<boolean> {
    const member = await this.db.findOne('project_members', {
      project_id: projectId,
      user_id: userId,
      is_active: true,
    });

    return !!member;
  }

  /**
   * Get a user's membership details for a project
   * @param projectId Project ID
   * @param userId User ID
   * @returns Member record or null
   */
  async getProjectMembership(projectId: string, userId: string) {
    return await this.db.findOne('project_members', {
      project_id: projectId,
      user_id: userId,
      is_active: true,
    });
  }

  /**
   * Remove a member from a project
   * @param projectId Project ID
   * @param userId User ID
   * @returns Updated member record
   */
  async removeProjectMember(projectId: string, userId: string) {
    const member = await this.db.findOne('project_members', {
      project_id: projectId,
      user_id: userId,
    });

    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    const result = await this.db.update('project_members', member.id, {
      is_active: false,
      left_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // AUTO-REVOKE: Remove access from all project features
    this.projectAccessService
      .revokeProjectAccess(projectId, userId)
      .catch((err) => {
        console.error('[ProjectMemberService] Error revoking project access:', err);
      });

    // Send notification to the removed member
    try {
      const project = await this.db.findOne('projects', { id: projectId });

      await this.notificationsService.sendNotification({
        user_id: userId,
        type: NotificationType.UPDATE,
        title: '📋 Project Membership Update',
        message: `You have been removed from the project "${project?.name || 'Unknown'}".`,
        priority: NotificationPriority.NORMAL,
        action_url: '/projects',
        data: { projectId, action: 'removed' },
        send_push: true,
      });
    } catch (notifError) {
      console.error('[ProjectMemberService] Error sending notification:', notifError);
    }

    return result;
  }

  /**
   * Get all projects a user is a member of
   * @param userId User ID
   * @param memberType Optional filter by member type
   * @returns List of project memberships
   */
  async getUserProjects(userId: string, memberType?: MemberType) {
    const conditions: any = {
      user_id: userId,
      is_active: true,
    };

    if (memberType) {
      conditions.member_type = memberType;
    }

    return await this.db.findMany('project_members', conditions);
  }

  /**
   * Update member permissions
   * @param projectId Project ID
   * @param userId User ID
   * @param permissions New permissions array
   * @returns Updated member record
   */
  async updateMemberPermissions(projectId: string, userId: string, permissions: string[]) {
    const member = await this.db.findOne('project_members', {
      project_id: projectId,
      user_id: userId,
    });

    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    return await this.db.update('project_members', member.id, {
      permissions,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Get default permissions for a member type and role
   * @param memberType Member type (client or developer)
   * @param role Member role
   * @returns Array of permission strings
   */
  private getDefaultPermissions(memberType: MemberType, role: MemberRole): string[] {
    if (memberType === MemberType.CLIENT) {
      return [
        'view_project',
        'edit_project',
        'manage_proposals',
        'view_milestones',
        'approve_milestones',
        'view_messages',
        'send_messages',
        'view_files',
        'upload_files',
        'view_team',
        'manage_payments',
      ];
    }

    // Developer permissions based on role
    const basePermissions = [
      'view_project',
      'view_milestones',
      'view_messages',
      'send_messages',
      'view_files',
      'upload_files',
      'view_team',
    ];

    if (role === MemberRole.ADMIN || role === MemberRole.OWNER) {
      return [
        ...basePermissions,
        'edit_milestones',
        'manage_tasks',
        'manage_team',
        'view_analytics',
      ];
    }

    if (role === MemberRole.DEVELOPER) {
      return [...basePermissions, 'update_milestones', 'manage_tasks'];
    }

    return basePermissions;
  }
}
