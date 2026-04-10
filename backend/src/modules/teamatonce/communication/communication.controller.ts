import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';

// Services
import { MeetingService } from './meeting.service';
import { WhiteboardService } from './whiteboard.service';
import { EventsService } from './events.service';
import { ChatService } from './chat.service';
import { VideoService } from './video.service';
import { ProjectService } from '../project/project.service';

// DTOs
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  AddMeetingNotesDto,
  AddMeetingRecordingDto,
  AddMeetingAttendeeDto,
} from './dto/meeting.dto';
import {
  CreateWhiteboardSessionDto,
  UpdateWhiteboardSessionDto,
} from './dto/whiteboard.dto';
import { CreateEventDto, UpdateEventDto } from './dto/events.dto';
import {
  SendMessageDto,
  CreateConversationDto,
  UpdateMessageDto,
} from './dto/chat.dto';
import {
  CreateVideoSessionDto,
  UpdateVideoSessionDto,
  JoinVideoSessionDto,
  UpdateParticipantsDto,
} from './dto/video.dto';
import { StartRecordingDto } from './dto/recording.dto';

@ApiTags('Communication')
@ApiBearerAuth()
@Controller('teamatonce/communication')
@UseGuards(JwtAuthGuard)
export class CommunicationController {
  constructor(
    private readonly meetingService: MeetingService,
    private readonly whiteboardService: WhiteboardService,
    private readonly eventsService: EventsService,
    private readonly chatService: ChatService,
    private readonly videoService: VideoService,
    private readonly projectService: ProjectService,
  ) {}

  // ============================================
  // MEETING ENDPOINTS
  // ============================================

