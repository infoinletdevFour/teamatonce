/**
 * MessageList Component
 * Displays messages in a chat format with grouping by date
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  File,
  Download,
  CheckCheck,
  Check,
  Edit2,
  Trash2,
  Reply,
  MoreVertical,
} from 'lucide-react';
import { Message } from '@/services/messageService';
import { UserAvatar } from '@/components/project';
import { TeamMember } from '@/lib/types/project';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  onReply?: (message: Message) => void;
  onReaction?: (messageId: string, emoji: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  onLoadMore,
  hasMore = false,
  loading = false,
  onDelete,
  onEdit,
  onReply,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Handle scroll events
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);

      // Load more messages when scrolling to top
      if (scrollTop < 100 && hasMore && !loading && onLoadMore) {
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, onLoadMore]);

  const scrollToBottom = (smooth = false) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto'
    });
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    messages.forEach((message) => {
      const messageDate = new Date(message.created_at).toDateString();

      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: messageDate, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (dateString === today) return 'Today';
    if (dateString === yesterday) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
    setActiveMenu(null);
  };

  const handleSaveEdit = (messageId: string) => {
    if (onEdit && editContent.trim()) {
      onEdit(messageId, editContent.trim());
      setEditingMessageId(null);
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const renderAttachment = (attachment: any, index: number) => {
    // Handle both old format (type='image') and new format (type='image/png')
    const attachmentType = attachment.type || attachment.mimeType || '';
    const isImage = attachmentType === 'image' ||
                    attachmentType.startsWith('image/') ||
                    attachment.mimeType?.startsWith('image/');

    // Use id if available, otherwise use url or index as key
    const key = attachment.id || attachment.url || `attachment-${index}`;

    if (isImage) {
      return (
        <div key={key} className="mt-2">
          <img
            src={attachment.url}
            alt={attachment.name || 'Attachment'}
            className="max-w-xs rounded-xl border-2 border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(attachment.url, '_blank')}
          />
        </div>
      );
    }

    return (
      <div
        key={key}
        className="mt-2 flex items-center space-x-2 p-3 bg-gray-100 rounded-xl max-w-xs cursor-pointer hover:bg-gray-200 transition-colors"
        onClick={() => window.open(attachment.url, '_blank')}
      >
        <File className="w-5 h-5 text-gray-600" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {attachment.name || 'Unknown file'}
          </p>
          <p className="text-xs text-gray-500">
            {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Unknown size'}
          </p>
        </div>
        <Download className="w-4 h-4 text-gray-600" />
      </div>
    );
  };

  const renderMessageActions = (message: Message, isOwn: boolean) => {
    if (activeMenu !== message.id) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`absolute top-8 bg-white rounded-xl shadow-lg border-2 border-gray-200 py-1 z-10 min-w-[150px] ${
          isOwn ? 'right-0' : 'left-0'
        }`}
      >
        {onReply && (
          <button
            onClick={() => {
              onReply(message);
              setActiveMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <Reply className="w-4 h-4" />
            <span>Reply</span>
          </button>
        )}
        {isOwn && onEdit && (
          <button
            onClick={() => handleEdit(message)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit</span>
          </button>
        )}
        {isOwn && onDelete && (
          <button
            onClick={() => {
              onDelete(message.id);
              setActiveMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        )}
      </motion.div>
    );
  };

  const renderReadStatus = (message: Message, isOwn: boolean) => {
    if (!isOwn) return null;

    const readBy = message.read_by || [];
    const isRead = readBy.length > 1; // More than just sender

    return (
      <div className="flex items-center space-x-1 text-xs text-gray-400">
        {isRead ? (
          <CheckCheck className="w-3 h-3 text-blue-500" />
        ) : (
          <Check className="w-3 h-3" />
        )}
      </div>
    );
  };

  const groupedMessages = groupMessagesByDate(messages);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p className="text-lg font-semibold mb-2">No messages yet</p>
          <p className="text-sm">Start the conversation by sending a message</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div
        ref={messagesContainerRef}
        className="h-full overflow-y-auto px-6 py-4 space-y-6 overflow-x-hidden"
      >
        {loading && hasMore && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}

        {groupedMessages.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-4">
            {/* Date Divider */}
            <div className="flex items-center justify-center">
              <div className="px-3 py-1 bg-gray-200 rounded-full">
                <span className="text-xs font-semibold text-gray-600">
                  {formatDate(group.date)}
                </span>
              </div>
            </div>

            {/* Messages */}
            {group.messages.map((message, messageIdx) => {
              const isOwn = message.sender_id === currentUserId;
              const isEditing = editingMessageId === message.id;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: messageIdx * 0.02 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-start space-x-2 max-w-lg ${
                      isOwn ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    {/* Avatar for all messages */}
                    {message.sender ? (
                      <UserAvatar
                        user={message.sender as TeamMember}
                        size="sm"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        ?
                      </div>
                    )}

                    <div className="flex-1">
                      {/* Sender name for all messages */}
                      <p className={`text-sm font-semibold mb-1 ${isOwn ? 'text-right text-gray-700' : 'text-gray-900'}`}>
                        {message.sender?.name || 'Unknown User'}
                      </p>

                      <div className="relative group">
                        <div
                          className={`px-4 py-3 rounded-2xl ${
                            isOwn
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                              : 'bg-white border-2 border-gray-200 text-gray-900'
                          }`}
                        >
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full px-2 py-1 bg-white text-gray-900 rounded border-2 border-gray-300 focus:border-blue-500 outline-none resize-none"
                                rows={2}
                                autoFocus
                              />
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleSaveEdit(message.id)}
                                  className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div
                                className="whitespace-pre-wrap break-words message-content prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: message.content }}
                              />
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="space-y-2">
                                  {message.attachments.map((attachment, index) => renderAttachment(attachment, index))}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Message Actions Button */}
                        {!isEditing && (
                          <button
                            onClick={() => setActiveMenu(activeMenu === message.id ? null : message.id)}
                            className={`absolute top-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 rounded ${
                              isOwn ? '-right-5' : '-right-8'
                            }`}
                          >
                            <MoreVertical className="w-4 h-4 text-gray-600" />
                          </button>
                        )}

                        {/* Actions Menu */}
                        <AnimatePresence>
                          {renderMessageActions(message, isOwn)}
                        </AnimatePresence>
                      </div>

                      {/* Timestamp and Read Status */}
                      <div className={`flex items-center space-x-2 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                        <p className="text-xs text-gray-500">
                          {formatTime(message.created_at)}
                        </p>
                        {renderReadStatus(message, isOwn)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-4 right-4 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

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

export default MessageList;
