import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Video, Phone, MoreVertical } from 'lucide-react';
import { MessageList, MessageInput, ConversationList } from '@/components/communication';
import { messageService, Message, Conversation, SendMessageData } from '@/services/messageService';
import { socketClient } from '@/lib/websocket-client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Client Messages Page
 * Real-time messaging interface for client-team communication
 */

export const Messages: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);

  // Get current user ID from auth
  const currentUserId = user?.id || '';

  // ============================================
  // WEBSOCKET & REAL-TIME SETUP
  // ============================================

  useEffect(() => {
    socketClient.connect();
    socketClient.onMessage(handleNewMessage);
    socketClient.onTyping(handleTypingIndicator);
    loadConversations();

    return () => {
      if (selectedConversation) {
        socketClient.leaveRoom(selectedConversation.id);
      }
      socketClient.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      socketClient.joinRoom(selectedConversation.id);
      loadMessages(selectedConversation.id);
      messageService.markAsRead('', selectedConversation.id).catch(console.error);
    }

    return () => {
      if (selectedConversation) {
        socketClient.leaveRoom(selectedConversation.id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id]);

  // ============================================
  // DATA LOADING
  // ============================================

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messageService.getConversations('');
      setConversations(data || []);

      if (!selectedConversation && data && data.length > 0) {
        setSelectedConversation(data[0]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      const data = await messageService.getMessages('', conversationId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  // ============================================
  // MESSAGE HANDLERS
  // ============================================

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!selectedConversation) return;
    if (!content.trim() && !attachments?.length) return;

    try {
      const messageData: SendMessageData = {
        content: content.trim(),
        messageType: 'text',
        replyToId: replyToMessage?.id,
      };

      if (attachments && attachments.length > 0) {
        const uploadedAttachments = await Promise.all(
          attachments.map(file => messageService.uploadAttachment('', file, selectedConversation.id))
        );
        messageData.attachments = uploadedAttachments;
      }

      const newMessage = await messageService.sendMessage(
        '',
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
    const { conversationId, message } = data;

    if (selectedConversation?.id === conversationId) {
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      messageService.markAsRead('', conversationId).catch(console.error);
    }

    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, lastMessage: message, last_message_at: message.created_at }
          : conv
      )
    );
  }, [selectedConversation?.id]);

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

    try {
      await messageService.deleteMessage('', messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message. Please try again.');
    }
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    try {
      await messageService.updateMessage('', messageId, { content });
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

  const totalUnread = (conversations || []).reduce((acc, conv) => {
    const unread = messageService.getUnreadCount(conv, currentUserId);
    return acc + unread;
  }, 0);

  return (
    <div className="h-[calc(100vh-80px)] bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="h-full max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="mb-2">
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Messages
            </h1>
          </div>
          <p className="text-gray-600">
            {totalUnread > 0
              ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}`
              : 'Communicate with your development teams'}
          </p>
        </motion.div>

        {/* Main Chat Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-[calc(100%-120px)]"
        >
          <div className="flex h-full overflow-hidden">
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
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        {selectedConversation.title || 'Conversation'}
                      </h3>
                      {typingUsers.size > 0 && (
                        <span className="text-sm text-gray-500 italic">typing...</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-white rounded-xl transition-colors">
                        <Phone className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-white rounded-xl transition-colors">
                        <Video className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-white rounded-xl transition-colors">
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
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
                <MessageInput
                  onSend={handleSendMessage}
                  onTyping={handleTyping}
                  placeholder="Type your message..."
                  replyTo={replyToMessage}
                  onCancelReply={() => setReplyToMessage(null)}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <MessageSquare className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {conversations.length === 0
                      ? 'No conversations yet'
                      : 'Select a conversation'}
                  </h3>
                  <p className="text-gray-600">
                    {conversations.length === 0
                      ? 'Start by creating a new conversation'
                      : 'Choose a conversation to start messaging your team'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Messages;
