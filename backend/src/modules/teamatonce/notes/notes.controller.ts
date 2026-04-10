import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NotesService } from './notes.service';
import {
  CreateNoteDto,
  UpdateNoteDto,
  MoveNoteDto,
  ShareNoteDto,
  BulkNotesDto,
  DuplicateNoteDto,
} from './dto/notes.dto';

@ApiTags('Notes')
@Controller('projects/:projectId/notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  async createNote(
    @Param('projectId') projectId: string,
    @Body() dto: CreateNoteDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.createNote(projectId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notes for a project' })
  @ApiQuery({ name: 'parentId', required: false })
  @ApiQuery({ name: 'isPinned', required: false, type: Boolean })
  @ApiQuery({ name: 'isFavorite', required: false, type: Boolean })
  @ApiQuery({ name: 'isArchived', required: false, type: Boolean })
  @ApiQuery({ name: 'isDeleted', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'tags', required: false, isArray: true })
  async getNotes(
    @Param('projectId') projectId: string,
    @Query('parentId') parentId?: string,
    @Query('isPinned') isPinned?: string,
    @Query('isFavorite') isFavorite?: string,
    @Query('isArchived') isArchived?: string,
    @Query('isDeleted') isDeleted?: string,
    @Query('search') search?: string,
    @Query('tags') tags?: string | string[],
    @Req() req?: any,
  ) {
    const userId = req.user.sub || req.user.userId;

    const filters = {
      parentId,
      isPinned: isPinned === 'true' ? true : isPinned === 'false' ? false : undefined,
      isFavorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : undefined,
      isArchived: isArchived === 'true' ? true : isArchived === 'false' ? false : undefined,
      isDeleted: isDeleted === 'true' ? true : isDeleted === 'false' ? false : undefined,
      search,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
    };

    return this.notesService.getNotes(projectId, userId, filters);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search notes' })
  @ApiQuery({ name: 'q', required: true })
  async searchNotes(
    @Param('projectId') projectId: string,
    @Query('q') query: string,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.searchNotes(projectId, userId, query);
  }

  @Get(':noteId')
  @ApiOperation({ summary: 'Get a note by ID' })
  async getNote(
    @Param('projectId') projectId: string,
    @Param('noteId') noteId: string,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.getNote(projectId, noteId, userId);
  }

  @Put(':noteId')
  @ApiOperation({ summary: 'Update a note' })
  async updateNote(
    @Param('projectId') projectId: string,
    @Param('noteId') noteId: string,
    @Body() dto: UpdateNoteDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.updateNote(projectId, noteId, userId, dto);
  }

  @Delete(':noteId')
  @ApiOperation({ summary: 'Delete a note (soft delete - move to trash)' })
  async deleteNote(
    @Param('projectId') projectId: string,
    @Param('noteId') noteId: string,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.deleteNote(projectId, noteId, userId, false);
  }

  @Delete(':noteId/permanent')
  @ApiOperation({ summary: 'Permanently delete a note' })
  async permanentDeleteNote(
    @Param('projectId') projectId: string,
    @Param('noteId') noteId: string,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.deleteNote(projectId, noteId, userId, true);
  }

  @Post(':noteId/restore')
  @ApiOperation({ summary: 'Restore a deleted note' })
  async restoreNote(
    @Param('projectId') projectId: string,
    @Param('noteId') noteId: string,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.restoreNote(projectId, noteId, userId);
  }

  // ============================================
  // ARCHIVE OPERATIONS
  // ============================================

  @Post(':noteId/archive')
  @ApiOperation({ summary: 'Archive a note' })
  async archiveNote(
    @Param('projectId') projectId: string,
    @Param('noteId') noteId: string,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.archiveNote(projectId, noteId, userId);
  }

  @Post(':noteId/unarchive')
  @ApiOperation({ summary: 'Unarchive a note' })
  async unarchiveNote(
    @Param('projectId') projectId: string,
    @Param('noteId') noteId: string,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.unarchiveNote(projectId, noteId, userId);
  }

  // ============================================
  // MOVE & SHARE
  // ============================================

  @Patch(':noteId/move')
  @ApiOperation({ summary: 'Move a note (change parent or position)' })
  async moveNote(
    @Param('projectId') projectId: string,
    @Param('noteId') noteId: string,
    @Body() dto: MoveNoteDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.moveNote(projectId, noteId, userId, dto);
  }

  @Post(':noteId/share')
  @ApiOperation({ summary: 'Share a note with other users' })
  async shareNote(
    @Param('projectId') projectId: string,
    @Param('noteId') noteId: string,
    @Body() dto: ShareNoteDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.shareNote(projectId, noteId, userId, dto);
  }

  @Delete(':noteId/share/:targetUserId')
  @ApiOperation({ summary: 'Remove sharing from a user' })
  async unshareNote(
    @Param('projectId') projectId: string,
    @Param('noteId') noteId: string,
    @Param('targetUserId') targetUserId: string,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.unshareNote(projectId, noteId, userId, targetUserId);
  }

  // ============================================
  // DUPLICATE
  // ============================================

  @Post(':noteId/duplicate')
  @ApiOperation({ summary: 'Duplicate a note' })
  async duplicateNote(
    @Param('projectId') projectId: string,
    @Param('noteId') noteId: string,
    @Body() dto: DuplicateNoteDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.duplicateNote(projectId, noteId, userId, dto);
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  @Post('bulk/archive')
  @ApiOperation({ summary: 'Archive multiple notes' })
  async bulkArchive(
    @Param('projectId') projectId: string,
    @Body() dto: BulkNotesDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.bulkArchive(projectId, dto.noteIds, userId);
  }

  @Post('bulk/unarchive')
  @ApiOperation({ summary: 'Unarchive multiple notes' })
  async bulkUnarchive(
    @Param('projectId') projectId: string,
    @Body() dto: BulkNotesDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.bulkUnarchive(projectId, dto.noteIds, userId);
  }

  @Post('bulk/delete')
  @ApiOperation({ summary: 'Delete multiple notes (soft delete)' })
  async bulkDelete(
    @Param('projectId') projectId: string,
    @Body() dto: BulkNotesDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.bulkDelete(projectId, dto.noteIds, userId, false);
  }

  @Post('bulk/delete/permanent')
  @ApiOperation({ summary: 'Permanently delete multiple notes' })
  async bulkPermanentDelete(
    @Param('projectId') projectId: string,
    @Body() dto: BulkNotesDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.bulkDelete(projectId, dto.noteIds, userId, true);
  }

  @Post('bulk/restore')
  @ApiOperation({ summary: 'Restore multiple deleted notes' })
  async bulkRestore(
    @Param('projectId') projectId: string,
    @Body() dto: BulkNotesDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.notesService.bulkRestore(projectId, dto.noteIds, userId);
  }
}
