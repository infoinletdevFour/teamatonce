/**
 * Incoming Call Modal Component
 * Displays when receiving an incoming video/audio call
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  X,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface IncomingCallData {
  sessionId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  callType: 'audio' | 'video';
  projectId: string;
  projectName?: string;
  conversationId?: string;
}

interface IncomingCallModalProps {
  isOpen: boolean;
  callData: IncomingCallData | null;
  onAccept: (mediaPreferences: { audioEnabled: boolean; videoEnabled: boolean }) => void;
  onDecline: () => void;
  autoDeclineTimeout?: number; // in seconds, default 30
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  isOpen,
  callData,
  onAccept,
  onDecline,
  autoDeclineTimeout = 30,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(autoDeclineTimeout);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && callData) {
      setTimeRemaining(autoDeclineTimeout);
      setAudioEnabled(true);
      setVideoEnabled(callData.callType === 'video');

      // Store media preferences in sessionStorage for pre-call setup
      sessionStorage.setItem('incoming_call_audio', 'true');
      sessionStorage.setItem('incoming_call_video', callData.callType === 'video' ? 'true' : 'false');

      // Start ringtone
      try {
        audioRef.current = new Audio('/sounds/ringtone.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch(() => {
          // Browser may block autoplay - that's okay
        });
      } catch {
        // Audio not available
      }
    }

    return () => {
      // Stop ringtone on cleanup
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isOpen, callData, autoDeclineTimeout]);

  // Auto-decline countdown
  useEffect(() => {
    if (isOpen && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            onDecline();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, onDecline]);

  // Handle accept
  const handleAccept = useCallback(() => {
    // Store final preferences
    sessionStorage.setItem('incoming_call_audio', audioEnabled.toString());
    sessionStorage.setItem('incoming_call_video', videoEnabled.toString());

    // Stop ringtone
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    onAccept({ audioEnabled, videoEnabled });
  }, [audioEnabled, videoEnabled, onAccept]);

  // Handle decline
  const handleDecline = useCallback(() => {
    // Stop ringtone
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Clear stored preferences
    sessionStorage.removeItem('incoming_call_audio');
    sessionStorage.removeItem('incoming_call_video');

    onDecline();
  }, [onDecline]);

  // Toggle media preferences
  const toggleAudio = useCallback(() => {
    setAudioEnabled((prev) => !prev);
  }, []);

  const toggleVideo = useCallback(() => {
    setVideoEnabled((prev) => !prev);
  }, []);

  if (!callData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-sm mx-4"
          >
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden">
              {/* Close button */}
              <button
                onClick={handleDecline}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors z-10"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header with call type indicator */}
              <div className="pt-6 pb-2 px-6 text-center">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                  {callData.callType === 'video' ? (
                    <>
                      <Video className="h-4 w-4" />
                      Incoming Video Call
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4" />
                      Incoming Audio Call
                    </>
                  )}
                </span>
              </div>

              {/* Caller info with ring animation */}
              <div className="py-8 px-6 text-center">
                <div className="relative inline-block mb-4">
                  {/* Ring animation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      className="absolute w-24 h-24 rounded-full border-2 border-blue-500"
                      animate={{
                        scale: [1, 1.4, 1.4],
                        opacity: [0.8, 0, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeOut',
                      }}
                    />
                    <motion.div
                      className="absolute w-24 h-24 rounded-full border-2 border-blue-500"
                      animate={{
                        scale: [1, 1.4, 1.4],
                        opacity: [0.8, 0, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeOut',
                        delay: 0.5,
                      }}
                    />
                    <motion.div
                      className="absolute w-24 h-24 rounded-full border-2 border-blue-500"
                      animate={{
                        scale: [1, 1.4, 1.4],
                        opacity: [0.8, 0, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeOut',
                        delay: 1,
                      }}
                    />
                  </div>

                  {/* Avatar */}
                  {callData.callerAvatar ? (
                    <img
                      src={callData.callerAvatar}
                      alt={callData.callerName}
                      className="relative w-24 h-24 rounded-full object-cover border-4 border-gray-700"
                    />
                  ) : (
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-gray-700">
                      <User className="h-12 w-12 text-white" />
                    </div>
                  )}
                </div>

                {/* Caller name */}
                <h3 className="text-xl font-semibold text-white mb-1">
                  {callData.callerName}
                </h3>

                {/* Project name if available */}
                {callData.projectName && (
                  <p className="text-sm text-gray-400 mb-2">
                    {callData.projectName}
                  </p>
                )}

                {/* Auto-decline countdown */}
                <p className="text-sm text-gray-500">
                  Auto-decline in{' '}
                  <span className="text-blue-400 font-medium">{timeRemaining}s</span>
                </p>
              </div>

              {/* Pre-call media toggles */}
              <div className="px-6 pb-4">
                <p className="text-xs text-gray-500 text-center mb-3">
                  Adjust before answering
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={toggleAudio}
                    className={cn(
                      'p-3 rounded-full transition-all',
                      audioEnabled
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    )}
                    title={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                  >
                    {audioEnabled ? (
                      <Mic className="h-5 w-5" />
                    ) : (
                      <MicOff className="h-5 w-5" />
                    )}
                  </button>

                  {callData.callType === 'video' && (
                    <button
                      onClick={toggleVideo}
                      className={cn(
                        'p-3 rounded-full transition-all',
                        videoEnabled
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      )}
                      title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
                    >
                      {videoEnabled ? (
                        <Video className="h-5 w-5" />
                      ) : (
                        <VideoOff className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-6 pt-2">
                <div className="flex justify-center gap-6">
                  {/* Decline button */}
                  <motion.button
                    onClick={handleDecline}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 transition-colors">
                      <PhoneOff className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-sm text-gray-400">Decline</span>
                  </motion.button>

                  {/* Accept button */}
                  <motion.button
                    onClick={handleAccept}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 transition-colors">
                      {callData.callType === 'video' ? (
                        <Video className="h-7 w-7 text-white" />
                      ) : (
                        <Phone className="h-7 w-7 text-white" />
                      )}
                    </div>
                    <span className="text-sm text-gray-400">Accept</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IncomingCallModal;
