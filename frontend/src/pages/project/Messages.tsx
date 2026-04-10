import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, Video, Phone, MoreVertical, Loader2 } from 'lucide-react';
import { MessageList, MessageInput, ConversationList } from '@/components/communication';
import { messageService, Message, Conversation, SendMessageData } from '@/services/messageService';
import { socketClient } from '@/lib/websocket-client';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVideoCallContext } from '@/contexts/VideoCallContext';
import { ProjectPageLayout } from '@/layouts/ProjectPageLayout';
import { AccessDenied, AccessLoading } from '@/components/project';
import { useProjectRole } from '@/hooks/useProjectRole';
import { RejectedProjectBanner } from '@/components/project/RejectedProjectBanner';
import { getProjectStats } from '@/services/projectService';

/**
 * Project Messages Page
 * Project-scoped messaging interface for client-developer/team communication
 * Shows only conversations related to the current project
 */

const Messages: React.FC = () => {
  // Get project ID from URL params
  const { projectId } = useParams<{ projectId: string }>();

  // Get company and auth context
  const { companyId, loading: companyLoading } = useCompany();
  const { user } = useAuth();

  // Check project membership
  const { hasAccess, loading: roleLoading } = useProjectRole(projectId);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<string>('approved');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Check if project is rejected
  const isProjectRejected = approvalStatus === 'rejected';

  // Get current user ID from auth
  const currentUserId = user?.id || 'current-user-id';

  // Video call context (global)
  const {
    isInCall,
    callType,
    isLoading: callLoading,
    startCall,
  } = useVideoCallContext();

  // Handlers for video/audio calls
  const handleStartVideoCall = useCallback(() => {
    console.log('[Messages] Video call button clicked', { projectId, userId: user?.id, userName: user?.name });
    if (!projectId) {
      console.error('[Messages] No projectId available');
      return;
    }
    // Get participant IDs from the current conversation
    const participantIds = selectedConversation?.participants
      ?.filter(p => p.id !== currentUserId)
      ?.map(p => p.id) || [];
    console.log('[Messages] Starting video call with participants:', participantIds);
    startCall(projectId, 'video', participantIds, selectedConversation?.id);
  }, [projectId, selectedConversation, currentUserId, startCall, user]);

  const handleStartAudioCall = useCallback(() => {
    console.log('[Messages] Audio call button clicked', { projectId, userId: user?.id, userName: user?.name });
    if (!projectId) {
      console.error('[Messages] No projectId available');
      return;
    }
    // Get participant IDs from the current conversation
    const participantIds = selectedConversation?.participants
      ?.filter(p => p.id !== currentUserId)
      ?.map(p => p.id) || [];
    console.log('[Messages] Starting audio call with participants:', participantIds);
    startCall(projectId, 'audio', participantIds, selectedConversation?.id);
  }, [projectId, selectedConversation, currentUserId, startCall, user]);

  // ============================================
  // WEBSOCKET & REAL-TIME SETUP
  // ============================================

  useEffect(() => {
    if (companyId && projectId) {
      socketClient.connect();
      socketClient.onMessage(handleNewMessage);
      socketClient.onTyping(handleTypingIndicator);
      loadConversations();

      // Fetch project approval status
      getProjectStats(projectId).then((data) => {
        setApprovalStatus(data.project?.approval_status || 'approved');
        setRejectionReason(data.project?.approval_rejection_reason || '');
      }).catch(console.error);
    }

    return () => {
      if (selectedConversation) {
        socketClient.leaveRoom(selectedConversation.id);
      }
      socketClient.disconnect();
    };
  }, [companyId, projectId]);

  useEffect(() => {
    if (selectedConversation && companyId) {
      socketClient.joinRoom(selectedConversation.id);
      loadMessages(selectedConversation.id);
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
      // Get conversations filtered by project ID
      const data = await messageService.getConversations(companyId, projectId);
      // Handle both array and undefined/null responses
      const conversations = Array.isArray(data) ? data : [];
      setConversations(conversations);

      if (!selectedConversation && conversations.length > 0) {
        setSelectedConversation(conversations[0]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!companyId) return;

    try {
      setMessagesLoading(true);
      const data = await messageService.getMessages(companyId, conversationId);
      // Handle both array and undefined/null responses
      const messages = Array.isArray(data) ? data : [];
      setMessages(messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]); // Set empty array on error
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

      if (attachments && attachments.length > 0) {
        const uploadedAttachments = await Promise.all(
          attachments.map(file => messageService.uploadAttachment(companyId, file, selectedConversation.id))
        );
        messageData.attachments = uploadedAttachments;
      }

      const newMessage = await messageService.sendMessage(
        companyId,
        selectedConversation.id,
        messageData
      );

      setMessages(prev => [...prev, newMessage]);
      setReplyToMessage(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleNewMessage = useCallback((data: any) => {
    if (!companyId) return;

    const { conversationId, message } = data;

    if (selectedConversation?.id === conversationId) {
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      messageService.markAsRead(companyId, conversationId).catch(console.error);
    }

    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, lastMessage: message, last_message_at: message.created_at }
          : conv
      )
    );
  }, [selectedConversation?.id, companyId]);

  const handleTypingIndicator = useCallback((data: { userId: string; isTyping: boolean }) => {
    setTypingUsers(prev => {
      const next = new Set(prev);
      data.isTyping ? next.add(data.userId) : next.delete(data.userId);
      return next;
    });
  }, []);

  const handleTyping = (isTyping: boolean) => {
    if (selectedConversation) {
      socketClient.sendTyping(selectedConversation.id, isTyping);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    if (!companyId) return;

    try {
      await messageService.deleteMessage(companyId, messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message. Please try again.');
    }
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    if (!companyId) return;

    try {
      await messageService.updateMessage(companyId, messageId, { content });
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, content } : m))
      );
    } catch (error) {
      console.error('Failed to edit message:', error);
      alert('Failed to edit message. Please try again.');
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

  const totalUnread = conversations.reduce((acc, conv) => {
    const unread = messageService.getUnreadCount(conv, currentUserId);
    return acc + unread;
  }, 0);

  // Access check
  if (roleLoading) {
    return <AccessLoading />;
  }

  if (!hasAccess) {
    return <AccessDenied message="You don't have permission to access messages for this project." />;
  }

  if (companyLoading) {
    return (
      <ProjectPageLayout title="Messages" subtitle="Loading...">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </ProjectPageLayout>
    );
  }

  return (
    <ProjectPageLayout
      title="Messages"
      subtitle={
        totalUnread > 0
          ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}`
          : 'Communicate with your team'
      }
      headerActions={
        !isProjectRejected ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>New Message</span>
          </motion.button>
        ) : null
      }
    >
      {/* Rejected Project Banner */}
      {isProjectRejected && (
        <RejectedProjectBanner
          reason={rejectionReason}
          className="mb-6"
        />
      )}

      {/* Main Chat Interface */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex h-[700px] overflow-hidden">
          {/* Conversations List - Left Sidebar */}
          <div className="w-80 border-r border-gray-200 overflow-hidden">
            <ConversationList
              conversations={conversations}
              currentUserId={currentUserId}
              selectedConversationId={selectedConversation?.id}
              onSelectConversation={handleSelectConversation}
              loading={loading}
            />
          </div>

          {/* Chat Area - Main Content */}
          {selectedConversation ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-bold text-gray-900">
                      {selectedConversation.title || 'Conversation'}
                    </h3>
                    {typingUsers.size > 0 && (
                      <span className="text-sm text-gray-500 italic">typing...</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleStartAudioCall}
                      disabled={callLoading || isInCall}
                      className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Start video call"
                    >
                      {callLoading && callType === 'video' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Video className="w-5 h-5" />
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
                      title="More options"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 bg-gray-50 min-h-0 overflow-hidden">
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
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">
                  {conversations.length === 0
                    ? 'No conversations yet'
                    : 'Select a conversation'}
                </h3>
                <p className="text-gray-500">
                  {conversations.length === 0
                    ? 'Start by creating a new conversation'
                    : 'Choose a conversation to start messaging'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Incoming Call Modal and Video Call Overlay are rendered globally by VideoCallProvider */}
    </ProjectPageLayout>
  );
};

export default Messages;
