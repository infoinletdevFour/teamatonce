/**
 * Video Call Overlay Component
 * Full-screen overlay for video calls within the Messages page
 * Uses LiveKit components for video conferencing
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useRoomContext,
  useTracks,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, RoomEvent } from 'livekit-client';
import {
  Loader2,
  X,
  Minimize2,
  Maximize2,
  Users,
  MessageSquare,
  Phone,
  PhoneOff,
  Copy,
  Check,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useVideoCallStore } from '@/stores/videoCallStore';

export interface VideoCallOverlayProps {
  isOpen: boolean;
  sessionId: string;
  token: string;
  serverUrl: string;
  callType: 'audio' | 'video';
  onClose: () => void;
  onMinimize?: () => void;
  projectId?: string;
}

export const VideoCallOverlay: React.FC<VideoCallOverlayProps> = ({
  isOpen,
  sessionId,
  token,
  serverUrl,
  callType,
  onClose,
  onMinimize,
  projectId,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const {
    showChat,
    toggleChat,
    unreadChatCount,
    setConnectionState,
    participants,
  } = useVideoCallStore();

  // Handle minimize toggle
  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
    onMinimize?.();
  }, [onMinimize]);

  // Handle maximize from minimized state
  const handleMaximize = useCallback(() => {
    setIsMinimized(false);
  }, []);

  // Handle fullscreen toggle
  const handleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Copy room link
  const handleCopyLink = useCallback(() => {
    const roomUrl = `${window.location.origin}/company/${projectId?.split('/')[0] || ''}/project/${projectId}/video/${sessionId}`;
    navigator.clipboard.writeText(roomUrl).then(() => {
      setLinkCopied(true);
      toast.success('Room link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 3000);
    });
  }, [projectId, sessionId]);

  // Handle room disconnect
  const handleDisconnected = useCallback(() => {
    setConnectionState('disconnected');
    toast.info('Left video call');
    onClose();
  }, [setConnectionState, onClose]);

  // Handle room connection
  const handleConnected = useCallback(() => {
    setConnectionState('connected');
  }, [setConnectionState]);

  // Handle room errors
  const handleError = useCallback((error: Error) => {
    console.error('[VideoCallOverlay] Room error:', error);
    toast.error('Video call error: ' + error.message);
  }, []);

  if (!isOpen || !token || !serverUrl) {
    return null;
  }

  // Minimized view - small floating widget
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        drag
        dragConstraints={{ left: 0, right: window.innerWidth - 200, top: 0, bottom: window.innerHeight - 150 }}
        className="fixed bottom-20 right-4 z-[90] cursor-move"
      >
        <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden w-48">
          {/* Mini preview */}
          <div className="relative h-28 bg-gray-800 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/50" />
            <Phone className="h-8 w-8 text-blue-400 animate-pulse" />
            <div className="absolute top-2 left-2 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              In Call
            </div>
          </div>

          {/* Mini controls */}
          <div className="p-2 flex items-center justify-between">
            <button
              onClick={handleMaximize}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Expand"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <span className="text-xs text-gray-500">
              {participants.length + 1} in call
            </span>
            <button
              onClick={onClose}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
              title="End Call"
            >
              <PhoneOff className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          'fixed inset-0 z-[80] bg-gray-900',
          isFullscreen ? 'p-0' : 'p-4 md:p-8'
        )}
      >
        <div
          className={cn(
            'h-full w-full overflow-hidden',
            isFullscreen
              ? 'rounded-none'
              : 'rounded-2xl border border-gray-700 shadow-2xl'
          )}
        >
          <LiveKitRoom
            video={callType === 'video'}
            audio={{
              autoGainControl: true,
              echoCancellation: true,
              noiseSuppression: true,
            }}
            token={token}
            serverUrl={serverUrl}
            connect={true}
            onConnected={handleConnected}
            onDisconnected={handleDisconnected}
            onError={handleError}
            data-lk-theme="default"
            style={{ height: '100%' }}
          >
            <div className="flex h-full relative bg-gray-900">
              {/* Top control bar */}
              <div className="absolute top-0 left-0 right-0 z-50 p-4">
                <div className="flex items-center justify-between">
                  {/* Left controls */}
                  <div className="flex items-center gap-2">
                    {/* Connection status */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/80 backdrop-blur-sm rounded-full">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-sm text-gray-300">Connected</span>
                    </div>

                    {/* Participant count */}
                    <button
                      onClick={() => setShowParticipants(!showParticipants)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors',
                        showParticipants
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800/80 backdrop-blur-sm text-gray-300 hover:bg-gray-700'
                      )}
                    >
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{participants.length + 1}</span>
                    </button>
                  </div>

                  {/* Right controls */}
                  <div className="flex items-center gap-2">
                    {/* Copy link */}
                    <button
                      onClick={handleCopyLink}
                      className={cn(
                        'p-2 rounded-full transition-all',
                        linkCopied
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-800/80 backdrop-blur-sm text-gray-300 hover:bg-gray-700'
                      )}
                      title="Copy room link"
                    >
                      {linkCopied ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>

                    {/* Toggle chat */}
                    <button
                      onClick={toggleChat}
                      className={cn(
                        'p-2 rounded-full transition-all relative',
                        showChat
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800/80 backdrop-blur-sm text-gray-300 hover:bg-gray-700'
                      )}
                      title="Toggle chat"
                    >
                      <MessageSquare className="h-5 w-5" />
                      {unreadChatCount > 0 && !showChat && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {unreadChatCount > 9 ? '9+' : unreadChatCount}
                        </span>
                      )}
                    </button>

                    {/* Minimize */}
                    <button
                      onClick={handleMinimize}
                      className="p-2 rounded-full bg-gray-800/80 backdrop-blur-sm text-gray-300 hover:bg-gray-700 transition-colors"
                      title="Minimize"
                    >
                      <Minimize2 className="h-5 w-5" />
                    </button>

                    {/* Fullscreen */}
                    <button
                      onClick={handleFullscreen}
                      className="p-2 rounded-full bg-gray-800/80 backdrop-blur-sm text-gray-300 hover:bg-gray-700 transition-colors"
                      title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    >
                      <Maximize2 className="h-5 w-5" />
                    </button>

                    {/* End call */}
                    <button
                      onClick={onClose}
                      className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                      title="End call"
                    >
                      <PhoneOff className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Main video area */}
              <div className={cn('flex-1 transition-all duration-300', showChat && 'mr-80')}>
                <VideoConference />
              </div>

              {/* Participants sidebar */}
              <AnimatePresence>
                {showParticipants && (
                  <motion.div
                    initial={{ x: -320, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -320, opacity: 0 }}
                    className="absolute left-0 top-16 bottom-0 w-72 bg-gray-900/95 backdrop-blur-sm border-r border-gray-800 z-40 overflow-y-auto"
                  >
                    <ParticipantsList />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat sidebar */}
              <AnimatePresence>
                {showChat && (
                  <motion.div
                    initial={{ x: 320, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 320, opacity: 0 }}
                    className="absolute right-0 top-0 bottom-0 w-80 bg-gray-900 border-l border-gray-800 z-40"
                  >
                    <InCallChat onClose={toggleChat} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Audio renderer */}
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Participants List Component
 */
const ParticipantsList: React.FC = () => {
  const { participants } = useVideoCallStore();
  const currentUserId = localStorage.getItem('teamatonce_user_id');
  const currentUserName = localStorage.getItem('teamatonce_user_name') || 'You';

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Participants</h3>

      <div className="space-y-2">
        {/* Current user */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
            {currentUserName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {currentUserName} (You)
            </p>
            <p className="text-xs text-gray-400">Host</p>
          </div>
        </div>

        {/* Other participants */}
        {participants.map((participant) => (
          <div
            key={participant.userId}
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-medium">
              {participant.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {participant.displayName}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {participant.isAudioMuted && <span>🔇</span>}
                {participant.isVideoMuted && <span>📷</span>}
                {participant.isScreenSharing && <span>🖥️</span>}
              </div>
            </div>
          </div>
        ))}

        {participants.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Waiting for others to join...
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * In-Call Chat Component
 */
interface InCallChatProps {
  onClose: () => void;
}

const InCallChat: React.FC<InCallChatProps> = ({ onClose }) => {
  const [message, setMessage] = useState('');
  const { chatMessages, sendMessage, markChatAsRead } = useVideoCallStore();

  useEffect(() => {
    markChatAsRead();
  }, [markChatAsRead]);

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message.trim());
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
      minute: '2-digit',
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
        {chatMessages.length === 0 ? (
          <p className="text-gray-500 text-center text-sm">No messages yet</p>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'space-y-1',
                msg.type === 'system' && 'text-center'
              )}
            >
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
                  <p className="text-sm text-gray-200 break-words">
                    {msg.content}
                  </p>
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
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallOverlay;
