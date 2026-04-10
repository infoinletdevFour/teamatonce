import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TeamAtOnceGateway } from '../../../websocket/teamatonce.gateway';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../../notifications/dto';
import {
  CreateWhiteboardSessionDto,
  UpdateWhiteboardSessionDto,
} from './dto/whiteboard.dto';

@Injectable()
export class WhiteboardService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => TeamAtOnceGateway))
    private readonly gateway: TeamAtOnceGateway,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Create a new whiteboard session for a project
   */
  async createWhiteboardSession(
    projectId: string,
    userId: string,
    dto: CreateWhiteboardSessionDto,
  ) {
    const sessionData = {
      project_id: projectId,
      name: dto.name,
      created_by: userId,
      last_modified: new Date().toISOString(),
      canvas_data: JSON.stringify(dto.canvasData || {}),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const session = await this.db.insert('whiteboard_sessions', sessionData);
    const parsedSession = this.parseWhiteboardJson(session);

    // Notify clients about new whiteboard session via WebSocket
    this.gateway.sendToProject(projectId, 'whiteboard-session-created', {
      session: parsedSession,
      createdBy: userId,
      timestamp: new Date().toISOString(),
    });

    // Send push notification to project members
    try {
      const project = await this.db.findOne('projects', { id: projectId });
      const creator = await this.db.getUserById(userId);

      // Get project members (use project_members table, not project_team_members)
      const projectMembers = await this.db.findMany('project_members', {
        project_id: projectId,
      });

      const notifyUserIds = projectMembers
        .map((m: any) => m.user_id)
        .filter((id: string) => id && id !== userId);

      // Add client to notifications if not already included and not the creator
      if (project?.client_id && project.client_id !== userId && !notifyUserIds.includes(project.client_id)) {
        notifyUserIds.push(project.client_id);
      }

      if (notifyUserIds.length > 0) {
        await this.notificationsService.sendNotification({
          user_ids: notifyUserIds,
          type: NotificationType.UPDATE,
          title: '🎨 New Whiteboard Session',
          message: `${creator?.name || 'A team member'} started a new whiteboard session "${dto.name}" in project "${project?.name || 'Unknown'}". Join to collaborate!`,
          priority: NotificationPriority.NORMAL,
          action_url: `/project/${projectId}/whiteboard/${session.id}`,
          data: {
            projectId,
            sessionId: session.id,
            sessionName: dto.name,
            createdBy: userId,
          },
          send_push: true,
        });
      }
    } catch (error) {
      console.error('[WhiteboardService] Failed to send whiteboard notification:', error);
    }

    return parsedSession;
  }

  /**
   * Get a specific whiteboard session by ID
   */
  async getWhiteboardSession(projectId: string, sessionId: string) {
    const session = await this.db.findOne('whiteboard_sessions', {
      id: sessionId,
      project_id: projectId,
    });

    if (!session) {
      throw new NotFoundException(
        `Whiteboard session with ID ${sessionId} not found`,
      );
    }

    return this.parseWhiteboardJson(session);
  }

  /**
   * Get all whiteboard sessions for a project
   */
  async getWhiteboardSessions(projectId: string) {
    const sessions = await this.db.findMany(
      'whiteboard_sessions',
      { project_id: projectId },
      {
        orderBy: 'last_modified',
        order: 'desc',
      },
    );

    return sessions.map((s) => this.parseWhiteboardJson(s));
  }

  /**
   * Update a whiteboard session
   */
  async updateWhiteboardSession(sessionId: string, dto: UpdateWhiteboardSessionDto) {
    const session = await this.db.findOne('whiteboard_sessions', {
      id: sessionId,
    });

    if (!session) {
      throw new NotFoundException(
        `Whiteboard session with ID ${sessionId} not found`,
      );
    }

    const updateData: any = {
      canvas_data: JSON.stringify(dto.canvasData),
      last_modified: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (dto.name) {
      updateData.name = dto.name;
    }

    await this.db.update('whiteboard_sessions', sessionId, updateData);

    const updatedSession = await this.getWhiteboardSession(
      session.project_id,
      sessionId,
    );

    // Broadcast update to all clients in the whiteboard session
    // Note: Real-time updates are handled via WebSocket gateway 'whiteboard-update' event
    // This is for persistence notification
    this.gateway.sendToWhiteboard(sessionId, 'whiteboard-session-updated', {
      session: updatedSession,
      timestamp: new Date().toISOString(),
    });

    return updatedSession;
  }

  /**
   * Delete a whiteboard session
   */
  async deleteWhiteboardSession(sessionId: string) {
    const session = await this.db.findOne('whiteboard_sessions', {
      id: sessionId,
    });

    if (!session) {
      throw new NotFoundException(
        `Whiteboard session with ID ${sessionId} not found`,
      );
    }

    await this.db.delete('whiteboard_sessions', sessionId);

    // Notify clients about deleted whiteboard session
    this.gateway.sendToProject(session.project_id, 'whiteboard-session-deleted', {
      sessionId,
      timestamp: new Date().toISOString(),
    });

    return { success: true, message: 'Whiteboard session deleted successfully' };
  }

  /**
   * Get active participants in a whiteboard session
   */
  getActiveParticipants(sessionId: string): string[] {
    return this.gateway.getWhiteboardParticipants(sessionId);
  }

  /**
   * Helper method to parse JSON fields in whiteboard records
   */
  private parseWhiteboardJson(session: any) {
    if (!session) return null;

    return {
      ...session,
      canvas_data: this.safeJsonParse(session.canvas_data),
    };
  }

  /**
   * Safe JSON parser
   */
  private safeJsonParse(value: any) {
    if (!value) return null;
    if (typeof value === 'object') return value;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}
