/**
 * Video Call Store - Global state management for video calling
 * Uses Zustand for reactive state management
 * Integrated with real backend API, WebSocket, and LiveKit
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { videoService, VideoSession, VideoParticipant } from '@/services/videoService';
import { videoCallSocket } from '@/lib/video-call-socket';
import { liveKitClient } from '@/lib/livekit-client';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: number;
  type: 'message' | 'system' | 'reaction';
  replyTo?: string;
}

export interface CallHistory {
  id: string;
  participants: VideoParticipant[];
  type: 'audio' | 'video';
  duration: number;
  timestamp: number;
  sessionType: string;
  recordingUrl?: string;
}

export interface VideoCallState {
  // Session state
  isCallActive: boolean;
  sessionId: string | null;
  projectId: string | null;
  session: VideoSession | null;
  callType: 'audio' | 'video' | null;
  callStartTime: number | null;
  callDuration: number;

  // Current user
  currentUserId: string | null;
  currentUserName: string | null;

  // Participants
  participants: VideoParticipant[];

  // Local media state
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isSpeaking: boolean;

  // Call features
  isRecording: boolean;
  recordingId: string | null;
  recordingStartTime: number | null;
  recordingDuration: number;
  showChat: boolean;

  // Chat
  chatMessages: ChatMessage[];
  unreadChatCount: number;

  // UI state
  gridLayout: 'gallery' | 'speaker' | 'sidebar';
  isFullscreen: boolean;
  showParticipants: boolean;

  // Connection
  connectionState: string;

  // Call history
  callHistory: CallHistory[];

  // Actions
  startCall: (projectId: string, userId: string, userName: string, type?: 'audio' | 'video') => Promise<void>;
  joinCall: (sessionId: string, userId: string, userName: string) => Promise<void>;
  leaveCall: () => Promise<void>;
  endCall: () => void;

  // Participant management
  addParticipant: (participant: VideoParticipant) => void;
  removeParticipant: (participantId: string) => void;
  updateParticipant: (participantId: string, updates: Partial<VideoParticipant>) => void;

  // Media controls
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  toggleHandRaise: () => void;

  // Recording controls
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  setRecordingId: (recordingId: string | null) => void;
  updateRecordingDuration: () => void;

  // Chat
  sendMessage: (content: string, replyTo?: string) => void;
  addChatMessage: (message: ChatMessage) => void;
  markChatAsRead: () => void;
  toggleChat: () => void;

  // UI actions
  setGridLayout: (layout: 'gallery' | 'speaker' | 'sidebar') => void;
  toggleFullscreen: () => void;
  toggleParticipants: () => void;

  // Utility
  updateCallDuration: () => void;
  setConnectionState: (state: string) => void;
  setSessionInfo: (sessionId: string, projectId: string, session?: VideoSession) => void;

  // Call history
  addToHistory: (call: CallHistory) => void;
  clearHistory: () => void;

  // Internal helpers
  setupWebSocketListeners: () => void;
}

export const useVideoCallStore = create<VideoCallState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isCallActive: false,
    sessionId: null,
    projectId: null,
    session: null,
    callType: null,
    callStartTime: null,
    callDuration: 0,

    currentUserId: null,
    currentUserName: null,

    participants: [],

    isAudioMuted: false,
    isVideoMuted: false,
    isScreenSharing: false,
    isHandRaised: false,
    isSpeaking: false,

    isRecording: false,
    recordingId: null,
    recordingStartTime: null,
    recordingDuration: 0,
    showChat: false,

    chatMessages: [],
    unreadChatCount: 0,

    gridLayout: 'gallery',
    isFullscreen: false,
    showParticipants: true,

    connectionState: 'disconnected',

    callHistory: [],

    // Actions
    startCall: async (projectId: string, userId: string, userName: string, type: 'audio' | 'video' = 'video') => {
      try {
        // 1. Create video session via API
        const session = await videoService.createVideoSession(projectId, {
          roomName: `${type}-call-${Date.now()}`,
          sessionType: 'meeting',
        });

        // 2. Join the session to get LiveKit token
        const joinResponse = await videoService.joinVideoSession(session.id, {
          userId,
          displayName: userName,
        });

        // 3. Connect to WebSocket for real-time events
        if (!videoCallSocket.isConnected()) {
          videoCallSocket.connect();
        }
        await videoCallSocket.joinSession(session.id);

        // 4. Setup WebSocket event listeners
        get().setupWebSocketListeners();

        // 5. Connect to LiveKit room
        await liveKitClient.connect(joinResponse.roomUrl, joinResponse.token);

        // 6. Enable media
        await liveKitClient.enableMicrophone(true);
        if (type === 'video') {
          await liveKitClient.enableCamera(true);
        }

        // 7. Update state
        set({
          isCallActive: true,
          sessionId: session.id,
          projectId,
          session,
          callType: type,
          callStartTime: Date.now(),
          currentUserId: userId,
          currentUserName: userName,
          isVideoMuted: type === 'audio',
          isAudioMuted: false,
          connectionState: 'connected',
        });

        // 8. Add system message
        get().addChatMessage({
          id: `msg-${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          content: `${type === 'video' ? 'Video' : 'Audio'} call started`,
          timestamp: Date.now(),
          type: 'system',
        });

        toast.success(`${type} call started successfully`);
      } catch (error) {
        console.error('[VideoCall] Failed to start call:', error);
        set({ isCallActive: false, sessionId: null });
        toast.error('Failed to start call');
        throw error;
      }
    },

    joinCall: async (sessionId: string, userId: string, userName: string) => {
      try {
        // 1. Join session via API to get LiveKit token
        const joinResponse = await videoService.joinVideoSession(sessionId, {
          userId,
          displayName: userName,
        });

        // 2. Get session details
        const session = await videoService.getVideoSession(sessionId);

        // 3. Connect to WebSocket
        if (!videoCallSocket.isConnected()) {
          videoCallSocket.connect();
        }
        await videoCallSocket.joinSession(sessionId);

        // 4. Setup WebSocket event listeners
        get().setupWebSocketListeners();

        // 5. Connect to LiveKit room
        await liveKitClient.connect(joinResponse.roomUrl, joinResponse.token);

        // 6. Enable media
        await liveKitClient.enableMicrophone(true);
        await liveKitClient.enableCamera(true);

        // 7. Update state
        set({
          isCallActive: true,
          sessionId,
          projectId: session.project_id,
          session,
          callType: 'video',
          callStartTime: Date.now(),
          currentUserId: userId,
          currentUserName: userName,
          connectionState: 'connected',
        });

        // 8. Add system message
        get().addChatMessage({
          id: `msg-${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          content: `${userName} joined the call`,
          timestamp: Date.now(),
          type: 'system',
        });

        toast.success('Joined call successfully');
      } catch (error) {
        console.error('[VideoCall] Failed to join call:', error);
        set({ isCallActive: false });
        toast.error('Failed to join call');
        throw error;
      }
    },

    leaveCall: async () => {
      const state = get();

      if (state.isCallActive && state.sessionId) {
        try {
          // 1. Leave WebSocket room
          await videoCallSocket.leaveSession(state.sessionId);

          // 2. Disconnect from LiveKit
          await liveKitClient.disconnect();

          // 3. Add to history
          if (state.callStartTime) {
            const callData: CallHistory = {
              id: state.sessionId,
              participants: state.participants,
              type: state.callType || 'video',
              duration: Date.now() - state.callStartTime,
              timestamp: state.callStartTime,
              sessionType: state.session?.session_type || 'meeting',
              recordingUrl: state.session?.recording_url,
            };
            get().addToHistory(callData);
          }

          // 4. Clear state
          get().endCall();

          toast.info('Left call');
        } catch (error) {
          console.error('[VideoCall] Failed to leave call:', error);
          // Still clear state even if API fails
          await liveKitClient.disconnect();
          get().endCall();
        }
      }
    },

    endCall: () => {
      set({
        isCallActive: false,
        sessionId: null,
        projectId: null,
        session: null,
        callType: null,
        callStartTime: null,
        callDuration: 0,
        participants: [],
        isAudioMuted: false,
        isVideoMuted: false,
        isScreenSharing: false,
        isHandRaised: false,
        isSpeaking: false,
        isRecording: false,
        recordingId: null,
        recordingStartTime: null,
        recordingDuration: 0,
        showChat: false,
        chatMessages: [],
        unreadChatCount: 0,
        isFullscreen: false,
        connectionState: 'disconnected',
      });
    },

    // Helper to setup WebSocket listeners
    setupWebSocketListeners: () => {
      videoCallSocket.on('participant-joined', (data: any) => {
        get().addParticipant({
          userId: data.userId,
          displayName: data.displayName || 'User',
          joinedAt: data.timestamp,
        });
      });

      videoCallSocket.on('participant-left', (data: any) => {
        get().removeParticipant(data.userId);
      });

      videoCallSocket.on('participant-media-updated', (data: any) => {
        const updates: Partial<VideoParticipant> = {};
        if (data.mediaType === 'audio') updates.isAudioMuted = !data.enabled;
        if (data.mediaType === 'video') updates.isVideoMuted = !data.enabled;
        if (data.mediaType === 'screen') updates.isScreenSharing = data.enabled;
        get().updateParticipant(data.userId, updates);
      });

      videoCallSocket.on('chat:message_received', (message: any) => {
        get().addChatMessage({
          id: message.id,
          senderId: message.senderId,
          senderName: 'User',
          content: message.content,
          timestamp: new Date(message.timestamp).getTime(),
          type: 'message',
          replyTo: message.replyTo,
        });
      });

      // Recording events
      videoCallSocket.on('recording:started', (data: any) => {
        set({
          isRecording: true,
          recordingId: data.recordingId,
          recordingStartTime: Date.now(),
        });
        get().addChatMessage({
          id: `msg-${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          content: 'Recording started',
          timestamp: Date.now(),
          type: 'system',
        });
      });

      videoCallSocket.on('recording:stopped', (data: any) => {
        set({
          isRecording: false,
          recordingId: null,
          recordingStartTime: null,
          recordingDuration: 0,
        });
        get().addChatMessage({
          id: `msg-${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          content: `Recording stopped (${Math.floor((data.duration_seconds || 0) / 60)}m ${(data.duration_seconds || 0) % 60}s)`,
          timestamp: Date.now(),
          type: 'system',
        });
      });

      videoCallSocket.on('recording:completed', (data: any) => {
        toast.success('Recording is ready for download!');
        get().addChatMessage({
          id: `msg-${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          content: 'Recording is now available for download',
          timestamp: Date.now(),
          type: 'system',
        });
      });

      // Setup LiveKit event listeners
      liveKitClient.on('participantConnected', (_participant: any) => {
        // Participant connected
      });

      liveKitClient.on('trackSubscribed', (_data: any) => {
        // Track subscribed
      });
    },

    addParticipant: (participant: VideoParticipant) => {
      set((state) => ({
        participants: [...state.participants, participant],
      }));

      get().addChatMessage({
        id: `msg-${Date.now()}`,
        senderId: 'system',
        senderName: 'System',
        content: `${participant.displayName} joined the call`,
        timestamp: Date.now(),
        type: 'system',
      });
    },

    removeParticipant: (participantId: string) => {
      const state = get();
      const participant = state.participants.find((p) => p.userId === participantId);

      set((state) => ({
        participants: state.participants.filter((p) => p.userId !== participantId),
      }));

      if (participant) {
        get().addChatMessage({
          id: `msg-${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          content: `${participant.displayName} left the call`,
          timestamp: Date.now(),
          type: 'system',
        });
      }
    },

    updateParticipant: (participantId: string, updates: Partial<VideoParticipant>) => {
      set((state) => ({
        participants: state.participants.map((p) =>
          p.userId === participantId ? { ...p, ...updates } : p
        ),
      }));
    },

    toggleAudio: async () => {
      const state = get();
      const newMutedState = !state.isAudioMuted;

      try {
        // 1. Toggle in LiveKit
        await liveKitClient.enableMicrophone(!newMutedState);

        // 2. Update local state
        set({ isAudioMuted: newMutedState });

        // 3. Notify via WebSocket
        if (state.sessionId && state.currentUserId) {
          await videoCallSocket.toggleMedia({
            sessionId: state.sessionId,
            participantId: state.currentUserId,
            mediaType: 'audio',
            enabled: !newMutedState,
          });
        }

      } catch (error) {
        console.error('Failed to toggle audio:', error);
        set({ isAudioMuted: !newMutedState }); // Revert on error
        toast.error('Failed to toggle audio');
        throw error;
      }
    },

    toggleVideo: async () => {
      const state = get();
      const newMutedState = !state.isVideoMuted;

      try {
        // 1. Toggle in LiveKit
        await liveKitClient.enableCamera(!newMutedState);

        // 2. Update local state
        set({ isVideoMuted: newMutedState });

        // 3. Notify via WebSocket
        if (state.sessionId && state.currentUserId) {
          await videoCallSocket.toggleMedia({
            sessionId: state.sessionId,
            participantId: state.currentUserId,
            mediaType: 'video',
            enabled: !newMutedState,
          });
        }

      } catch (error) {
        console.error('Failed to toggle video:', error);
        set({ isVideoMuted: !newMutedState }); // Revert on error
        toast.error('Failed to toggle video');
        throw error;
      }
    },

    startScreenShare: async () => {
      const state = get();

      try {
        // 1. Start screen share in LiveKit
        await liveKitClient.startScreenShare();

        // 2. Update local state
        set({ isScreenSharing: true });

        // 3. Notify via WebSocket
        if (state.sessionId && state.currentUserId) {
          await videoCallSocket.toggleMedia({
            sessionId: state.sessionId,
            participantId: state.currentUserId,
            mediaType: 'screen',
            enabled: true,
          });
        }

        toast.success('Screen sharing started');
      } catch (error) {
        console.error('Failed to start screen share:', error);
        toast.error('Failed to start screen sharing');
        throw error;
      }
    },

    stopScreenShare: async () => {
      const state = get();

      try {
        // 1. Stop screen share in LiveKit
        await liveKitClient.stopScreenShare();

        // 2. Update local state
        set({ isScreenSharing: false });

        // 3. Notify via WebSocket
        if (state.sessionId && state.currentUserId) {
          await videoCallSocket.toggleMedia({
            sessionId: state.sessionId,
            participantId: state.currentUserId,
            mediaType: 'screen',
            enabled: false,
          });
        }

      } catch (error) {
        console.error('Failed to stop screen share:', error);
        toast.error('Failed to stop screen sharing');
        throw error;
      }
    },

    toggleHandRaise: () => {
      const state = get();
      const newHandRaised = !state.isHandRaised;

      set({ isHandRaised: newHandRaised });

      // Notify via WebSocket
      if (state.sessionId && state.currentUserId) {
        videoCallSocket.raiseHand(state.sessionId, state.currentUserId, newHandRaised).catch((_error) => {
          // Failed to toggle hand raise
        });
      }
    },

    // Recording controls
    startRecording: async () => {
      const state = get();

      if (!state.sessionId) {
        toast.error('No active session');
        return;
      }

      if (state.isRecording) {
        toast.error('Recording is already in progress');
        return;
      }

      try {
        // Optimistic update
        set({ isRecording: true, recordingStartTime: Date.now() });

        // Start recording via API
        const recording = await videoService.startRecording(state.sessionId);

        set({
          recordingId: recording.id,
        });

        // Add system message
        get().addChatMessage({
          id: `msg-${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          content: 'Recording started',
          timestamp: Date.now(),
          type: 'system',
        });

        toast.success('Recording started');
      } catch (error: any) {
        // Revert on error
        set({
          isRecording: false,
          recordingId: null,
          recordingStartTime: null,
        });

        console.error('Failed to start recording:', error);
        toast.error(error?.response?.data?.message || 'Failed to start recording');
      }
    },

    stopRecording: async () => {
      const state = get();

      if (!state.sessionId || !state.recordingId) {
        toast.error('No active recording');
        return;
      }

      try {
        // Optimistic update
        const wasRecording = state.isRecording;
        const recordingDuration = state.recordingStartTime
          ? Math.floor((Date.now() - state.recordingStartTime) / 1000)
          : 0;

        set({
          isRecording: false,
          recordingStartTime: null,
          recordingDuration: 0,
        });

        // Stop recording via API
        const response = await videoService.stopRecording(state.sessionId, state.recordingId);

        set({ recordingId: null });

        // Add system message
        get().addChatMessage({
          id: `msg-${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          content: `Recording stopped (${Math.floor(response.duration_seconds / 60)}m ${response.duration_seconds % 60}s)`,
          timestamp: Date.now(),
          type: 'system',
        });

        toast.success('Recording stopped - processing in background');
      } catch (error: any) {
        // Revert on error
        set({
          isRecording: true,
          recordingStartTime: state.recordingStartTime,
        });

        console.error('Failed to stop recording:', error);
        toast.error(error?.response?.data?.message || 'Failed to stop recording');
      }
    },

    setRecordingId: (recordingId: string | null) => {
      set({ recordingId });
    },

    updateRecordingDuration: () => {
      const state = get();
      if (state.isRecording && state.recordingStartTime) {
        set({ recordingDuration: Math.floor((Date.now() - state.recordingStartTime) / 1000) });
      }
    },

    sendMessage: async (content: string, replyTo?: string) => {
      const state = get();

      if (!state.currentUserId || !state.sessionId) {
        return;
      }

      const message: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        senderId: state.currentUserId,
        senderName: state.currentUserName || 'Unknown',
        content: content.trim(),
        timestamp: Date.now(),
        type: 'message',
        replyTo,
      };

      try {
        // 1. Send via WebSocket
        await videoCallSocket.sendChatMessage({
          sessionId: state.sessionId,
          content: message.content,
          replyTo,
        });

        // 2. Add to local state immediately
        get().addChatMessage(message);
      } catch (error) {
        console.error('Failed to send chat message:', error);
        toast.error('Failed to send message');
      }
    },

    addChatMessage: (message: ChatMessage) => {
      set((state) => ({
        chatMessages: [...state.chatMessages, message],
        unreadChatCount: state.showChat ? state.unreadChatCount : state.unreadChatCount + 1,
      }));
    },

    markChatAsRead: () => {
      set({ unreadChatCount: 0 });
    },

    toggleChat: () => {
      const state = get();
      const newShowChat = !state.showChat;

      set({ showChat: newShowChat });

      if (newShowChat) {
        get().markChatAsRead();
      }
    },

    setGridLayout: (layout: 'gallery' | 'speaker' | 'sidebar') => {
      set({ gridLayout: layout });
    },

    toggleFullscreen: () => {
      set((state) => ({ isFullscreen: !state.isFullscreen }));
    },

    toggleParticipants: () => {
      set((state) => ({ showParticipants: !state.showParticipants }));
    },

    updateCallDuration: () => {
      const state = get();
      if (state.callStartTime) {
        set({ callDuration: Date.now() - state.callStartTime });
      }
    },

    setConnectionState: (connectionState: string) => {
      set({ connectionState });
    },

    setSessionInfo: (sessionId: string, projectId: string, session?: VideoSession) => {
      set({
        sessionId,
        projectId,
        session: session || null,
        isCallActive: true,
      });
    },

    addToHistory: (call: CallHistory) => {
      set((state) => ({
        callHistory: [call, ...state.callHistory.slice(0, 49)], // Keep last 50 calls
      }));
    },

    clearHistory: () => {
      set({ callHistory: [] });
    },
  }))
);

// Auto-update call duration every second when in call
let durationInterval: NodeJS.Timeout | null = null;

useVideoCallStore.subscribe(
  (state) => state.isCallActive,
  (isCallActive) => {
    if (isCallActive) {
      durationInterval = setInterval(() => {
        useVideoCallStore.getState().updateCallDuration();
      }, 1000);
    } else if (durationInterval) {
      clearInterval(durationInterval);
      durationInterval = null;
    }
  }
);

// Auto-update recording duration every second when recording
let recordingDurationInterval: NodeJS.Timeout | null = null;

useVideoCallStore.subscribe(
  (state) => state.isRecording,
  (isRecording) => {
    if (isRecording) {
      recordingDurationInterval = setInterval(() => {
        useVideoCallStore.getState().updateRecordingDuration();
      }, 1000);
    } else if (recordingDurationInterval) {
      clearInterval(recordingDurationInterval);
      recordingDurationInterval = null;
    }
  }
);

export default useVideoCallStore;
