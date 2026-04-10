/**
 * useVideoCall Hook
 * Manages video call state and WebSocket events for the Messages page
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { socketClient } from '@/lib/websocket-client';
import { videoService, VideoSession, JoinVideoSessionResponse } from '@/services/videoService';
import { useVideoCallStore } from '@/stores/videoCallStore';
import { toast } from 'sonner';
import type { IncomingCallData } from '@/components/video-call/IncomingCallModal';

interface UseVideoCallOptions {
  projectId: string;
  userId: string;
  userName: string;
  conversationId?: string;
  onCallStarted?: (sessionId: string) => void;
  onCallEnded?: () => void;
}

interface UseVideoCallReturn {
  // State
  isInCall: boolean;
  isReceivingCall: boolean;
  incomingCallData: IncomingCallData | null;
  activeSession: VideoSession | null;
  token: string | null;
  serverUrl: string | null;
  callType: 'audio' | 'video' | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  startCall: (type: 'audio' | 'video', inviteeIds?: string[]) => Promise<void>;
  acceptCall: (mediaPreferences: { audioEnabled: boolean; videoEnabled: boolean }) => Promise<void>;
  declineCall: () => void;
  endCall: () => Promise<void>;

  // Cleanup
  cleanup: () => void;
}

export function useVideoCall(options: UseVideoCallOptions): UseVideoCallReturn {
  const { projectId, userId, userName, conversationId, onCallStarted, onCallEnded } = options;

  // Local state
  const [isInCall, setIsInCall] = useState(false);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState<IncomingCallData | null>(null);
  const [activeSession, setActiveSession] = useState<VideoSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for event handlers
  const handlersRef = useRef<{
    onIncomingCall?: (data: any) => void;
    onCallAccepted?: (data: any) => void;
    onCallDeclined?: (data: any) => void;
    onCallEnded?: (data: any) => void;
  }>({})

  // Store actions
  const { setConnectionState, endCall: resetCallState } = useVideoCallStore();

  // Handle incoming call event
  const handleIncomingCall = useCallback((data: any) => {
    console.log('[useVideoCall] Incoming call:', data);

    // Don't show if already in a call
    if (isInCall) {
      console.log('[useVideoCall] Already in call, ignoring incoming call');
      return;
    }

    // Don't show our own calls
    if (data.callerId === userId) {
      return;
    }

    setIncomingCallData({
      sessionId: data.sessionId,
      callerId: data.callerId,
      callerName: data.callerName || 'Unknown',
      callerAvatar: data.callerAvatar,
      callType: data.callType || 'video',
      projectId: data.projectId || projectId,
      projectName: data.projectName,
      conversationId: data.conversationId,
    });
    setIsReceivingCall(true);

    toast.info(`Incoming ${data.callType || 'video'} call from ${data.callerName || 'Unknown'}`);
  }, [isInCall, userId, projectId]);

  // Handle call accepted event (when someone accepts our call)
  const handleCallAccepted = useCallback((data: any) => {
    console.log('[useVideoCall] Call accepted:', data);
    toast.success(`${data.participantName || 'User'} joined the call`);
  }, []);

  // Handle call declined event
  const handleCallDeclined = useCallback((data: any) => {
    console.log('[useVideoCall] Call declined:', data);
    toast.info(`${data.participantName || 'User'} declined the call`);
  }, []);

  // Handle call ended event
  const handleCallEnded = useCallback((data: any) => {
    console.log('[useVideoCall] Call ended:', data);

    // If we're in a call with this session, end it
    if (activeSession?.id === data.sessionId) {
      setIsInCall(false);
      setActiveSession(null);
      setToken(null);
      setServerUrl(null);
      setCallType(null);
      setConnectionState('disconnected');
      resetCallState();
      onCallEnded?.();
      toast.info('Call ended');
    }

    // If receiving call for this session, close the modal
    if (incomingCallData?.sessionId === data.sessionId) {
      setIsReceivingCall(false);
      setIncomingCallData(null);
    }
  }, [activeSession, incomingCallData, setConnectionState, resetCallState, onCallEnded]);

  // Setup WebSocket event listeners
  useEffect(() => {
    // Ensure WebSocket is connected
    if (!socketClient.isConnected()) {
      socketClient.connect(userId, projectId);
    }

    // Create handler references
    handlersRef.current.onIncomingCall = handleIncomingCall;
    handlersRef.current.onCallAccepted = handleCallAccepted;
    handlersRef.current.onCallDeclined = handleCallDeclined;
    handlersRef.current.onCallEnded = handleCallEnded;

    // Subscribe to video call events
    socketClient.on('incoming-call', handleIncomingCall);
    socketClient.on('call-accepted', handleCallAccepted);
    socketClient.on('call-declined', handleCallDeclined);
    socketClient.on('call-ended', handleCallEnded);

    // Join project room to receive call events
    socketClient.joinRoom(`project:${projectId}`);

    // Cleanup
    return () => {
      socketClient.off('incoming-call', handleIncomingCall);
      socketClient.off('call-accepted', handleCallAccepted);
      socketClient.off('call-declined', handleCallDeclined);
      socketClient.off('call-ended', handleCallEnded);
    };
  }, [projectId, userId, handleIncomingCall, handleCallAccepted, handleCallDeclined, handleCallEnded]);

  // Start a call
  const startCall = useCallback(async (type: 'audio' | 'video', inviteeIds?: string[]) => {
    console.log('[useVideoCall] Starting call:', { type, projectId, userId, userName, inviteeIds });

    if (!userId) {
      const errorMsg = 'Please log in to start a call';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!projectId) {
      const errorMsg = 'No project selected';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setCallType(type);

      console.log('[useVideoCall] Starting call:', { type, projectId, inviteeIds });

      // Create video session
      const session = await videoService.createVideoSession(projectId, {
        roomName: `${type}-call-${Date.now()}`,
        sessionType: 'meeting',
      });

      console.log('[useVideoCall] Session created:', session.id);

      // Join the session to get LiveKit token
      const joinResponse: JoinVideoSessionResponse = await videoService.joinVideoSession(session.id, {
        userId,
        displayName: userName,
      });

      console.log('[useVideoCall] Joined session, got token');

      // Update state
      setActiveSession(session);
      setToken(joinResponse.token);
      setServerUrl(joinResponse.roomUrl);
      setIsInCall(true);
      setConnectionState('connected');

      // Emit WebSocket event to notify others
      socketClient.emit('start-call', {
        sessionId: session.id,
        projectId,
        callerId: userId,
        callerName: userName,
        callType: type,
        conversationId,
        inviteeIds: inviteeIds || [],
      });

      onCallStarted?.(session.id);
      toast.success(`${type === 'video' ? 'Video' : 'Audio'} call started`);
    } catch (err: any) {
      console.error('[useVideoCall] Failed to start call:', err);
      console.error('[useVideoCall] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        stack: err.stack,
      });
      const errorMessage = err.response?.data?.message || err.message || 'Failed to start call';
      setError(errorMessage);
      setCallType(null);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, userId, userName, conversationId, setConnectionState, onCallStarted]);

  // Accept incoming call
  const acceptCall = useCallback(async (mediaPreferences: { audioEnabled: boolean; videoEnabled: boolean }) => {
    if (!incomingCallData) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[useVideoCall] Accepting call:', incomingCallData.sessionId);

      // Store media preferences
      sessionStorage.setItem('call_audio_enabled', mediaPreferences.audioEnabled.toString());
      sessionStorage.setItem('call_video_enabled', mediaPreferences.videoEnabled.toString());

      // Join the session
      const joinResponse: JoinVideoSessionResponse = await videoService.joinVideoSession(
        incomingCallData.sessionId,
        {
          userId,
          displayName: userName,
        }
      );

      // Get session details
      const session = await videoService.getVideoSession(incomingCallData.sessionId);

      console.log('[useVideoCall] Joined call successfully');

      // Update state
      setActiveSession(session);
      setToken(joinResponse.token);
      setServerUrl(joinResponse.roomUrl);
      setCallType(incomingCallData.callType);
      setIsInCall(true);
      setIsReceivingCall(false);
      setIncomingCallData(null);
      setConnectionState('connected');

      // Notify caller that we accepted
      socketClient.emit('accept-call', {
        sessionId: incomingCallData.sessionId,
        participantId: userId,
        participantName: userName,
      });

      onCallStarted?.(session.id);
      toast.success('Joined call');
    } catch (err: any) {
      console.error('[useVideoCall] Failed to accept call:', err);
      setError(err.message || 'Failed to join call');
      toast.error('Failed to join call');
    } finally {
      setIsLoading(false);
    }
  }, [incomingCallData, userId, userName, setConnectionState, onCallStarted]);

  // Decline incoming call
  const declineCall = useCallback(() => {
    if (!incomingCallData) {
      return;
    }

    console.log('[useVideoCall] Declining call:', incomingCallData.sessionId);

    // Notify caller
    socketClient.emit('decline-call', {
      sessionId: incomingCallData.sessionId,
      participantId: userId,
      participantName: userName,
    });

    // Clear state
    setIsReceivingCall(false);
    setIncomingCallData(null);

    toast.info('Call declined');
  }, [incomingCallData, userId, userName]);

  // End current call
  const endCall = useCallback(async () => {
    if (!activeSession) {
      return;
    }

    try {
      console.log('[useVideoCall] Ending call:', activeSession.id);

      // End session via API
      await videoService.endVideoSession(activeSession.id);

      // Notify others via WebSocket
      socketClient.emit('end-call', {
        sessionId: activeSession.id,
        endedBy: userId,
      });

      // Clear state
      setIsInCall(false);
      setActiveSession(null);
      setToken(null);
      setServerUrl(null);
      setCallType(null);
      setConnectionState('disconnected');
      resetCallState();

      onCallEnded?.();
      toast.info('Call ended');
    } catch (err: any) {
      console.error('[useVideoCall] Failed to end call:', err);
      // Still clear local state even if API fails
      setIsInCall(false);
      setActiveSession(null);
      setToken(null);
      setServerUrl(null);
      setCallType(null);
      setConnectionState('disconnected');
      resetCallState();
      onCallEnded?.();
    }
  }, [activeSession, userId, setConnectionState, resetCallState, onCallEnded]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (isInCall && activeSession) {
      endCall();
    }
    setIsReceivingCall(false);
    setIncomingCallData(null);
  }, [isInCall, activeSession, endCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't automatically end call on unmount - user might be navigating
    };
  }, []);

  return {
    // State
    isInCall,
    isReceivingCall,
    incomingCallData,
    activeSession,
    token,
    serverUrl,
    callType,
    isLoading,
    error,

    // Actions
    startCall,
    acceptCall,
    declineCall,
    endCall,

    // Cleanup
    cleanup,
  };
}

export default useVideoCall;
