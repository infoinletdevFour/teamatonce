import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../../notifications/dto';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  MeetingStatus,
} from './dto/meeting.dto';

@Injectable()
export class MeetingService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Create a new meeting for a project
   */
  async createMeeting(
    projectId: string,
    userId: string,
    dto: CreateMeetingDto,
  ) {
    const meetingData = {
      project_id: projectId,
      title: dto.title,
      description: dto.description || null,
      meeting_type: dto.meetingType,
      location: dto.location || null,
      start_time: new Date(dto.startTime).toISOString(),
      end_time: new Date(dto.endTime).toISOString(),
      attendees: JSON.stringify(dto.attendees || []),
      agenda: dto.agenda || null,
      created_by: userId,
      status: MeetingStatus.SCHEDULED,
      notes: null,
      recording_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    const meeting = await this.db.insert('meetings', meetingData);

    // Send notifications to all attendees
    if (dto.attendees && dto.attendees.length > 0) {
      try {
        const startDate = new Date(dto.startTime);
        const formattedDate = startDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        // Get project info for context
        let projectName = 'Project';
        try {
          const project = await this.db.findOne('projects', { id: projectId });
          if (project) projectName = project.name;
        } catch (e) {}

        // Notify attendees (excluding the creator)
        const attendeesToNotify = dto.attendees.filter((id: string) => id !== userId);
        if (attendeesToNotify.length > 0) {
          await this.notificationsService.sendNotification({
            user_ids: attendeesToNotify,
            type: NotificationType.REMINDER,
            title: 'New Meeting Scheduled',
            message: `You've been invited to "${dto.title}" on ${formattedDate} for project "${projectName}".`,
            priority: NotificationPriority.HIGH,
            action_url: `/project/${projectId}/communication`,
            data: {
              projectId,
              meetingId: meeting.id,
              meetingTitle: dto.title,
              startTime: dto.startTime,
              endTime: dto.endTime,
              meetingType: dto.meetingType,
            },
            send_push: true,
            send_email: true,
          });
        }
      } catch (error) {
        console.error('[MeetingService] Failed to send meeting notification:', error);
      }
    }

    return this.parseMeetingJson(meeting);
  }

  /**
   * Get a specific meeting by ID
   */
  async getMeetingById(id: string) {
    const meeting = await this.db.findOne('meetings', {
      id,
      deleted_at: null,
    });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found`);
    }

    return this.parseMeetingJson(meeting);
  }

  /**
   * Get all meetings for a project
   */
  async getProjectMeetings(projectId: string) {
    const meetings = await this.db.findMany(
      'meetings',
      {
        project_id: projectId,
        deleted_at: null,
      },
      {
        orderBy: 'start_time',
        order: 'asc',
      },
    );

    return meetings.map((m) => this.parseMeetingJson(m));
  }

  /**
   * Get upcoming meetings for a project
   */
  async getUpcomingMeetings(projectId: string, limit: number = 5) {
    const now = new Date().toISOString();

    // Use database query builder for complex conditions
    const query = this.db
      .table('meetings')
      .where('project_id', '=', projectId)
      .where('start_time', '>=', now)
      .isNull('deleted_at')
      .orderBy('start_time', 'asc')
      .limit(limit);

    const result = await query.execute();
    const meetings = result.data || [];

    return meetings.map((m) => this.parseMeetingJson(m));
  }

  /**
   * Update meeting details
   */
  async updateMeeting(id: string, dto: UpdateMeetingDto) {
    await this.getMeetingById(id); // Verify meeting exists

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.meetingType) updateData.meeting_type = dto.meetingType;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.startTime)
      updateData.start_time = new Date(dto.startTime).toISOString();
    if (dto.endTime)
      updateData.end_time = new Date(dto.endTime).toISOString();
    if (dto.agenda !== undefined) updateData.agenda = dto.agenda;
    if (dto.status) updateData.status = dto.status;

    await this.db.update('meetings', id, updateData);
    return this.getMeetingById(id);
  }

  /**
   * Cancel a meeting (soft delete)
   */
  async cancelMeeting(id: string, cancelledBy?: string) {
    const meeting = await this.getMeetingById(id); // Verify meeting exists

    await this.db.update('meetings', id, {
      status: MeetingStatus.CANCELLED,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Notify all attendees about cancellation
    if (meeting.attendees && meeting.attendees.length > 0) {
      try {
        const attendeesToNotify = cancelledBy
          ? meeting.attendees.filter((id: string) => id !== cancelledBy)
          : meeting.attendees;

        if (attendeesToNotify.length > 0) {
          await this.notificationsService.sendNotification({
            user_ids: attendeesToNotify,
            type: NotificationType.UPDATE,
            title: 'Meeting Cancelled',
            message: `The meeting "${meeting.title}" has been cancelled.`,
            priority: NotificationPriority.HIGH,
            action_url: `/project/${meeting.project_id}/communication`,
            data: {
              projectId: meeting.project_id,
              meetingId: id,
              meetingTitle: meeting.title,
              cancelled: true,
            },
            send_push: true,
          });
        }
      } catch (error) {
        console.error('[MeetingService] Failed to send meeting cancellation notification:', error);
      }
    }

    return { success: true, message: 'Meeting cancelled successfully' };
  }

  /**
   * Add an attendee to a meeting
   */
  async addMeetingAttendee(id: string, userId: string) {
    const meeting = await this.getMeetingById(id);
    const attendees = meeting.attendees || [];

    // Check if user is already an attendee
    if (attendees.includes(userId)) {
      return meeting;
    }

    attendees.push(userId);

    await this.db.update('meetings', id, {
      attendees: JSON.stringify(attendees),
      updated_at: new Date().toISOString(),
    });

    return this.getMeetingById(id);
  }

  /**
   * Update meeting notes
   */
  async updateMeetingNotes(id: string, notes: string) {
    await this.getMeetingById(id); // Verify meeting exists

    await this.db.update('meetings', id, {
      notes,
      updated_at: new Date().toISOString(),
    });

    return this.getMeetingById(id);
  }

  /**
   * Update recording URL
   */
  async updateRecordingUrl(id: string, recordingUrl: string) {
    await this.getMeetingById(id); // Verify meeting exists

    await this.db.update('meetings', id, {
      recording_url: recordingUrl,
      status: MeetingStatus.COMPLETED,
      updated_at: new Date().toISOString(),
    });

    return this.getMeetingById(id);
  }

  /**
   * Helper method to parse JSON fields in meeting records
   */
  private parseMeetingJson(meeting: any) {
    if (!meeting) return null;

    return {
      ...meeting,
      attendees: this.safeJsonParse(meeting.attendees),
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
