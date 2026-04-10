/**
 * Message Service
 * Handles all messaging and conversation API calls
 */

import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/lib/api-client';

// Types
export interface SendMessageData {
  content: string;
  messageType?: 'text' | 'code' | 'file' | 'system';
  attachments?: Attachment[];
  mentions?: string[];
  replyToId?: string;
}

export interface CreateConversationData {
  projectId?: string;
  conversationType: 'direct' | 'group' | 'project';
  title?: string;
  participants: string[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  mimeType: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: 'text' | 'code' | 'file' | 'system';
  content: string;
  attachments?: Attachment[];
  mentions?: string[];
  reply_to_id?: string;
  reactions?: Record<string, string[]>;
  read_by?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Populated fields
  sender?: any;
}

export interface Conversation {
  id: string;
  project_id?: string;
  conversation_type: 'direct' | 'group' | 'project';
  title?: string;
  participants: string[];
  created_by: string;
  last_message_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Populated fields
  lastMessage?: Message;
  unreadCount?: number;
  participantDetails?: any[];
}

export interface UpdateMessageData {
  content?: string;
  reactions?: Record<string, string[]>;
}

class MessageService {
  // ============================================
  // CONVERSATION MANAGEMENT
  // ============================================

  /**
   * Create a new conversation
   */
  async createConversation(_companyId: string, data: CreateConversationData): Promise<Conversation> {
    const response = await apiClient.post<ApiResponse<Conversation> | Conversation>(
      `/teamatonce/communication/conversations`,
      data
    );
    // Handle both wrapped and unwrapped responses
    const result = (response.data as any).data || response.data;
    return result as Conversation;
  }

  /**
   * Get all conversations for current user
   */
  async getConversations(_companyId: string, projectId?: string): Promise<Conversation[]> {
    const params = projectId ? { projectId } : {};
    const response = await apiClient.get<ApiResponse<Conversation[]> | Conversation[]>(
      `/teamatonce/communication/conversations`,
      { params }
    );
    // Handle both wrapped and unwrapped responses
    const result = (response.data as any).data || response.data;
    return Array.isArray(result) ? result : [];
  }

  /**
   * Get a specific conversation by ID
   */
  async getConversation(_companyId: string, conversationId: string): Promise<Conversation> {
    const response = await apiClient.get<ApiResponse<Conversation>>(
      `/teamatonce/communication/conversations/${conversationId}`
    );
    return response.data.data;
  }

  // ============================================
  // MESSAGE MANAGEMENT
  // ============================================

  /**
   * Send a message in a conversation
   */
  async sendMessage(_companyId: string, conversationId: string, data: SendMessageData): Promise<Message> {
    const response = await apiClient.post<ApiResponse<Message> | Message>(
      `/teamatonce/communication/conversations/${conversationId}/messages`,
      data
    );
    // Handle both wrapped and unwrapped responses
    const result = (response.data as any).data || response.data;
    return result as Message;
  }

  /**
   * Get messages from a conversation
   */
  async getMessages(
    _companyId: string,
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Message[]> {
    const response = await apiClient.get<ApiResponse<Message[]> | Message[]>(
      `/teamatonce/communication/conversations/${conversationId}/messages`,
      {
        params: { limit, offset },
      }
    );
    // Handle both wrapped and unwrapped responses
    const result = (response.data as any).data || response.data;
    return Array.isArray(result) ? result : [];
  }

  /**
   * Update a message (edit content or add reactions)
   */
  async updateMessage(_companyId: string, messageId: string, data: UpdateMessageData): Promise<Message> {
    const response = await apiClient.put<ApiResponse<Message>>(
      `/teamatonce/communication/messages/${messageId}`,
      data
    );
    return response.data.data;
  }

  /**
   * Delete a message
   */
  async deleteMessage(_companyId: string, messageId: string): Promise<void> {
    await apiClient.delete(`/teamatonce/communication/messages/${messageId}`);
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markAsRead(_companyId: string, conversationId: string): Promise<void> {
    await apiClient.post(`/teamatonce/communication/conversations/${conversationId}/read`);
  }

  // ============================================
  // PROJECT MESSAGES (Legacy Support)
  // ============================================

  /**
   * Get project messages (legacy endpoint)
   * Backend returns { messages: Message[] }
   */
  async getProjectMessages(_companyId: string, projectId: string, limit: number = 50): Promise<Message[]> {
    const response = await apiClient.get<any>(
      `/teamatonce/communication/projects/${projectId}/messages`,
      {
        params: { limit },
      }
    );
    // Backend returns { messages: [] }, handle both formats for compatibility
    return response.data?.messages || response.data?.data || [];
  }

  // ============================================
  // FILE UPLOAD SUPPORT
  // ============================================

  /**
   * Upload a file attachment
   */
  async uploadAttachment(_companyId: string, file: File, conversationId: string): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);

    // Don't set Content-Type header - browser will auto-set with boundary for FormData
    const response = await apiClient.post<Attachment | ApiResponse<Attachment>>(
      `/teamatonce/communication/attachments/upload`,
      formData
    );
    // Handle both direct response and wrapped response formats
    const data = response.data;
    if ('data' in data && data.data) {
      return data.data as Attachment;
    }
    return data as Attachment;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get unread count for a conversation
   */
  getUnreadCount(conversation: Conversation, currentUserId: string): number {
    if (!conversation.lastMessage) return 0;

    const readBy = conversation.lastMessage.read_by || [];
    return readBy.includes(currentUserId) ? 0 : 1;
  }

  /**
   * Format message timestamp
   */
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  }

  /**
   * Group messages by date
   */
  groupMessagesByDate(messages: Message[]): { date: string; messages: Message[] }[] {
    const groups: { [key: string]: Message[] } = {};

    messages.forEach((message) => {
      const date = new Date(message.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages,
    }));
  }
}

export const messageService = new MessageService();
export default messageService;
