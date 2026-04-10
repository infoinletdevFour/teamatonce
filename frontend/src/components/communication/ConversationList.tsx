/**
 * ConversationList Component
 * Displays list of conversations with unread badges and search
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MessageSquare,
  Users,
  X,
  Pin,
  Archive,
  MoreVertical,
  CheckCheck,
  Check
} from 'lucide-react';
import { Conversation } from '@/services/messageService';
import { UserAvatar } from '@/components/project';
import { TeamMember } from '@/lib/types/project';

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId: string;
  currentUserName?: string;
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation?: () => void;
  loading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentUserId,
  currentUserName,
  selectedConversationId,
  onSelectConversation,
  onCreateConversation,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((conv) => {
        // Search by title
        if (conv.title?.toLowerCase().includes(query)) return true;

        // Search by participant names
        if (conv.participantDetails?.some(
          (p: any) => p.name?.toLowerCase().includes(query)
        )) return true;

        // Search by last message
        if (conv.lastMessage?.content?.toLowerCase().includes(query)) return true;

        return false;
      });
    }

    // Sort by last message time (most recent first)
    return filtered.sort((a, b) => {
      const timeA = a.last_message_at || a.created_at;
      const timeB = b.last_message_at || b.created_at;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });
  }, [conversations, searchQuery]);

  const getUnreadCount = (conversation: Conversation): number => {
    if (!conversation.lastMessage) return 0;

    const readBy = conversation.lastMessage.read_by || [];
    return readBy.includes(currentUserId) ? 0 : 1;
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getConversationTitle = (conversation: Conversation): string => {
    // For direct conversations, ALWAYS show the other participant's name (ignore conversation.title)
    if (conversation.conversation_type === 'direct' && conversation.participantDetails) {
      // Find the other participant by ID only (name comparison can fail due to data inconsistency)
      const otherParticipant = conversation.participantDetails.find((p: any) => {
        return p.id !== currentUserId;
      });

      // If we found the other participant, return their name
      if (otherParticipant?.name && otherParticipant.name !== 'Unknown User') {
        return otherParticipant.name;
      }

      // Fallback: try getting the first participant that's not Unknown and not current user
      const validParticipant = conversation.participantDetails.find(
        (p: any) => p.name && p.name !== 'Unknown User' && p.id !== currentUserId
      );
      if (validParticipant?.name) {
        return validParticipant.name;
      }

      return 'Unknown User';
    }

    // For non-direct conversations, use title if available
    if (conversation.title) return conversation.title;

    // For group conversations
    if (conversation.conversation_type === 'group') {
      const count = conversation.participants.length;
      return `Group (${count} members)`;
    }

    // For project conversations
    if (conversation.conversation_type === 'project') {
      return `Project Chat`;
    }

    return 'Conversation';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    // For direct conversations, show other participant's avatar
    if (conversation.conversation_type === 'direct' && conversation.participantDetails) {
      // Find the other participant by ID only
      const otherParticipant = conversation.participantDetails.find((p: any) => {
        return p.id !== currentUserId;
      });

      if (otherParticipant) {
        // Check if we have member type info for custom colors
        const memberType = (conversation as any).memberType;
        if (memberType && !otherParticipant.avatar) {
          const gradientClass = memberType === 'client'
            ? 'bg-gradient-to-br from-green-500 to-teal-500'
            : 'bg-gradient-to-br from-blue-500 to-purple-500';

          return (
            <div className={`w-12 h-12 rounded-full ${gradientClass} flex items-center justify-center text-white font-bold text-lg`}>
              {otherParticipant.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          );
        }
        return <UserAvatar user={otherParticipant as TeamMember} size="lg" showStatus />;
      }
    }

    // For group or project conversations, show group icon
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
        <Users className="w-6 h-6 text-white" />
      </div>
    );
  };

  // Strip HTML tags from content for preview
  const stripHtml = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const getLastMessagePreview = (conversation: Conversation): string => {
    if (!conversation.lastMessage) return 'No messages yet';

    const { content, sender_id, message_type } = conversation.lastMessage;

    // Prefix with sender name if not current user
    const prefix = sender_id === currentUserId ? 'You: ' : '';

    // Handle different message types
    if (message_type === 'file') return `${prefix}Sent a file`;
    if (message_type === 'code') return `${prefix}Sent code`;

    // Strip HTML tags and truncate text messages
    const plainText = stripHtml(content);
    const maxLength = 50;
    const truncated = plainText.length > maxLength
      ? `${plainText.substring(0, maxLength)}...`
      : plainText;

    return `${prefix}${truncated}`;
  };

  const renderConversationActions = (conversation: Conversation) => {
    if (activeMenu !== conversation.id) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border-2 border-gray-200 py-1 z-10 min-w-[150px]"
      >
        <button
          onClick={() => {
            // TODO: Implement pin conversation
            setActiveMenu(null);
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
        >
          <Pin className="w-4 h-4" />
          <span>Pin</span>
        </button>
        <button
          onClick={() => {
            // TODO: Implement archive conversation
            setActiveMenu(null);
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
        >
          <Archive className="w-4 h-4" />
          <span>Archive</span>
        </button>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-gray-900">Messages</h2>
          {onCreateConversation && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCreateConversation}
              className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
              title="New conversation"
            >
              <MessageSquare className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
              {searchQuery
                ? 'No conversations found'
                : 'No conversations yet'}
            </p>
            {!searchQuery && onCreateConversation && (
              <button
                onClick={onCreateConversation}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Start a conversation
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredConversations.map((conversation, index) => {
              const unreadCount = getUnreadCount(conversation);
              const isSelected = selectedConversationId === conversation.id;

              return (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`relative p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    {getConversationAvatar(conversation)}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold truncate ${
                          unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {getConversationTitle(conversation)}
                        </h3>
                        {conversation.last_message_at && (
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {formatTimestamp(conversation.last_message_at)}
                          </span>
                        )}
                      </div>

                      {/* Member Type Badge (if available) */}
                      {(conversation as any).memberType && (
                        <div className="flex items-center mb-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            (conversation as any).memberType === 'client'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {(conversation as any).memberType === 'client' ? 'Client' : 'Developer'}
                          </span>
                          {(conversation as any).memberRole && (
                            <span className="text-xs text-gray-500 ml-2 capitalize">
                              {(conversation as any).memberRole}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${
                          unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                        }`}>
                          {getLastMessagePreview(conversation)}
                        </p>

                        {/* Unread Badge */}
                        {unreadCount > 0 && (
                          <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full flex-shrink-0">
                            {unreadCount}
                          </span>
                        )}

                        {/* Read Status (for sent messages) */}
                        {unreadCount === 0 && conversation.lastMessage?.sender_id === currentUserId && (
                          <div className="ml-2 flex-shrink-0">
                            {(conversation.lastMessage.read_by?.length || 0) > 1 ? (
                              <CheckCheck className="w-4 h-4 text-blue-500" />
                            ) : (
                              <Check className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === conversation.id ? null : conversation.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Actions Menu Dropdown */}
                  <AnimatePresence>
                    {renderConversationActions(conversation)}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
};

export default ConversationList;
