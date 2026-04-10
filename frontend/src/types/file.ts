/**
 * File Management Types
 * Complete type definitions for file operations
 */

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;

  // Organization
  folderId?: string;
  projectId: string;
  path: string;

  // Metadata
  uploadedBy: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  uploadedAt: Date;
  modifiedAt?: Date;

  // Version Control
  version: number;
  versionHistory?: FileVersion[];

  // Sharing & Permissions
  permissions: FilePermission[];
  sharedWith?: SharedUser[];
  isPublic: boolean;
  shareLink?: string;
  shareLinkExpiry?: Date;

  // Classification
  tags?: string[];
  description?: string;

  // Status
  status: 'uploading' | 'processing' | 'ready' | 'error';
  uploadProgress?: number;

  // Folder specific
  isFolder?: boolean;
  children?: FileItem[];
}

export interface Folder {
  id: string;
  name: string;
  path: string;
  projectId: string;
  parentId?: string;
  createdBy: string;
  createdAt: Date;
  modifiedAt: Date;
  children?: Folder[];
  fileCount: number;
  totalSize: number;
}

export interface FileVersion {
  id: string;
  version: number;
  fileId: string;
  url: string;
  size: number;
  uploadedBy: {
    id: string;
    name: string;
  };
  uploadedAt: Date;
  comment?: string;
}

export interface SharedUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  permission: FilePermission;
  sharedAt: Date;
  sharedBy: string;
}

export type FileType =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'code'
  | 'archive'
  | 'other';

export enum FilePermission {
  VIEW = 'view',
  EDIT = 'edit',
  COMMENT = 'comment',
  MANAGE = 'manage',
}

export interface UploadFileRequest {
  file: File;
  projectId: string;
  folderId?: string;
  tags?: string[];
  description?: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export interface CreateFolderRequest {
  name: string;
  projectId: string;
  parentId?: string;
  description?: string;
}

export interface ShareFileRequest {
  fileId: string;
  emails?: string[];
  userIds?: string[];
  permission: FilePermission;
  message?: string;
  expiryDate?: Date;
  requirePassword?: boolean;
  password?: string;
}

export interface FileDownloadResponse {
  url: string;
  fileName: string;
  expiresAt: Date;
}

export interface FileSearchFilters {
  projectId: string;
  folderId?: string;
  query?: string;
  type?: FileType | 'all';
  tags?: string[];
  uploadedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minSize?: number;
  maxSize?: number;
  sortBy?: 'name' | 'date' | 'size' | 'type';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface FileOperationResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export interface StorageInfo {
  used: number;
  total: number;
  percentage: number;
  byType: {
    image: number;
    video: number;
    document: number;
    code: number;
    audio: number;
    archive: number;
    other: number;
  };
}

export interface BreadcrumbItem {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
}
