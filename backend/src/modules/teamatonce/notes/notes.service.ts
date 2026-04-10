import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../../notifications/dto';
import {
  CreateNoteDto,
  UpdateNoteDto,
  MoveNoteDto,
  ShareNoteDto,
  DuplicateNoteDto,
  NoteFiltersDto,
} from './dto/notes.dto';

@Injectable()
export class NotesService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  // ============================================
  // NOTE CRUD OPERATIONS
  // ============================================

  async createNote(projectId: string, userId: string, dto: CreateNoteDto) {
    // Get the next position for the note
    const position = await this.getNextPosition(projectId, dto.parentId || null);

    // Strip HTML tags to create plaintext content for search
    const contentText = dto.content ? this.stripHtml(dto.content) : null;

    const noteData = {
      project_id: projectId,
      title: dto.title,
      content: dto.content || null,
      content_text: contentText,
      parent_id: dto.parentId || null,
      created_by: userId,
      last_edited_by: userId,
      position,
      icon: dto.icon || null,
      cover_image: dto.coverImage || null,
      tags: JSON.stringify(dto.tags || []),
      attachments: JSON.stringify({}),
      is_pinned: dto.isPinned || false,
      is_favorite: false,
      is_archived: false,
      shared_with: JSON.stringify([]),
      view_count: 0,
      metadata: JSON.stringify({}),
    };

    const note = await this.db.insert('notes', noteData);
    return this.parseNoteJson(note);
  }

  async getNotes(projectId: string, userId: string, filters?: NoteFiltersDto) {
    // Build query conditions
    const query = this.db.table('notes')
      .where('project_id', '=', projectId);

    // Filter by deletion status
    if (filters?.isDeleted) {
      query.whereNotNull('deleted_at');
    } else {
      query.where('deleted_at', '=', null);
    }

    // Filter by archive status
    if (filters?.isArchived !== undefined) {
      query.where('is_archived', '=', filters.isArchived);
    } else if (!filters?.isDeleted) {
      // By default, exclude archived notes unless explicitly requested
      query.where('is_archived', '=', false);
    }

    // Filter by parent
    if (filters?.parentId) {
      query.where('parent_id', '=', filters.parentId);
    } else if (filters?.parentId === null || filters?.parentId === undefined) {
      // If no parent filter, get root notes (parent_id is null)
      // This is optional - remove if you want all notes regardless of hierarchy
    }

    // Filter by pinned
    if (filters?.isPinned !== undefined) {
      query.where('is_pinned', '=', filters.isPinned);
    }

    // Filter by favorite
    if (filters?.isFavorite !== undefined) {
      query.where('is_favorite', '=', filters.isFavorite);
    }

    // Order by position
    query.orderBy('position', 'asc');

    const result = await query.execute();
    let notes = result.data || [];

    // Apply search filter (in memory for now, could be optimized with full-text search)
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      notes = notes.filter(
        (n: any) =>
          n.title?.toLowerCase().includes(searchLower) ||
          n.content_text?.toLowerCase().includes(searchLower)
      );
    }

    // Apply tag filter
    if (filters?.tags && filters.tags.length > 0) {
      notes = notes.filter((n: any) => {
        const noteTags = this.safeJsonParse(n.tags) || [];
        return filters.tags!.some(tag => noteTags.includes(tag));
      });
    }

    // Filter by access (user is creator or note is shared with user)
    notes = notes.filter((n: any) => {
      if (n.created_by === userId) return true;
      const sharedWith = this.safeJsonParse(n.shared_with) || [];
      return sharedWith.includes(userId);
    });

    // Get child counts for each note
    const notesWithCounts = await Promise.all(
      notes.map(async (note: any) => {
        const childCount = await this.getChildCount(note.id);
        return {
          ...this.parseNoteJson(note),
          childCount,
        };
      })
    );

    return {
      notes: notesWithCounts,
      total: notesWithCounts.length,
    };
  }

  async getNote(projectId: string, noteId: string, userId: string) {
    const note = await this.db.findOne('notes', {
      id: noteId,
      project_id: projectId,
    });

    if (!note) {
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }

    // Check access
    const sharedWith = this.safeJsonParse(note.shared_with) || [];
    if (note.created_by !== userId && !sharedWith.includes(userId)) {
      throw new ForbiddenException('You do not have access to this note');
    }

    // Increment view count
    await this.db.update('notes', noteId, {
      view_count: (note.view_count || 0) + 1,
    });

    // Get children
    const childrenResult = await this.db.table('notes')
      .where('parent_id', '=', noteId)
      .where('deleted_at', '=', null)
      .where('is_archived', '=', false)
      .orderBy('position', 'asc')
      .execute();

    const children = (childrenResult.data || []).map((c: any) => this.parseNoteJson(c));

    return {
      ...this.parseNoteJson(note),
      children,
      childCount: children.length,
    };
  }

  async updateNote(projectId: string, noteId: string, userId: string, dto: UpdateNoteDto) {
    const note = await this.getNoteDirect(noteId, projectId);

    // Check ownership
    if (note.created_by !== userId) {
      const sharedWith = this.safeJsonParse(note.shared_with) || [];
      if (!sharedWith.includes(userId)) {
        throw new ForbiddenException('You do not have permission to edit this note');
      }
    }

    const updateData: any = {
      last_edited_by: userId,
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.content !== undefined) {
      updateData.content = dto.content;
      updateData.content_text = this.stripHtml(dto.content);
    }
    if (dto.parentId !== undefined) updateData.parent_id = dto.parentId;
    if (dto.icon !== undefined) updateData.icon = dto.icon;
    if (dto.coverImage !== undefined) updateData.cover_image = dto.coverImage;
    if (dto.tags !== undefined) updateData.tags = JSON.stringify(dto.tags);
    if (dto.isPinned !== undefined) updateData.is_pinned = dto.isPinned;
    if (dto.isFavorite !== undefined) updateData.is_favorite = dto.isFavorite;
    if (dto.position !== undefined) updateData.position = dto.position;

    await this.db.update('notes', noteId, updateData);
    return this.getNote(projectId, noteId, userId);
  }

  async deleteNote(projectId: string, noteId: string, userId: string, permanent = false) {
    const note = await this.getNoteDirect(noteId, projectId);

    // Check ownership
    if (note.created_by !== userId) {
      throw new ForbiddenException('Only the note creator can delete this note');
    }

    if (permanent) {
      // Permanently delete note and all children
      await this.deleteNoteAndChildren(noteId);
      return { success: true, message: 'Note permanently deleted' };
    } else {
      // Soft delete (move to trash)
      await this.softDeleteNoteAndChildren(noteId);
      return { success: true, message: 'Note moved to trash' };
    }
  }

  async restoreNote(projectId: string, noteId: string, userId: string) {
    const note = await this.db.findOne('notes', {
      id: noteId,
      project_id: projectId,
    });

    if (!note) {
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }

    if (note.created_by !== userId) {
      throw new ForbiddenException('Only the note creator can restore this note');
    }

    // Restore note and all children
    await this.restoreNoteAndChildren(noteId);
    return this.getNote(projectId, noteId, userId);
  }

  // ============================================
  // ARCHIVE OPERATIONS
  // ============================================

  async archiveNote(projectId: string, noteId: string, userId: string) {
    const note = await this.getNoteDirect(noteId, projectId);

    if (note.created_by !== userId) {
      throw new ForbiddenException('Only the note creator can archive this note');
    }

    await this.archiveNoteAndChildren(noteId);
    return { success: true, message: 'Note archived' };
  }

  async unarchiveNote(projectId: string, noteId: string, userId: string) {
    const note = await this.getNoteDirect(noteId, projectId);

    if (note.created_by !== userId) {
      throw new ForbiddenException('Only the note creator can unarchive this note');
    }

    await this.unarchiveNoteAndChildren(noteId);
    return this.getNote(projectId, noteId, userId);
  }

  // ============================================
  // MOVE & REORDER
  // ============================================

  async moveNote(projectId: string, noteId: string, userId: string, dto: MoveNoteDto) {
    const note = await this.getNoteDirect(noteId, projectId);

    if (note.created_by !== userId) {
      throw new ForbiddenException('Only the note creator can move this note');
    }

    // Prevent moving a note to be its own child
    if (dto.parentId && await this.isDescendant(dto.parentId, noteId)) {
      throw new BadRequestException('Cannot move a note to be its own descendant');
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.parentId !== undefined) {
      updateData.parent_id = dto.parentId;
    }

    if (dto.position !== undefined) {
      updateData.position = dto.position;
    } else if (dto.parentId !== undefined) {
      // Get new position at the end of the new parent's children
      updateData.position = await this.getNextPosition(projectId, dto.parentId || null);
    }

    await this.db.update('notes', noteId, updateData);
    return this.getNote(projectId, noteId, userId);
  }

  // ============================================
  // SHARE OPERATIONS
  // ============================================

  async shareNote(projectId: string, noteId: string, userId: string, dto: ShareNoteDto) {
    const note = await this.getNoteDirect(noteId, projectId);

    if (note.created_by !== userId) {
      throw new ForbiddenException('Only the note creator can share this note');
    }

    const currentShared = this.safeJsonParse(note.shared_with) || [];
    const newShared = [...new Set([...currentShared, ...dto.userIds])];

    await this.db.update('notes', noteId, {
      shared_with: JSON.stringify(newShared),
      updated_at: new Date().toISOString(),
    });

    // Send notification to newly shared users
    try {
      const newlySharedUsers = dto.userIds.filter((id: string) => !currentShared.includes(id));

      if (newlySharedUsers.length > 0) {
        const project = await this.db.findOne('projects', { id: projectId });
        const sharer = await this.db.getUserById(userId);

        await this.notificationsService.sendNotification({
          user_ids: newlySharedUsers,
          type: NotificationType.UPDATE,
          title: '📝 Note Shared With You',
          message: `${sharer?.name || 'A team member'} shared the note "${note.title}" with you in project "${project?.name || 'Unknown'}".`,
          priority: NotificationPriority.NORMAL,
          action_url: `/project/${projectId}/notes/${noteId}`,
          data: {
            projectId,
            noteId,
            noteTitle: note.title,
            sharedBy: userId,
          },
          send_push: true,
        });
      }
    } catch (error) {
      console.error('[NotesService] Failed to send note share notification:', error);
    }

    return this.getNote(projectId, noteId, userId);
  }

  async unshareNote(projectId: string, noteId: string, userId: string, targetUserId: string) {
    const note = await this.getNoteDirect(noteId, projectId);

    if (note.created_by !== userId) {
      throw new ForbiddenException('Only the note creator can manage sharing');
    }

    const currentShared = this.safeJsonParse(note.shared_with) || [];
    const newShared = currentShared.filter((id: string) => id !== targetUserId);

    await this.db.update('notes', noteId, {
      shared_with: JSON.stringify(newShared),
      updated_at: new Date().toISOString(),
    });

    return this.getNote(projectId, noteId, userId);
  }

  // ============================================
  // DUPLICATE
  // ============================================

  async duplicateNote(projectId: string, noteId: string, userId: string, dto: DuplicateNoteDto) {
    const note = await this.getNoteDirect(noteId, projectId);

    // Create duplicate
    const duplicateData = {
      project_id: projectId,
      title: dto.title || `${note.title} (Copy)`,
      content: note.content,
      content_text: note.content_text,
      parent_id: dto.parentId !== undefined ? dto.parentId : note.parent_id,
      created_by: userId,
      last_edited_by: userId,
      position: await this.getNextPosition(projectId, dto.parentId !== undefined ? dto.parentId : note.parent_id),
      icon: note.icon,
      cover_image: note.cover_image,
      tags: note.tags,
      attachments: JSON.stringify({}),
      is_pinned: false,
      is_favorite: false,
      is_archived: false,
      shared_with: JSON.stringify([]),
      view_count: 0,
      metadata: JSON.stringify({}),
    };

    const duplicate = await this.db.insert('notes', duplicateData);

    // Duplicate children if requested
    if (dto.includeChildren) {
      await this.duplicateChildren(noteId, duplicate.id, userId);
    }

    return this.getNote(projectId, duplicate.id, userId);
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  async bulkArchive(projectId: string, noteIds: string[], userId: string) {
    for (const noteId of noteIds) {
      await this.archiveNote(projectId, noteId, userId);
    }
    return { success: true, message: `${noteIds.length} notes archived` };
  }

  async bulkUnarchive(projectId: string, noteIds: string[], userId: string) {
    for (const noteId of noteIds) {
      await this.unarchiveNote(projectId, noteId, userId);
    }
    return { success: true, message: `${noteIds.length} notes unarchived` };
  }

  async bulkDelete(projectId: string, noteIds: string[], userId: string, permanent = false) {
    for (const noteId of noteIds) {
      await this.deleteNote(projectId, noteId, userId, permanent);
    }
    const action = permanent ? 'permanently deleted' : 'moved to trash';
    return { success: true, message: `${noteIds.length} notes ${action}` };
  }

  async bulkRestore(projectId: string, noteIds: string[], userId: string) {
    for (const noteId of noteIds) {
      await this.restoreNote(projectId, noteId, userId);
    }
    return { success: true, message: `${noteIds.length} notes restored` };
  }

  // ============================================
  // SEARCH
  // ============================================

  async searchNotes(projectId: string, userId: string, query: string) {
    const searchLower = query.toLowerCase();

    // Get all notes user has access to
    const result = await this.db.table('notes')
      .where('project_id', '=', projectId)
      .where('deleted_at', '=', null)
      .where('is_archived', '=', false)
      .execute();

    const notes = result.data || [];

    // Filter by search query and access
    const matchingNotes = notes.filter((n: any) => {
      // Check access
      if (n.created_by !== userId) {
        const sharedWith = this.safeJsonParse(n.shared_with) || [];
        if (!sharedWith.includes(userId)) return false;
      }

      // Check search match
      return (
        n.title?.toLowerCase().includes(searchLower) ||
        n.content_text?.toLowerCase().includes(searchLower)
      );
    });

    return {
      notes: matchingNotes.map((n: any) => this.parseNoteJson(n)),
      total: matchingNotes.length,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async getNoteDirect(noteId: string, projectId: string) {
    const note = await this.db.findOne('notes', {
      id: noteId,
      project_id: projectId,
    });

    if (!note) {
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }

    return note;
  }

  private async getNextPosition(projectId: string, parentId: string | null): Promise<number> {
    const query = this.db.table('notes')
      .where('project_id', '=', projectId)
      .where('deleted_at', '=', null);

    if (parentId) {
      query.where('parent_id', '=', parentId);
    } else {
      query.where('parent_id', '=', null);
    }

    query.orderBy('position', 'desc').limit(1);

    const result = await query.execute();
    const notes = result.data || [];

    if (notes.length === 0) return 0;
    return (notes[0].position || 0) + 1;
  }

  private async getChildCount(noteId: string): Promise<number> {
    const result = await this.db.table('notes')
      .where('parent_id', '=', noteId)
      .where('deleted_at', '=', null)
      .where('is_archived', '=', false)
      .execute();

    return (result.data || []).length;
  }

  private async isDescendant(potentialDescendant: string, ancestorId: string): Promise<boolean> {
    // Check if potentialDescendant is a descendant of ancestorId
    let currentId = potentialDescendant;
    const visited = new Set<string>();

    while (currentId) {
      if (visited.has(currentId)) break; // Prevent infinite loops
      visited.add(currentId);

      const note = await this.db.findOne('notes', { id: currentId });
      if (!note) break;

      if (note.parent_id === ancestorId) return true;
      currentId = note.parent_id;
    }

    return false;
  }

  private async deleteNoteAndChildren(noteId: string) {
    // Get all children
    const childrenResult = await this.db.table('notes')
      .where('parent_id', '=', noteId)
      .execute();

    const children = childrenResult.data || [];

    // Recursively delete children
    for (const child of children) {
      await this.deleteNoteAndChildren(child.id);
    }

    // Delete the note
    await this.db.delete('notes', noteId);
  }

  private async softDeleteNoteAndChildren(noteId: string) {
    const now = new Date().toISOString();

    // Get all children
    const childrenResult = await this.db.table('notes')
      .where('parent_id', '=', noteId)
      .where('deleted_at', '=', null)
      .execute();

    const children = childrenResult.data || [];

    // Recursively soft delete children
    for (const child of children) {
      await this.softDeleteNoteAndChildren(child.id);
    }

    // Soft delete the note
    await this.db.update('notes', noteId, { deleted_at: now });
  }

  private async restoreNoteAndChildren(noteId: string) {
    // Get all children (including deleted ones)
    const childrenResult = await this.db.table('notes')
      .where('parent_id', '=', noteId)
      .whereNotNull('deleted_at')
      .execute();

    const children = childrenResult.data || [];

    // Recursively restore children
    for (const child of children) {
      await this.restoreNoteAndChildren(child.id);
    }

    // Restore the note
    await this.db.update('notes', noteId, {
      deleted_at: null,
      updated_at: new Date().toISOString(),
    });
  }

  private async archiveNoteAndChildren(noteId: string) {
    const now = new Date().toISOString();

    // Get all children
    const childrenResult = await this.db.table('notes')
      .where('parent_id', '=', noteId)
      .where('deleted_at', '=', null)
      .where('is_archived', '=', false)
      .execute();

    const children = childrenResult.data || [];

    // Recursively archive children
    for (const child of children) {
      await this.archiveNoteAndChildren(child.id);
    }

    // Archive the note
    await this.db.update('notes', noteId, {
      is_archived: true,
      archived_at: now,
      updated_at: now,
    });
  }

  private async unarchiveNoteAndChildren(noteId: string) {
    // Get all archived children
    const childrenResult = await this.db.table('notes')
      .where('parent_id', '=', noteId)
      .where('deleted_at', '=', null)
      .where('is_archived', '=', true)
      .execute();

    const children = childrenResult.data || [];

    // Recursively unarchive children
    for (const child of children) {
      await this.unarchiveNoteAndChildren(child.id);
    }

    // Unarchive the note
    await this.db.update('notes', noteId, {
      is_archived: false,
      archived_at: null,
      updated_at: new Date().toISOString(),
    });
  }

  private async duplicateChildren(originalParentId: string, newParentId: string, userId: string) {
    const childrenResult = await this.db.table('notes')
      .where('parent_id', '=', originalParentId)
      .where('deleted_at', '=', null)
      .execute();

    const children = childrenResult.data || [];

    for (const child of children) {
      const note = await this.db.findOne('notes', { id: child.id });
      if (!note) continue;

      const duplicateData = {
        project_id: note.project_id,
        title: note.title,
        content: note.content,
        content_text: note.content_text,
        parent_id: newParentId,
        created_by: userId,
        last_edited_by: userId,
        position: child.position,
        icon: note.icon,
        cover_image: note.cover_image,
        tags: note.tags,
        attachments: JSON.stringify({}),
        is_pinned: false,
        is_favorite: false,
        is_archived: false,
        shared_with: JSON.stringify([]),
        view_count: 0,
        metadata: JSON.stringify({}),
      };

      const duplicate = await this.db.insert('notes', duplicateData);

      // Recursively duplicate this child's children
      await this.duplicateChildren(child.id, duplicate.id, userId);
    }
  }

  private parseNoteJson(note: any) {
    if (!note) return null;

    return {
      id: note.id,
      projectId: note.project_id,
      title: note.title,
      content: note.content,
      contentText: note.content_text,
      parentId: note.parent_id,
      createdBy: note.created_by,
      lastEditedBy: note.last_edited_by,
      position: note.position || 0,
      icon: note.icon,
      coverImage: note.cover_image,
      tags: this.safeJsonParse(note.tags) || [],
      attachments: this.safeJsonParse(note.attachments) || {},
      isPinned: note.is_pinned || false,
      isFavorite: note.is_favorite || false,
      isArchived: note.is_archived || false,
      archivedAt: note.archived_at,
      sharedWith: this.safeJsonParse(note.shared_with) || [],
      viewCount: note.view_count || 0,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
      deletedAt: note.deleted_at,
    };
  }

  private safeJsonParse(value: any) {
    if (!value) return null;
    if (typeof value === 'object') return value;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
