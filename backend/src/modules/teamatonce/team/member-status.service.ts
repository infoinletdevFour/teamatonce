import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AppGateway } from '../../../common/gateways/app.gateway';
import { UpdateMemberStatusDto, OnlineStatus } from './dto/member-status.dto';

@Injectable()
export class MemberStatusService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => AppGateway))
    private readonly appGateway: AppGateway
  ) {}

  /**
   * Update member online/offline status and broadcast to relevant projects
   */
  async updateMemberStatus(
    memberId: string,
    status: OnlineStatus,
    deviceInfo?: string
  ) {
    try {
      // Verify team member exists
      const memberQuery = this.db.table('team_members')
        .where('id', '=', memberId)
        .where('is_active', '=', true)
        .limit(1);

      const memberResult = await memberQuery.execute();
      const member = memberResult.data?.[0];

      if (!member) {
        throw new NotFoundException(`Team member with ID ${memberId} not found`);
      }

      const now = new Date().toISOString();

      // Update member's availability status
      const updateQuery = /* TODO: replace client call */ this.db.client.table('team_members')
        .where('id', '=', memberId);

      await updateQuery.update({
        availability_status: this.mapOnlineStatusToAvailability(status),
        updated_at: now
      });

      // Get all active projects this team member is assigned to
      const assignmentsQuery = this.db.table('project_team_assignments')
        .where('team_member_id', '=', memberId)
        .where('is_active', '=', true);

      const assignmentsResult = await assignmentsQuery.execute();
      const assignments = assignmentsResult.data || [];

      const projectIds = assignments.map(a => a.project_id);

      // Broadcast status update via WebSocket
      const statusUpdate = {
        member_id: memberId,
        display_name: member.display_name,
        role: member.role,
        status,
        last_seen: now,
        device_info: deviceInfo || null,
        profile_image: member.profile_image
      };

      // Emit to each project room
      projectIds.forEach(projectId => {
        this.appGateway.emitToRoom(
          `project:${projectId}`,
          'team:member_status_changed',
          statusUpdate
        );
      });

      // Also emit to user's personal room
      if (member.user_id) {
        this.appGateway.emitToUser(
          member.user_id,
          'team:status_updated',
          statusUpdate
        );
      }

      return {
        member_id: memberId,
        status,
        last_seen: now,
        project_ids: projectIds
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('[MemberStatusService] Error updating member status:', error);
      throw new BadRequestException('Failed to update member status');
    }
  }

  /**
   * Get all currently online team members
   */
  async getAllOnlineMembers() {
    try {
      // Get all active team members with 'available' status
      const query = this.db.table('team_members')
        .where('is_active', '=', true)
        .where('availability_status', '=', 'available')
        .orderBy('display_name', 'asc');

      const result = await query.execute();
      const members = result.data || [];

      // Check WebSocket gateway for actual online status
      const onlineUserIds = this.appGateway.getOnlineUsers();

      return members
        .filter(member => onlineUserIds.includes(member.user_id))
        .map(member => ({
          member_id: member.id,
          user_id: member.user_id,
          display_name: member.display_name,
          role: member.role,
          status: OnlineStatus.ONLINE,
          last_seen: member.updated_at,
          profile_image: member.profile_image,
          skills: this.safeJsonParse(member.skills, []),
          technologies: this.safeJsonParse(member.technologies, [])
        }));
    } catch (error) {
      console.error('[MemberStatusService] Error fetching online members:', error);
      throw new BadRequestException('Failed to fetch online members');
    }
  }

  /**
   * Get status of a specific member
   */
  async getMemberStatus(memberId: string) {
    try {
      const memberQuery = this.db.table('team_members')
        .where('id', '=', memberId)
        .where('is_active', '=', true)
        .limit(1);

      const memberResult = await memberQuery.execute();
      const member = memberResult.data?.[0];

      if (!member) {
        throw new NotFoundException(`Team member with ID ${memberId} not found`);
      }

      // Check if user is actually online via WebSocket
      const isOnline = member.user_id ? this.appGateway.isUserOnline(member.user_id) : false;

      let status: OnlineStatus;
      if (isOnline) {
        status = this.mapAvailabilityToOnlineStatus(member.availability_status);
      } else {
        status = OnlineStatus.OFFLINE;
      }

      return {
        member_id: member.id,
        user_id: member.user_id,
        display_name: member.display_name,
        role: member.role,
        status,
        last_seen: member.updated_at,
        profile_image: member.profile_image,
        is_online: isOnline
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('[MemberStatusService] Error fetching member status:', error);
      throw new BadRequestException('Failed to fetch member status');
    }
  }

  /**
   * Get online status of all team members assigned to a project
   */
  async getProjectTeamStatus(projectId: string) {
    try {
      // Verify project exists
      const projectQuery = this.db.table('projects')
        .where('id', '=', projectId)
        .limit(1);

      const projectResult = await projectQuery.execute();
      const project = projectResult.data?.[0];

      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      // Get all active team assignments for this project
      const assignmentsQuery = this.db.table('project_team_assignments')
        .where('project_id', '=', projectId)
        .where('is_active', '=', true);

      const assignmentsResult = await assignmentsQuery.execute();
      const assignments = assignmentsResult.data || [];

      if (assignments.length === 0) {
        return [];
      }

      // Get team member details
      const memberIds = assignments.map(a => a.team_member_id);
      const membersQuery = this.db.table('team_members')
        .whereIn('id', memberIds)
        .where('is_active', '=', true);

      const membersResult = await membersQuery.execute();
      const members = membersResult.data || [];

      // Get online users from WebSocket gateway
      const onlineUserIds = this.appGateway.getOnlineUsers();

      // Combine assignment and member data with online status
      return assignments.map(assignment => {
        const member = members.find(m => m.id === assignment.team_member_id);
        if (!member) return null;

        const isOnline = member.user_id ? onlineUserIds.includes(member.user_id) : false;

        let status: OnlineStatus;
        if (isOnline) {
          status = this.mapAvailabilityToOnlineStatus(member.availability_status);
        } else {
          status = OnlineStatus.OFFLINE;
        }

        return {
          member_id: member.id,
          user_id: member.user_id,
          display_name: member.display_name,
          project_role: assignment.project_role,
          allocation_percentage: assignment.allocation_percentage,
          role: member.role,
          status,
          last_seen: member.updated_at,
          profile_image: member.profile_image,
          is_online: isOnline
        };
      }).filter(item => item !== null);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('[MemberStatusService] Error fetching project team status:', error);
      throw new BadRequestException('Failed to fetch project team status');
    }
  }

  /**
   * Bulk update member statuses (for reconnection scenarios)
   */
  async bulkUpdateStatuses(updates: UpdateMemberStatusDto[]) {
    try {
      const results = await Promise.allSettled(
        updates.map(update =>
          this.updateMemberStatus(update.member_id, update.status, update.device_info)
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        total: updates.length,
        successful,
        failed,
        results: results.map((result, index) => ({
          member_id: updates[index].member_id,
          status: result.status,
          data: result.status === 'fulfilled' ? result.value : null,
          error: result.status === 'rejected' ? result.reason.message : null
        }))
      };
    } catch (error) {
      console.error('[MemberStatusService] Error in bulk status update:', error);
      throw new BadRequestException('Failed to perform bulk status update');
    }
  }

  /**
   * Handle member disconnect (called from WebSocket gateway)
   */
  async handleMemberDisconnect(userId: string) {
    try {
      // Find team member by user_id
      const memberQuery = this.db.table('team_members')
        .where('user_id', '=', userId)
        .where('is_active', '=', true)
        .limit(1);

      const memberResult = await memberQuery.execute();
      const member = memberResult.data?.[0];

      if (!member) {
        // Not a team member, ignore
        return;
      }

      // Update to offline status
      await this.updateMemberStatus(member.id, OnlineStatus.OFFLINE);
    } catch (error) {
      console.error('[MemberStatusService] Error handling member disconnect:', error);
      // Non-critical, don't throw
    }
  }

  /**
   * Handle member connect (called from WebSocket gateway)
   */
  async handleMemberConnect(userId: string, deviceInfo?: string) {
    try {
      // Find team member by user_id
      const memberQuery = this.db.table('team_members')
        .where('user_id', '=', userId)
        .where('is_active', '=', true)
        .limit(1);

      const memberResult = await memberQuery.execute();
      const member = memberResult.data?.[0];

      if (!member) {
        // Not a team member, ignore
        return;
      }

      // Update to online status
      await this.updateMemberStatus(member.id, OnlineStatus.ONLINE, deviceInfo);
    } catch (error) {
      console.error('[MemberStatusService] Error handling member connect:', error);
      // Non-critical, don't throw
    }
  }

  /**
   * Helper: Map OnlineStatus to availability_status
   */
  private mapOnlineStatusToAvailability(status: OnlineStatus): string {
    switch (status) {
      case OnlineStatus.ONLINE:
        return 'available';
      case OnlineStatus.AWAY:
      case OnlineStatus.BUSY:
        return 'busy';
      case OnlineStatus.OFFLINE:
        return 'unavailable';
      default:
        return 'available';
    }
  }

  /**
   * Helper: Map availability_status to OnlineStatus
   */
  private mapAvailabilityToOnlineStatus(availability: string): OnlineStatus {
    switch (availability) {
      case 'available':
        return OnlineStatus.ONLINE;
      case 'busy':
        return OnlineStatus.BUSY;
      case 'unavailable':
        return OnlineStatus.OFFLINE;
      default:
        return OnlineStatus.ONLINE;
    }
  }

  /**
   * Helper: Safe JSON parse with fallback
   */
  private safeJsonParse(value: any, fallback: any = null) {
    if (!value) return fallback;
    if (typeof value === 'object') return value;

    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
}