  @Post('projects/:projectId/meetings')
  @ApiOperation({ summary: 'Create a new meeting for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 201, description: 'Meeting created successfully' })
  async createMeeting(
    @Param('projectId') projectId: string,
    @Body() dto: CreateMeetingDto,
    @Request() req,
  ) {
    // Check if project is rejected
    await this.projectService.validateProjectNotRejected(projectId);

    const userId = req.user.sub || req.user.userId;
    return this.meetingService.createMeeting(projectId, userId, dto);
  }

  @Get('projects/:projectId/meetings')
  @ApiOperation({ summary: 'Get all meetings for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Meetings retrieved successfully' })
  async getProjectMeetings(@Param('projectId') projectId: string) {
    return this.meetingService.getProjectMeetings(projectId);
  }

  @Get('projects/:projectId/meetings/upcoming')
  @ApiOperation({ summary: 'Get upcoming meetings for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Upcoming meetings retrieved successfully',
  })
  async getUpcomingMeetings(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: number,
  ) {
    return this.meetingService.getUpcomingMeetings(projectId, limit || 5);
  }

  @Get('meetings/:id')
  @ApiOperation({ summary: 'Get a specific meeting by ID' })
  @ApiParam({ name: 'id', description: 'Meeting ID' })
  @ApiResponse({ status: 200, description: 'Meeting retrieved successfully' })
  async getMeeting(@Param('id') id: string) {
    return this.meetingService.getMeetingById(id);
  }

  @Put('meetings/:id')
  @ApiOperation({ summary: 'Update a meeting' })
  @ApiParam({ name: 'id', description: 'Meeting ID' })
  @ApiResponse({ status: 200, description: 'Meeting updated successfully' })
  async updateMeeting(
    @Param('id') id: string,
    @Body() dto: UpdateMeetingDto,
  ) {
    return this.meetingService.updateMeeting(id, dto);
  }

  @Delete('meetings/:id')
  @ApiOperation({ summary: 'Cancel a meeting' })
  @ApiParam({ name: 'id', description: 'Meeting ID' })
  @ApiResponse({ status: 200, description: 'Meeting cancelled successfully' })
  async cancelMeeting(@Param('id') id: string) {
    return this.meetingService.cancelMeeting(id);
  }

  @Post('meetings/:id/attendees')
  @ApiOperation({ summary: 'Add an attendee to a meeting' })
  @ApiParam({ name: 'id', description: 'Meeting ID' })
  @ApiResponse({ status: 200, description: 'Attendee added successfully' })
  async addMeetingAttendee(
    @Param('id') id: string,
    @Body() dto: AddMeetingAttendeeDto,
  ) {
    return this.meetingService.addMeetingAttendee(id, dto.userId);
  }

  @Patch('meetings/:id/notes')
  @ApiOperation({ summary: 'Update meeting notes' })
  @ApiParam({ name: 'id', description: 'Meeting ID' })
  @ApiResponse({ status: 200, description: 'Meeting notes updated successfully' })
  async updateMeetingNotes(
    @Param('id') id: string,
    @Body() dto: AddMeetingNotesDto,
  ) {
    return this.meetingService.updateMeetingNotes(id, dto.notes);
  }

  @Patch('meetings/:id/recording')
  @ApiOperation({ summary: 'Update meeting recording URL' })
  @ApiParam({ name: 'id', description: 'Meeting ID' })
  @ApiResponse({
    status: 200,
    description: 'Recording URL updated successfully',
  })
  async updateRecordingUrl(
    @Param('id') id: string,
    @Body() dto: AddMeetingRecordingDto,
  ) {
    return this.meetingService.updateRecordingUrl(id, dto.recordingUrl);
  }

  // ============================================
  // WHITEBOARD ENDPOINTS
  // ============================================

  @Post('projects/:projectId/whiteboards')
  @ApiOperation({ summary: 'Create a new whiteboard session' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 201,
    description: 'Whiteboard session created successfully',
  })
  async createWhiteboardSession(
    @Param('projectId') projectId: string,
    @Body() dto: CreateWhiteboardSessionDto,
    @Request() req,
  ) {
    // Check if project is rejected
    await this.projectService.validateProjectNotRejected(projectId);

    const userId = req.user.sub || req.user.userId;
    return this.whiteboardService.createWhiteboardSession(projectId, userId, dto);
  }

  @Get('projects/:projectId/whiteboards')
  @ApiOperation({ summary: 'Get all whiteboard sessions for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Whiteboard sessions retrieved successfully',
  })
  async getWhiteboardSessions(@Param('projectId') projectId: string) {
    return this.whiteboardService.getWhiteboardSessions(projectId);
  }

  @Get('projects/:projectId/whiteboards/:sessionId')
  @ApiOperation({ summary: 'Get a specific whiteboard session' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'sessionId', description: 'Whiteboard session ID' })
  @ApiResponse({
    status: 200,
    description: 'Whiteboard session retrieved successfully',
  })
  async getWhiteboardSession(
    @Param('projectId') projectId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.whiteboardService.getWhiteboardSession(projectId, sessionId);
  }

  @Put('whiteboards/:sessionId')
  @ApiOperation({ summary: 'Update a whiteboard session' })
  @ApiParam({ name: 'sessionId', description: 'Whiteboard session ID' })
  @ApiResponse({
    status: 200,
    description: 'Whiteboard session updated successfully',
  })
  async updateWhiteboardSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateWhiteboardSessionDto,
  ) {
    return this.whiteboardService.updateWhiteboardSession(sessionId, dto);
  }

  @Delete('whiteboards/:sessionId')
  @ApiOperation({ summary: 'Delete a whiteboard session' })
  @ApiParam({ name: 'sessionId', description: 'Whiteboard session ID' })
  @ApiResponse({
    status: 200,
    description: 'Whiteboard session deleted successfully',
  })
  async deleteWhiteboardSession(@Param('sessionId') sessionId: string) {
    return this.whiteboardService.deleteWhiteboardSession(sessionId);
  }

  @Get('whiteboards/:sessionId/participants')
  @ApiOperation({ summary: 'Get active participants in a whiteboard session' })
  @ApiParam({ name: 'sessionId', description: 'Whiteboard session ID' })
  @ApiResponse({
    status: 200,
    description: 'Participants retrieved successfully',
  })
  async getWhiteboardParticipants(@Param('sessionId') sessionId: string) {
    return {
      sessionId,
      participants: this.whiteboardService.getActiveParticipants(sessionId),
    };
  }

  // ============================================
  // CALENDAR EVENTS ENDPOINTS
  // ============================================

  @Post('projects/:projectId/events')
  @ApiOperation({ summary: 'Create a new calendar event' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  async createEvent(
    @Param('projectId') projectId: string,
    @Body() dto: CreateEventDto,
    @Request() req,
  ) {
    // Check if project is rejected
    await this.projectService.validateProjectNotRejected(projectId);

    const userId = req.user.sub || req.user.userId;
    return this.eventsService.createEvent(projectId, userId, dto);
  }

  @Get('projects/:projectId/events')
  @ApiOperation({ summary: 'Get calendar events for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'start', required: false, description: 'Start date (ISO)' })
  @ApiQuery({ name: 'end', required: false, description: 'End date (ISO)' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  async getEvents(
    @Param('projectId') projectId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.eventsService.getEvents(projectId, start, end);
  }

  @Get('events/:eventId')
  @ApiOperation({ summary: 'Get a specific event by ID' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
  async getEvent(@Param('eventId') eventId: string) {
    return this.eventsService.getEventById(eventId);
  }

  @Put('projects/:projectId/events/:eventId')
  @ApiOperation({ summary: 'Update a calendar event' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  async updateEvent(
    @Param('projectId') projectId: string,
    @Param('eventId') eventId: string,
    @Body() dto: UpdateEventDto,
    @Request() req: any,
  ) {
    // Check if project is rejected
    await this.projectService.validateProjectNotRejected(projectId);

    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.eventsService.updateEvent(projectId, eventId, dto, userId);
  }

  @Delete('projects/:projectId/events/:eventId')
  @ApiOperation({ summary: 'Delete a calendar event' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  async deleteEvent(
    @Param('projectId') projectId: string,
    @Param('eventId') eventId: string,
    @Request() req: any,
  ) {
    // Check if project is rejected
    await this.projectService.validateProjectNotRejected(projectId);

    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.eventsService.deleteEvent(projectId, eventId, userId);
  }

  // ============================================
  // CHAT/MESSAGING ENDPOINTS
  // ============================================

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({
    status: 201,
    description: 'Conversation created successfully',
  })
  async createConversation(
    @Body() dto: CreateConversationDto,
    @Request() req,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.chatService.createConversation(userId, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get conversations for the current user' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project ID' })
  @ApiResponse({
    status: 200,
    description: 'Conversations retrieved successfully',
  })
  async getConversations(
    @Query('projectId') projectId: string | undefined,
    @Request() req,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.chatService.getConversations(userId, projectId);
  }

  @Get('conversations/:conversationId')
  @ApiOperation({ summary: 'Get a specific conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({
    status: 200,
    description: 'Conversation retrieved successfully',
  })
  async getConversation(
    @Param('conversationId') conversationId: string,
    @Request() req,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.chatService.getConversation(conversationId, userId);
  }

  @Post('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
    @Request() req,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.chatService.sendMessage(conversationId, userId, dto);
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get messages from a conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Request() req?,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.chatService.getMessages(
      conversationId,
      userId,
      limit || 50,
      offset || 0,
    );
  }

  @Put('messages/:messageId')
  @ApiOperation({ summary: 'Update a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message updated successfully' })
  async updateMessage(
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
    @Request() req,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.chatService.updateMessage(messageId, userId, dto);
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  async deleteMessage(@Param('messageId') messageId: string, @Request() req) {
    const userId = req.user.sub || req.user.userId;
    return this.chatService.deleteMessage(messageId, userId);
  }

  @Post('conversations/:conversationId/read')
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({
    status: 200,
    description: 'Messages marked as read successfully',
  })
  async markMessagesAsRead(
    @Param('conversationId') conversationId: string,
    @Request() req,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.chatService.markMessagesAsRead(conversationId, userId);
  }

  // ============================================
  // PROJECT-BASED CHAT ENDPOINTS (NEW FORMAT)
  // ============================================

  @Get('projects/:projectId/messages')
  @ApiOperation({
    summary: 'Get chat messages for a project',
    description: 'Retrieves messages with full sender information for real-time chat',
  })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of messages to retrieve' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset for pagination' })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        messages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              senderId: { type: 'string' },
              senderName: { type: 'string' },
              senderAvatar: { type: 'string' },
              content: { type: 'string' },
              type: { type: 'string', enum: ['text', 'file', 'system'] },
              attachments: { type: 'array' },
              timestamp: { type: 'string' },
              read: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  async getProjectMessages(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Request() req?,
  ) {
    const userId = req?.user?.sub || req?.user?.userId;
    return this.chatService.getProjectMessagesFormatted(
      projectId,
      userId,
      limit || 50,
      offset || 0,
    );
  }

  @Post('projects/:projectId/messages')
  @ApiOperation({
    summary: 'Send a message to project chat',
    description: 'Sends a message and broadcasts it via WebSocket to all project members',
  })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        senderId: { type: 'string' },
        senderName: { type: 'string' },
        senderAvatar: { type: 'string' },
        content: { type: 'string' },
        type: { type: 'string' },
        attachments: { type: 'array' },
        timestamp: { type: 'string' },
        read: { type: 'boolean' },
      },
    },
  })
  async sendProjectMessage(
    @Param('projectId') projectId: string,
    @Body() dto: SendMessageDto,
    @Request() req,
  ) {
    // Check if project is rejected
    await this.projectService.validateProjectNotRejected(projectId);

    const userId = req.user.sub || req.user.userId;
    return this.chatService.sendProjectMessage(projectId, userId, dto);
  }

  @Get('projects/:projectId/conversations')
  @ApiOperation({
    summary: 'Get conversations list for a project',
    description: 'Retrieves all conversation threads in the project',
  })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Conversations retrieved successfully',
  })
  async getProjectConversations(
    @Param('projectId') projectId: string,
    @Request() req,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.chatService.getProjectConversationsList(projectId, userId);
  }

  // ============================================
  // VIDEO CONFERENCING ENDPOINTS
  // ============================================

  @Post('projects/:projectId/video-sessions')
  @ApiOperation({ summary: 'Create a new video session' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 201,
    description: 'Video session created successfully',
  })
  async createVideoSession(
    @Param('projectId') projectId: string,
    @Body() dto: CreateVideoSessionDto,
    @Request() req,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.videoService.createVideoSession(projectId, userId, dto);
  }

  @Post('video-sessions/:sessionId/join')
  @ApiOperation({ summary: 'Join a video session' })
  @ApiParam({ name: 'sessionId', description: 'Video session ID' })
  @ApiResponse({
    status: 200,
    description: 'Joined video session successfully',
  })
  async joinVideoSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: JoinVideoSessionDto,
  ) {
    return this.videoService.joinVideoSession(sessionId, dto);
  }

  @Post('video-sessions/:sessionId/end')
  @ApiOperation({ summary: 'End a video session' })
  @ApiParam({ name: 'sessionId', description: 'Video session ID' })
  @ApiResponse({ status: 200, description: 'Video session ended successfully' })
  async endVideoSession(
    @Param('sessionId') sessionId: string,
    @Body() dto?: UpdateVideoSessionDto,
  ) {
    return this.videoService.endVideoSession(sessionId, dto);
  }

  @Get('projects/:projectId/video-sessions')
  @ApiOperation({ summary: 'Get recent video sessions for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Video sessions retrieved successfully',
  })
  async getRecentVideoSessions(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: number,
  ) {
    return this.videoService.getRecentSessions(projectId, limit || 10);
  }

  @Get('projects/:projectId/video-sessions/active')
  @ApiOperation({ summary: 'Get active video sessions for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Active video sessions retrieved successfully',
  })
  async getActiveVideoSessions(@Param('projectId') projectId: string) {
    return this.videoService.getActiveSessions(projectId);
  }

  @Get('video-sessions/:sessionId')
  @ApiOperation({ summary: 'Get a specific video session' })
  @ApiParam({ name: 'sessionId', description: 'Video session ID' })
  @ApiResponse({
    status: 200,
    description: 'Video session retrieved successfully',
  })
  async getVideoSession(@Param('sessionId') sessionId: string) {
    return this.videoService.getVideoSession(sessionId);
  }

  @Put('video-sessions/:sessionId')
  @ApiOperation({ summary: 'Update a video session' })
  @ApiParam({ name: 'sessionId', description: 'Video session ID' })
  @ApiResponse({
    status: 200,
    description: 'Video session updated successfully',
  })
  async updateVideoSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateVideoSessionDto,
  ) {
    return this.videoService.updateVideoSession(sessionId, dto);
  }

  @Put('video-sessions/:sessionId/participants')
  @ApiOperation({ summary: 'Update video session participants' })
  @ApiParam({ name: 'sessionId', description: 'Video session ID' })
  @ApiResponse({
    status: 200,
    description: 'Participants updated successfully',
  })
  async updateParticipants(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateParticipantsDto,
  ) {
    return this.videoService.updateParticipants(sessionId, dto);
  }

  @Delete('video-sessions/:sessionId')
  @ApiOperation({ summary: 'Cancel a video session' })
  @ApiParam({ name: 'sessionId', description: 'Video session ID' })
  @ApiResponse({
    status: 200,
    description: 'Video session cancelled successfully',
  })
  async cancelVideoSession(@Param('sessionId') sessionId: string) {
    return this.videoService.cancelVideoSession(sessionId);
  }

  // ============================================
  // VIDEO RECORDING ENDPOINTS
  // ============================================

  @Post('video-sessions/:sessionId/recording/start')
  @ApiOperation({ summary: 'Start recording a video session (host only)' })
  @ApiParam({ name: 'sessionId', description: 'Video session ID' })
  @ApiResponse({
    status: 201,
    description: 'Recording started successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only the host can start recording',
  })
  async startRecording(
    @Param('sessionId') sessionId: string,
    @Body() dto: StartRecordingDto,
    @Request() req,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.videoService.startRecording(sessionId, userId, dto);
  }

  @Post('video-sessions/:sessionId/recording/:recordingId/stop')
  @ApiOperation({ summary: 'Stop recording a video session (host only)' })
  @ApiParam({ name: 'sessionId', description: 'Video session ID' })
  @ApiParam({ name: 'recordingId', description: 'Recording ID' })
  @ApiResponse({
    status: 200,
    description: 'Recording stopped successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only the host can stop recording',
  })
  async stopRecording(
    @Param('sessionId') sessionId: string,
    @Param('recordingId') recordingId: string,
    @Request() req,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.videoService.stopRecording(sessionId, recordingId, userId);
  }

  @Get('video-sessions/:sessionId/recordings')
  @ApiOperation({ summary: 'Get all recordings for a video session' })
  @ApiParam({ name: 'sessionId', description: 'Video session ID' })
  @ApiResponse({
    status: 200,
    description: 'Recordings retrieved successfully',
  })
  async getRecordings(@Param('sessionId') sessionId: string) {
    return this.videoService.getRecordings(sessionId);
  }

  // ============================================
  // ATTACHMENT UPLOAD ENDPOINTS
  // ============================================

  @Post('attachments/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an attachment for chat messages' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        projectId: {
          type: 'string',
          description: 'Optional project ID for organizing attachments',
        },
        conversationId: {
          type: 'string',
          description: 'Optional conversation ID',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Attachment uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        name: { type: 'string' },
        type: { type: 'string' },
        size: { type: 'number' },
      },
    },
  })
  async uploadAttachment(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { projectId?: string; conversationId?: string },
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user.sub || req.user.userId;
    return this.chatService.uploadAttachment(userId, file, body.projectId, body.conversationId);
  }
}
