import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TeamAtOnceGateway } from '../../../websocket/teamatonce.gateway';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../../notifications/dto';
import {
  SendMessageDto,
  CreateConversationDto,
  UpdateMessageDto,
  MessageType,
  ConversationType,
} from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly db: DatabaseService,
    private readonly gateway: TeamAtOnceGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ============================================
  // CONVERSATION MANAGEMENT
  // ============================================

  /**
   * Create a new conversation
   */
  async createConversation(createdBy: string, dto: CreateConversationDto) {
    // Validate participants
    if (!dto.participants || dto.participants.length === 0) {
      throw new BadRequestException('At least one participant is required');
    }

    // Include creator in participants if not already included
    if (!dto.participants.includes(createdBy)) {
      dto.participants.push(createdBy);
    }

    // For direct conversations, check if one already exists between these users in this project
    if (dto.conversationType === 'direct' && dto.participants.length === 2) {
      const existingConversation = await this.findExistingDirectConversation(
        dto.participants,
        dto.projectId,
      );

      if (existingConversation) {
        console.log(
          `[ChatService] Found existing conversation ${existingConversation.id} between users`,
        );
        return existingConversation;
      }
    }

    const conversationData = {
      project_id: dto.projectId || null,
      conversation_type: dto.conversationType,
      title: dto.title || null,
      participants: JSON.stringify(dto.participants),
      created_by: createdBy,
      last_message_at: null,
      metadata: JSON.stringify({}),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const conversation = await this.db.insert('conversations', conversationData);
    const parsedConversation = this.parseConversationJson(conversation);

    // Notify all participants about new conversation
    dto.participants.forEach((userId) => {
      this.gateway.sendToUser(userId, 'conversation-created', {
        conversation: parsedConversation,
        timestamp: new Date().toISOString(),
      });
    });

    return parsedConversation;
  }

  /**
   * Find an existing direct conversation between two users in a project
   */
  private async findExistingDirectConversation(
    participants: string[],
    projectId?: string,
  ): Promise<any> {
    if (participants.length !== 2) {
      return null;
    }

    // Get all direct conversations for the project (or without project if null)
    const conditions: any = {
      conversation_type: 'direct',
    };

    if (projectId) {
      conditions.project_id = projectId;
    }

    const conversations = await this.db.findMany('conversations', conditions);

    // Find a conversation where both participants match exactly
    for (const conv of conversations) {
      const convParticipants = this.safeJsonParse(conv.participants) || [];

      // Check if both participants are in this conversation and conversation has exactly 2 participants
      if (
        convParticipants.length === 2 &&
        participants.every((p) => convParticipants.includes(p)) &&
        convParticipants.every((p) => participants.includes(p))
      ) {
        return this.parseConversationJson(conv);
      }
    }

    return null;
  }

  /**
   * Get conversations for a user
   */
  async getConversations(userId: string, projectId?: string) {
    // Use database query builder to search for conversations where user is a participant
    // Note: This is a simplified version. In production, you'd use PostgreSQL JSONB operators
    const allConversations = await this.db.findMany(
      'conversations',
      projectId ? { project_id: projectId } : {},
      {
        orderBy: 'last_message_at',
        order: 'desc',
      },
    );

    // For project conversations, sync project members to participants before filtering
    // This ensures newly added project members can see the project chat
    for (const conv of allConversations) {
      if (conv.conversation_type === 'project' && conv.project_id) {
        const projectMemberIds = await this.getProjectMemberIds(conv.project_id);
        const existingParticipants = this.safeJsonParse(conv.participants) || [];

        // Check if user is a project member but not in participants
        if (projectMemberIds.includes(userId) && !existingParticipants.includes(userId)) {
          // Add all project members to participants
          const allParticipants = [...new Set([...existingParticipants, ...projectMemberIds])];
          await this.db.update('conversations', conv.id, {
            participants: JSON.stringify(allParticipants),
            updated_at: new Date().toISOString(),
          });
          conv.participants = JSON.stringify(allParticipants);
        }
      }
    }

    // Filter conversations where user is a participant
    const userConversations = allConversations.filter((conv) => {
      const participants = this.safeJsonParse(conv.participants) || [];
      return participants.includes(userId);
    });

    // Enrich conversations with participant details and last message
    const enrichedConversations = await Promise.all(
      userConversations.map(async (conv) => {
        const parsed = this.parseConversationJson(conv);
        const participants = parsed.participants || [];

        // Get participant details
        const participantDetails = await Promise.all(
          participants.map(async (participantId: string) => {
            const userInfo = await this.getUserInfo(participantId);
            return {
              id: participantId,
              name: userInfo.name,
              avatar: userInfo.avatar,
            };
          }),
        );

        // Get last message
        const lastMessages = await this.db.findMany(
          'messages',
          {
            conversation_id: conv.id,
            deleted_at: null,
          },
          {
            orderBy: 'created_at',
            order: 'desc',
            limit: 1,
          },
        );

        const lastMessage = lastMessages[0]
          ? this.parseMessageJson(lastMessages[0])
          : null;

        return {
          ...parsed,
          participantDetails,
          lastMessage,
        };
      }),
    );

    return enrichedConversations;
  }

  /**
   * Get a specific conversation by ID
   */
  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.db.findOne('conversations', {
      id: conversationId,
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`,
      );
    }

    // Verify user is a participant
    const participants = this.safeJsonParse(conversation.participants) || [];
    if (!participants.includes(userId)) {
      throw new NotFoundException('Conversation not found or access denied');
    }

    const parsed = this.parseConversationJson(conversation);

    // Get participant details
    const participantDetails = await Promise.all(
      participants.map(async (participantId: string) => {
        const userInfo = await this.getUserInfo(participantId);
        return {
          id: participantId,
          name: userInfo.name,
          avatar: userInfo.avatar,
        };
      }),
    );

    return {
      ...parsed,
      participantDetails,
    };
  }

  // ============================================
  // MESSAGE MANAGEMENT
  // ============================================

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    dto: SendMessageDto,
  ) {
    // Verify conversation exists and user is a participant
    const conversation = await this.getConversation(conversationId, senderId);

    const messageData = {
      conversation_id: conversationId,
      sender_id: senderId,
      message_type: dto.messageType || MessageType.TEXT,
      content: dto.content,
      attachments: JSON.stringify(dto.attachments || []),
      mentions: JSON.stringify(dto.mentions || []),
      reply_to_id: dto.replyToId || null,
      reactions: JSON.stringify({}),
      read_by: JSON.stringify([senderId]), // Sender has read their own message
      metadata: JSON.stringify({}),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    const message = await this.db.insert('messages', messageData);
    const parsedMessage = this.parseMessageJson(message);

    // Update conversation's last_message_at
    await this.db.update('conversations', conversationId, {
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Broadcast message to all participants via WebSocket (except sender)
    const participants = conversation.participants || [];
    const senderInfo = await this.getUserInfo(senderId);

    // Add sender info to parsed message for return and WebSocket broadcast
    const messageWithSender = {
      ...parsedMessage,
      sender: {
        id: senderId,
        name: senderInfo.name,
        avatar: senderInfo.avatar,
      },
    };

    // Send notifications to all participants (except sender)
    const recipientIds = participants.filter((userId: string) => userId !== senderId);
    if (recipientIds.length > 0) {
      // Check for mentions - high priority notifications
      const mentions = dto.mentions || [];
      const mentionedUserIds = mentions.filter((id: string) => recipientIds.includes(id));
      const nonMentionedUserIds = recipientIds.filter((id: string) => !mentions.includes(id));

      // Send high priority notifications to mentioned users
      if (mentionedUserIds.length > 0) {
        await this.notificationsService.sendNotification({
          user_ids: mentionedUserIds,
          type: NotificationType.SOCIAL,
          title: 'You were mentioned in a message',
          message: `${senderInfo.name} mentioned you: "${dto.content.substring(0, 100)}${dto.content.length > 100 ? '...' : ''}"`,
          priority: NotificationPriority.HIGH,
          action_url: `/messages/${conversationId}`,
          data: { conversationId, messageId: parsedMessage.id, senderId, senderName: senderInfo.name },
          send_push: true,
        });
      }

      // Send normal notifications to other participants
      if (nonMentionedUserIds.length > 0) {
        await this.notificationsService.sendNotification({
          user_ids: nonMentionedUserIds,
          type: NotificationType.SOCIAL,
          title: 'New message',
          message: `${senderInfo.name}: "${dto.content.substring(0, 100)}${dto.content.length > 100 ? '...' : ''}"`,
          priority: NotificationPriority.NORMAL,
          action_url: `/messages/${conversationId}`,
          data: { conversationId, messageId: parsedMessage.id, senderId, senderName: senderInfo.name },
          send_push: true,
        });
      }
    }

    participants.forEach((userId: string) => {
      // Don't send to the sender - they already have the message locally
      if (userId !== senderId) {
        this.gateway.sendToUser(userId, 'new-message', {
          conversationId,
          message: messageWithSender,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Use database realtime to broadcast message
    try {
      await /* TODO: use Socket.io */ this.db.publishToChannel(`conversation:${conversationId}`, {
        type: 'new-message',
        message: messageWithSender,
      });
    } catch (error) {
      // Realtime is optional, log error but don't fail
      console.warn('Failed to publish to realtime channel:', error.message);
    }

    return messageWithSender;
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    // Verify user has access to this conversation
    await this.getConversation(conversationId, userId);

    const messages = await this.db.findMany(
      'messages',
      {
        conversation_id: conversationId,
        deleted_at: null,
      },
      {
        orderBy: 'created_at',
        order: 'asc',
        limit,
        offset,
      },
    );

    // Enrich messages with sender information
    const enrichedMessages = await Promise.all(
      messages.map(async (m) => {
        const parsed = this.parseMessageJson(m);
        const senderInfo = await this.getUserInfo(m.sender_id);
        return {
          ...parsed,
          sender: {
            id: m.sender_id,
            name: senderInfo.name,
            avatar: senderInfo.avatar,
          },
        };
      }),
    );

    return enrichedMessages;
  }

  /**
   * Update a message (for editing or reactions)
   */
  async updateMessage(messageId: string, userId: string, dto: UpdateMessageDto) {
    const message = await this.db.findOne('messages', {
      id: messageId,
      deleted_at: null,
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Only sender can edit content
    if (dto.content && message.sender_id !== userId) {
      throw new BadRequestException('Only the sender can edit message content');
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.content) {
      updateData.content = dto.content;
    }

    if (dto.reactions) {
      updateData.reactions = JSON.stringify(dto.reactions);
    }

    await this.db.update('messages', messageId, updateData);

    const updatedMessage = await this.db.findOne('messages', {
      id: messageId,
    });
    const parsedMessage = this.parseMessageJson(updatedMessage);

    // Notify conversation participants
    const conversation = await this.db.findOne('conversations', {
      id: message.conversation_id,
    });
    const participants = this.safeJsonParse(conversation.participants) || [];

    participants.forEach((participantId) => {
      this.gateway.sendToUser(participantId, 'message-updated', {
        conversationId: message.conversation_id,
        message: parsedMessage,
        timestamp: new Date().toISOString(),
      });
    });

    return parsedMessage;
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string) {
    // Verify user has access to this conversation
    await this.getConversation(conversationId, userId);

    // Get unread messages
    const messages = await this.db.findMany('messages', {
      conversation_id: conversationId,
      deleted_at: null,
    });

    // Update read_by for each message
    for (const message of messages) {
      const readBy = this.safeJsonParse(message.read_by) || [];
      if (!readBy.includes(userId)) {
        readBy.push(userId);
        await this.db.update('messages', message.id, {
          read_by: JSON.stringify(readBy),
          updated_at: new Date().toISOString(),
        });
      }
    }

    return { success: true, message: 'Messages marked as read' };
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string, userId: string) {
    const message = await this.db.findOne('messages', {
      id: messageId,
      deleted_at: null,
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Only sender can delete their message
    if (message.sender_id !== userId) {
      throw new BadRequestException('Only the sender can delete their message');
    }

    await this.db.update('messages', messageId, {
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Notify conversation participants
    const conversation = await this.db.findOne('conversations', {
      id: message.conversation_id,
    });
    const participants = this.safeJsonParse(conversation.participants) || [];

    participants.forEach((participantId) => {
      this.gateway.sendToUser(participantId, 'message-deleted', {
        conversationId: message.conversation_id,
        messageId,
        timestamp: new Date().toISOString(),
      });
    });

    return { success: true, message: 'Message deleted successfully' };
  }

  // ============================================
  // PROJECT MESSAGES (Enhanced with User Info)
  // ============================================

  /**
   * Get project messages with formatted user information
   */
  async getProjectMessagesFormatted(
    projectId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    // Find or create project conversation
    const conversation = await this.getOrCreateProjectConversation(projectId, userId);

    // Get messages
    const messages = await this.db.findMany(
      'messages',
      {
        conversation_id: conversation.id,
        deleted_at: null,
      },
      {
        orderBy: 'created_at',
        order: 'desc',
        limit,
        offset,
      },
    );

    // Enrich messages with user information
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const userInfo = await this.getUserInfo(msg.sender_id);
        const readBy = this.safeJsonParse(msg.read_by) || [];

        return {
          id: msg.id,
          senderId: msg.sender_id,
          senderName: userInfo.name,
          senderAvatar: userInfo.avatar,
          content: msg.content,
          type: msg.message_type || 'text',
          attachments: this.safeJsonParse(msg.attachments) || [],
          timestamp: msg.created_at,
          read: readBy.includes(userId),
        };
      }),
    );

    // Return in reverse order (newest first from DB, but display oldest first)
    return {
      messages: enrichedMessages.reverse(),
    };
  }

  /**
   * Send a project message with WebSocket broadcast
   */
  async sendProjectMessage(
    projectId: string,
    senderId: string,
    dto: SendMessageDto,
  ) {
    // Get or create project conversation
    const conversation = await this.getOrCreateProjectConversation(projectId, senderId);

    // Get sender info
    const userInfo = await this.getUserInfo(senderId);

    // Create message
    const messageData = {
      conversation_id: conversation.id,
      sender_id: senderId,
      message_type: dto.messageType || MessageType.TEXT,
      content: dto.content,
      attachments: JSON.stringify(dto.attachments || []),
      mentions: JSON.stringify(dto.mentions || []),
      reply_to_id: dto.replyToId || null,
      reactions: JSON.stringify({}),
      read_by: JSON.stringify([senderId]),
      metadata: JSON.stringify({}),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    const message = await this.db.insert('messages', messageData);

    // Update conversation's last_message_at
    await this.db.update('conversations', conversation.id, {
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Format response
    const formattedMessage = {
      id: message.id,
      senderId: senderId,
      senderName: userInfo.name,
      senderAvatar: userInfo.avatar,
      content: dto.content,
      type: dto.messageType || 'text',
      attachments: dto.attachments || [],
      timestamp: message.created_at,
      read: true, // Sender has read their own message
    };

    // Broadcast via WebSocket to project room
    this.gateway.sendToProject(projectId, 'new-message', {
      message: formattedMessage,
      timestamp: new Date().toISOString(),
    });

    // Also broadcast to conversation participants
    const participants = this.safeJsonParse(conversation.participants) || [];

    // Send notifications to all participants (except sender)
    const recipientIds = participants.filter((userId: string) => userId !== senderId);
    if (recipientIds.length > 0) {
      // Get project info for better notification context
      let projectName = 'Project';
      try {
        const project = await this.db.findOne('projects', { id: projectId });
        if (project) projectName = project.name;
      } catch (e) {
        // Keep default project name
      }

      // Check for mentions - high priority notifications
      const mentions = dto.mentions || [];
      const mentionedUserIds = mentions.filter((id: string) => recipientIds.includes(id));
      const nonMentionedUserIds = recipientIds.filter((id: string) => !mentions.includes(id));

      // Send high priority notifications to mentioned users
      if (mentionedUserIds.length > 0) {
        await this.notificationsService.sendNotification({
          user_ids: mentionedUserIds,
          type: NotificationType.SOCIAL,
          title: `You were mentioned in ${projectName}`,
          message: `${userInfo.name} mentioned you: "${dto.content.substring(0, 100)}${dto.content.length > 100 ? '...' : ''}"`,
          priority: NotificationPriority.HIGH,
          action_url: `/project/${projectId}/messages`,
          data: { projectId, conversationId: conversation.id, messageId: message.id, senderId, senderName: userInfo.name },
          send_push: true,
        });
      }

      // Send normal notifications to other participants
      if (nonMentionedUserIds.length > 0) {
        await this.notificationsService.sendNotification({
          user_ids: nonMentionedUserIds,
          type: NotificationType.SOCIAL,
          title: `New message in ${projectName}`,
          message: `${userInfo.name}: "${dto.content.substring(0, 100)}${dto.content.length > 100 ? '...' : ''}"`,
          priority: NotificationPriority.NORMAL,
          action_url: `/project/${projectId}/messages`,
          data: { projectId, conversationId: conversation.id, messageId: message.id, senderId, senderName: userInfo.name },
          send_push: true,
        });
      }
    }

    participants.forEach((userId: string) => {
      if (userId !== senderId) {
        this.gateway.sendToUser(userId, 'new-message', {
          projectId,
          conversationId: conversation.id,
          message: formattedMessage,
          timestamp: new Date().toISOString(),
        });
      }
    });

    return formattedMessage;
  }

  /**
   * Get conversations list for a project
   */
  async getProjectConversationsList(projectId: string, userId: string) {
    const conversations = await this.db.findMany(
      'conversations',
      {
        project_id: projectId,
      },
      {
        orderBy: 'last_message_at',
        order: 'desc',
      },
    );

    // Filter by user participation and enrich with data
    const userConversations = await Promise.all(
      conversations
        .filter((conv) => {
          const participants = this.safeJsonParse(conv.participants) || [];
          return participants.includes(userId);
        })
        .map(async (conv) => {
          // Get last message
          const lastMessages = await this.db.findMany(
            'messages',
            {
              conversation_id: conv.id,
              deleted_at: null,
            },
            {
              orderBy: 'created_at',
              order: 'desc',
              limit: 1,
            },
          );

          const lastMessage = lastMessages[0];
          let lastMessageData = null;

          if (lastMessage) {
            const senderInfo = await this.getUserInfo(lastMessage.sender_id);
            lastMessageData = {
              content: lastMessage.content,
              senderName: senderInfo.name,
              timestamp: lastMessage.created_at,
            };
          }

          // Get unread count
          const messages = await this.db.findMany('messages', {
            conversation_id: conv.id,
            deleted_at: null,
          });

          const unreadCount = messages.filter((msg) => {
            const readBy = this.safeJsonParse(msg.read_by) || [];
            return !readBy.includes(userId);
          }).length;

          return {
            id: conv.id,
            title: conv.title || 'Project Chat',
            type: conv.conversation_type,
            participants: this.safeJsonParse(conv.participants),
            lastMessage: lastMessageData,
            unreadCount,
            updatedAt: conv.last_message_at || conv.updated_at,
          };
        }),
    );

    return {
      conversations: userConversations,
    };
  }

  /**
   * Get or create project conversation
   * Automatically syncs all project members to conversation participants
   */
  private async getOrCreateProjectConversation(projectId: string, userId: string) {
    // Get all project members to ensure they're included in conversation
    const projectMemberIds = await this.getProjectMemberIds(projectId);

    // Ensure current user is included
    if (!projectMemberIds.includes(userId)) {
      projectMemberIds.push(userId);
    }

    const conversations = await this.db.findMany('conversations', {
      project_id: projectId,
      conversation_type: ConversationType.PROJECT,
    });

    if (conversations.length > 0) {
      const conversation = conversations[0];

      // Sync all project members to participants
      const existingParticipants = this.safeJsonParse(conversation.participants) || [];
      const allParticipants = [...new Set([...existingParticipants, ...projectMemberIds])];

      // Update if there are new participants
      if (allParticipants.length > existingParticipants.length) {
        await this.db.update('conversations', conversation.id, {
          participants: JSON.stringify(allParticipants),
          updated_at: new Date().toISOString(),
        });
        conversation.participants = JSON.stringify(allParticipants);
      }

      return conversation;
    }

    // Create new project conversation with all project members
    const conversationData = {
      project_id: projectId,
      conversation_type: ConversationType.PROJECT,
      title: `Project Chat`,
      participants: JSON.stringify(projectMemberIds),
      created_by: userId,
      last_message_at: null,
      metadata: JSON.stringify({}),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return await this.db.insert('conversations', conversationData);
  }

  /**
   * Get all member IDs for a project from project_members table
   */
  private async getProjectMemberIds(projectId: string): Promise<string[]> {
    try {
      // Get all active project members
      const members = await this.db.findMany('project_members', {
        project_id: projectId,
        is_active: true,
      });

      const memberUserIds = members.map((m: any) => m.user_id).filter(Boolean);

      // Also get the project owner (client_id)
      const project = await this.db.findOne('projects', { id: projectId });
      if (project?.client_id && !memberUserIds.includes(project.client_id)) {
        memberUserIds.push(project.client_id);
      }

      return memberUserIds;
    } catch (error) {
      console.error('[ChatService] Error getting project member IDs:', error.message);
      return [];
    }
  }

  /**
   * Get user information from database
   */
  private async getUserInfo(userId: string): Promise<{ name: string; avatar: string }> {
    console.log(`[ChatService] getUserInfo called for userId: ${userId}`);

    // Names that are actually roles/titles and should be skipped
    // Note: Be careful not to include names that users might actually use (like "Client")
    const roleLikeNames = [
      'company owner', 'owner', 'admin', 'administrator', 'unknown user'
    ];

    const isRoleLikeName = (name: string): boolean => {
      if (!name) return true;
      return roleLikeNames.includes(name.toLowerCase().trim());
    };

    // First, try to get user info from database (most authoritative source)
    // Use the same field priority as the /me API: fullName > metadata.full_name > displayName > email
    try {
      const result: any = await this.db.getUserById(userId);
      // Unwrap the response - database returns { success: true, user: {...} }
      const user = result?.user || result;

      console.log(`[ChatService] database user for ${userId}:`, user ? {
        fullName: user.fullName,
        displayName: user.displayName,
        email: user.email,
        metadata: user.metadata ? { full_name: user.metadata?.full_name } : null
      } : 'not found');

      if (user) {
        // Prioritize 'fullName' field, then metadata.full_name, then displayName
        let name = user.fullName;
        if (!name || isRoleLikeName(name)) {
          name = user.metadata?.full_name;
        }
        if (!name || isRoleLikeName(name)) {
          name = user.displayName;
        }
        // Fall back to email only if no valid name found
        if (!name || isRoleLikeName(name)) {
          name = user.email;
        }

        console.log(`[ChatService] Resolved name for ${userId}: ${name}`);
        if (name && !isRoleLikeName(name)) {
          return {
            name: name,
            avatar: user.photoURL || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          };
        }
      }
    } catch (error) {
      console.log(`[ChatService] Error getting database user for ${userId}:`, error.message);
    }

    // Then try company team members - but prioritize email over role-like names
    try {
      const teamMembers = await this.db.findMany('company_team_members', {
        user_id: userId,
      });
      console.log(`[ChatService] Team members for ${userId}:`, teamMembers.length > 0 ? teamMembers.map(m => ({ name: m.name, email: m.email })) : 'none found');

      if (teamMembers.length > 0) {
        const member = teamMembers[0];
        // Prefer actual name, but skip role-like names. Fall back to email.
        let name = member.fullName;
        if (!name || isRoleLikeName(name)) {
          name = member.email;
        }

        if (name && !isRoleLikeName(name)) {
          return {
            name: name,
            avatar: member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          };
        }
      }
    } catch (memberError) {
      console.log(`[ChatService] Error getting team members for ${userId}:`, memberError.message);
    }

    // Try project_members table as well
    try {
      const projectMembers = await this.db.findMany('project_members', {
        user_id: userId,
      });

      if (projectMembers.length > 0) {
        // Get user details from the user field if populated, or from the users table
        for (const pm of projectMembers) {
          if (pm.user && pm.user.name && !isRoleLikeName(pm.user.name)) {
            return {
              name: pm.user.name,
              avatar: pm.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(pm.user.name)}&background=random`,
            };
          }
        }
      }
    } catch (pmError) {
      console.log(`[ChatService] Error getting project members for ${userId}:`, pmError.message);
    }

    // Fallback to generic user
    console.log(`[ChatService] No user info found for ${userId}, returning Unknown User`);
    return {
      name: 'Unknown User',
      avatar: 'https://ui-avatars.com/api/?name=U&background=random',
    };
  }

  // ============================================
  // FILE UPLOAD
  // ============================================

  /**
   * Upload an attachment for chat messages
   */
  async uploadAttachment(
    userId: string,
    file: Express.Multer.File,
    projectId?: string,
    conversationId?: string,
  ): Promise<{ url: string; name: string; type: string; size: number }> {
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');

    // Use project-files bucket (existing bucket) with chat-attachments subfolder
    const bucket = 'project-files';

    // Organize files by project or conversation if provided
    let filePath: string;
    if (projectId) {
      filePath = `chat-attachments/${projectId}/${timestamp}-${sanitizedFileName}`;
    } else if (conversationId) {
      filePath = `chat-attachments/${conversationId}/${timestamp}-${sanitizedFileName}`;
    } else {
      filePath = `chat-attachments/general/${userId}/${timestamp}-${sanitizedFileName}`;
    }

    try {
      // Upload file to storage using database
      const uploadResult = await /* TODO: use StorageService */ this.db.uploadFile(
        bucket,
        file.buffer,
        filePath,
        {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false,
        },
      );

      console.log('[ChatService] Upload result:', uploadResult);

      // Get file URL from upload result - extract publicUrl and decode if needed
      // Use the same pattern as project deliverable uploads (which work correctly)
      const publicUrl = typeof uploadResult === 'string'
        ? uploadResult
        : (uploadResult.publicUrl || uploadResult.url || uploadResult.path);

      // Decode URL-encoded paths
      const finalUrl = publicUrl ? decodeURIComponent(publicUrl) : '';

      if (!finalUrl) {
        throw new Error('No URL returned from storage upload');
      }

      return {
        url: finalUrl,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
      };
    } catch (error) {
      console.error('[ChatService] Error uploading attachment:', error);
      throw new BadRequestException(`Failed to upload attachment: ${error.message}`);
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Parse JSON fields in conversation records
   */
  private parseConversationJson(conversation: any) {
    if (!conversation) return null;

    return {
      ...conversation,
      participants: this.safeJsonParse(conversation.participants),
      metadata: this.safeJsonParse(conversation.metadata),
    };
  }

  /**
   * Parse JSON fields in message records
   */
  private parseMessageJson(message: any) {
    if (!message) return null;

    return {
      ...message,
      attachments: this.safeJsonParse(message.attachments),
      mentions: this.safeJsonParse(message.mentions),
      reactions: this.safeJsonParse(message.reactions),
      read_by: this.safeJsonParse(message.read_by),
      metadata: this.safeJsonParse(message.metadata),
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
