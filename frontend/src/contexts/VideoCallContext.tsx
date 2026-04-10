/**
 * VideoCallContext
 * Global context for video/audio calls
 * Handles incoming call notifications across the entire app
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { socketClient } from '@/lib/websocket-client';
import { videoService, VideoSession } from '@/services/videoService';
import { useVideoCallStore } from '@/stores/videoCallStore';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { IncomingCallModal } from '@/components/video-call/IncomingCallModal';
import type { IncomingCallData } from '@/components/video-call/IncomingCallModal';

// Helper function to extract companyId from current URL
const getCompanyIdFromUrl = (): string | null => {
  const match = window.location.pathname.match(/\/company\/([^/]+)/);
  return match ? match[1] : null;
};

// Helper function to open video call in a new window
const openVideoCallWindow = (companyId: string, projectId: string, sessionId: string, callType: 'audio' | 'video') => {
  const url = `/company/${companyId}/project/${projectId}/video/${sessionId}?callType=${callType}`;
  const windowFeatures = 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no';
  const callWindow = window.open(url, `video-call-${sessionId}`, windowFeatures);

  if (callWindow) {
    callWindow.focus();
  } else {
    // Popup was blocked, try opening in a new tab
    window.open(url, '_blank');
  }

  return callWindow;
};

interface VideoCallContextType {
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
  startCall: (projectId: string, type: 'audio' | 'video', inviteeIds?: string[], conversationId?: string) => Promise<void>;
  acceptCall: (mediaPreferences: { audioEnabled: boolean; videoEnabled: boolean }) => Promise<void>;
  declineCall: () => void;
  endCall: () => Promise<void>;
}

const VideoCallContext = createContext<VideoCallContextType | null>(null);

export function useVideoCallContext() {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error('useVideoCallContext must be used within a VideoCallProvider');
  }
  return context;
}

interface VideoCallProviderProps {
  children: ReactNode;
}

export function VideoCallProvider({ children }: VideoCallProviderProps) {
  const { user, isAuthenticated } = useAuth();

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

  // Store actions
  const { setConnectionState, endCall: resetCallState } = useVideoCallStore();

  // Refs for cleanup
  const handlersRef = useRef<{
    onIncomingCall?: (data: any) => void;
    onCallAccepted?: (data: any) => void;
    onCallDeclined?: (data: any) => void;
    onCallEnded?: (data: any) => void;
  }>({});

  // Handle incoming call event
  const handleIncomingCall = useCallback((data: any) => {
    console.log('[VideoCallContext] Incoming call:', data);

    // Don't show if already in a call
    if (isInCall) {
      console.log('[VideoCallContext] Already in call, ignoring incoming call');
      return;
    }

    // Don't show our own calls
    if (data.callerId === user?.id) {
      return;
    }

    setIncomingCallData({
      sessionId: data.sessionId,
      callerId: data.callerId,
      callerName: data.callerName || 'Unknown',
      callerAvatar: data.callerAvatar,
      callType: data.callType || 'video',
      projectId: data.projectId,
      projectName: data.projectName,
      conversationId: data.conversationId,
    });
    setIsReceivingCall(true);

    toast.info(`Incoming ${data.callType || 'video'} call from ${data.callerName || 'Unknown'}`);
  }, [isInCall, user?.id]);

  // Handle call accepted event
  const handleCallAccepted = useCallback((data: any) => {
    console.log('[VideoCallContext] Call accepted:', data);
    toast.success(`${data.participantName || 'User'} joined the call`);
  }, []);

  // Handle call declined event
  const handleCallDeclined = useCallback((data: any) => {
    console.log('[VideoCallContext] Call declined:', data);
    toast.info(`${data.participantName || 'User'} declined the call`);
  }, []);

  // Handle call ended event
  const handleCallEnded = useCallback((data: any) => {
    console.log('[VideoCallContext] Call ended:', data);

    // If we're in a call with this session, end it
    if (activeSession?.id === data.sessionId) {
      setIsInCall(false);
      setActiveSession(null);
      setToken(null);
      setServerUrl(null);
      setCallType(null);
      setConnectionState('disconnected');
      resetCallState();
      toast.info('Call ended');
    }

    // If receiving call for this session, close the modal
    if (incomingCallData?.sessionId === data.sessionId) {
      setIsReceivingCall(false);
      setIncomingCallData(null);
    }
  }, [activeSession, incomingCallData, setConnectionState, resetCallState]);

  // Setup WebSocket event listeners when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    console.log('[VideoCallContext] Setting up global call listeners for user:', user.id);

    // Ensure WebSocket is connected
    if (!socketClient.isConnected()) {
      socketClient.connect(user.id);
    }

    // Store handler references
    handlersRef.current.onIncomingCall = handleIncomingCall;
    handlersRef.current.onCallAccepted = handleCallAccepted;
    handlersRef.current.onCallDeclined = handleCallDeclined;
    handlersRef.current.onCallEnded = handleCallEnded;

    // Subscribe to video call events
    socketClient.on('incoming-call', handleIncomingCall);
    socketClient.on('call-accepted', handleCallAccepted);
    socketClient.on('call-declined', handleCallDeclined);
    socketClient.on('call-ended', handleCallEnded);

    // Cleanup
    return () => {
      socketClient.off('incoming-call', handleIncomingCall);
      socketClient.off('call-accepted', handleCallAccepted);
      socketClient.off('call-declined', handleCallDeclined);
      socketClient.off('call-ended', handleCallEnded);
    };
  }, [isAuthenticated, user?.id, handleIncomingCall, handleCallAccepted, handleCallDeclined, handleCallEnded]);

  // Start a call
  const startCall = useCallback(async (projectId: string, type: 'audio' | 'video', inviteeIds?: string[], conversationId?: string) => {
    console.log('[VideoCallContext] Starting call:', { type, projectId, userId: user?.id, inviteeIds });

    if (!user?.id) {
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

    const companyId = getCompanyIdFromUrl();
    if (!companyId) {
      const errorMsg = 'Unable to determine company context';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setCallType(type);

      // Create video session
      const session = await videoService.createVideoSession(projectId, {
        roomName: `${type}-call-${Date.now()}`,
        sessionType: 'meeting',
      });

      console.log('[VideoCallContext] Session created:', session.id);

      // Emit WebSocket event to notify others
      socketClient.emit('start-call', {
        sessionId: session.id,
        projectId,
        callerId: user.id,
        callerName: user.name || 'User',
        callType: type,
        conversationId,
        inviteeIds: inviteeIds || [],
      });

      // Open video call in a new window
      openVideoCallWindow(companyId, projectId, session.id, type);

      toast.success(`${type === 'video' ? 'Video' : 'Audio'} call started in new window`);
    } catch (err: any) {
      console.error('[VideoCallContext] Failed to start call:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to start call';
      setError(errorMessage);
      setCallType(null);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Accept incoming call
  const acceptCall = useCallback(async (mediaPreferences: { audioEnabled: boolean; videoEnabled: boolean }) => {
    if (!incomingCallData || !user?.id) {
      return;
    }

    const companyId = getCompanyIdFromUrl();
    if (!companyId) {
      toast.error('Unable to determine company context');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[VideoCallContext] Accepting call:', incomingCallData.sessionId);

      // Store media preferences for the new window to use
      sessionStorage.setItem('call_audio_enabled', mediaPreferences.audioEnabled.toString());
      sessionStorage.setItem('call_video_enabled', mediaPreferences.videoEnabled.toString());

      // Notify caller that we accepted
      socketClient.emit('accept-call', {
        sessionId: incomingCallData.sessionId,
        participantId: user.id,
        participantName: user.name || 'User',
      });

      // Open video call in a new window
      openVideoCallWindow(
        companyId,
        incomingCallData.projectId,
        incomingCallData.sessionId,
        incomingCallData.callType
      );

      // Clear incoming call state
      setIsReceivingCall(false);
      setIncomingCallData(null);

      toast.success('Joining call in new window');
    } catch (err: any) {
      console.error('[VideoCallContext] Failed to accept call:', err);
      setError(err.message || 'Failed to join call');
      toast.error('Failed to join call');
    } finally {
      setIsLoading(false);
    }
  }, [incomingCallData, user]);

  // Decline incoming call
  const declineCall = useCallback(() => {
    if (!incomingCallData || !user?.id) {
      return;
    }

    console.log('[VideoCallContext] Declining call:', incomingCallData.sessionId);

    // Notify caller
    socketClient.emit('decline-call', {
      sessionId: incomingCallData.sessionId,
      participantId: user.id,
      participantName: user.name || 'User',
    });

    // Clear state
    setIsReceivingCall(false);
    setIncomingCallData(null);

    toast.info('Call declined');
  }, [incomingCallData, user]);

  // End current call
  const endCall = useCallback(async () => {
    if (!activeSession) {
      return;
    }

    try {
      console.log('[VideoCallContext] Ending call:', activeSession.id);

      // End session via API
      await videoService.endVideoSession(activeSession.id);

      // Notify others via WebSocket
      socketClient.emit('end-call', {
        sessionId: activeSession.id,
        endedBy: user?.id,
      });

      // Clear state
      setIsInCall(false);
      setActiveSession(null);
      setToken(null);
      setServerUrl(null);
      setCallType(null);
      setConnectionState('disconnected');
      resetCallState();

      toast.info('Call ended');
    } catch (err: any) {
      console.error('[VideoCallContext] Failed to end call:', err);
      // Still clear local state even if API fails
      setIsInCall(false);
      setActiveSession(null);
      setToken(null);
      setServerUrl(null);
      setCallType(null);
      setConnectionState('disconnected');
      resetCallState();
    }
  }, [activeSession, user?.id, setConnectionState, resetCallState]);

  const contextValue: VideoCallContextType = {
    isInCall,
    isReceivingCall,
    incomingCallData,
    activeSession,
    token,
    serverUrl,
    callType,
    isLoading,
    error,
    startCall,
    acceptCall,
    declineCall,
    endCall,
  };

  return (
    <VideoCallContext.Provider value={contextValue}>
      {children}

      {/* Global Incoming Call Modal */}
      <IncomingCallModal
        isOpen={isReceivingCall}
        callData={incomingCallData}
        onAccept={acceptCall}
        onDecline={declineCall}
        autoDeclineTimeout={30}
      />

      {/* Video calls now open in a new window instead of overlay */}
    </VideoCallContext.Provider>
  );
}

export default VideoCallProvider;
