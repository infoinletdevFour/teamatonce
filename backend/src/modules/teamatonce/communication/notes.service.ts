/**
 * Notes Service
 *
 * Manages project notes with automatic project member access.
 * All project members can view and collaborate on notes.
 * Supports hierarchical notes (parent-child relationships).
 */

import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TeamAtOnceGateway } from '../../../websocket/teamatonce.gateway';
import { NotificationsService } from '../../notifications/notifications.service';
import { ProjectAccessService } from '../project/project-access.service';

export interface CreateNoteDto {
  title: string;
  content?: string; // HTML content
  parentId?: string; // For hierarchical notes
  icon?: string;
  coverImage?: string;
  tags?: string[];
  isPinned?: boolean;
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  icon?: string;
  coverImage?: string;
  tags?: string[];
  isPinned?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  position?: number;
}

@Injectable()
export class NotesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly gateway: TeamAtOnceGateway,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => ProjectAccessService))
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  /**
   * Create a new note for a project.
   * All project members automatically have access.
   */
  async createNote(
    projectId: string,
    createdBy: string,
    dto: CreateNoteDto,
  ) {
    // Validate parent exists if provided
    if (dto.parentId) {
      const parent = await this.db.findOne('notes', {
        id: dto.parentId,
        project_id: projectId,
        deleted_at: null,
      });
      if (!parent) {
        throw new BadRequestException('Parent note not found');
      }
    }

    // Get max position for ordering
    const existingNotes = await this.db.findMany('notes', {
      project_id: projectId,
      parent_id: dto.parentId || null,
      deleted_at: null,
    });
    const maxPosition = existingNotes.reduce(
      (max: number, note: any) => Math.max(max, note.position || 0),
      0,
    );

    // Extract plain text for search
    const contentText = dto.content
      ? dto.content.replace(/<[^>]*>/g, '').trim()
      : null;

    const noteData = {
      project_id: projectId,
      title: dto.title,
      content: dto.content || null,
      content_text: contentText,
      parent_id: dto.parentId || null,
      created_by: createdBy,
      last_edited_by: createdBy,
      position: maxPosition + 1,
      icon: dto.icon || null,
      cover_image: dto.coverImage || null,
      tags: JSON.stringify(dto.tags || []),
      attachments: JSON.stringify({ file_attachment: [], note_attachment: [] }),
      is_pinned: dto.isPinned || false,
      is_favorite: false,
      is_archived: false,
      archived_at: null,
      shared_with: JSON.stringify([]), // Not needed - all project members have access
      view_count: 0,
      metadata: JSON.stringify({}),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    const note = await this.db.insert('notes', noteData);
    const parsedNote = this.parseNoteJson(note);

    // Notify all project members about the new note
    this.gateway.sendToProject(projectId, 'note-created', {
      note: parsedNote,
      createdBy,
      timestamp: new Date().toISOString(),
    });

    return parsedNote;
  }

  /**
   * Get all notes for a project.
   * Returns hierarchical structure with top-level notes.
   */
  async getProjectNotes(
    projectId: string,
    options?: {
      parentId?: string;
      includeArchived?: boolean;
      search?: string;
    },
  ) {
    const conditions: any = {
      project_id: projectId,
      deleted_at: null,
    };

    // Filter by parent (null for top-level)
    if (options?.parentId) {
      conditions.parent_id = options.parentId;
    } else if (options?.parentId === undefined) {
      // Default to top-level notes only
      conditions.parent_id = null;
    }

    // Exclude archived unless requested
    if (!options?.includeArchived) {
      conditions.is_archived = false;
    }

    let notes = await this.db.findMany('notes', conditions, {
      orderBy: 'position',
      order: 'asc',
    });

    // Filter by search term
    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      notes = notes.filter(
        (note: any) =>
          note.title?.toLowerCase().includes(searchLower) ||
          note.content_text?.toLowerCase().includes(searchLower),
      );
    }

    return notes.map((note: any) => this.parseNoteJson(note));
  }

  /**
   * Get a single note by ID.
   * Increments view count.
   */
  async getNoteById(noteId: string, viewerId?: string) {
    const note = await this.db.findOne('notes', {
      id: noteId,
      deleted_at: null,
    });

    if (!note) {
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }

    // Increment view count
    await this.db.update('notes', noteId, {
      view_count: (note.view_count || 0) + 1,
    });

    return this.parseNoteJson(note);
  }

  /**
   * Get child notes (sub-pages) of a parent note.
   */
  async getChildNotes(parentId: string) {
    const children = await this.db.findMany(
      'notes',
      {
        parent_id: parentId,
        deleted_at: null,
        is_archived: false,
      },
      {
        orderBy: 'position',
        order: 'asc',
      },
    );

    return children.map((note: any) => this.parseNoteJson(note));
  }

  /**
   * Get pinned notes for a project.
   */
  async getPinnedNotes(projectId: string) {
    const notes = await this.db.findMany(
      'notes',
      {
        project_id: projectId,
        is_pinned: true,
        deleted_at: null,
        is_archived: false,
      },
      {
        orderBy: 'updated_at',
        order: 'desc',
      },
    );

    return notes.map((note: any) => this.parseNoteJson(note));
  }

  /**
   * Get favorite notes for a user in a project.
   */
  async getFavoriteNotes(projectId: string) {
    const notes = await this.db.findMany(
      'notes',
      {
        project_id: projectId,
        is_favorite: true,
        deleted_at: null,
        is_archived: false,
      },
      {
        orderBy: 'updated_at',
        order: 'desc',
      },
    );

    return notes.map((note: any) => this.parseNoteJson(note));
  }

  /**
   * Get recently updated notes.
   */
  async getRecentNotes(projectId: string, limit: number = 10) {
    const notes = await this.db.findMany(
      'notes',
      {
        project_id: projectId,
        deleted_at: null,
        is_archived: false,
      },
      {
        orderBy: 'updated_at',
        order: 'desc',
        limit,
      },
    );

    return notes.map((note: any) => this.parseNoteJson(note));
  }

  /**
   * Update a note.
   * Notifies all project members about the update.
   */
  async updateNote(
    noteId: string,
    updatedBy: string,
    dto: UpdateNoteDto,
  ) {
    const note = await this.getNoteById(noteId);

    const updateData: any = {
      updated_at: new Date().toISOString(),
      last_edited_by: updatedBy,
    };

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.content !== undefined) {
      updateData.content = dto.content;
      updateData.content_text = dto.content
        ? dto.content.replace(/<[^>]*>/g, '').trim()
        : null;
    }
    if (dto.icon !== undefined) updateData.icon = dto.icon;
    if (dto.coverImage !== undefined) updateData.cover_image = dto.coverImage;
    if (dto.tags !== undefined) updateData.tags = JSON.stringify(dto.tags);
    if (dto.isPinned !== undefined) updateData.is_pinned = dto.isPinned;
    if (dto.isFavorite !== undefined) updateData.is_favorite = dto.isFavorite;
    if (dto.isArchived !== undefined) {
      updateData.is_archived = dto.isArchived;
      updateData.archived_at = dto.isArchived ? new Date().toISOString() : null;
    }
    if (dto.position !== undefined) updateData.position = dto.position;

    await this.db.update('notes', noteId, updateData);
    const updatedNote = await this.getNoteById(noteId);

    // Notify all project members about the update
    this.gateway.sendToProject(note.project_id, 'note-updated', {
      note: updatedNote,
      updatedBy,
      timestamp: new Date().toISOString(),
    });

    return updatedNote;
  }

  /**
   * Delete a note (soft delete).
   * Also deletes all child notes.
   */
  async deleteNote(noteId: string, deletedBy: string) {
    const note = await this.getNoteById(noteId);

    // Recursively delete child notes
    const children = await this.db.findMany('notes', {
      parent_id: noteId,
      deleted_at: null,
    });

    for (const child of children) {
      await this.deleteNote(child.id, deletedBy);
    }

    // Soft delete the note
    await this.db.update('notes', noteId, {
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Notify all project members
    this.gateway.sendToProject(note.project_id, 'note-deleted', {
      noteId,
      deletedBy,
      timestamp: new Date().toISOString(),
    });

    return { success: true, message: 'Note deleted successfully' };
  }

  /**
   * Toggle pin status.
   */
  async togglePin(noteId: string, userId: string) {
    const note = await this.getNoteById(noteId);
    return this.updateNote(noteId, userId, { isPinned: !note.is_pinned });
  }

  /**
   * Toggle favorite status.
   */
  async toggleFavorite(noteId: string, userId: string) {
    const note = await this.getNoteById(noteId);
    return this.updateNote(noteId, userId, { isFavorite: !note.is_favorite });
  }

  /**
   * Archive a note.
   */
  async archiveNote(noteId: string, userId: string) {
    return this.updateNote(noteId, userId, { isArchived: true });
  }

  /**
   * Unarchive a note.
   */
  async unarchiveNote(noteId: string, userId: string) {
    return this.updateNote(noteId, userId, { isArchived: false });
  }

  /**
   * Move a note to a new parent.
   */
  async moveNote(noteId: string, newParentId: string | null, userId: string) {
    const note = await this.getNoteById(noteId);

    // Validate new parent if provided
    if (newParentId) {
      const parent = await this.db.findOne('notes', {
        id: newParentId,
        project_id: note.project_id,
        deleted_at: null,
      });
      if (!parent) {
        throw new BadRequestException('New parent note not found');
      }

      // Prevent moving to self or descendants
      if (newParentId === noteId) {
        throw new BadRequestException('Cannot move note to itself');
      }
    }

    await this.db.update('notes', noteId, {
      parent_id: newParentId,
      updated_at: new Date().toISOString(),
    });

    const updatedNote = await this.getNoteById(noteId);

    this.gateway.sendToProject(note.project_id, 'note-moved', {
      note: updatedNote,
      movedBy: userId,
      timestamp: new Date().toISOString(),
    });

    return updatedNote;
  }

  /**
   * Reorder notes within a parent.
   */
  async reorderNotes(
    projectId: string,
    parentId: string | null,
    noteIds: string[],
    userId: string,
  ) {
    // Update positions based on order in array
    for (let i = 0; i < noteIds.length; i++) {
      await this.db.update('notes', noteIds[i], {
        position: i + 1,
        updated_at: new Date().toISOString(),
      });
    }

    this.gateway.sendToProject(projectId, 'notes-reordered', {
      parentId,
      noteIds,
      reorderedBy: userId,
      timestamp: new Date().toISOString(),
    });

    return { success: true, message: 'Notes reordered successfully' };
  }

  /**
   * Search notes in a project.
   */
  async searchNotes(projectId: string, query: string) {
    return this.getProjectNotes(projectId, { search: query });
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private parseNoteJson(note: any) {
    if (!note) return null;

    return {
      ...note,
      tags: this.safeJsonParse(note.tags) || [],
      attachments: this.safeJsonParse(note.attachments) || {
        file_attachment: [],
        note_attachment: [],
      },
      shared_with: this.safeJsonParse(note.shared_with) || [],
      metadata: this.safeJsonParse(note.metadata) || {},
    };
  }

  private safeJsonParse(value: any): any {
    if (!value) return null;
    if (typeof value === 'object') return value;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}
