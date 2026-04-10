import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Smile, Reply, Edit2, Trash2 } from 'lucide-react';
import { Message } from '@/lib/types/project';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage?: boolean;
  showAvatar?: boolean;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact?: (emoji: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage = false,
  showAvatar = true,
  onReply,
  onEdit,
  onDelete,
  onReact,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const commonEmojis = ['👍', '❤️', '😊', '🎉', '👏', '🔥'];

  const renderMessageContent = () => {
    if (message.type === 'code' && message.codeLanguage) {
      return (
        <div className="bg-gray-900 rounded-lg p-4 my-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-mono">{message.codeLanguage}</span>
          </div>
          <pre className="text-sm text-gray-100 overflow-x-auto">
            <code>{message.content}</code>
          </pre>
        </div>
      );
    }

    if (message.type === 'system') {
      return (
        <div className="text-center my-4">
          <span className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
            {message.content}
          </span>
        </div>
      );
    }

    return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>;
  };

  if (message.type === 'system') {
    return renderMessageContent();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end space-x-2 mb-4 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0">
          {message.sender.avatar ? (
            <img
              src={message.sender.avatar}
              alt={message.sender.name}
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white shadow-sm flex items-center justify-center text-white text-sm font-bold">
              {message.sender.name.charAt(0)}
            </div>
          )}
        </div>
      )}

      {/* Message Content */}
      <div className={`flex-1 max-w-lg ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Sender Name & Time */}
        <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <span className="text-xs font-semibold text-gray-700">{message.sender.name}</span>
          <span className="text-xs text-gray-500">{format(message.timestamp, 'HH:mm')}</span>
          {message.edited && <span className="text-xs text-gray-400 italic">(edited)</span>}
        </div>

        {/* Message Bubble */}
        <div className="relative group">
          <div
            className={`rounded-2xl px-4 py-3 shadow-sm ${
              isOwnMessage
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                : 'bg-white border-2 border-gray-200 text-gray-900'
            }`}
          >
            {renderMessageContent()}

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className={`flex items-center space-x-2 p-2 rounded-lg ${
                      isOwnMessage ? 'bg-white/20' : 'bg-gray-100'
                    }`}
                  >
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-600">
                        {attachment.name.split('.').pop()?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.name}</p>
                      <p className="text-xs opacity-75">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`absolute top-0 flex items-center space-x-1 ${
                isOwnMessage ? 'left-0 -translate-x-full -ml-2' : 'right-0 translate-x-full mr-2'
              }`}
            >
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
              >
                <Smile className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={onReply}
                className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
              >
                <Reply className="w-4 h-4 text-gray-600" />
              </button>
              {isOwnMessage && (
                <>
                  <button
                    onClick={onEdit}
                    className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={onDelete}
                    className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`absolute top-full mt-2 bg-white rounded-xl shadow-xl border-2 border-gray-200 p-2 flex space-x-1 ${
                isOwnMessage ? 'right-0' : 'left-0'
              }`}
            >
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact?.(emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="text-xl hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((reaction, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.1 }}
                className="flex items-center space-x-1 bg-white border-2 border-gray-200 rounded-full px-2 py-0.5 text-xs hover:border-blue-300 transition-colors"
              >
                <span>{reaction.emoji}</span>
                <span className="font-semibold text-gray-700">{reaction.count}</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
