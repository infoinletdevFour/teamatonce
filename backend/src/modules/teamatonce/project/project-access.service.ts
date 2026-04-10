/**
 * Project Access Service
 *
 * Central service for managing unified project-based access.
 * When a member is added to a project, they automatically get access to:
 * - Project Chat (conversation)
 * - Project Calendar (events)
 * - Project Video Calls
 * - Project Notes
 * - Project Files
 *
 * This eliminates the need to manually add members to each feature.
 */

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationPriority, NotificationType } from '../../notifications/dto/create-notification.dto';
import { TeamAtOnceGateway } from '../../../websocket/teamatonce.gateway';

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  member_type: 'client' | 'seller';
  company_id?: string;
  role: 'owner' | 'admin' | 'developer' | 'viewer';
  permissions: string[];
  is_active: boolean;
}

@Injectable()
export class ProjectAccessService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notificationsService: NotificationsService,
    private readonly gateway: TeamAtOnceGateway,
  ) {}

  /**
   * Sync all project features when a new member is added.
   * This is the main entry point - called when addProjectMember() succeeds.
   *
   * @param projectId Project ID
   * @param userId User ID being added
   * @param memberType 'client' or 'seller'
   */
  async syncProjectAccess(
    projectId: string,
    userId: string,
    memberType: 'client' | 'seller',
  ): Promise<void> {
    console.log(
      `[ProjectAccessService] Syncing project access for user ${userId} to project ${projectId}`,
    );

    try {
      // Run all sync operations in parallel
      await Promise.all([
        this.addToProjectConversation(projectId, userId),
        this.syncCalendarAccess(projectId, userId),
        this.syncNotesAccess(projectId, userId),
      ]);

      // Get project details for notification
      const project = await this.db.findOne('projects', { id: projectId });

      // Send notification to user about project access
      await this.notificationsService.sendNotification({
        user_id: userId,
        type: NotificationType.OTHER,
        title: 'Project Access Granted',
        message: `You now have access to "${project?.name || 'Project'}" and all its features: Chat, Calendar, Notes, Video Calls, and Files.`,
        action_url: `/company/${project?.company_id || project?.assigned_company_id}/project/${projectId}`,
        data: {
          projectId,
          memberType,
        },
        priority: NotificationPriority.NORMAL,
      });

      // Notify user via WebSocket
      this.gateway.sendToUser(userId, 'project-access-granted', {
        projectId,
        projectName: project?.name,
        memberType,
        features: ['chat', 'calendar', 'notes', 'video', 'files'],
        timestamp: new Date().toISOString(),
      });

      console.log(
        `[ProjectAccessService] Successfully synced all project features for user ${userId}`,
      );
    } catch (error) {
      console.error(
        `[ProjectAccessService] Error syncing project access:`,
        error,
      );
      // Don't throw - this is a background operation
    }
  }

  /**
   * Remove access from all project features when a member is removed.
   *
   * @param projectId Project ID
   * @param userId User ID being removed
   */
  async revokeProjectAccess(projectId: string, userId: string): Promise<void> {
    console.log(
      `[ProjectAccessService] Revoking project access for user ${userId} from project ${projectId}`,
    );

    try {
      // Remove from project conversation
      await this.removeFromProjectConversation(projectId, userId);

      // Notify user via WebSocket
      this.gateway.sendToUser(userId, 'project-access-revoked', {
        projectId,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `[ProjectAccessService] Successfully revoked access for user ${userId}`,
      );
    } catch (error) {
      console.error(
        `[ProjectAccessService] Error revoking project access:`,
        error,
      );
    }
  }

  // ============================================
  // CHAT SYNC
  // ============================================

  /**
   * Add user to project conversation (auto-creates if doesn't exist).
   * This ensures all project members can participate in the project chat.
   */
  private async addToProjectConversation(
    projectId: string,
    userId: string,
  ): Promise<void> {
    // Find or create project conversation
    let conversation = await this.db.findOne('conversations', {
      project_id: projectId,
      conversation_type: 'project',
    });

    if (!conversation) {
      // Create project conversation with this user
      conversation = await this.db.insert('conversations', {
        project_id: projectId,
        conversation_type: 'project',
        title: 'Project Chat',
        participants: JSON.stringify([userId]),
        created_by: userId,
        last_message_at: null,
        metadata: JSON.stringify({}),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      console.log(
        `[ProjectAccessService] Created project conversation ${conversation.id}`,
      );
    } else {
      // Add user to existing conversation participants
      const participants = this.safeJsonParse(conversation.participants) || [];

      if (!participants.includes(userId)) {
        participants.push(userId);

        await this.db.update('conversations', conversation.id, {
          participants: JSON.stringify(participants),
          updated_at: new Date().toISOString(),
        });

        console.log(
          `[ProjectAccessService] Added user ${userId} to conversation ${conversation.id}`,
        );

        // Notify existing participants about new member
        participants
          .filter((p: string) => p !== userId)
          .forEach((participantId: string) => {
            this.gateway.sendToUser(participantId, 'participant-added', {
              conversationId: conversation.id,
              projectId,
              newUserId: userId,
              timestamp: new Date().toISOString(),
            });
          });
      }
    }
  }

  /**
   * Remove user from project conversation
   */
  private async removeFromProjectConversation(
    projectId: string,
    userId: string,
  ): Promise<void> {
    const conversation = await this.db.findOne('conversations', {
      project_id: projectId,
      conversation_type: 'project',
    });

    if (conversation) {
      const participants = this.safeJsonParse(conversation.participants) || [];
      const updatedParticipants = participants.filter(
        (p: string) => p !== userId,
      );

      await this.db.update('conversations', conversation.id, {
        participants: JSON.stringify(updatedParticipants),
        updated_at: new Date().toISOString(),
      });

      console.log(
        `[ProjectAccessService] Removed user ${userId} from conversation ${conversation.id}`,
      );
    }
  }

  // ============================================
  // CALENDAR SYNC
  // ============================================

  /**
   * Sync calendar access for a user.
   * Project members automatically see all project calendar events.
   * (Calendar events are already project-scoped in schema)
   */
  private async syncCalendarAccess(
    projectId: string,
    userId: string,
  ): Promise<void> {
    // Calendar events are already project-scoped, so members with project access
    // can see all events. Just log this sync operation.
    console.log(
      `[ProjectAccessService] Calendar access synced for user ${userId} in project ${projectId}`,
    );

    // Notify user about upcoming events (if any)
    const upcomingEvents = await this.db.findMany(
      'calendar_events',
      {
        project_id: projectId,
        deleted_at: null,
      },
      {
        orderBy: 'date',
        order: 'asc',
        limit: 5,
      },
    );

    if (upcomingEvents.length > 0) {
      this.gateway.sendToUser(userId, 'calendar-events-available', {
        projectId,
        eventCount: upcomingEvents.length,
        nextEvent: upcomingEvents[0],
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ============================================
  // NOTES SYNC
  // ============================================

  /**
   * Sync notes access for a user.
   * Project members can see all project notes (shared_with includes all members).
   */
  private async syncNotesAccess(
    projectId: string,
    userId: string,
  ): Promise<void> {
    // Notes are already project-scoped. Members with project access can see all notes.
    console.log(
      `[ProjectAccessService] Notes access synced for user ${userId} in project ${projectId}`,
    );

    // Notify user about existing notes (if any)
    const notes = await this.db.findMany(
      'notes',
      {
        project_id: projectId,
        deleted_at: null,
        parent_id: null, // Top-level notes only
      },
      {
        orderBy: 'updated_at',
        order: 'desc',
        limit: 5,
      },
    );

    if (notes.length > 0) {
      this.gateway.sendToUser(userId, 'notes-available', {
        projectId,
        noteCount: notes.length,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get all active members of a project
   */
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    return await this.db.findMany('project_members', {
      project_id: projectId,
      is_active: true,
    });
  }

  /**
   * Get all project member user IDs
   */
  async getProjectMemberIds(projectId: string): Promise<string[]> {
    const members = await this.getProjectMembers(projectId);
    return members.map((m) => m.user_id);
  }

  /**
   * Check if user has access to a project
   */
  async hasProjectAccess(projectId: string, userId: string): Promise<boolean> {
    const member = await this.db.findOne('project_members', {
      project_id: projectId,
      user_id: userId,
      is_active: true,
    });
    return !!member;
  }

  /**
   * Get user's role in a project
   */
  async getProjectRole(
    projectId: string,
    userId: string,
  ): Promise<string | null> {
    const member = await this.db.findOne('project_members', {
      project_id: projectId,
      user_id: userId,
      is_active: true,
    });
    return member?.role || null;
  }

  /**
   * Check if user has specific permission in a project
   */
  async hasPermission(
    projectId: string,
    userId: string,
    permission: string,
  ): Promise<boolean> {
    const member = await this.db.findOne('project_members', {
      project_id: projectId,
      user_id: userId,
      is_active: true,
    });

    if (!member) return false;

    const permissions = this.safeJsonParse(member.permissions) || [];
    return permissions.includes(permission);
  }

  /**
   * Safe JSON parser
   */
  private safeJsonParse(value: any): any {
    if (!value) return null;
    if (typeof value === 'object') return value;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}
