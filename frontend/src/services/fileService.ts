/**
 * File Service
 * Handles file upload, download, and management for projects
 */

import { apiClient } from '@/lib/api-client';

export interface FileUploadMetadata {
  description?: string;
  tags?: string[];
  milestoneId?: string;
  isPublic?: boolean;
  sharedWith?: string[];
}

export interface DeliverableUploadMetadata {
  deliverableIndex: number;
  description?: string;
  tags?: string[];
}

export interface ProjectFile {
  id: string;
  projectId: string;
  milestoneId?: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  fileType: 'document' | 'image' | 'video' | 'audio' | 'code' | 'archive' | 'other';
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
  tags?: string[];
  version: number;
  isDeliverable: boolean;
  deliverableIndex?: number;
  thumbnailUrl?: string;
  isPublic: boolean;
  sharedWith?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileListResponse {
  files: ProjectFile[];
  total: number;
}

export interface FileListFilters {
  milestoneId?: string;
  fileType?: string;
  uploadedBy?: string;
  isDeliverable?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Upload a file to a project
 */
export const uploadProjectFile = async (
  projectId: string,
  file: File,
  metadata?: FileUploadMetadata
): Promise<ProjectFile> => {
  const formData = new FormData();
  formData.append('file', file);

  if (metadata?.description) {
    formData.append('description', metadata.description);
  }
  if (metadata?.tags) {
    formData.append('tags', JSON.stringify(metadata.tags));
  }
  if (metadata?.milestoneId) {
    formData.append('milestoneId', metadata.milestoneId);
  }
  // Note: FormData sends strings, backend should handle string-to-boolean conversion
  // Only send isPublic if true, backend defaults to false
  if (metadata?.isPublic === true) {
    formData.append('isPublic', 'true');
  }
  if (metadata?.sharedWith) {
    formData.append('sharedWith', JSON.stringify(metadata.sharedWith));
  }

  // Don't set Content-Type header - browser will auto-set with boundary for FormData
  const response = await apiClient.post<ProjectFile>(
    `/projects/${projectId}/files/upload`,
    formData
  );

  return response.data;
};

/**
 * Upload a milestone deliverable
 */
export const uploadDeliverable = async (
  projectId: string,
  milestoneId: string,
  file: File,
  metadata: DeliverableUploadMetadata
): Promise<ProjectFile> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('deliverableIndex', String(metadata.deliverableIndex));

  if (metadata.description) {
    formData.append('description', metadata.description);
  }
  if (metadata.tags) {
    formData.append('tags', JSON.stringify(metadata.tags));
  }

  // Don't set Content-Type header - browser will auto-set with boundary for FormData
  const response = await apiClient.post<ProjectFile>(
    `/projects/${projectId}/milestones/${milestoneId}/deliverables/upload`,
    formData
  );

  return response.data;
};

/**
 * Get all files for a project
 */
export const getProjectFiles = async (
  projectId: string,
  filters?: FileListFilters
): Promise<FileListResponse> => {
  const response = await apiClient.get<FileListResponse>(
    `/projects/${projectId}/files`,
    { params: filters }
  );

  return response.data;
};

/**
 * Get file details by ID
 */
export const getFileDetails = async (
  projectId: string,
  fileId: string
): Promise<ProjectFile> => {
  const response = await apiClient.get<ProjectFile>(
    `/projects/${projectId}/files/${fileId}`
  );

  return response.data;
};

/**
 * Download a file
 */
export const downloadFile = async (
  projectId: string,
  fileId: string,
  fileName?: string
): Promise<void> => {
  const response = await apiClient.get(
    `/projects/${projectId}/files/${fileId}/download`,
    {
      responseType: 'blob',
    }
  );

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName || 'download');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Get signed URL for file access
 */
export const getFileUrl = async (
  projectId: string,
  fileId: string
): Promise<{ url: string; expiresIn: number }> => {
  const response = await apiClient.get(
    `/projects/${projectId}/files/${fileId}/url`
  );

  return response.data;
};

/**
 * Delete a file
 */
export const deleteFile = async (
  projectId: string,
  fileId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(
    `/projects/${projectId}/files/${fileId}`
  );

  return response.data;
};

/**
 * Share file with users
 */
export const shareFile = async (
  projectId: string,
  fileId: string,
  userIds: string[]
): Promise<ProjectFile> => {
  const response = await apiClient.post<ProjectFile>(
    `/projects/${projectId}/files/${fileId}/share`,
    { userIds }
  );

  return response.data;
};

/**
 * Update file metadata
 */
export const updateFileMetadata = async (
  projectId: string,
  fileId: string,
  metadata: {
    description?: string;
    tags?: string[];
    isPublic?: boolean;
    sharedWith?: string[];
  }
): Promise<ProjectFile> => {
  const response = await apiClient.post<ProjectFile>(
    `/projects/${projectId}/files/${fileId}`,
    metadata
  );

  return response.data;
};

/**
 * Get files for a specific milestone
 */
export const getMilestoneFiles = async (
  projectId: string,
  milestoneId: string
): Promise<FileListResponse> => {
  const response = await apiClient.get<FileListResponse>(
    `/projects/${projectId}/milestones/${milestoneId}/files`
  );

  return response.data;
};

/**
 * Get deliverable files for a milestone
 */
export const getMilestoneDeliverables = async (
  projectId: string,
  milestoneId: string
): Promise<FileListResponse> => {
  const response = await apiClient.get<FileListResponse>(
    `/projects/${projectId}/milestones/${milestoneId}/deliverables`
  );

  return response.data;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file icon based on file type
 */
export const getFileIcon = (fileType: string): string => {
  const iconMap: Record<string, string> = {
    document: 'FileText',
    image: 'Image',
    video: 'Video',
    audio: 'Music',
    code: 'Code',
    archive: 'Archive',
    other: 'File',
  };

  return iconMap[fileType] || 'File';
};

/**
 * Validate file before upload
 */
export const validateFile = (
  file: File,
  options?: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  }
): { valid: boolean; error?: string } => {
  const maxSize = options?.maxSize || 100 * 1024 * 1024; // 100MB default
  const allowedTypes = options?.allowedTypes;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(maxSize)}`,
    };
  }

  if (allowedTypes && !allowedTypes.some(type => file.type.includes(type))) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  return { valid: true };
};

export default {
  uploadProjectFile,
  uploadDeliverable,
  getProjectFiles,
  getFileDetails,
  downloadFile,
  getFileUrl,
  deleteFile,
  shareFile,
  updateFileMetadata,
  getMilestoneFiles,
  getMilestoneDeliverables,
  formatFileSize,
  getFileIcon,
  validateFile,
};
