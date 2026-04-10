import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../../database/database.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../../notifications/dto';
import { SchedulerService } from '../scheduler.service';
import { TeamAtOnceGateway } from '../../../websocket/teamatonce.gateway';

@Injectable()
export class CalendarReminderJob {
  private readonly logger = new Logger(CalendarReminderJob.name);
  private isRunning = false;

  constructor(
    private readonly db: DatabaseService,
    private readonly notificationsService: NotificationsService,
    private readonly schedulerService: SchedulerService,
    private readonly gateway: TeamAtOnceGateway,
  ) {}

  /**
   * Check for events with reminders due and send notifications
   * Runs every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCalendarReminders(): Promise<void> {
    // Prevent overlapping executions
    if (this.isRunning) {
      this.logger.warn('Calendar reminder job is already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    const jobName = 'CalendarReminderJob';

    try {
      this.schedulerService.logJobStart(jobName);

      const now = new Date();
      let processedCount = 0;

      // Find all upcoming events with reminders that haven't been sent yet
      const events = await this.db.findMany('calendar_events', {
        reminder_sent: false,
        status: 'upcoming',
        deleted_at: null,
      });

      // Filter events that have reminder_minutes set
      const eventsWithReminders = events.filter((event: any) =>
        event.reminder_minutes !== null && event.reminder_minutes > 0
      );

      for (const event of eventsWithReminders) {
        try {
          // Calculate the event's start datetime
          const eventDateTime = this.parseEventDateTime(event.date, event.start_time);
          if (!eventDateTime) {
            this.logger.warn(`Invalid date/time for event ${event.id}: ${event.date} ${event.start_time}`);
            continue;
          }

          // Calculate when the reminder should be sent
          const reminderTime = new Date(eventDateTime.getTime() - event.reminder_minutes * 60 * 1000);

          // Check if it's time to send the reminder (reminder time has passed but event hasn't started yet)
          if (now >= reminderTime && now < eventDateTime) {
            await this.sendEventReminder(event);
            processedCount++;
          }
        } catch (error) {
          this.logger.error(`Error processing reminder for event ${event.id}:`, error);
        }
      }

      this.schedulerService.logJobComplete(jobName, processedCount);
    } catch (error) {
      this.schedulerService.logJobError(jobName, error as Error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Parse event date and time into a Date object
   */
  private parseEventDateTime(date: string, time: string): Date | null {
    try {
      // Extract date portion (YYYY-MM-DD) in case it's an ISO string
      const dateStr = date.includes('T') ? date.split('T')[0] : date;
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);

      return new Date(year, month - 1, day, hours, minutes, 0, 0);
    } catch {
      return null;
    }
  }

  /**
   * Send reminder notification to all event attendees
   */
  private async sendEventReminder(event: any): Promise<void> {
    // Parse attendees
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

    if (attendees.length === 0) {
      this.logger.warn(`No attendees found for event ${event.id}`);
      // Still mark as sent to prevent repeated processing
      await this.markReminderSent(event.id);
      return;
    }

    // Get project info for the notification URL
    const project = await this.db.findOne('projects', { id: event.project_id });

    // Get project members for determining company context
    const projectMembers = await this.db.findMany('project_members', {
      project_id: event.project_id,
    });

    const reminderMinutes = event.reminder_minutes;
    const timeLabel = this.formatReminderTime(reminderMinutes);
    const notificationTitle = `⏰ Event Reminder: ${event.title}`;
    const notificationMessage = `Your event "${event.title}" starts in ${timeLabel} (${event.start_time} on ${event.date})`;

    // Send notification to each attendee
    for (const userId of attendees) {
      try {
        const userCompanyId = await this.getCompanyIdForUser(userId, event.project_id, project, projectMembers);

        const notificationData = {
          projectId: event.project_id,
          companyId: userCompanyId,
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.date,
          eventTime: event.start_time,
          eventType: event.type,
          reminderMinutes: reminderMinutes,
        };

        // Send real-time WebSocket notification
        this.gateway.sendToUser(userId, 'calendar-event-reminder', {
          event: {
            id: event.id,
            title: event.title,
            date: event.date,
            startTime: event.start_time,
            endTime: event.end_time,
            type: event.type,
            projectId: event.project_id,
          },
          title: notificationTitle,
          message: notificationMessage,
          timestamp: new Date().toISOString(),
        });

        // Send push notification and save to database
        await this.notificationsService.sendNotification({
          user_id: userId,
          type: NotificationType.REMINDER,
          title: notificationTitle,
          message: notificationMessage,
          priority: event.priority === 'high' ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
          action_url: `/company/${userCompanyId}/project/${event.project_id}/calendar`,
          data: notificationData,
          send_push: true,
        });

        this.logger.log(`Sent reminder for event ${event.id} to user ${userId}`);
      } catch (error) {
        this.logger.error(`Failed to send reminder to user ${userId} for event ${event.id}:`, error);
      }
    }

    // Mark reminder as sent
    await this.markReminderSent(event.id);
  }

  /**
   * Format reminder time for display
   */
  private formatReminderTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  }

  /**
   * Mark event reminder as sent
   */
  private async markReminderSent(eventId: string): Promise<void> {
    await this.db.update('calendar_events', eventId, {
      reminder_sent: true,
      updated_at: new Date().toISOString(),
    });
    this.logger.log(`Marked reminder as sent for event ${eventId}`);
  }

  /**
   * Get the correct company ID for a user based on their role in the project
   */
  private async getCompanyIdForUser(
    userId: string,
    projectId: string,
    project: any,
    projectMembers: any[],
  ): Promise<string | null> {
    // Check if user is the project client (owner)
    if (userId === project?.client_id) {
      return project.company_id;
    }

    // Find user in project_members to determine their member_type
    const member = projectMembers.find((m: any) => m.user_id === userId);

    if (member) {
      if (member.member_type === 'client') {
        return project?.company_id;
      } else if (member.member_type === 'developer') {
        return project?.assigned_company_id || member.company_id;
      }
    }

    // Fallback: check if user belongs to the assigned developer company
    if (project?.assigned_company_id) {
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
    if (project?.company_id) {
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
    return project?.company_id;
  }
}
