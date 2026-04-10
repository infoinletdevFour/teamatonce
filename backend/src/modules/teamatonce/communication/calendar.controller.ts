/**
 * Calendar Controller
 *
 * REST API for project calendar events.
 * Uses ProjectAccessGuard to ensure only project members can access.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { ProjectAccessGuard } from '../../../common/guards/project-access.guard';
import { CalendarService, CreateCalendarEventDto, UpdateCalendarEventDto } from './calendar.service';

@Controller('api/projects/:projectId/calendar')
@UseGuards(AuthGuard, ProjectAccessGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  /**
   * Create a new calendar event
   */
  @Post('events')
  async createEvent(
    @Param('projectId') projectId: string,
    @Body() dto: CreateCalendarEventDto,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.calendarService.createEvent(projectId, userId, dto);
  }

  /**
   * Get all calendar events for a project
   */
  @Get('events')
  async getProjectEvents(
    @Param('projectId') projectId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.calendarService.getProjectEvents(projectId, {
      startDate,
      endDate,
      type,
      status,
    });
  }

  /**
   * Get upcoming events for a project
   */
  @Get('events/upcoming')
  async getUpcomingEvents(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: number,
  ) {
    return this.calendarService.getUpcomingEvents(projectId, limit || 10);
  }

  /**
   * Get events for a specific date
   */
  @Get('events/date/:date')
  async getEventsByDate(
    @Param('projectId') projectId: string,
    @Param('date') date: string,
  ) {
    return this.calendarService.getEventsByDate(projectId, date);
  }

  /**
   * Get events for a date range
   */
  @Get('events/range')
  async getEventsInRange(
    @Param('projectId') projectId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.calendarService.getEventsInRange(projectId, startDate, endDate);
  }

  /**
   * Get a single calendar event
   */
  @Get('events/:eventId')
  async getEvent(@Param('eventId') eventId: string) {
    return this.calendarService.getEventById(eventId);
  }

  /**
   * Update a calendar event
   */
  @Put('events/:eventId')
  async updateEvent(
    @Param('eventId') eventId: string,
    @Body() dto: UpdateCalendarEventDto,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.calendarService.updateEvent(eventId, userId, dto);
  }

  /**
   * Delete a calendar event
   */
  @Delete('events/:eventId')
  async deleteEvent(
    @Param('eventId') eventId: string,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.calendarService.deleteEvent(eventId, userId);
  }

  /**
   * Mark an event as completed
   */
  @Post('events/:eventId/complete')
  async completeEvent(
    @Param('eventId') eventId: string,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.calendarService.completeEvent(eventId, userId);
  }

  /**
   * Cancel an event
   */
  @Post('events/:eventId/cancel')
  async cancelEvent(
    @Param('eventId') eventId: string,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.calendarService.cancelEvent(eventId, userId);
  }
}
