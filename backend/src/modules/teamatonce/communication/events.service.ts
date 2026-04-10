import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TeamAtOnceGateway } from '../../../websocket/teamatonce.gateway';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../../notifications/dto';
import { CreateEventDto, UpdateEventDto } from './dto/events.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly gateway: TeamAtOnceGateway,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Transform a database event (snake_case) to frontend format (camelCase)
   * This must match the transformation in frontend's getCalendarEvents
   */
  private transformEventToFrontendFormat(event: any): any {
    // Extract YYYY-MM-DD from date if it's an ISO timestamp
    const dateStr = event.date?.includes('T') ? event.date.split('T')[0] : event.date;

    // Parse attendees from JSON if it's a string
    let attendees = event.attendees || [];
    if (typeof attendees === 'string') {
      try {
        attendees = JSON.parse(attendees);
      } catch {
        attendees = [];
      }
    }

    return {
      id: event.id,
      projectId: event.project_id, // Needed for WebSocket event filtering
      title: event.title,
      description: event.description || '',
      type: event.type,
      startTime: event.start_time,
      endTime: event.end_time,
      date: dateStr,
      location: event.location,
      isVirtual: !!event.meeting_url,
      meetingLink: event.meeting_url,
      attendees: attendees,
      projectName: event.project_name || '',
      priority: event.priority || 'normal',
      status: event.status || 'upcoming',
      reminderMinutes: event.reminder_minutes,
      reminderSent: event.reminder_sent,
      createdBy: event.created_by,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      color: event.color,
    };
  }

  /**
   * Get the correct company ID for a user based on their role in the project
   * - Client team members → use project.company_id (client's company)
   * - Developer team members → use project.assigned_company_id (developer's company)
   */
  private async getCompanyIdForUser(
    userId: string,
    projectId: string,
    project: any,
    projectMembers: any[],
  ): Promise<string | null> {
    // Check if user is the project client (owner)
    if (userId === project.client_id) {
      return project.company_id;
    }

    // Find user in project_members to determine their member_type
    const member = projectMembers.find((m: any) => m.user_id === userId);

    if (member) {
      if (member.member_type === 'client') {
        // Client team member → use client's company ID
        return project.company_id;
      } else if (member.member_type === 'developer') {
        // Developer team member → use assigned developer company ID
        return project.assigned_company_id || member.company_id;
      }
    }

    // Fallback: check if user belongs to the assigned developer company
    if (project.assigned_company_id) {
      const companyMember = await this.db.findOne('company_team_members', {
        company_id: project.assigned_company_id,
        user_id: userId,
        status: 'active',
      });
      if (companyMember) {
        return project.assigned_company_id;
      }
    }

    // Fallback: check if user belongs to the client's company
    if (project.company_id) {
      const clientCompanyMember = await this.db.findOne('company_team_members', {
        company_id: project.company_id,
        user_id: userId,
        status: 'active',
      });
      if (clientCompanyMember) {
        return project.company_id;
      }
    }

    // Default to client's company if we can't determine
    return project.company_id;
  }

  /**
   * Get calendar events for a project with optional date range filter
   */
  async getEvents(projectId: string, start?: string, end?: string) {
    const conditions: any = {
      project_id: projectId,
      deleted_at: null,
    };

    // If date range is provided, use query builder for complex conditions
    if (start && end) {
      const query = this.db
        .table('calendar_events')
        .where('project_id', '=', projectId)
        .where('date', '>=', start)
        .where('date', '<=', end)
        .isNull('deleted_at')
        .orderBy('date', 'asc');

      const result = await query.execute();
      return result.data || [];
    }

    // Otherwise use simple findMany
    const events = await this.db.findMany(
      'calendar_events',
      conditions,
      {
        orderBy: 'date',
        order: 'asc',
      },
    );

    return events;
  }

  /**
   * Create a new calendar event
   */
  async createEvent(projectId: string, createdBy: string, dto: CreateEventDto) {
    // Check if project exists and is not completed
    const project = await this.db.findOne('projects', { id: projectId });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    if (project.status === 'completed' || project.status === 'ended') {
      throw new BadRequestException('Cannot create events on completed or ended projects');
    }

    // Prepare attendees list - creator is always included as default attendee
    let attendees: string[] = [];
    if (dto.attendees && dto.attendees.length > 0) {
      // Use provided attendees but ensure creator is always included
      attendees = [...new Set([createdBy, ...dto.attendees])];
    } else {
      // If no attendees specified, only the creator is an attendee
      attendees = [createdBy];
    }

    const eventData = {
      project_id: projectId,
      created_by: createdBy,
      title: dto.title,
      description: dto.description || null,
      date: dto.date, // Event date (YYYY-MM-DD)
      start_time: dto.startTime, // e.g., "09:00"
      end_time: dto.endTime, // e.g., "10:00"
      type: dto.type || 'meeting',
      meeting_url: dto.meetingUrl || null,
      priority: dto.priority || 'normal',
      status: dto.status || 'upcoming',
      color: dto.color || '#3b82f6', // Default blue color
      location: dto.location || null,
      attendees: JSON.stringify(attendees), // Store attendees as JSON
      reminder_minutes: dto.reminderMinutes || null, // Minutes before event to send reminder
      reminder_sent: false, // Initialize as not sent
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    const savedEvent = await this.db.insert('calendar_events', eventData);

    // Transform event to frontend format (camelCase) before sending via WebSocket
    const frontendEvent = this.transformEventToFrontendFormat(savedEvent);

    // Only notify attendees (except creator) via WebSocket
    const attendeesToNotify = attendees.filter((id: string) => id !== createdBy);
    attendeesToNotify.forEach((userId: string) => {
      this.gateway.sendToUser(userId, 'calendar-event-created', {
        event: frontendEvent,
        createdBy,
        timestamp: new Date().toISOString(),
      });
    });

    // Send push notification only to attendees (not all project members)
    try {
      const creator = await this.db.getUserById(createdBy);

      // Get project members for determining company context
      const projectMembers = await this.db.findMany('project_members', {
        project_id: projectId,
      });

      if (attendeesToNotify.length > 0) {
        const eventTime = dto.startTime ? ` at ${dto.startTime}` : '';
        const priorityEmoji = dto.priority === 'high' ? '🔴' : dto.priority === 'low' ? '🔵' : '📅';
        const notificationTitle = `${priorityEmoji} New Event: ${dto.title}`;
        const notificationMessage = `${creator?.name || 'A team member'} added a new ${dto.type || 'event'} "${dto.title}" on ${dto.date}${eventTime} for project "${project?.name || 'Unknown'}".`;

        // Send individual notifications with correct company context per user
        for (const userId of attendeesToNotify) {
          const userCompanyId = await this.getCompanyIdForUser(userId, projectId, project, projectMembers);

          await this.notificationsService.sendNotification({
            user_id: userId,
            type: NotificationType.REMINDER,
            title: notificationTitle,
            message: notificationMessage,
            priority: dto.priority === 'high' ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
            action_url: `/company/${userCompanyId}/project/${projectId}/calendar`,
            data: {
              projectId,
              companyId: userCompanyId,
              eventId: savedEvent.id,
              eventTitle: dto.title,
              eventDate: dto.date,
              eventType: dto.type,
            },
            send_push: true,
          });
        }
      }
    } catch (error) {
      console.error('[EventsService] Failed to send event notification:', error);
    }

    return savedEvent;
  }

  /**
   * Update a calendar event
   */
  async updateEvent(projectId: string, eventId: string, dto: UpdateEventDto, updatedBy?: string) {
    const event = await this.db.findOne('calendar_events', {
      id: eventId,
      project_id: projectId,
      deleted_at: null,
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.date) updateData.date = dto.date;
    if (dto.startTime) updateData.start_time = dto.startTime;
    if (dto.endTime) updateData.end_time = dto.endTime;
    if (dto.type) updateData.type = dto.type;
    if (dto.meetingUrl !== undefined) updateData.meeting_url = dto.meetingUrl;
    if (dto.priority) updateData.priority = dto.priority;
    if (dto.status) updateData.status = dto.status;
    if (dto.color) updateData.color = dto.color;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.attendees !== undefined) {
      // Ensure creator is always an attendee
      const attendeesWithCreator = [...new Set([event.created_by, ...dto.attendees])];
      updateData.attendees = JSON.stringify(attendeesWithCreator);
    }

    // Handle reminder field
    if (dto.reminderMinutes !== undefined) {
      updateData.reminder_minutes = dto.reminderMinutes || null;
      // Reset reminder_sent when reminder is changed
      updateData.reminder_sent = false;
    }

    // Reset reminder_sent if date or time changes (so reminder can be sent again for new time)
    if (dto.date || dto.startTime) {
      updateData.reminder_sent = false;
    }

    await this.db.update('calendar_events', eventId, updateData);

    const updatedEvent = await this.db.findOne('calendar_events', {
      id: eventId,
    });

    // Transform event to frontend format (camelCase) before sending via WebSocket
    const frontendEvent = this.transformEventToFrontendFormat(updatedEvent);

    // Get attendees from the updated event
    let attendees: string[] = [];
    if (typeof updatedEvent.attendees === 'string') {
      try {
        attendees = JSON.parse(updatedEvent.attendees);
      } catch {
        attendees = [];
      }
    } else {
      attendees = updatedEvent.attendees || [];
    }

    // Only notify attendees (except the one who updated)
    const attendeesToNotify = attendees.filter((id: string) => id !== updatedBy);

    // Notify attendees about the updated event via WebSocket
    attendeesToNotify.forEach((userId: string) => {
      this.gateway.sendToUser(userId, 'calendar-event-updated', {
        event: frontendEvent,
        updatedBy,
        timestamp: new Date().toISOString(),
      });
    });

    // Send push notifications only to attendees
    try {
      const project = await this.db.findOne('projects', { id: projectId });

      // Get project members for determining company context
      const projectMembers = await this.db.findMany('project_members', {
        project_id: projectId,
      });

      if (attendeesToNotify.length > 0) {
        const notificationTitle = `📝 Event Updated: ${updatedEvent.title}`;
        const notificationMessage = `The event "${updatedEvent.title}" on ${updatedEvent.date} has been updated.`;

        // Send individual notifications with correct company context per user
        for (const userId of attendeesToNotify) {
          const userCompanyId = await this.getCompanyIdForUser(userId, projectId, project, projectMembers);

          await this.notificationsService.sendNotification({
            user_id: userId,
            type: NotificationType.REMINDER,
            title: notificationTitle,
            message: notificationMessage,
            priority: NotificationPriority.NORMAL,
            action_url: `/company/${userCompanyId}/project/${projectId}/calendar`,
            data: {
              projectId,
              companyId: userCompanyId,
              eventId: updatedEvent.id,
              eventTitle: updatedEvent.title,
              eventDate: updatedEvent.date,
              eventType: updatedEvent.type,
            },
            send_push: true,
          });
        }
      }
    } catch (error) {
      console.error('[EventsService] Failed to send event update notification:', error);
    }

    return updatedEvent;
  }

  /**
   * Delete a calendar event (soft delete)
   */
  async deleteEvent(projectId: string, eventId: string, deletedBy?: string) {
    const event = await this.db.findOne('calendar_events', {
      id: eventId,
      project_id: projectId,
      deleted_at: null,
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    await this.db.update('calendar_events', eventId, {
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Get attendees from the event
    let attendees: string[] = [];
    if (typeof event.attendees === 'string') {
      try {
        attendees = JSON.parse(event.attendees);
      } catch {
        attendees = [];
      }
    } else {
      attendees = event.attendees || [];
    }

    // Only notify attendees (except the one who deleted)
    const attendeesToNotify = attendees.filter((id: string) => id !== deletedBy);

    // Notify attendees about the deleted event via WebSocket
    attendeesToNotify.forEach((userId: string) => {
      this.gateway.sendToUser(userId, 'calendar-event-deleted', {
        eventId,
        deletedBy,
        timestamp: new Date().toISOString(),
      });
    });

    // Send push notifications only to attendees
    try {
      const project = await this.db.findOne('projects', { id: projectId });

      // Get project members for determining company context
      const projectMembers = await this.db.findMany('project_members', {
        project_id: projectId,
      });

      if (attendeesToNotify.length > 0) {
        const notificationTitle = `🗑️ Event Deleted: ${event.title}`;
        const notificationMessage = `The event "${event.title}" on ${event.date} has been deleted.`;

        // Send individual notifications with correct company context per user
        for (const userId of attendeesToNotify) {
          const userCompanyId = await this.getCompanyIdForUser(userId, projectId, project, projectMembers);

          await this.notificationsService.sendNotification({
            user_id: userId,
            type: NotificationType.REMINDER,
            title: notificationTitle,
            message: notificationMessage,
            priority: NotificationPriority.NORMAL,
            action_url: `/company/${userCompanyId}/project/${projectId}/calendar`,
            data: {
              projectId,
              companyId: userCompanyId,
            },
            send_push: true,
          });
        }
      }
    } catch (error) {
      console.error('[EventsService] Failed to send event deletion notification:', error);
    }

    return { success: true, message: 'Event deleted successfully' };
  }

  /**
   * Get a specific event by ID
   */
  async getEventById(eventId: string) {
    const event = await this.db.findOne('calendar_events', {
      id: eventId,
      deleted_at: null,
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return event;
  }
}
