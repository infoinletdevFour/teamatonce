/**
 * Video Service
 * Handles all video session API calls for Team@Once platform
 * Integrates with database/LiveKit via backend
 */

import { apiClient } from '@/lib/api-client';

// ============================================
// Types (matching backend DTOs)
// ============================================

export interface VideoSession {
  id: string;
  project_id: string;
  room_id: string;
  room_name: string;
  session_type: 'meeting' | 'demo' | 'review' | 'training';
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  duration_minutes?: number;
  host_id: string;
  participants: VideoParticipant[];
  recording_url?: string;
  recording_id?: string;
  meeting_notes?: string;
  agenda?: string;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  metadata?: {
    roomId?: string;
    roomName?: string;
    roomUrl?: string;
    joinUrl?: string;
    embedUrl?: string;
    maxParticipants?: number;
    recordingEnabled?: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface VideoParticipant {
  userId: string;
  displayName: string;
  joinedAt?: string;
  leftAt?: string;
  role?: 'host' | 'participant';
  isAudioMuted?: boolean;
  isVideoMuted?: boolean;
  isScreenSharing?: boolean;
}

export interface CreateVideoSessionDto {
  roomName: string;
  sessionType?: 'meeting' | 'demo' | 'review' | 'training';
  scheduledAt?: string;
  agenda?: string;
}

export interface JoinVideoSessionDto {
  userId: string;
  displayName: string;
}

export interface JoinVideoSessionResponse {
  session: VideoSession;
  token: string;
  roomUrl: string;
  roomName: string;
}

export interface UpdateVideoSessionDto {
  recordingUrl?: string;
  meetingNotes?: string;
  status?: 'scheduled' | 'active' | 'ended' | 'cancelled';
}

export interface UpdateParticipantsDto {
  participants: VideoParticipant[];
}

export interface StartRecordingDto {
  audio_only?: boolean;
}

export interface Recording {
  id: string;
  video_session_id: string;
  project_id: string;
  database_recording_id: string;
  recording_url?: string;
  duration_seconds?: number;
  file_size_bytes?: number;
  status: 'recording' | 'processing' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  started_by: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface StopRecordingResponse {
  message: string;
  duration_seconds: number;
  status: string;
}

// ============================================
// Video Service Class
// ============================================

class VideoService {
  private readonly baseUrl = '/teamatonce/communication';

  /**
   * Create a new video session for a project
   * All project members will be auto-invited via WebSocket notification
   */
  async createVideoSession(projectId: string, data: CreateVideoSessionDto): Promise<VideoSession> {
    const response = await apiClient.post(
      `${this.baseUrl}/projects/${projectId}/video-sessions`,
      data
    );
    return response.data;
  }

  /**
   * Join a video session and get LiveKit token
   * Returns token, room URL, and room name for LiveKit connection
   */
  async joinVideoSession(sessionId: string, data: JoinVideoSessionDto): Promise<JoinVideoSessionResponse> {
    const response = await apiClient.post(
      `${this.baseUrl}/video-sessions/${sessionId}/join`,
      data
    );
    return response.data;
  }

  /**
   * End a video session (host only)
   */
  async endVideoSession(sessionId: string): Promise<VideoSession> {
    const response = await apiClient.post(
      `${this.baseUrl}/video-sessions/${sessionId}/end`
    );
    return response.data;
  }

  /**
   * Get active video sessions for a project
   */
  async getActiveSessions(projectId: string): Promise<VideoSession[]> {
    const response = await apiClient.get(
      `${this.baseUrl}/projects/${projectId}/video-sessions/active`
    );
    return response.data;
  }

  /**
   * Get recent video sessions for a project
   */
  async getRecentSessions(projectId: string, limit: number = 10): Promise<VideoSession[]> {
    const response = await apiClient.get(
      `${this.baseUrl}/projects/${projectId}/video-sessions`,
      { params: { limit } }
    );
    return response.data;
  }

  /**
   * Get a specific video session by ID
   */
  async getVideoSession(sessionId: string): Promise<VideoSession> {
    const response = await apiClient.get(
      `${this.baseUrl}/video-sessions/${sessionId}`
    );
    return response.data;
  }

  /**
   * Update a video session
   */
  async updateVideoSession(sessionId: string, data: UpdateVideoSessionDto): Promise<VideoSession> {
    const response = await apiClient.put(
      `${this.baseUrl}/video-sessions/${sessionId}`,
      data
    );
    return response.data;
  }

  /**
   * Update participants in a video session
   */
  async updateParticipants(sessionId: string, data: UpdateParticipantsDto): Promise<VideoSession> {
    const response = await apiClient.put(
      `${this.baseUrl}/video-sessions/${sessionId}/participants`,
      data
    );
    return response.data;
  }

  /**
   * Cancel a scheduled video session
   */
  async cancelVideoSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(
      `${this.baseUrl}/video-sessions/${sessionId}`
    );
    return response.data;
  }

  // ============================================
  // Recording Methods
  // ============================================

  /**
   * Start recording a video session (host only)
   */
  async startRecording(sessionId: string, options?: StartRecordingDto): Promise<Recording> {
    const response = await apiClient.post(
      `${this.baseUrl}/video-sessions/${sessionId}/recording/start`,
      options || {}
    );
    return response.data;
  }

  /**
   * Stop recording a video session (host only)
   */
  async stopRecording(sessionId: string, recordingId: string): Promise<StopRecordingResponse> {
    const response = await apiClient.post(
      `${this.baseUrl}/video-sessions/${sessionId}/recording/${recordingId}/stop`
    );
    return response.data;
  }

  /**
   * Get all recordings for a video session
   */
  async getRecordings(sessionId: string): Promise<Recording[]> {
    const response = await apiClient.get(
      `${this.baseUrl}/video-sessions/${sessionId}/recordings`
    );
    return response.data;
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Get session type label
   */
  getSessionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      meeting: 'Team Meeting',
      demo: 'Demo Session',
      review: 'Code Review',
      training: 'Training Session',
    };
    return labels[type] || type;
  }

  /**
   * Get session status color
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      scheduled: 'blue',
      active: 'green',
      ended: 'gray',
      cancelled: 'red',
    };
    return colors[status] || 'gray';
  }

  /**
   * Format duration in minutes to human readable
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  /**
   * Check if session is joinable
   */
  isJoinable(session: VideoSession): boolean {
    return session.status === 'active' || session.status === 'scheduled';
  }

  /**
   * Check if user is host of session
   */
  isHost(session: VideoSession, userId: string): boolean {
    return session.host_id === userId;
  }
}

// Export singleton instance
export const videoService = new VideoService();
export default videoService;
