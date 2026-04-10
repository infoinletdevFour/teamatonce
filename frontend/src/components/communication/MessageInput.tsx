/**
 * MessageInput Component
 * Custom rich text editor with file attachment support and emoji picker
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Paperclip,
  Smile,
  X,
  File,
  Image as ImageIcon,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
} from 'lucide-react';
import { Message } from '@/services/messageService';

interface MessageInputProps {
  onSend: (content: string, attachments?: File[]) => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  maxLength?: number;
}

interface ToolbarButton {
  icon: React.ReactNode;
  command: string;
  title: string;
  value?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  onTyping,
  placeholder = 'Type a message...',
  disabled = false,
  replyTo,
  onCancelReply,
  maxLength = 5000,
}) => {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isEmpty, setIsEmpty] = useState(true);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  // Common emojis for quick access
  const commonEmojis = [
    '😊', '😂', '❤️', '👍', '👋', '🎉', '🔥', '✨',
    '💯', '🙌', '👏', '💪', '🤔', '😎', '🚀', '⭐'
  ];

  // Toolbar buttons configuration
  const toolbarButtons: ToolbarButton[] = [
    { icon: <Bold className="w-4 h-4" />, command: 'bold', title: 'Bold (Ctrl+B)' },
    { icon: <Italic className="w-4 h-4" />, command: 'italic', title: 'Italic (Ctrl+I)' },
    { icon: <Underline className="w-4 h-4" />, command: 'underline', title: 'Underline (Ctrl+U)' },
    { icon: <Strikethrough className="w-4 h-4" />, command: 'strikeThrough', title: 'Strikethrough' },
    { icon: <List className="w-4 h-4" />, command: 'insertUnorderedList', title: 'Bullet List' },
    { icon: <ListOrdered className="w-4 h-4" />, command: 'insertOrderedList', title: 'Numbered List' },
    { icon: <Quote className="w-4 h-4" />, command: 'formatBlock', title: 'Quote', value: 'blockquote' },
    { icon: <Code className="w-4 h-4" />, command: 'code', title: 'Code' },
    { icon: <LinkIcon className="w-4 h-4" />, command: 'createLink', title: 'Insert Link' },
  ];

  // Check if editor content is empty
  const checkIfEmpty = useCallback(() => {
    if (editorRef.current) {
      const text = editorRef.current.innerText.trim();
      setIsEmpty(text.length === 0 || text === '\n');
    }
  }, []);

  // Update active formats based on cursor position
  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>();

    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    if (document.queryCommandState('strikeThrough')) formats.add('strikeThrough');
    if (document.queryCommandState('insertUnorderedList')) formats.add('insertUnorderedList');
    if (document.queryCommandState('insertOrderedList')) formats.add('insertOrderedList');

    setActiveFormats(formats);
  }, []);

  // Focus editor on mount and when reply changes
  useEffect(() => {
    if (editorRef.current && !disabled) {
      editorRef.current.focus();
    }
  }, [replyTo, disabled]);

  // Save selection before opening dialogs
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  // Restore saved selection
  const restoreSelection = () => {
    if (savedSelectionRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelectionRef.current);
      }
    }
  };

  // Execute formatting command
  const execCommand = (command: string, value?: string) => {
    editorRef.current?.focus();

    if (command === 'code') {
      // Handle code formatting specially
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();

        if (selectedText) {
          const code = document.createElement('code');
          code.textContent = selectedText;
          range.deleteContents();
          range.insertNode(code);

          // Move cursor after the code element
          range.setStartAfter(code);
          range.setEndAfter(code);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    } else if (command === 'createLink') {
      saveSelection();
      const selection = window.getSelection();
      if (selection) {
        setLinkText(selection.toString() || '');
      }
      setShowLinkDialog(true);
    } else if (command === 'formatBlock' && value === 'blockquote') {
      document.execCommand('formatBlock', false, 'blockquote');
    } else {
      document.execCommand(command, false, value);
    }

    checkIfEmpty();
    updateActiveFormats();
  };

  // Insert link
  const insertLink = () => {
    if (!linkUrl) return;

    restoreSelection();
    editorRef.current?.focus();

    if (linkText) {
      // If we have link text, create an anchor with that text
      const selection = window.getSelection();
      if (selection && savedSelectionRef.current) {
        const range = savedSelectionRef.current;
        range.deleteContents();

        const anchor = document.createElement('a');
        anchor.href = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
        anchor.textContent = linkText;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';

        range.insertNode(anchor);

        // Move cursor after the link
        range.setStartAfter(anchor);
        range.setEndAfter(anchor);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else {
      // Just create link from URL
      document.execCommand('createLink', false, linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`);
    }

    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
    checkIfEmpty();
  };

  // Handle input changes
  const handleInput = () => {
    checkIfEmpty();
    updateActiveFormats();

    // Trigger typing indicator
    if (onTyping) {
      onTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1000);
    }
  };

  // Check if cursor is inside a list
  const isInsideList = (): boolean => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    let node: Node | null = selection.anchorNode;
    while (node && node !== editorRef.current) {
      if (node.nodeName === 'LI' || node.nodeName === 'UL' || node.nodeName === 'OL') {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter to send (without shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }

    // Shift+Enter for new line - handle list continuation
    if (e.key === 'Enter' && e.shiftKey) {
      if (isInsideList()) {
        // Insert a new list item instead of a line break
        e.preventDefault();
        document.execCommand('insertParagraph', false);
      }
      // For non-list content, let default behavior handle it (inserts <br> or new block)
      return;
    }

    // Keyboard shortcuts for formatting
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
      }
    }
  };

  // Handle send
  const handleSend = () => {
    if (!editorRef.current) return;

    const content = editorRef.current.innerHTML;
    const textContent = editorRef.current.innerText.trim();

    if (!textContent && attachments.length === 0) {
      return;
    }

    if (disabled) {
      return;
    }

    // Send HTML content
    onSend(content, attachments.length > 0 ? attachments : undefined);

    // Reset editor
    editorRef.current.innerHTML = '';
    setAttachments([]);
    setShowEmojiPicker(false);
    setIsEmpty(true);

    // Stop typing indicator
    if (onTyping) {
      onTyping(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Insert emoji
  const insertEmoji = (emoji: string) => {
    editorRef.current?.focus();
    document.execCommand('insertText', false, emoji);
    checkIfEmpty();
    setShowEmojiPicker(false);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Reply Preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-gray-50 border-b border-gray-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 mb-1">
                  Replying to {replyTo.sender?.name || 'Unknown'}
                </p>
                <p className="text-sm text-gray-700 line-clamp-2">
                  {replyTo.content}
                </p>
              </div>
              {onCancelReply && (
                <button
                  onClick={onCancelReply}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachments Preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-gray-50 border-b border-gray-200"
          >
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center space-x-2 px-3 py-2 bg-white border-2 border-gray-200 rounded-lg"
                >
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-3 bg-gray-50 border-b border-gray-200"
          >
            <div className="grid grid-cols-8 gap-2">
              {commonEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => insertEmoji(emoji)}
                  className="text-2xl hover:bg-gray-200 rounded p-1 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Link Dialog */}
      <AnimatePresence>
        {showLinkDialog && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-3 bg-gray-50 border-b border-gray-200"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Link text (optional)"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && insertLink()}
              />
              <button
                onClick={insertLink}
                disabled={!linkUrl}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insert
              </button>
              <button
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkUrl('');
                  setLinkText('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
          {/* Formatting Toolbar */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50">
            {toolbarButtons.map((btn, index) => (
              <button
                key={index}
                onClick={() => execCommand(btn.command, btn.value)}
                disabled={disabled}
                title={btn.title}
                className={`p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeFormats.has(btn.command) ? 'bg-gray-200 text-blue-600' : 'text-gray-600'
                }`}
              >
                {btn.icon}
              </button>
            ))}

            <div className="w-px h-5 bg-gray-300 mx-1" />

            {/* Attachment Button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.txt"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              title="Attach file"
              className="p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Emoji Button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              title="Add emoji"
              className={`p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                showEmojiPicker ? 'bg-gray-200 text-blue-600' : 'text-gray-600'
              }`}
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>

          {/* Editable Content Area */}
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onMouseUp={updateActiveFormats}
            onKeyUp={updateActiveFormats}
            data-placeholder={placeholder}
            className={`min-h-[80px] max-h-[200px] overflow-y-auto px-4 py-3 text-sm text-gray-900 outline-none rich-text-editor ${
              isEmpty ? 'is-empty' : ''
            }`}
          />

          {/* Action Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              Press Enter to send, Shift+Enter for new line
            </p>

            {/* Send Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={disabled || (isEmpty && attachments.length === 0)}
              className={`px-6 py-2 rounded-xl font-bold flex items-center space-x-2 transition-all ${
                !isEmpty || attachments.length > 0
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
              <span>Send</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
