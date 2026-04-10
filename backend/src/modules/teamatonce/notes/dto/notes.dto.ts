import { IsString, IsOptional, IsUUID, IsBoolean, IsArray, IsNumber, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty({ description: 'Note title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Note content (HTML)' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Parent note ID for hierarchical notes' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Note icon (emoji)' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ description: 'Note tags', type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Pin the note' })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}

export class UpdateNoteDto {
  @ApiPropertyOptional({ description: 'Note title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Note content (HTML)' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Parent note ID' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Note icon (emoji)' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ description: 'Note tags', type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Pin the note' })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ description: 'Favorite the note' })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @ApiPropertyOptional({ description: 'Position/order' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;
}

export class MoveNoteDto {
  @ApiPropertyOptional({ description: 'New parent note ID (null for root)' })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ description: 'New position in the list' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;
}

export class ShareNoteDto {
  @ApiProperty({ description: 'User IDs to share with', type: [String] })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}

export class BulkNotesDto {
  @ApiProperty({ description: 'Note IDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  noteIds: string[];
}

export class DuplicateNoteDto {
  @ApiPropertyOptional({ description: 'Custom title for the duplicate' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Include child notes' })
  @IsOptional()
  @IsBoolean()
  includeChildren?: boolean;

  @ApiPropertyOptional({ description: 'Parent ID for the duplicate' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class NoteFiltersDto {
  @ApiPropertyOptional({ description: 'Filter by parent ID' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Only pinned notes' })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ description: 'Only favorite notes' })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @ApiPropertyOptional({ description: 'Only archived notes' })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @ApiPropertyOptional({ description: 'Only deleted notes (trash)' })
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by tags', type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];
}

// Response types
export class NoteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  content?: string;

  @ApiPropertyOptional()
  contentText?: string;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiProperty()
  createdBy: string;

  @ApiPropertyOptional()
  lastEditedBy?: string;

  @ApiProperty()
  position: number;

  @ApiPropertyOptional()
  icon?: string;

  @ApiPropertyOptional()
  coverImage?: string;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty()
  attachments: Record<string, any>;

  @ApiProperty()
  isPinned: boolean;

  @ApiProperty()
  isFavorite: boolean;

  @ApiProperty()
  isArchived: boolean;

  @ApiPropertyOptional()
  archivedAt?: string;

  @ApiProperty({ type: [String] })
  sharedWith: string[];

  @ApiProperty()
  viewCount: number;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional()
  deletedAt?: string;

  // Enriched fields
  @ApiPropertyOptional({ type: [Object] })
  children?: NoteResponseDto[];

  @ApiPropertyOptional()
  childCount?: number;
}

export class NotesListResponseDto {
  @ApiProperty({ type: [NoteResponseDto] })
  notes: NoteResponseDto[];

  @ApiProperty()
  total: number;
}
