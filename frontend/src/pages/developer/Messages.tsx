import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Video, Phone, MoreVertical, Users, Loader2 } from 'lucide-react';
import { MessageList, MessageInput, ConversationList } from '@/components/communication';
import { messageService, Message, Conversation, SendMessageData } from '@/services/messageService';
import { socketClient } from '@/lib/websocket-client';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVideoCallContext } from '@/contexts/VideoCallContext';
import { useParams } from 'react-router-dom';
import { getProjectMembers, ProjectMember } from '@/services/projectService';

/**
 * Developer Messages Page
 * Real-time messaging interface for developer-client/team communication
 * Supports both company-wide and project-scoped messaging
 */

const Messages: React.FC = () => {
  // Get company context and project ID (if in project context)
  const { companyId } = useCompany();
  const { projectId } = useParams<{ projectId?: string }>();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [membersLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);

  // Get current user ID from auth
  const currentUserId = user?.id || 'current-developer-id';

  // Check if we're in project context
  const isProjectScope = !!projectId;

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
      ?.filter(p => p !== currentUserId)
      || [];
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
      ?.filter(p => p !== currentUserId)
      || [];
    console.log('[Messages] Starting audio call with participants:', participantIds);
    startCall(projectId, 'audio', participantIds, selectedConversation?.id);
  }, [projectId, selectedConversation, currentUserId, startCall, user]);

  // Refs for real-time updates (to avoid stale closures)
  const selectedConversationRef = useRef<Conversation | null>(null);
  const companyIdRef = useRef<string | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    companyIdRef.current = companyId;
  }, [companyId]);

  // ============================================
  // MESSAGE HANDLERS (defined before useEffect)
  // ============================================

  const handleNewMessage = useCallback((data: any) => {
    const currentCompanyId = companyIdRef.current;
    const currentSelectedConversation = selectedConversationRef.current;

    if (!currentCompanyId) {
      return;
    }

    const { conversationId, message } = data;

    if (currentSelectedConversation?.id === conversationId) {
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
      messageService.markAsRead(currentCompanyId, conversationId).catch(console.error);
    }

    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, lastMessage: message, last_message_at: message.created_at }
          : conv
      )
    );
  }, []); // No dependencies - uses refs for current values

  const handleMessageUpdate = useCallback((data: any) => {
    const currentSelectedConversation = selectedConversationRef.current;
    const { conversationId, message } = data;

    // Update message in the current conversation if it matches
    if (currentSelectedConversation?.id === conversationId) {
      setMessages(prev =>
        prev.map(m => (m.id === message.id ? message : m))
      );
    }

    // Update last message in conversation list if it was the edited message
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === conversationId && conv.lastMessage?.id === message.id) {
          return { ...conv, lastMessage: message };
        }
        return conv;
      })
    );
  }, []); // No dependencies - uses refs for current values

  const handleMessageDelete = useCallback((data: any) => {
    const currentSelectedConversation = selectedConversationRef.current;
    const { conversationId, messageId } = data;

    // Remove message from the current conversation if it matches
    if (currentSelectedConversation?.id === conversationId) {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    }
  }, []); // No dependencies - uses refs for current values

  const handleTypingIndicator = useCallback((data: { userId: string; isTyping: boolean }) => {
    setTypingUsers(prev => {
      const next = new Set(prev);
      data.isTyping ? next.add(data.userId) : next.delete(data.userId);
      return next;
    });
  }, []);

  // ============================================
  // DATA LOADING (defined before useEffect)
  // ============================================


  const loadConversations = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);

      // If we have a projectId, load project members and conversations
      if (projectId) {
        // Load both project members and existing conversations in parallel
        const [membersResponse, existingConversations] = await Promise.all([
          getProjectMembers(projectId),
          messageService.getConversations(companyId, projectId),
        ]);

        const { members } = membersResponse;

        // Filter out current user from members
        const otherMembers = members.filter(member => member.userId !== currentUserId);
        setProjectMembers(otherMembers);

        // Build the final conversations list
        const finalConversations: Conversation[] = [];

        // Process each member
        for (const member of otherMembers) {
          // Check if there's an existing conversation with this member
          const existingConv = existingConversations.find(conv =>
            conv.conversation_type === 'direct' &&
            conv.participants.includes(member.userId) &&
            conv.participants.includes(currentUserId)
          );

          if (existingConv) {
            // Use the existing conversation but add member metadata
            finalConversations.push({
              ...existingConv,
              title: member.user?.name || member.user?.email || existingConv.title || 'Unknown User',
              participantDetails: [
                {
                  id: member.userId,
                  name: member.user?.name || 'Unknown',
                  avatar: member.user?.avatar || null,
                },
              ],
              // Extra info for display
              memberType: member.memberType,
              memberRole: member.role,
              memberEmail: member.user?.email || '',
            } as any);
          } else {
            // Create a placeholder conversation for this member
            finalConversations.push({
              id: `member-${member.userId}`, // Temporary ID
              project_id: projectId,
              conversation_type: 'direct' as const,
              title: member.user?.name || member.user?.email || 'Unknown User',
              participants: [currentUserId, member.userId],
              created_by: currentUserId,
              created_at: member.joinedAt,
              updated_at: member.joinedAt,
              last_message_at: undefined, // No messages yet
              lastMessage: undefined,
              unreadCount: 0,
              participantDetails: [
                {
                  id: member.userId,
                  name: member.user?.name || 'Unknown',
                  avatar: member.user?.avatar || null,
                },
              ],
              // Extra info for display
              memberType: member.memberType,
              memberRole: member.role,
              memberEmail: member.user?.email || '',
            } as any);
          }
        }

        // Sort by last message time (existing conversations first, then by join time)
        finalConversations.sort((a, b) => {
          const timeA = a.last_message_at || a.created_at;
          const timeB = b.last_message_at || b.created_at;
          return new Date(timeB).getTime() - new Date(timeA).getTime();
        });

        setConversations(finalConversations);

        // Auto-select first conversation if none selected
        if (!selectedConversation && finalConversations.length > 0) {
          setSelectedConversation(finalConversations[0]);
          const firstMember = otherMembers.find(m =>
            finalConversations[0].participants.includes(m.userId)
          );
          if (firstMember) {
            setSelectedMember(firstMember);
          }
        }
      } else {
        // Company-wide messaging: just load all conversations without project filter
        const existingConversations = await messageService.getConversations(companyId);

        // Sort by last message time
        const sortedConversations = [...existingConversations].sort((a, b) => {
          const timeA = a.last_message_at || a.created_at;
          const timeB = b.last_message_at || b.created_at;
          return new Date(timeB).getTime() - new Date(timeA).getTime();
        });

        setConversations(sortedConversations);
        setProjectMembers([]);

        // Auto-select first conversation if none selected
        if (!selectedConversation && sortedConversations.length > 0) {
          setSelectedConversation(sortedConversations[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, companyId, currentUserId, selectedConversation]);

  // ============================================
  // WEBSOCKET & REAL-TIME SETUP
  // ============================================

  useEffect(() => {
    if (companyId && currentUserId) {
      // Connect with userId to join user-specific room for receiving messages
      socketClient.connect(currentUserId, projectId);
      socketClient.onMessage(handleNewMessage);
      socketClient.onMessageUpdate(handleMessageUpdate);
      socketClient.onMessageDelete(handleMessageDelete);
      socketClient.onTyping(handleTypingIndicator);
      loadConversations();
    }

    return () => {
      if (selectedConversation) {
        socketClient.leaveRoom(selectedConversation.id);
      }
      socketClient.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, projectId, currentUserId]);

  useEffect(() => {
    if (selectedConversation && companyId) {
      // Only join room and mark as read for real conversations (not temporary member- IDs)
      const isRealConversation = !selectedConversation.id.startsWith('member-');

      if (isRealConversation) {
        socketClient.joinRoom(selectedConversation.id);
        messageService.markAsRead(companyId, selectedConversation.id).catch(console.error);
      }

      loadMessages(selectedConversation.id);
    }

    return () => {
      if (selectedConversation && !selectedConversation.id.startsWith('member-')) {
        socketClient.leaveRoom(selectedConversation.id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id, companyId]);

  const loadMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);

      // For new member conversations (id starts with "member-"), show empty state
      if (conversationId.startsWith('member-')) {
        setMessages([]);
        setMessagesLoading(false);
        return;
      }

      // For real conversations, load from API
      if (companyId) {
        const data = await messageService.getMessages(companyId, conversationId);
        const messages = Array.isArray(data) ? data : [];
        setMessages(messages);
      } else {
        setMessages([]);
      }
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
      let conversationId = selectedConversation.id;

      // If this is a new conversation (id starts with "member-"), create it first
      if (conversationId.startsWith('member-')) {
        const memberId = conversationId.replace('member-', '');

        // Create a new direct conversation with this member
        const newConversation = await messageService.createConversation(companyId, {
          conversationType: 'direct',
          participants: [memberId],
          projectId: projectId,
          title: selectedConversation.title,
        });

        if (!newConversation || !newConversation.id) {
          throw new Error('Failed to create conversation: Invalid response from server');
        }

        // Update the conversation in our list with the real ID and participants
        const oldConversationId = conversationId;
        setConversations(prev =>
          prev.map(conv =>
            conv.id === oldConversationId
              ? {
                  ...conv,
                  id: newConversation.id,
                  participants: newConversation.participants || [currentUserId, memberId],
                  created_at: newConversation.created_at,
                  updated_at: newConversation.updated_at,
                }
              : conv
          )
        );

        // Update selected conversation with new ID
        setSelectedConversation(prev =>
          prev
            ? {
                ...prev,
                id: newConversation.id,
                participants: newConversation.participants || [currentUserId, memberId],
              }
            : prev
        );

        conversationId = newConversation.id;
      }

      const messageData: SendMessageData = {
        content: content.trim(),
        messageType: 'text',
        replyToId: replyToMessage?.id,
      };

      if (attachments && attachments.length > 0) {
        const uploadedAttachments = await Promise.all(
          attachments.map(file => messageService.uploadAttachment(companyId, file, conversationId))
        );
        messageData.attachments = uploadedAttachments;
      }

      const newMessage = await messageService.sendMessage(
        companyId,
        conversationId,
        messageData
      );

      if (!newMessage || !newMessage.id) {
        throw new Error('Failed to send message: Invalid response from server');
      }

      setMessages(prev => [...prev, newMessage]);
      setReplyToMessage(null);

      // Update conversation's last message
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, lastMessage: newMessage, last_message_at: newMessage.created_at }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

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

  return (
    <div className="h-screen flex flex-col p-6">
      {/* Main Chat Interface */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex-1">
        <div className="flex h-full overflow-hidden">
          {/* Conversations List - Left Sidebar */}
          <div className="w-80 border-r border-gray-200 overflow-hidden flex-shrink-0">
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
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {selectedConversation.title || 'Conversation'}
                      </h3>
                      {(selectedConversation as any).memberEmail && (
                        <p className="text-sm text-gray-500">
                          {(selectedConversation as any).memberEmail} • {' '}
                          <span className="capitalize">
                            {(selectedConversation as any).memberType === 'client' ? 'Client' : 'Developer'}
                          </span>
                          {(selectedConversation as any).memberRole && (
                            <> • <span className="capitalize">{(selectedConversation as any).memberRole}</span></>
                          )}
                        </p>
                      )}
                    </div>
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
              <div className="flex-shrink-0 overflow-hidden">
                <MessageInput
                  onSend={handleSendMessage}
                  onTyping={handleTyping}
                  placeholder="Type your message..."
                  replyTo={replyToMessage}
                  onCancelReply={() => setReplyToMessage(null)}
                />
              </div>
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

          {/* Team Members - Right Sidebar (only show in project scope) */}
          {isProjectScope && (
            <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0">
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="w-5 h-5 text-gray-700" />
                  <h3 className="font-bold text-gray-900">
                    Project Members
                  </h3>
                </div>

                {membersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Show all project members */}
                    {projectMembers.length > 0 ? (
                      projectMembers.map((member) => (
                        <motion.div
                          key={member.id}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => {
                            // Find conversation by member userId - either temporary or real ID
                            const conv = conversations.find(c =>
                              c.id === `member-${member.userId}` ||
                              c.participants.includes(member.userId)
                            );
                            if (conv) {
                              setSelectedConversation(conv);
                              setSelectedMember(member);
                            }
                          }}
                          className={`flex items-center space-x-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer ${
                            selectedMember?.userId === member.userId ? 'ring-2 ring-blue-500' : ''
                          }`}
                        >
                          <div className="relative">
                            {member.user?.avatar ? (
                              <img
                                src={member.user.avatar}
                                alt={member.user?.name || 'User'}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                member.memberType === 'client'
                                  ? 'bg-gradient-to-r from-green-500 to-teal-500'
                                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
                              }`}>
                                {member.user?.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {member.user?.name || member.user?.email || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                                member.memberType === 'client'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {member.memberType === 'client' ? 'Client' : 'Developer'}
                              </span>
                              <span className="ml-1 capitalize">{member.role}</span>
                            </p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          No other members in this project
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Incoming Call Modal and Video Call Overlay are rendered globally by VideoCallProvider */}
    </div>
  );
};

export default Messages;
