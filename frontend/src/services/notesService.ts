/**
 * Notes Service for Team@Once
 *
 * Handles all API calls related to project notes
 */

import { apiClient } from '@/lib/api-client'

// ============================================
// TYPES
// ============================================

export interface Note {
  id: string
  projectId: string
  title: string
  content?: string
  contentText?: string
  parentId?: string
  createdBy: string
  lastEditedBy?: string
  position: number
  icon?: string
  coverImage?: string
  tags: string[]
  attachments: Record<string, any>
  isPinned: boolean
  isFavorite: boolean
  isArchived: boolean
  archivedAt?: string
  sharedWith: string[]
  viewCount: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
  // Enriched fields
  children?: Note[]
  childCount?: number
}

export interface NotesListResponse {
  notes: Note[]
  total: number
}

export interface CreateNoteData {
  title: string
  content?: string
  parentId?: string
  icon?: string
  coverImage?: string
  tags?: string[]
  isPinned?: boolean
}

export interface UpdateNoteData {
  title?: string
  content?: string
  parentId?: string
  icon?: string
  coverImage?: string
  tags?: string[]
  isPinned?: boolean
  isFavorite?: boolean
  position?: number
}

export interface MoveNoteData {
  parentId?: string | null
  position?: number
}

export interface ShareNoteData {
  userIds: string[]
}

export interface DuplicateNoteData {
  title?: string
  includeChildren?: boolean
  parentId?: string
}

export interface NotesFilters {
  parentId?: string
  isPinned?: boolean
  isFavorite?: boolean
  isArchived?: boolean
  isDeleted?: boolean
  search?: string
  tags?: string[]
}

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Create a new note
 */
export const createNote = async (projectId: string, data: CreateNoteData): Promise<Note> => {
  const response = await apiClient.post(`/projects/${projectId}/notes`, data)
  return response.data
}

/**
 * Get all notes for a project
 */
export const getNotes = async (
  projectId: string,
  filters?: NotesFilters
): Promise<NotesListResponse> => {
  const params = new URLSearchParams()

  if (filters?.parentId) params.append('parentId', filters.parentId)
  if (filters?.isPinned !== undefined) params.append('isPinned', String(filters.isPinned))
  if (filters?.isFavorite !== undefined) params.append('isFavorite', String(filters.isFavorite))
  if (filters?.isArchived !== undefined) params.append('isArchived', String(filters.isArchived))
  if (filters?.isDeleted !== undefined) params.append('isDeleted', String(filters.isDeleted))
  if (filters?.search) params.append('search', filters.search)
  if (filters?.tags?.length) filters.tags.forEach(tag => params.append('tags', tag))

  const queryString = params.toString()
  const url = `/projects/${projectId}/notes${queryString ? `?${queryString}` : ''}`

  const response = await apiClient.get(url)
  return response.data
}

/**
 * Get a single note by ID
 */
export const getNote = async (projectId: string, noteId: string): Promise<Note> => {
  const response = await apiClient.get(`/projects/${projectId}/notes/${noteId}`)
  return response.data
}

/**
 * Update a note
 */
export const updateNote = async (
  projectId: string,
  noteId: string,
  data: UpdateNoteData
): Promise<Note> => {
  const response = await apiClient.put(`/projects/${projectId}/notes/${noteId}`, data)
  return response.data
}

/**
 * Delete a note (soft delete - move to trash)
 */
export const deleteNote = async (
  projectId: string,
  noteId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`/projects/${projectId}/notes/${noteId}`)
  return response.data
}

/**
 * Permanently delete a note
 */
export const permanentDeleteNote = async (
  projectId: string,
  noteId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`/projects/${projectId}/notes/${noteId}/permanent`)
  return response.data
}

/**
 * Restore a deleted note
 */
export const restoreNote = async (projectId: string, noteId: string): Promise<Note> => {
  const response = await apiClient.post(`/projects/${projectId}/notes/${noteId}/restore`)
  return response.data
}

