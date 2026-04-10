/**
 * Video Call WebSocket Client for Team@Once
 * Handles real-time video call events via Socket.io
 */

import io from 'socket.io-client';
import { appConfig } from '@/config/app-config';
import { getAuthToken } from './api-client';

type Socket = ReturnType<typeof io>;

// ============================================
// Video Call Socket Events
// ============================================

export type VideoCallEvent =
  // Connection events
  | 'connect'
  | 'disconnect'
  | 'connect_error'
  | 'reconnect'
  // Call management
  | 'video-session-created'
  | 'video-session-ended'
  | 'video-session-cancelled'
  // Participant events
  | 'participant-joined'
  | 'participant-left'
  | 'participant-media-updated'
  | 'participant-hand-updated'
  // Chat events
  | 'chat:message'
  | 'chat:message_received'
  // Recording events
  | 'recording:started'
  | 'recording:stopped'
  | 'recording:status';

export interface MediaToggleData {
  sessionId: string;
  participantId: string;
  mediaType: 'audio' | 'video' | 'screen';
  enabled: boolean;
}

export interface ParticipantJoinedData {
  userId: string;
  displayName: string;
  timestamp: string;
}

export interface ParticipantLeftData {
  userId: string;
  timestamp: string;
}

export interface ChatMessageData {
  sessionId: string;
  content: string;
  replyTo?: string;
}

export interface ChatMessageReceivedData {
  id: string;
  senderId: string;
  content: string;
  replyTo?: string;
  timestamp: string;
}

export interface VideoSessionCreatedData {
  sessionId: string;
  projectId: string;
  roomName: string;
  hostId: string;
  hostName: string;
  sessionType: string;
  agenda?: string;
}

// ============================================
// Video Call Socket Service
// ============================================

class VideoCallSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private eventHandlers = new Map<string, Set<Function>>();

  /**
   * Connect to video calls WebSocket namespace
   */
  connect(token?: string): void {
    if (this.socket?.connected) {
      return;
    }

    const authToken = token || this.token || getAuthToken() || '';
    if (token) {
      this.token = token;
    }

    // Connect to /teamatonce namespace (same as main WebSocket)
    this.socket = io(`${appConfig.websocket.url}/teamatonce`, {
      auth: {
        token: authToken,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventHandlers();
  }

  /**
   * Setup default event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      // Connected to video calls namespace
    });

    this.socket.on('disconnect', (_reason: string) => {
      // Disconnected
    });

    this.socket.on('connect_error', (_error: Error) => {
      // Connection error
    });

    this.socket.on('reconnect', (_attemptNumber: number) => {
      // Reconnected
    });
  }

  /**
   * Disconnect from video calls socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.eventHandlers.clear();
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ============================================
  // Session Management
  // ============================================

  /**
   * Join a video session room
   */
  joinSession(sessionId: string): Promise<{ success: boolean; participants?: any[] }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('join:video-session', { sessionId }, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response || { success: true });
        }
      });
    });
  }

  /**
   * Leave a video session room
   */
  leaveSession(sessionId: string): Promise<{ success: boolean }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('leave:video-session', { sessionId }, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response || { success: true });
        }
      });
    });
  }

  // ============================================
  // Media Controls
  // ============================================

  /**
   * Toggle media (audio/video/screen)
   */
  toggleMedia(data: MediaToggleData): Promise<{ success: boolean }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('video:media-toggle', data, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response || { success: true });
        }
      });
    });
  }

  /**
   * Raise or lower hand
   */
  raiseHand(
    sessionId: string,
    participantId: string,
    raised: boolean
  ): Promise<{ success: boolean }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('video:hand-raise', { sessionId, participantId, raised }, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response || { success: true });
        }
      });
    });
  }

  // ============================================
  // Chat
  // ============================================

  /**
   * Send in-call chat message
   */
  sendChatMessage(data: ChatMessageData): Promise<{ success: boolean; message: any }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('video:chat-message', data, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response || { success: true });
        }
      });
    });
  }

  // ============================================
  // Event Listeners
  // ============================================

  /**
   * Subscribe to video call events
   */
  on(event: VideoCallEvent | string, callback: Function): void {
    if (this.socket) {
      this.socket.on(event, callback as (...args: any[]) => void);

      // Track event handlers for cleanup
      if (!this.eventHandlers.has(event)) {
        this.eventHandlers.set(event, new Set());
      }
      this.eventHandlers.get(event)!.add(callback);
    }
  }

  /**
   * Unsubscribe from video call events
   */
  off(event: VideoCallEvent | string, callback?: Function): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback as (...args: any[]) => void);
        this.eventHandlers.get(event)?.delete(callback);
      } else {
        this.socket.off(event);
        this.eventHandlers.delete(event);
      }
    }
  }

  /**
   * Subscribe once to an event
   */
  once(event: VideoCallEvent | string, callback: Function): void {
    if (this.socket) {
      this.socket.once(event, callback as (...args: any[]) => void);
    }
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Get raw socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Reconnect with new token
   */
  reconnect(token?: string): void {
    this.disconnect();
    this.connect(token);
  }
}

// Export singleton instance
export const videoCallSocket = new VideoCallSocketService();
export default videoCallSocket;
