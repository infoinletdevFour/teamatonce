import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import {
  MessageSquare,
  Video,
  Calendar,
  Phone,
  Users,
  Clock,
  Plus,
  Search,
  MoreVertical,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { UserAvatar, AccessDenied, AccessLoading } from '@/components/project';
import { TeamMember } from '@/lib/types/project';
import { MessageList, MessageInput, ConversationList } from '@/components/communication';
import { messageService, Message, Conversation, SendMessageData } from '@/services/messageService';
import { getProjectTeam } from '@/services/teamMemberService';
import { socketClient } from '@/lib/websocket-client';
import { ProjectPageLayout } from '@/layouts/ProjectPageLayout';
import { useVideoCallContext } from '@/contexts/VideoCallContext';
import { useProjectRole } from '@/hooks/useProjectRole';
import { toast } from 'sonner';
import { RejectedProjectBanner } from '@/components/project/RejectedProjectBanner';
import { getProjectStats } from '@/services/projectService';

/**
 * Communication Hub Page
 * Centralized communication center with chat, video calls, meetings, and whiteboard
 */

interface Meeting {
  id: string;
  title: string;
  time: Date;
  duration: number;
  attendees: TeamMember[];
  type: 'scheduled' | 'ongoing' | 'completed';
}

export const CommunicationHub: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { company, loading: companyLoading } = useCompany();
  const companyId = company?.id || '';

  // Check project membership
  const { hasAccess, loading: roleLoading } = useProjectRole(projectId);

  const [activeTab, setActiveTab] = useState<'chat' | 'meetings' | 'contacts'>('chat');

  // Team members state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);

  // Real-time messaging state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);

  // Meetings state (placeholder - no backend API yet)
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  // Project approval state
  const [approvalStatus, setApprovalStatus] = useState<string>('approved');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Check if project is rejected
  const isProjectRejected = approvalStatus === 'rejected';

  // Get current user ID
  const currentUserId = user?.id || '';

  // Video call context
  const {
    isInCall,
    callType,
    isLoading: callLoading,
    startCall,
  } = useVideoCallContext();

  // Handlers for video/audio calls
  const handleStartVideoCall = useCallback(() => {
    if (!projectId) return;
    // Get participant IDs from the current conversation (excluding current user)
    const participantIds = selectedConversation?.participants
      ?.filter(id => id !== currentUserId) || [];
    startCall(projectId, 'video', participantIds, selectedConversation?.id);
  }, [projectId, selectedConversation, currentUserId, startCall]);

  const handleStartAudioCall = useCallback(() => {
    if (!projectId) return;
    // Get participant IDs from the current conversation (excluding current user)
    const participantIds = selectedConversation?.participants
      ?.filter(id => id !== currentUserId) || [];
    startCall(projectId, 'audio', participantIds, selectedConversation?.id);
  }, [projectId, selectedConversation, currentUserId, startCall]);

  // Refs to track latest values for WebSocket callbacks (avoid stale closures)
  const selectedConversationRef = useRef<Conversation | null>(null);
  const companyIdRef = useRef<string>('');

  // Keep refs in sync with state
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    companyIdRef.current = companyId;
  }, [companyId]);

  // ============================================
  // LOAD TEAM MEMBERS
  // ============================================

  const loadTeamMembers = useCallback(async () => {
    if (!projectId) return;

    setTeamLoading(true);
    try {
      const membersData = await getProjectTeam(projectId);

      // Transform to TeamMember type
      const members: TeamMember[] = membersData.map((m: any) => ({
        id: m.id || m.user_id,
        name: m.name || 'Unknown',
        email: m.email || '',
        avatar: m.avatar,
        role: (m.role as any) || 'developer',
        status: m.online_status ? 'online' : 'offline',
      }));

      // Add current user if not in list
      if (user && !members.find(m => m.id === user.id)) {
        members.unshift({
          id: user.id,
          name: user.name || 'You',
          email: user.email || '',
          avatar: user.avatar,
          role: (user.role as any) || 'developer',
          status: 'online',
        });
      }

      setTeamMembers(members);
    } catch (error) {
      console.error('Failed to load team members:', error);
      setTeamMembers([]);
    } finally {
      setTeamLoading(false);
    }
  }, [projectId, user]);

  // ============================================
  // LOAD MEETINGS
  // ============================================

  const loadMeetings = useCallback(async () => {
    if (!projectId) return;

    try {
      const allMeetings: Meeting[] = [];

      // Fetch meetings from the meetings table
      try {
        const meetingsResponse = await apiClient.get(`/communication/projects/${projectId}/meetings`);
        const meetingsData = meetingsResponse.data || [];

        for (const m of meetingsData) {
          const startTime = new Date(m.start_time);
          const endTime = new Date(m.end_time);
          const now = new Date();
          let type: Meeting['type'] = 'scheduled';

          if (m.status === 'completed' || m.status === 'cancelled') {
            type = 'completed';
          } else if (startTime <= now && endTime >= now) {
            type = 'ongoing';
          } else if (endTime < now) {
            type = 'completed';
          }

          const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
          const attendeeIds = m.attendees || [];
          const attendees = teamMembers.filter(tm => attendeeIds.includes(tm.id));

          allMeetings.push({
            id: m.id,
            title: m.title,
            time: startTime,
            duration,
            attendees: attendees.length > 0 ? attendees : [],
            type,
          });
        }
      } catch (err) {
        console.error('Failed to load meetings from meetings table:', err);
      }

      // Also fetch calendar events of type 'meeting' or 'call'
      try {
        const calendarResponse = await apiClient.get(`/teamatonce/communication/projects/${projectId}/events`);
        const calendarEvents = calendarResponse.data || [];

        for (const event of calendarEvents) {
          // Include all calendar events (meeting, call, or any other type)
          const eventDate = event.date || event.start_date;
          const startTimeStr = event.startTime || event.start_time || '09:00';
          const endTimeStr = event.endTime || event.end_time || '10:00';

          // Parse date and time more robustly
          let startTime: Date;
          let endTime: Date;

          if (eventDate) {
            // Try to parse the date in various formats
            const dateStr = String(eventDate).split('T')[0]; // Handle ISO format
            startTime = new Date(`${dateStr}T${startTimeStr}:00`);
            endTime = new Date(`${dateStr}T${endTimeStr}:00`);

            // If parsing failed, try alternative approach
            if (isNaN(startTime.getTime())) {
              startTime = new Date(eventDate);
              if (!isNaN(startTime.getTime())) {
                // If we got a valid date, set the time
                const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
                const [endHours, endMinutes] = endTimeStr.split(':').map(Number);
                startTime.setHours(startHours || 9, startMinutes || 0, 0, 0);
                endTime = new Date(startTime);
                endTime.setHours(endHours || 10, endMinutes || 0, 0, 0);
              }
            }
          }

          // Fallback if no date field or parsing failed
          if (!eventDate || isNaN(startTime!.getTime())) {
            if (event.created_at) {
              startTime = new Date(event.created_at);
            } else {
              startTime = new Date();
            }
            endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour
          }

          // Skip if still invalid
          if (isNaN(startTime!.getTime())) {
            console.warn('Skipping event with invalid date:', event);
            continue;
          }

          const now = new Date();
          let meetingType: Meeting['type'] = 'scheduled';

          if (event.status === 'completed' || event.status === 'cancelled') {
            meetingType = 'completed';
          } else if (startTime! <= now && endTime! >= now) {
            meetingType = 'ongoing';
          } else if (endTime! < now) {
            meetingType = 'completed';
          }

          const duration = Math.round((endTime!.getTime() - startTime!.getTime()) / (1000 * 60));

          allMeetings.push({
            id: event.id,
            title: event.title || 'Untitled Event',
            time: startTime!,
            duration: duration > 0 ? duration : 60, // Default 60 min if calculation fails
            attendees: [],
            type: meetingType,
          });
        }
      } catch (err) {
        console.error('Failed to load calendar events:', err);
      }

      // Sort by time (upcoming first)
      allMeetings.sort((a, b) => a.time.getTime() - b.time.getTime());

      setMeetings(allMeetings);
    } catch (error) {
      console.error('Failed to load meetings:', error);
      setMeetings([]);
    }
  }, [projectId, teamMembers]);

  // Load meetings when team members are loaded
  useEffect(() => {
    if (teamMembers.length > 0) {
      loadMeetings();
    }
  }, [teamMembers, loadMeetings]);

  // ============================================
  // WEBSOCKET & REAL-TIME SETUP
  // ============================================

  useEffect(() => {
    if (!currentUserId) return;

    // Connect to WebSocket
    socketClient.connect(currentUserId);

    // Setup message listeners
    socketClient.onMessage(handleNewMessage);
    socketClient.onTyping(handleTypingIndicator);
    socketClient.onUserStatus(handleUserStatus);

    // Load initial data
    loadTeamMembers();
    loadConversations();

    // Fetch project approval status
    if (projectId) {
      getProjectStats(projectId).then((data) => {
        setApprovalStatus(data.project?.approval_status || 'approved');
        setRejectionReason(data.project?.approval_rejection_reason || '');
      }).catch(console.error);
    }

    // Cleanup on unmount
    return () => {
      if (selectedConversation) {
        socketClient.leaveRoom(selectedConversation.id);
      }
    };
  }, [currentUserId]);

  // Join/leave conversation rooms when selection changes
  useEffect(() => {
    if (selectedConversation && companyId) {
      socketClient.joinRoom(selectedConversation.id);
      loadMessages(selectedConversation.id);

      // Mark messages as read
      messageService.markAsRead(companyId, selectedConversation.id).catch(console.error);
    }

    return () => {
      if (selectedConversation) {
        socketClient.leaveRoom(selectedConversation.id);
      }
    };
  }, [selectedConversation?.id, companyId]);

  // ============================================
  // DATA LOADING
  // ============================================

  const loadConversations = async () => {
    if (!companyId || !projectId) return;

    try {
      setLoading(true);
      const data = await messageService.getConversations(companyId, projectId);

      // Ensure data is an array
      const conversationsData = Array.isArray(data) ? data : [];
      setConversations(conversationsData);

      // Auto-select first conversation if none selected
      if (!selectedConversation && conversationsData.length > 0) {
        setSelectedConversation(conversationsData[0]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!companyId) return;

    try {
      setMessagesLoading(true);
      const data = await messageService.getMessages(companyId, conversationId);

      // Ensure data is an array
      const messagesData = Array.isArray(data) ? data : [];
      setMessages(messagesData);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  // ============================================
  // MESSAGE HANDLERS
  // ============================================

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!selectedConversation || !companyId) return;
    if (!content.trim() && !attachments?.length) return;

    try {
      const messageData: SendMessageData = {
        content: content.trim(),
        messageType: 'text',
        replyToId: replyToMessage?.id,
      };

      // Upload attachments if any
      if (attachments && attachments.length > 0) {
        const uploadedAttachments = await Promise.all(
          attachments.map(file => messageService.uploadAttachment(companyId, file, selectedConversation.id))
        );
        messageData.attachments = uploadedAttachments;
      }

      // Send message via API
      const newMessage = await messageService.sendMessage(
        companyId,
        selectedConversation.id,
        messageData
      );

      // Add to local state immediately
      setMessages(prev => [...prev, newMessage]);

      // Clear reply
      setReplyToMessage(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleNewMessage = useCallback((data: any) => {
    const { conversationId, message } = data;

    // Use refs to access latest values (avoid stale closures in WebSocket callbacks)
    const currentSelectedConversation = selectedConversationRef.current;
    const currentCompanyId = companyIdRef.current;

    // Only add if message is for selected conversation
    if (currentSelectedConversation?.id === conversationId) {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });

      // Mark as read if conversation is active
      if (currentCompanyId) {
        messageService.markAsRead(currentCompanyId, conversationId).catch(console.error);
      }
    }

    // Update conversation in list (always update regardless of selection)
    setConversations(prev => {
      return prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            lastMessage: message,
            last_message_at: message.created_at,
            // Increment unread count if not the selected conversation
            unreadCount: currentSelectedConversation?.id !== conversationId
              ? (conv.unreadCount || 0) + 1
              : conv.unreadCount,
          };
        }
        return conv;
      });
    });
  }, []); // No dependencies - uses refs for latest values

  const handleTypingIndicator = useCallback((data: { userId: string; isTyping: boolean }) => {
    setTypingUsers(prev => {
      const next = new Set(prev);
      if (data.isTyping) {
        next.add(data.userId);
      } else {
        next.delete(data.userId);
      }
      return next;
    });
  }, []);

  const handleUserStatus = useCallback((data: { userId: string; status: 'online' | 'offline' }) => {
    // Update team member status
    setTeamMembers(prev => prev.map(member => {
      if (member.id === data.userId) {
        return { ...member, status: data.status };
      }
      return member;
    }));
  }, []);

  const handleTyping = (isTyping: boolean) => {
    if (selectedConversation) {
      socketClient.sendTyping(selectedConversation.id, isTyping);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!companyId) return;
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await messageService.deleteMessage(companyId, messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success('Message deleted');
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error('Failed to delete message. Please try again.');
    }
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    if (!companyId) return;

    try {
      await messageService.updateMessage(companyId, messageId, { content });
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, content } : m
      ));
      toast.success('Message updated');
    } catch (error) {
      console.error('Failed to edit message:', error);
      toast.error('Failed to edit message. Please try again.');
    }
  };

  const handleReply = (message: Message) => {
    setReplyToMessage(message);
  };

  const handleSelectConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setSelectedConversation(conversation);
    }
  };

  const getMeetingTypeColor = (type: Meeting['type']) => {
    switch (type) {
      case 'ongoing':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatMeetingTime = (time: Date) => {
    // Check if date is valid
    if (!time || isNaN(time.getTime())) {
      return 'Date TBD';
    }

    const now = new Date();
    const diff = time.getTime() - now.getTime();
    const hours = Math.abs(Math.floor(diff / 3600000));

    if (diff > 0 && hours < 24) {
      return `in ${hours}h`;
    } else if (diff < 0 && hours < 24) {
      return `${hours}h ago`;
    } else {
      return time.toLocaleDateString();
    }
  };

  const onlineMembers = teamMembers.filter(m => m.status === 'online');

  if (companyLoading || teamLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading communication hub...</p>
        </div>
      </div>
    );
  }

  if (!company || !companyId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-800 font-semibold">No company selected</p>
        </div>
      </div>
    );
  }

  // Access check
  if (roleLoading) {
    return <AccessLoading />;
  }

  if (!hasAccess) {
    return <AccessDenied message="You don't have permission to access the communication hub for this project." />;
  }

  return (
    <ProjectPageLayout
      title="Communication Hub"
      subtitle="Stay connected with your team"
    >
      {/* Rejected Project Banner */}
      {isProjectRejected && (
        <RejectedProjectBanner
          reason={rejectionReason}
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Communication Area */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
            <div className="flex items-center border-b border-gray-200 bg-gray-50">
              {[
                { id: 'chat', label: 'Team Chat', icon: MessageSquare },
                { id: 'meetings', label: 'Meetings', icon: Calendar },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center space-x-2 ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600 border-b-4 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="flex h-[600px] overflow-hidden">
                {/* Conversation List - Left Sidebar */}
                <div className="w-80 h-full overflow-hidden border-r border-gray-200 flex-shrink-0">
                  <ConversationList
                    conversations={conversations}
                    currentUserId={currentUserId}
                    currentUserName={user?.name}
                    selectedConversationId={selectedConversation?.id}
                    onSelectConversation={handleSelectConversation}
                    loading={loading}
                  />
                </div>

                {/* Messages Area - Main Content */}
                {selectedConversation ? (
                  <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Conversation Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 truncate">
                            {(() => {
                              // For direct conversations, show the other participant's name
                              if (selectedConversation.conversation_type === 'direct' && selectedConversation.participantDetails) {
                                const otherParticipant = selectedConversation.participantDetails.find(
                                  (p: any) => p.id !== currentUserId
                                );
                                if (otherParticipant?.name && otherParticipant.name !== 'Unknown User') {
                                  return otherParticipant.name;
                                }
                              }
                              return selectedConversation.title || 'Conversation';
                            })()}
                          </h3>
                          {typingUsers.size > 0 && (
                            <span className="text-sm text-gray-500 italic flex-shrink-0">
                              typing...
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleStartAudioCall}
                            disabled={callLoading || isInCall}
                            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-gray-200"
                            title="Start audio call"
                          >
                            {callLoading && callType === 'audio' ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Phone className="w-5 h-5" />
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleStartVideoCall}
                            disabled={callLoading || isInCall}
                            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-gray-200"
                            title="Start video call"
                          >
                            {callLoading && callType === 'video' ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Video className="w-5 h-5" />
                            )}
                          </motion.button>
                          <button
                            onClick={() => toast.info('More options coming soon')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="More options"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Messages List */}
                    <div className="flex-1 overflow-hidden bg-gradient-to-br from-gray-50 to-white">
                      <MessageList
                        messages={messages}
                        currentUserId={currentUserId}
                        loading={messagesLoading}
                        onDelete={handleDeleteMessage}
                        onEdit={handleEditMessage}
                        onReply={handleReply}
                      />
                    </div>

                    {/* Message Input */}
                    <div className="flex-shrink-0">
                      {isProjectRejected ? (
                        <div className="p-4 bg-gray-100 border-t border-gray-200">
                          <p className="text-center text-gray-500 text-sm">
                            Messaging is disabled for rejected projects
                          </p>
                        </div>
                      ) : (
                        <MessageInput
                          onSend={handleSendMessage}
                          onTyping={handleTyping}
                          placeholder="Type your message..."
                          replyTo={replyToMessage}
                          onCancelReply={() => setReplyToMessage(null)}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                    <div className="text-center text-gray-500">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-semibold mb-2">
                        {conversations.length === 0
                          ? 'No conversations yet'
                          : 'Select a conversation'}
                      </p>
                      <p className="text-sm">
                        {conversations.length === 0
                          ? 'Start by creating a new conversation'
                          : 'Choose a conversation from the list to start messaging'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Meetings Tab */}
            {activeTab === 'meetings' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search meetings..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                  {!isProjectRejected && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(`/company/${companyId}/project/${projectId}/calendar`)}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Schedule Meeting</span>
                    </motion.button>
                  )}
                </div>

                {meetings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No meetings scheduled</h3>
                    <p className="text-gray-500">Click "Schedule Meeting" to create one</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {meetings.map((meeting, idx) => (
                      <motion.div
                        key={meeting.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">{meeting.title}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatMeetingTime(meeting.time)}</span>
                              </div>
                              <span>{meeting.duration} min</span>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${getMeetingTypeColor(
                              meeting.type
                            )}`}
                          >
                            {meeting.type === 'ongoing'
                              ? 'Live Now'
                              : meeting.type.charAt(0).toUpperCase() + meeting.type.slice(1)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {meeting.attendees.slice(0, 3).map((attendee) => (
                              <UserAvatar key={attendee.id} user={attendee} size="sm" showStatus />
                            ))}
                            {meeting.attendees.length > 3 && (
                              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-600">
                                  +{meeting.attendees.length - 3}
                                </span>
                              </div>
                            )}
                          </div>

                          {meeting.type === 'ongoing' && (
                            <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2">
                              <Video className="w-4 h-4" />
                              <span>Join Now</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Right Sidebar - Quick Info */}
        <div className="space-y-6">
          {/* Active Team Members */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <span>Online Now</span>
            </h2>
            {onlineMembers.length === 0 ? (
              <p className="text-gray-500 text-sm">No team members online</p>
            ) : (
              <div className="space-y-3">
                {onlineMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3">
                    <UserAvatar user={member} size="md" showStatus />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-600 capitalize">{member.role.replace('-', ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Communication Stats */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <h2 className="text-xl font-black mb-4">Team Stats</h2>
            <div className="space-y-4">
              {[
                { label: 'Team Members', value: teamMembers.length.toString() },
                { label: 'Online Now', value: onlineMembers.length.toString() },
                { label: 'Conversations', value: conversations.length.toString() },
                { label: 'Meetings', value: meetings.length.toString() },
              ].map((stat, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="opacity-90">{stat.label}</span>
                  <span className="text-2xl font-black">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </ProjectPageLayout>
  );
};

export default CommunicationHub;