// ============================================
// ARCHIVE OPERATIONS
// ============================================

/**
 * Archive a note
 */
export const archiveNote = async (
  projectId: string,
  noteId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/projects/${projectId}/notes/${noteId}/archive`)
  return response.data
}

/**
 * Unarchive a note
 */
export const unarchiveNote = async (projectId: string, noteId: string): Promise<Note> => {
  const response = await apiClient.post(`/projects/${projectId}/notes/${noteId}/unarchive`)
  return response.data
}

// ============================================
// MOVE & SHARE
// ============================================

/**
 * Move a note (change parent or position)
 */
export const moveNote = async (
  projectId: string,
  noteId: string,
  data: MoveNoteData
): Promise<Note> => {
  const response = await apiClient.patch(`/projects/${projectId}/notes/${noteId}/move`, data)
  return response.data
}

/**
 * Share a note with other users
 */
export const shareNote = async (
  projectId: string,
  noteId: string,
  data: ShareNoteData
): Promise<Note> => {
  const response = await apiClient.post(`/projects/${projectId}/notes/${noteId}/share`, data)
  return response.data
}

/**
 * Remove sharing from a user
 */
export const unshareNote = async (
  projectId: string,
  noteId: string,
  targetUserId: string
): Promise<Note> => {
  const response = await apiClient.delete(
    `/projects/${projectId}/notes/${noteId}/share/${targetUserId}`
  )
  return response.data
}

// ============================================
// DUPLICATE
// ============================================

/**
 * Duplicate a note
 */
export const duplicateNote = async (
  projectId: string,
  noteId: string,
  data?: DuplicateNoteData
): Promise<Note> => {
  const response = await apiClient.post(`/projects/${projectId}/notes/${noteId}/duplicate`, data || {})
  return response.data
}

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Archive multiple notes
 */
export const bulkArchiveNotes = async (
  projectId: string,
  noteIds: string[]
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/projects/${projectId}/notes/bulk/archive`, { noteIds })
  return response.data
}

/**
 * Unarchive multiple notes
 */
export const bulkUnarchiveNotes = async (
  projectId: string,
  noteIds: string[]
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/projects/${projectId}/notes/bulk/unarchive`, { noteIds })
  return response.data
}

/**
 * Delete multiple notes (soft delete)
 */
export const bulkDeleteNotes = async (
  projectId: string,
  noteIds: string[]
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/projects/${projectId}/notes/bulk/delete`, { noteIds })
  return response.data
}

/**
 * Permanently delete multiple notes
 */
export const bulkPermanentDeleteNotes = async (
  projectId: string,
  noteIds: string[]
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/projects/${projectId}/notes/bulk/delete/permanent`, {
    noteIds,
  })
  return response.data
}

/**
 * Restore multiple deleted notes
 */
export const bulkRestoreNotes = async (
  projectId: string,
  noteIds: string[]
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/projects/${projectId}/notes/bulk/restore`, { noteIds })
  return response.data
}

// ============================================
// SEARCH
// ============================================

/**
 * Search notes
 */
export const searchNotes = async (
  projectId: string,
  query: string
): Promise<NotesListResponse> => {
  const response = await apiClient.get(`/projects/${projectId}/notes/search?q=${encodeURIComponent(query)}`)
  return response.data
}

// ============================================
// QUICK ACTIONS
// ============================================

/**
 * Toggle note pinned status
 */
export const toggleNotePinned = async (
  projectId: string,
  noteId: string,
  isPinned: boolean
): Promise<Note> => {
  return updateNote(projectId, noteId, { isPinned })
}

/**
 * Toggle note favorite status
 */
export const toggleNoteFavorite = async (
  projectId: string,
  noteId: string,
  isFavorite: boolean
): Promise<Note> => {
  return updateNote(projectId, noteId, { isFavorite })
}
