import { IsString, IsOptional, IsNumber, IsArray, IsBoolean, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FileType {
  DOCUMENT = 'document',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  CODE = 'code',
  ARCHIVE = 'archive',
  OTHER = 'other',
}

// DTO for uploading a file
export class UploadFileDto {
  @ApiPropertyOptional({ description: 'File description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'File tags', type: [String] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Milestone ID to attach file to' })
  @IsUUID()
  @IsOptional()
  milestoneId?: string;

  @ApiPropertyOptional({ description: 'Whether file is public', default: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'User IDs to share file with', type: [String] })
  @IsArray()
  @IsOptional()
  sharedWith?: string[];
}

// DTO for uploading milestone deliverable
export class UploadDeliverableDto {
  @ApiProperty({ description: 'Deliverable index in milestone deliverables array' })
  @IsNumber()
  deliverableIndex: number;

  @ApiPropertyOptional({ description: 'File description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'File tags', type: [String] })
  @IsArray()
  @IsOptional()
  tags?: string[];
}

// Response DTO for file information
export class FileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiPropertyOptional()
  milestoneId?: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  filePath: string;

  @ApiProperty()
  fileUrl: string;

  @ApiProperty()
  fileSize: number;

  @ApiProperty()
  mimeType: string;

  @ApiProperty({ enum: FileType })
  fileType: FileType;

  @ApiProperty()
  uploadedBy: string;

  @ApiProperty()
  uploadedAt: Date;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @ApiProperty()
  version: number;

  @ApiProperty()
  isDeliverable: boolean;

  @ApiPropertyOptional()
  deliverableIndex?: number;

  @ApiPropertyOptional()
  thumbnailUrl?: string;

  @ApiProperty()
  isPublic: boolean;

  @ApiPropertyOptional({ type: [String] })
  sharedWith?: string[];

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// DTO for file list query
export class FileListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by milestone ID' })
  @IsUUID()
  @IsOptional()
  milestoneId?: string;

  @ApiPropertyOptional({ description: 'Filter by file type', enum: FileType })
  @IsEnum(FileType)
  @IsOptional()
  fileType?: FileType;

  @ApiPropertyOptional({ description: 'Filter by uploader ID' })
  @IsString()
  @IsOptional()
  uploadedBy?: string;

  @ApiPropertyOptional({ description: 'Filter deliverables only' })
  @IsBoolean()
  @IsOptional()
  isDeliverable?: boolean;

  @ApiPropertyOptional({ description: 'Search by file name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsNumber()
  @IsOptional()
  limit?: number;
}

// DTO for updating file metadata
export class UpdateFileDto {
  @ApiPropertyOptional({ description: 'File description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'File tags', type: [String] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Whether file is public' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'User IDs to share file with', type: [String] })
  @IsArray()
  @IsOptional()
  sharedWith?: string[];
}
