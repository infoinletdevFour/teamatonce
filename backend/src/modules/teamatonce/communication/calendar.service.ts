/**
 * Calendar Service
 *
 * Manages project calendar events with automatic project member access.
 * All project members can view and interact with calendar events.
 * Auto-notification to all project members when events are created/updated.
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IsString, IsOptional, IsArray, IsIn } from 'class-validator';
import { DatabaseService } from '../../database/database.service';
import { TeamAtOnceGateway } from '../../../websocket/teamatonce.gateway';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationPriority, NotificationType } from '../../notifications/dto/create-notification.dto';
import { ProjectAccessService } from '../project/project-access.service';

export class CreateCalendarEventDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  date: string; // YYYY-MM-DD format

  @IsString()
  startTime: string; // HH:MM format

  @IsString()
  endTime: string; // HH:MM format

  @IsOptional()
  @IsIn(['meeting', 'deadline', 'call', 'review', 'milestone'])
  type?: 'meeting' | 'deadline' | 'call' | 'review' | 'milestone';

  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @IsOptional()
  @IsIn(['high', 'medium', 'low', 'normal'])
  priority?: 'high' | 'medium' | 'low' | 'normal';

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attendees?: string[]; // Array of user IDs who are attending
}

export class UpdateCalendarEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsIn(['upcoming', 'completed', 'cancelled'])
  status?: 'upcoming' | 'completed' | 'cancelled';

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attendees?: string[]; // Array of user IDs who are attending
}

export enum EventStatus {
  UPCOMING = 'upcoming',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Injectable()
export class CalendarService {
  constructor(
    private readonly db: DatabaseService,
    private readonly gateway: TeamAtOnceGateway,
    private readonly notificationsService: NotificationsService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  /**
   * Create a new calendar event for a project.
   * Automatically notifies all project members.
   */
  async createEvent(
    projectId: string,
    createdBy: string,
    dto: CreateCalendarEventDto,
  ) {
    // Check if project exists and is not completed
    const project = await this.db.findOne('projects', { id: projectId });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Block event creation on completed or ended projects
    if (project.status === 'completed' || project.status === 'ended') {
      throw new BadRequestException('Cannot create events on completed or ended projects');
    }

    // Validate date and time format
    if (!this.isValidDate(dto.date)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    if (!this.isValidTime(dto.startTime) || !this.isValidTime(dto.endTime)) {
      throw new BadRequestException('Invalid time format. Use HH:MM');
    }

    // Validate that the event is not in the past
    if (this.isDateTimeInPast(dto.date, dto.startTime)) {
      throw new BadRequestException('Cannot create an event in the past. Please select a future date and time.');
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
      title: dto.title,
      description: dto.description || null,
      date: dto.date,
      start_time: dto.startTime,
      end_time: dto.endTime,
      type: dto.type || 'meeting',
      meeting_url: dto.meetingUrl || null,
      priority: dto.priority || 'normal',
      status: EventStatus.UPCOMING,
      color: dto.color || null,
      location: dto.location || null,
      attendees: JSON.stringify(attendees),
      created_by: createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    const event = await this.db.insert('calendar_events', eventData);
    const transformedEvent = this.transformEvent(event);

    // Only notify attendees (except creator)
    const attendeesToNotify = attendees.filter((id) => id !== createdBy);

    // Send WebSocket notification to attendees
    attendeesToNotify.forEach((userId) => {
      this.gateway.sendToUser(userId, 'calendar-event-created', {
        event: transformedEvent,
        createdBy,
        timestamp: new Date().toISOString(),
      });
    });

    // Send in-app and push notifications only to selected attendees
    if (attendeesToNotify.length > 0) {
      const companyId = project.company_id;
      await this.notificationsService.sendNotification({
        user_ids: attendeesToNotify,
        type: NotificationType.REMINDER, // Using reminder type for calendar events
        title: 'New Calendar Event',
        message: `"${dto.title}" has been scheduled for ${dto.date} at ${dto.startTime}`,
        action_url: `/company/${companyId}/project/${projectId}/calendar?event=${event.id}`,
        data: {
          projectId,
          companyId,
          eventId: event.id,
          eventType: dto.type,
        },
        priority: dto.priority === 'high' ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
        send_push: true, // Enable browser/mobile push notifications
      });
    }

    return transformedEvent;
  }

  /**
   * Get all calendar events for a project.
   * Any project member can view all events.
   */
  async getProjectEvents(
    projectId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      type?: string;
      status?: string;
    },
  ) {
    // Build query conditions
    const conditions: any = {
      project_id: projectId,
      deleted_at: null,
    };

    if (options?.type) {
      conditions.type = options.type;
    }

    if (options?.status) {
      conditions.status = options.status;
    }

    let events = await this.db.findMany('calendar_events', conditions, {
      orderBy: 'date',
      order: 'asc',
    });

    // Filter by date range if provided
    if (options?.startDate || options?.endDate) {
      events = events.filter((event: any) => {
        const eventDate = new Date(event.date);
        if (options.startDate && eventDate < new Date(options.startDate)) {
          return false;
        }
        if (options.endDate && eventDate > new Date(options.endDate)) {
          return false;
        }
        return true;
      });
    }

    return this.transformEvents(events);
  }

  /**
   * Get a single calendar event by ID.
   */
  async getEventById(eventId: string, transform: boolean = true) {
    const event = await this.db.findOne('calendar_events', {
      id: eventId,
      deleted_at: null,
    });

    if (!event) {
      throw new NotFoundException(`Calendar event with ID ${eventId} not found`);
    }

    return transform ? this.transformEvent(event) : event;
  }

  /**
   * Get upcoming events for a project.
   */
  async getUpcomingEvents(projectId: string, limit: number = 10) {
    const today = new Date().toISOString().split('T')[0];

    const allEvents = await this.db.findMany(
      'calendar_events',
      {
        project_id: projectId,
        deleted_at: null,
        status: EventStatus.UPCOMING,
      },
      {
        orderBy: 'date',
        order: 'asc',
      },
    );

    // Filter for future dates and limit
    const filteredEvents = allEvents
      .filter((event: any) => event.date >= today)
      .slice(0, limit);

    return this.transformEvents(filteredEvents);
  }

  /**
   * Update a calendar event.
   * Only the creator can update the event.
   * Notifies all project members about the change.
   */
  async updateEvent(
    eventId: string,
    updatedBy: string,
    dto: UpdateCalendarEventDto,
  ) {
    // Get raw event for project_id access and creator check
    const event = await this.getEventById(eventId, false);

    // Check if the user is the creator of the event
    if (event.created_by !== updatedBy) {
      throw new BadRequestException('You can only edit events that you created.');
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.date !== undefined) {
      if (!this.isValidDate(dto.date)) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
      }
      updateData.date = dto.date;
    }
    if (dto.startTime !== undefined) {
      if (!this.isValidTime(dto.startTime)) {
        throw new BadRequestException('Invalid time format. Use HH:MM');
      }
      updateData.start_time = dto.startTime;
    }
    if (dto.endTime !== undefined) {
      if (!this.isValidTime(dto.endTime)) {
        throw new BadRequestException('Invalid time format. Use HH:MM');
      }
      updateData.end_time = dto.endTime;
    }
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.meetingUrl !== undefined) updateData.meeting_url = dto.meetingUrl;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.color !== undefined) updateData.color = dto.color;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.attendees !== undefined) {
      // Ensure creator is always an attendee
      const attendeesWithCreator = [...new Set([event.created_by, ...dto.attendees])];
      updateData.attendees = JSON.stringify(attendeesWithCreator);
    }

    // Validate that the final date/time is not in the past
    const finalDate = updateData.date || event.date;
    const finalStartTime = updateData.start_time || event.start_time;
    if (this.isDateTimeInPast(finalDate, finalStartTime)) {
      throw new BadRequestException('Cannot set an event to a past date/time. Please select a future date and time.');
    }

    await this.db.update('calendar_events', eventId, updateData);
    const updatedEvent = await this.getEventById(eventId);

    // Get attendees from the updated event (or use existing attendees)
    const attendees = this.safeJsonParse(updateData.attendees) || this.safeJsonParse(event.attendees) || [];
    const attendeesToNotify = attendees.filter((id: string) => id !== updatedBy);

    // Notify attendees about the update via WebSocket
    attendeesToNotify.forEach((userId: string) => {
      this.gateway.sendToUser(userId, 'calendar-event-updated', {
        event: updatedEvent,
        updatedBy,
        timestamp: new Date().toISOString(),
      });
    });

    // Send in-app and push notifications only to attendees
    if (attendeesToNotify.length > 0) {
      const eventTitle = updateData.title || event.title;
      const eventDate = updateData.date || event.date;
      const eventStartTime = updateData.start_time || event.start_time;

      // Get company_id from project for the action URL
      const project = await this.db.findOne('projects', { id: event.project_id });
      const companyId = project?.company_id;

      await this.notificationsService.sendNotification({
        user_ids: attendeesToNotify,
        type: NotificationType.REMINDER,
        title: 'Calendar Event Updated',
        message: `"${eventTitle}" has been updated - ${eventDate} at ${eventStartTime}`,
        action_url: `/company/${companyId}/project/${event.project_id}/calendar?event=${eventId}`,
        data: {
          projectId: event.project_id,
          companyId,
          eventId: eventId,
          eventType: updateData.type || event.type,
        },
        priority: (updateData.priority || event.priority) === 'high' ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
        send_push: true, // Enable browser/mobile push notifications
      });
    }

    return updatedEvent;
  }

  /**
   * Delete a calendar event (soft delete).
   * Notifies attendees about the deletion.
   */
  async deleteEvent(eventId: string, deletedBy: string) {
    // Get raw event for project_id access
    const event = await this.getEventById(eventId, false);

    await this.db.update('calendar_events', eventId, {
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Get attendees from the event and notify them (except the one who deleted)
    const attendees = this.safeJsonParse(event.attendees) || [];
    const attendeesToNotify = attendees.filter((id: string) => id !== deletedBy);

    // Notify attendees about the deletion via WebSocket
    attendeesToNotify.forEach((userId: string) => {
      this.gateway.sendToUser(userId, 'calendar-event-deleted', {
        eventId,
        deletedBy,
        timestamp: new Date().toISOString(),
      });
    });

    // Send in-app and push notifications only to attendees
    if (attendeesToNotify.length > 0) {
      // Get company_id from project for the action URL
      const project = await this.db.findOne('projects', { id: event.project_id });
      const companyId = project?.company_id;

      await this.notificationsService.sendNotification({
        user_ids: attendeesToNotify,
        type: NotificationType.REMINDER,
        title: 'Calendar Event Deleted',
        message: `"${event.title}" scheduled for ${event.date} has been deleted`,
        action_url: `/company/${companyId}/project/${event.project_id}/calendar`,
        data: {
          projectId: event.project_id,
          companyId,
        },
        priority: NotificationPriority.NORMAL,
        send_push: true, // Enable browser/mobile push notifications
      });
    }

    return { success: true, message: 'Calendar event deleted successfully' };
  }

  /**
   * Mark an event as completed.
   */
  async completeEvent(eventId: string, completedBy: string) {
    return this.updateEvent(eventId, completedBy, {
      status: EventStatus.COMPLETED,
    });
  }

  /**
   * Cancel an event.
   * Notifies attendees about the cancellation.
   */
  async cancelEvent(eventId: string, cancelledBy: string) {
    // Get raw event for project_id and other fields access
    const event = await this.getEventById(eventId, false);

    await this.db.update('calendar_events', eventId, {
      status: EventStatus.CANCELLED,
      updated_at: new Date().toISOString(),
    });

    const updatedEvent = await this.getEventById(eventId);

    // Get attendees from the event and notify them (except the one who cancelled)
    const attendees = this.safeJsonParse(event.attendees) || [];
    const attendeesToNotify = attendees.filter((id: string) => id !== cancelledBy);

    // Send cancellation notification with push only to attendees
    if (attendeesToNotify.length > 0) {
      // Get company_id from project for the action URL
      const project = await this.db.findOne('projects', { id: event.project_id });
      const companyId = project?.company_id;

      await this.notificationsService.sendNotification({
        user_ids: attendeesToNotify,
        type: NotificationType.REMINDER,
        title: 'Event Cancelled',
        message: `"${event.title}" scheduled for ${event.date} has been cancelled`,
        action_url: `/company/${companyId}/project/${event.project_id}/calendar`,
        data: {
          projectId: event.project_id,
          companyId,
          eventId: eventId,
        },
        priority: NotificationPriority.NORMAL,
        send_push: true, // Enable browser/mobile push notifications
      });
    }

    // Send WebSocket notification to attendees
    attendeesToNotify.forEach((userId: string) => {
      this.gateway.sendToUser(userId, 'calendar-event-cancelled', {
        event: updatedEvent,
        cancelledBy,
        timestamp: new Date().toISOString(),
      });
    });

    return updatedEvent;
  }

  /**
   * Get events for a specific date.
   */
  async getEventsByDate(projectId: string, date: string) {
    if (!this.isValidDate(date)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    const events = await this.db.findMany(
      'calendar_events',
      {
        project_id: projectId,
        date,
        deleted_at: null,
      },
      {
        orderBy: 'start_time',
        order: 'asc',
      },
    );

    return this.transformEvents(events);
  }

  /**
   * Get events for a date range (for calendar view).
   */
  async getEventsInRange(
    projectId: string,
    startDate: string,
    endDate: string,
  ) {
    return this.getProjectEvents(projectId, { startDate, endDate });
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private isValidDate(dateStr: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private isValidTime(timeStr: string): boolean {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(timeStr);
  }

  /**
   * Check if a date/time is in the past
   */
  private isDateTimeInPast(dateStr: string, timeStr: string): boolean {
    const now = new Date();
    const eventDateTime = new Date(`${dateStr}T${timeStr}:00`);
    return eventDateTime < now;
  }

  /**
   * Transform database event (snake_case) to API response (camelCase)
   */
  private transformEvent(event: any) {
    if (!event) return null;
    return {
      id: event.id,
      projectId: event.project_id,
      title: event.title,
      description: event.description,
      date: event.date,
      startTime: event.start_time,
      endTime: event.end_time,
      type: event.type,
      meetingUrl: event.meeting_url,
      priority: event.priority,
      status: event.status,
      color: event.color,
      location: event.location,
      attendees: this.safeJsonParse(event.attendees) || [],
      createdBy: event.created_by,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      deletedAt: event.deleted_at,
    };
  }

  /**
   * Transform array of events
   */
  private transformEvents(events: any[]) {
    return events.map((event) => this.transformEvent(event));
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
