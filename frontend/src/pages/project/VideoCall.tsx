/**
 * Video Call Page for Team@Once
 * Uses LiveKit components for real video conferencing through database backend
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Video,
  Mic,
  MessageSquare,
  Radio,
  Send,
  Link as LinkIcon,
  Check,
  AlertCircle,
  X,
  Circle,
  Square,
} from 'lucide-react';
import { toast } from 'sonner';
import { videoService } from '@/services/videoService';
import { useVideoCallStore } from '@/stores/videoCallStore';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface VideoCallProps {
  sessionId?: string;
}

/**
 * Main Video Call Component
 * Handles joining calls and displaying the LiveKit video conference
 * Opens in a new window from Messages/CommunicationHub pages
 */
export const VideoCall: React.FC<VideoCallProps> = ({ sessionId: propSessionId }) => {
  const { companyId, projectId, sessionId: paramSessionId } = useParams<{ companyId: string; projectId: string; sessionId: string }>();
  const navigate = useNavigate();

  const sessionId = propSessionId || paramSessionId;

  // Get callType from URL search params (defaults to video)
  const searchParams = new URLSearchParams(window.location.search);
  const urlCallType = searchParams.get('callType') as 'audio' | 'video' | null;

  // Get media preferences from sessionStorage (set by IncomingCallModal)
  const storedAudioEnabled = sessionStorage.getItem('call_audio_enabled');
  const storedVideoEnabled = sessionStorage.getItem('call_video_enabled');

  const [token, setToken] = useState<string>('');
  const [serverUrl, setServerUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callType] = useState<'audio' | 'video'>(urlCallType || 'video');
  const [linkCopied, setLinkCopied] = useState(false);
  const [initialAudioEnabled] = useState(() => storedAudioEnabled !== 'false');
  const [initialVideoEnabled] = useState(() => storedVideoEnabled !== 'false' && (urlCallType || 'video') === 'video');

  // Get user info from AuthContext
  const { user, loading: authLoading } = useAuth();

  // Store state
  const {
    isRecording,
    recordingDuration,
    showChat,
    chatMessages,
    unreadChatCount,
    toggleChat,
    addChatMessage,
    setConnectionState,
    setSessionInfo,
    startRecording,
    stopRecording,
  } = useVideoCallStore();

  // Session state for host check
  const [session, setSession] = useState<any>(null);
  const [isTogglingRecording, setIsTogglingRecording] = useState(false);

  // Check if current user is host
  const isHost = session?.host_id === user?.id;

  // Join the video call on mount (wait for auth to complete)
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    const joinCall = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setIsLoading(false);
        return;
      }

      if (!user?.id) {
        setError('Please log in to join the call');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('[VideoCall] Joining session:', sessionId);

        // Join the session via API to get LiveKit token
        const response = await videoService.joinVideoSession(sessionId, {
          userId: user.id,
          displayName: user.name || 'User',
        });

        console.log('[VideoCall] Join response received');

        if (!response.token || !response.roomUrl) {
          throw new Error('Invalid response from server: missing token or room URL');
        }

        setToken(response.token);
        setServerUrl(response.roomUrl);
        setSession(response.session);
        setConnectionState('connected');

        // Set session info in store for recording functionality
        if (response.session && projectId) {
          setSessionInfo(sessionId, projectId, response.session);
        }

        toast.success('Connected to video call');
      } catch (err: any) {
        console.error('[VideoCall] Failed to join:', err);
        setError(err.message || 'Failed to join video call');
        toast.error('Failed to join video call');
      } finally {
        setIsLoading(false);
      }
    };

    joinCall();
  }, [sessionId, projectId, user, authLoading, setConnectionState, setSessionInfo]);

  // Handle disconnect
  const handleDisconnected = useCallback(async () => {
    try {
      console.log('[VideoCall] Disconnected from call');
      setConnectionState('disconnected');
      toast.info('Left video call');

      // Clear stored media preferences
      sessionStorage.removeItem('call_audio_enabled');
      sessionStorage.removeItem('call_video_enabled');

      // Close the window if it was opened as a popup, otherwise navigate back
      if (window.opener) {
        window.close();
      } else if (companyId && projectId) {
        navigate(`/company/${companyId}/project/${projectId}/messages`);
      }
    } catch (err) {
      console.error('[VideoCall] Error handling disconnect:', err);
    }
  }, [companyId, projectId, navigate, setConnectionState]);

  // Handle recording toggle
  const handleToggleRecording = useCallback(async () => {
    if (isTogglingRecording) return;

    setIsTogglingRecording(true);
    try {
      if (isRecording) {
        await stopRecording();
      } else {
        await startRecording();
      }
    } finally {
      setIsTogglingRecording(false);
    }
  }, [isRecording, isTogglingRecording, startRecording, stopRecording]);

  // Format recording duration
  const formatRecordingDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Copy room link
  const handleCopyRoomLink = useCallback(() => {
    const roomUrl = `${window.location.origin}/company/${companyId}/project/${projectId}/video/${sessionId}`;

    navigator.clipboard.writeText(roomUrl).then(() => {
      setLinkCopied(true);
      toast.success('Room link copied to clipboard!');

      setTimeout(() => {
        setLinkCopied(false);
      }, 3000);
    }).catch((err) => {
      console.error('Failed to copy link:', err);
      toast.error('Failed to copy link');
    });
  }, [companyId, projectId, sessionId]);

  // Loading state (includes auth loading)
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white text-lg">
            {authLoading ? 'Authenticating...' : 'Connecting to video call...'}
          </p>
          <p className="text-gray-400 text-sm mt-2">Please wait while we set up your connection</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center max-w-md">
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-400 mb-2">Connection Failed</h3>
            <p className="text-gray-300 mb-6">{error}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  if (window.opener) {
                    window.close();
                  } else if (companyId && projectId) {
                    navigate(`/company/${companyId}/project/${projectId}/messages`);
                  }
                }}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {window.opener ? 'Close Window' : 'Go Back'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No token yet
  if (!token || !serverUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white text-lg">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen relative bg-gray-900">
      <LiveKitRoom
        video={callType === 'video' && initialVideoEnabled}
        audio={initialAudioEnabled ? {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        } : false}
        token={token}
        serverUrl={serverUrl}
        connect={true}
        onDisconnected={handleDisconnected}
        data-lk-theme="default"
        style={{ height: '100%' }}
      >
        <div className="flex h-full relative">
          {/* Main video conference UI */}
          <div className={cn('w-full transition-all duration-300', showChat && 'mr-80')}>
            <VideoConference />
          </div>

          {/* Chat Sidebar */}
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="absolute right-0 top-0 bottom-0 bg-gray-900 border-l border-gray-800 flex flex-col z-50"
              >
                <ChatPanel
                  messages={chatMessages}
                  onClose={toggleChat}
                  onSendMessage={(content) => {
                    addChatMessage({
                      id: `msg-${Date.now()}`,
                      senderId: user?.id || '',
                      senderName: user?.name || 'User',
                      content,
                      timestamp: Date.now(),
                      type: 'message',
                    });
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Control Buttons */}
          <div className="absolute top-4 right-4 z-40 flex gap-2 items-center">
            {/* Recording indicator with duration */}
            {isRecording && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-600 rounded-full shadow-lg animate-pulse">
                <Radio className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-medium">
                  {formatRecordingDuration(recordingDuration)}
                </span>
              </div>
            )}

            {/* Record Button (Host only) */}
            {isHost && (
              <button
                onClick={handleToggleRecording}
                disabled={isTogglingRecording}
                className={cn(
                  'p-3 rounded-full shadow-lg hover:scale-105 transition-all',
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-700 hover:bg-gray-600',
                  isTogglingRecording && 'opacity-50 cursor-not-allowed'
                )}
                title={isRecording ? 'Stop recording' : 'Start recording'}
              >
                {isTogglingRecording ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : isRecording ? (
                  <Square className="h-5 w-5 text-white fill-white" />
                ) : (
                  <Circle className="h-5 w-5 text-red-500 fill-red-500" />
                )}
              </button>
            )}

            {/* Copy Room Link */}
            <button
              onClick={handleCopyRoomLink}
              className={cn(
                'p-3 rounded-full shadow-lg hover:scale-105 transition-all',
                linkCopied
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-700 hover:bg-gray-600'
              )}
              title="Copy room link"
            >
              {linkCopied ? (
                <Check className="h-5 w-5 text-white" />
              ) : (
                <LinkIcon className="h-5 w-5 text-white" />
              )}
            </button>

            {/* Toggle Chat */}
            <button
              onClick={toggleChat}
              className={cn(
                'p-3 rounded-full shadow-lg hover:scale-105 transition-all relative',
                showChat
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-700 hover:bg-gray-600'
              )}
              title="Toggle chat"
            >
              <MessageSquare className="h-5 w-5 text-white" />
              {unreadChatCount > 0 && !showChat && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Audio renderer for all participants */}
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};

/**
 * Chat Panel Component
 */
interface ChatPanelProps {
  messages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: number;
    type: 'message' | 'system' | 'reaction';
  }>;
  onClose: () => void;
  onSendMessage: (content: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onClose, onSendMessage }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Chat</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center text-sm">No messages yet</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={cn(
              'space-y-1',
              msg.type === 'system' && 'text-center'
            )}>
              {msg.type === 'system' ? (
                <p className="text-gray-500 text-sm italic">{msg.content}</p>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-300">
                      {msg.senderName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 break-words">{msg.content}</p>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Custom Video Grid Layout (Alternative to VideoConference)
 * Use this for more control over the video layout
 */
export const CustomVideoGrid: React.FC = () => {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <div className="flex flex-col h-full">
      <GridLayout tracks={tracks} style={{ flex: 1 }}>
        <ParticipantTile />
      </GridLayout>
      <ControlBar />
    </div>
  );
};

/**
 * Start Call Page Component
 * Shows a pre-call screen where users can start a new call
 */
export const StartVideoCall: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isCreating, setIsCreating] = useState(false);
  const [callType, setCallType] = useState<'video' | 'audio'>('video');
  const [roomName, setRoomName] = useState('');
  const [sessionType, setSessionType] = useState<'meeting' | 'demo' | 'review' | 'training'>('meeting');

  const handleStartCall = async () => {
    if (!projectId || !user?.id) {
      toast.error('Missing project or user information');
      return;
    }

    try {
      setIsCreating(true);

      // Create the video session
      const session = await videoService.createVideoSession(projectId, {
        roomName: roomName || `${sessionType}-${Date.now()}`,
        sessionType,
      });

      console.log('[StartVideoCall] Session created:', session.id);
      toast.success('Call created! Connecting...');

      // Navigate to the video call page
      navigate(`/projects/${projectId}/video/${session.id}`);
    } catch (err: any) {
      console.error('[StartVideoCall] Failed to create call:', err);
      toast.error(err.message || 'Failed to start call');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-700">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Start a Video Call</h2>
            <p className="text-gray-400 mt-2">Create a new video session for your team</p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Room Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Room Name (optional)
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g., Sprint Planning"
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Session Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Session Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['meeting', 'demo', 'review', 'training'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSessionType(type)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                      sessionType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Call Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Call Type
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setCallType('video')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors',
                    callType === 'video'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  )}
                >
                  <Video className="w-5 h-5" />
                  Video
                </button>
                <button
                  onClick={() => setCallType('audio')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors',
                    callType === 'audio'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  )}
                >
                  <Mic className="w-5 h-5" />
                  Audio Only
                </button>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartCall}
              disabled={isCreating}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating call...
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  Start Call
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
