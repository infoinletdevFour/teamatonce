/**
 * Notes Controller
 *
 * REST API for project notes.
 * Uses ProjectAccessGuard to ensure only project members can access.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { ProjectAccessGuard } from '../../../common/guards/project-access.guard';
import { NotesService, CreateNoteDto, UpdateNoteDto } from './notes.service';

@Controller('api/projects/:projectId/notes')
@UseGuards(AuthGuard, ProjectAccessGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  /**
   * Create a new note
   */
  @Post()
  async createNote(
    @Param('projectId') projectId: string,
    @Body() dto: CreateNoteDto,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.createNote(projectId, userId, dto);
  }

  /**
   * Get all notes for a project (top-level by default)
   */
  @Get()
  async getProjectNotes(
    @Param('projectId') projectId: string,
    @Query('parentId') parentId?: string,
    @Query('includeArchived') includeArchived?: string,
    @Query('search') search?: string,
  ) {
    return this.notesService.getProjectNotes(projectId, {
      parentId,
      includeArchived: includeArchived === 'true',
      search,
    });
  }

  /**
   * Get pinned notes
   */
  @Get('pinned')
  async getPinnedNotes(@Param('projectId') projectId: string) {
    return this.notesService.getPinnedNotes(projectId);
  }

  /**
   * Get favorite notes
   */
  @Get('favorites')
  async getFavoriteNotes(@Param('projectId') projectId: string) {
    return this.notesService.getFavoriteNotes(projectId);
  }

  /**
   * Get recent notes
   */
  @Get('recent')
  async getRecentNotes(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: number,
  ) {
    return this.notesService.getRecentNotes(projectId, limit || 10);
  }

  /**
   * Search notes
   */
  @Get('search')
  async searchNotes(
    @Param('projectId') projectId: string,
    @Query('q') query: string,
  ) {
    return this.notesService.searchNotes(projectId, query);
  }

  /**
   * Get a single note
   */
  @Get(':noteId')
  async getNote(
    @Param('noteId') noteId: string,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.getNoteById(noteId, userId);
  }

  /**
   * Get child notes (sub-pages)
   */
  @Get(':noteId/children')
  async getChildNotes(@Param('noteId') noteId: string) {
    return this.notesService.getChildNotes(noteId);
  }

  /**
   * Update a note
   */
  @Put(':noteId')
  async updateNote(
    @Param('noteId') noteId: string,
    @Body() dto: UpdateNoteDto,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.updateNote(noteId, userId, dto);
  }

  /**
   * Delete a note
   */
  @Delete(':noteId')
  async deleteNote(
    @Param('noteId') noteId: string,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.deleteNote(noteId, userId);
  }

  /**
   * Toggle pin status
   */
  @Post(':noteId/pin')
  async togglePin(
    @Param('noteId') noteId: string,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.togglePin(noteId, userId);
  }

  /**
   * Toggle favorite status
   */
  @Post(':noteId/favorite')
  async toggleFavorite(
    @Param('noteId') noteId: string,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.toggleFavorite(noteId, userId);
  }

  /**
   * Archive a note
   */
  @Post(':noteId/archive')
  async archiveNote(
    @Param('noteId') noteId: string,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.archiveNote(noteId, userId);
  }

  /**
   * Unarchive a note
   */
  @Post(':noteId/unarchive')
  async unarchiveNote(
    @Param('noteId') noteId: string,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.unarchiveNote(noteId, userId);
  }

  /**
   * Move a note to a new parent
   */
  @Post(':noteId/move')
  async moveNote(
    @Param('noteId') noteId: string,
    @Body('parentId') parentId: string | null,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.moveNote(noteId, parentId, userId);
  }

  /**
   * Reorder notes within a parent
   */
  @Post('reorder')
  async reorderNotes(
    @Param('projectId') projectId: string,
    @Body('parentId') parentId: string | null,
    @Body('noteIds') noteIds: string[],
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.reorderNotes(projectId, parentId, noteIds, userId);
  }
}
