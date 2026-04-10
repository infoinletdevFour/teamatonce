/**
 * Project Collaboration Types
 * TypeScript interfaces for all project collaboration features
 */

// Task Management Types
// Backend uses: initialized, inprogress, done (no dashes/underscores)
export type TaskStatus = 'initialized' | 'inprogress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: TeamMember;
  dueDate?: Date;
  tags?: string[];
  comments?: Comment[];
  attachments?: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  color: string;
}

// Team & User Types
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'client' | 'seller' | 'designer' | 'project-manager';
  status: 'online' | 'away' | 'busy' | 'offline';
  timezone?: string;
}

// Communication Types
export interface Message {
  id: string;
  content: string;
  sender: TeamMember;
  timestamp: Date;
  edited?: boolean;
  reactions?: Reaction[];
  attachments?: Attachment[];
  replyTo?: string;
  type: 'text' | 'code' | 'file' | 'system';
  codeLanguage?: string;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'project' | 'team' | 'direct';
  members: TeamMember[];
  unreadCount?: number;
  lastMessage?: Message;
  isPinned?: boolean;
}

export interface Reaction {
  emoji: string;
  users: TeamMember[];
  count: number;
}

// Video Call Types
export interface VideoParticipant {
  id: string;
  member: TeamMember;
  stream?: MediaStream;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
}

export interface VideoCallState {
  roomId: string;
  participants: VideoParticipant[];
  isRecording: boolean;
  startedAt: Date;
  duration: number;
}

// File Management Types
export type FileType = 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive' | 'other';

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: TeamMember;
  uploadedAt: Date;
  version: number;
  versions?: FileVersion[];
  isFolder?: boolean;
  children?: FileItem[];
  tags?: string[];
}

export interface FileVersion {
  id: string;
  version: number;
  url: string;
  size: number;
  uploadedBy: TeamMember;
  uploadedAt: Date;
  changeNote?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  type: 'folder';
  children: (FileItem | FolderItem)[];
  createdAt: Date;
  updatedAt: Date;
}

// Comment Types
export interface Comment {
  id: string;
  content: string;
  author: TeamMember;
  createdAt: Date;
  updatedAt?: Date;
  replies?: Comment[];
}

// Attachment Types
export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: FileType;
  mimeType: string;
}

// Filter & Search Types
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignee?: string[];
  tags?: string[];
  search?: string;
}

export interface FileFilters {
  type?: FileType[];
  uploadedBy?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

// Presence & Activity Types
export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: Date;
  currentActivity?: string;
}

export interface TypingIndicator {
  userId: string;
  channelId: string;
  userName: string;
}
