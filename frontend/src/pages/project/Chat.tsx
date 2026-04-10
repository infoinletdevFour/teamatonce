import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash,
  Search,
  Plus,
  Send,
  Smile,
  Paperclip,
  Code,
  Pin,
  Users,
  Settings,
  Bell,
  Star,
  X,
  Loader2,
  AlertCircle,
  MessageSquare,
  Phone,
  Video,
} from 'lucide-react';
import { MessageBubble, UserAvatar } from '@/components/project';
import { Channel, Message as UIMessage, TeamMember } from '@/lib/types/project';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useVideoCallContext } from '@/contexts/VideoCallContext';
import messageService, {
  Conversation,
  Message as APIMessage,
  CreateConversationData
} from '@/services/messageService';
import { getProjectTeam } from '@/services/teamMemberService';
import { toast } from 'sonner';

/**
 * Team Chat Page
 * Real-time messaging with channels, file sharing, and code snippets
 */

export const Chat: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { company } = useCompany();
  const companyId = company?.id || '';

  // State
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showChannelInfo, setShowChannelInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUserId = user?.id || '';

  // Video call context
  const {
    isInCall,
    callType,
    isLoading: callLoading,
    startCall,
  } = useVideoCallContext();

  // Handlers for video/audio calls (group call for team chat)
  const handleStartVideoCall = useCallback(() => {
    if (!projectId) return;
    // Get all team member IDs except current user for group call
    const participantIds = teamMembers
      .filter(m => m.id !== currentUserId)
      .map(m => m.id);
    startCall(projectId, 'video', participantIds, selectedChannel?.id !== 'general' ? selectedChannel?.id : undefined);
  }, [projectId, teamMembers, currentUserId, selectedChannel, startCall]);

  const handleStartAudioCall = useCallback(() => {
    if (!projectId) return;
    // Get all team member IDs except current user for group call
    const participantIds = teamMembers
      .filter(m => m.id !== currentUserId)
      .map(m => m.id);
    startCall(projectId, 'audio', participantIds, selectedChannel?.id !== 'general' ? selectedChannel?.id : undefined);
  }, [projectId, teamMembers, currentUserId, selectedChannel, startCall]);

  // Transform API message to UI message format
  const transformMessage = useCallback((apiMsg: APIMessage, members: TeamMember[]): UIMessage => {
    const sender = members.find(m => m.id === apiMsg.sender_id) ||
      (apiMsg.sender ? {
        id: apiMsg.sender.id || apiMsg.sender_id,
        name: apiMsg.sender.name || 'Unknown User',
        email: apiMsg.sender.email || '',
        avatar: apiMsg.sender.avatar,
        role: 'developer' as const,
        status: 'online' as const,
      } : {
        id: apiMsg.sender_id,
        name: 'Unknown User',
        email: '',
        role: 'developer' as const,
        status: 'offline' as const,
      });

    return {
      id: apiMsg.id,
      content: apiMsg.content,
      sender,
      timestamp: new Date(apiMsg.created_at),
      type: apiMsg.message_type || 'text',
      reactions: apiMsg.reactions ? Object.entries(apiMsg.reactions).map(([emoji, userIds]) => ({
        emoji,
        users: (userIds as string[]).map(uid => members.find(m => m.id === uid) || {
          id: uid, name: 'User', email: '', role: 'developer' as const, status: 'offline' as const
        }),
        count: (userIds as string[]).length,
      })) : undefined,
      attachments: apiMsg.attachments?.map(att => ({
        id: att.id,
        name: att.name,
        url: att.url,
        size: att.size,
        type: (att.type as any) || 'other',
        mimeType: att.mimeType,
      })),
    };
  }, []);

  // Transform conversation to channel format
  const transformConversation = useCallback((conv: Conversation, members: TeamMember[]): Channel => {
    return {
      id: conv.id,
      name: conv.title || (conv.conversation_type === 'project' ? 'general' : 'direct'),
      description: conv.conversation_type === 'project' ? 'Project discussion' : undefined,
      type: conv.conversation_type === 'direct' ? 'direct' : conv.conversation_type === 'group' ? 'team' : 'project',
      members: conv.participantDetails?.map((p: any) => ({
        id: p.id || p.user_id,
        name: p.name || 'Unknown',
        email: p.email || '',
        avatar: p.avatar,
        role: 'developer' as const,
        status: 'online' as const,
      })) || members.filter(m => conv.participants.includes(m.id)),
      unreadCount: conv.unreadCount || 0,
      isPinned: conv.conversation_type === 'project',
      lastMessage: conv.lastMessage ? transformMessage(conv.lastMessage, members) : undefined,
    };
  }, [transformMessage]);

  // Load initial data
  const loadData = useCallback(async () => {
    if (!companyId || !projectId) return;

    setLoading(true);
    setError(null);

    try {
      // Load team members and conversations in parallel
      const [membersData, conversationsData] = await Promise.all([
        getProjectTeam(projectId).catch(() => []),
        messageService.getConversations(companyId, projectId).catch(() => []),
      ]);

      // Transform team members
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

      // Transform conversations to channels
      const transformedChannels = conversationsData.map(conv => transformConversation(conv, members));

      // If no project conversation exists, create a placeholder for general channel
      if (!transformedChannels.find(c => c.type === 'project')) {
        transformedChannels.unshift({
          id: 'general',
          name: 'general',
          description: 'General project discussion',
          type: 'project',
          members,
          unreadCount: 0,
          isPinned: true,
        });
      }

      setChannels(transformedChannels);

      // Select first channel by default
      if (transformedChannels.length > 0 && !selectedChannel) {
        setSelectedChannel(transformedChannels[0]);
      }
    } catch (err: any) {
      console.error('Error loading chat data:', err);
      setError('Failed to load chat. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [companyId, projectId, user, transformConversation, selectedChannel]);

  // Load messages for selected channel
  const loadMessages = useCallback(async () => {
    if (!companyId || !selectedChannel || selectedChannel.id === 'general') {
      // For placeholder general channel, show empty state
      if (selectedChannel?.id === 'general') {
        setMessages([]);
      }
      return;
    }

    setMessagesLoading(true);

    try {
      const apiMessages = await messageService.getMessages(companyId, selectedChannel.id);
      const transformedMessages = apiMessages.map(msg => transformMessage(msg, teamMembers));
      setMessages(transformedMessages);

      // Mark as read
      await messageService.markAsRead(companyId, selectedChannel.id).catch(() => {});
    } catch (err: any) {
      console.error('Error loading messages:', err);
      toast.error('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }, [companyId, selectedChannel, teamMembers, transformMessage]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load messages when channel changes
  useEffect(() => {
    if (selectedChannel) {
      loadMessages();
    }
  }, [selectedChannel, loadMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create or get general project conversation
  const ensureProjectConversation = async (): Promise<string> => {
    if (!companyId || !projectId) throw new Error('Missing company or project ID');

    // Check if general channel already exists with a real ID
    if (selectedChannel && selectedChannel.id !== 'general') {
      return selectedChannel.id;
    }

    // Create new project conversation
    const conversationData: CreateConversationData = {
      projectId,
      conversationType: 'project',
      title: 'general',
      participants: teamMembers.map(m => m.id),
    };

    const newConversation = await messageService.createConversation(companyId, conversationData);

    // Update channels list with real conversation
    const newChannel = transformConversation(newConversation, teamMembers);
    setChannels(prev => prev.map(ch => ch.id === 'general' ? newChannel : ch));
    setSelectedChannel(newChannel);

    return newConversation.id;
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !companyId || sending) return;

    setSending(true);

    try {
      const conversationId = await ensureProjectConversation();

      const apiMessage = await messageService.sendMessage(companyId, conversationId, {
        content: messageInput,
        messageType: 'text',
      });

      // Add message to UI
      const uiMessage = transformMessage(apiMessage, teamMembers);
      setMessages(prev => [...prev, uiMessage]);
      setMessageInput('');
    } catch (err: any) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !companyId || !selectedChannel) return;

    try {
      const conversationId = await ensureProjectConversation();

      for (const file of Array.from(files)) {
        const attachment = await messageService.uploadAttachment(companyId, file, conversationId);

        // Send message with attachment
        const apiMessage = await messageService.sendMessage(companyId, conversationId, {
          content: `Shared file: ${file.name}`,
          messageType: 'file',
          attachments: [attachment],
        });

        const uiMessage = transformMessage(apiMessage, teamMembers);
        setMessages(prev => [...prev, uiMessage]);
      }

      toast.success('File uploaded successfully');
    } catch (err: any) {
      console.error('Error uploading file:', err);
      toast.error('Failed to upload file');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filter channels by search
  const filteredChannels = channels.filter(ch =>
    ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineMembers = selectedChannel?.members.filter((m) => m.status === 'online') || [];

  // Loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-800 font-semibold mb-2">Error Loading Chat</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Sidebar - Channels */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Team Chat
          </h2>

          {/* Search Channels */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="mb-4">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Channels</span>
              <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                <Plus className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {filteredChannels.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500 text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No channels yet</p>
                <p className="text-xs">Start a conversation below</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredChannels.filter(ch => ch.type !== 'direct').map((channel) => (
                  <motion.button
                    key={channel.id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    onClick={() => setSelectedChannel(channel)}
                    className={`w-full px-3 py-2.5 rounded-lg text-left transition-all flex items-center justify-between group ${
                      selectedChannel?.id === channel.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <Hash className="w-4 h-4 flex-shrink-0" />
                      <span className="font-semibold truncate">{channel.name}</span>
                      {channel.isPinned && (
                        <Pin className="w-3 h-3 flex-shrink-0" />
                      )}
                    </div>
                    {channel.unreadCount && channel.unreadCount > 0 ? (
                      <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                        {channel.unreadCount}
                      </span>
                    ) : null}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Direct Messages */}
          <div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Team Members</span>
            </div>

            <div className="space-y-1">
              {teamMembers.filter(m => m.id !== currentUserId).slice(0, 5).map((member) => (
                <motion.button
                  key={member.id}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="w-full px-3 py-2.5 rounded-lg text-left hover:bg-gray-100 transition-all flex items-center space-x-2"
                >
                  <UserAvatar user={member} size="sm" showStatus />
                  <span className="font-semibold text-gray-700 truncate">{member.name}</span>
                </motion.button>
              ))}
              {teamMembers.length === 0 && (
                <p className="px-3 py-2 text-gray-500 text-sm">No team members yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
              <Hash className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{selectedChannel?.name || 'Select a channel'}</h3>
              {selectedChannel?.description && (
                <p className="text-sm text-gray-600">{selectedChannel.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleStartAudioCall}
              disabled={callLoading || isInCall}
              className="p-2.5 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Start group audio call"
            >
              {callLoading && callType === 'audio' ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
              ) : (
                <Phone className="w-5 h-5 text-gray-600" />
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleStartVideoCall}
              disabled={callLoading || isInCall}
              className="p-2.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Start group video call"
            >
              {callLoading && callType === 'video' ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
              ) : (
                <Video className="w-5 h-5 text-gray-600" />
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Star className="w-5 h-5 text-gray-600" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowChannelInfo(!showChannelInfo)}
              className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Users className="w-5 h-5 text-gray-600" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-white custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-1">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No messages yet</h3>
                <p className="text-gray-500">Be the first to send a message!</p>
              </div>
            ) : (
              <>
                {/* Date Separator */}
                <div className="text-center my-4">
                  <span className="text-sm text-gray-500 bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-200">
                    Today
                  </span>
                </div>

                {/* Messages */}
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={message.sender.id === currentUserId}
                    showAvatar={true}
                  />
                ))}
              </>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message #${selectedChannel?.name || 'general'}`}
                rows={1}
                disabled={sending}
                className="w-full px-4 py-3 bg-transparent resize-none outline-none text-gray-900 placeholder-gray-500 disabled:opacity-50"
              />

              <div className="flex items-center justify-between px-4 pb-3">
                <div className="flex items-center space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Attach file"
                  >
                    <Paperclip className="w-5 h-5 text-gray-600" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Insert code"
                  >
                    <Code className="w-5 h-5 text-gray-600" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Add emoji"
                  >
                    <Smile className="w-5 h-5 text-gray-600" />
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sending}
                  className={`px-6 py-2 rounded-xl font-bold flex items-center space-x-2 transition-all ${
                    messageInput.trim() && !sending
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  <span>{sending ? 'Sending...' : 'Send'}</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Channel Info */}
      <AnimatePresence>
        {showChannelInfo && selectedChannel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-white border-l border-gray-200 overflow-hidden"
          >
            <div className="p-6 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Channel Info</h3>
                <button
                  onClick={() => setShowChannelInfo(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Channel Description */}
              {selectedChannel.description && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-600 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedChannel.description}</p>
                </div>
              )}

              {/* Members */}
              <div>
                <h4 className="text-sm font-bold text-gray-600 mb-3">
                  Members ({selectedChannel.members.length})
                </h4>
                <div className="space-y-2">
                  {selectedChannel.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <UserAvatar user={member} size="md" showStatus />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{member.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Online Status Summary */}
              <div className="mt-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                <div className="flex items-center space-x-2 text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-semibold">
                    {onlineMembers.length} online now
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;
