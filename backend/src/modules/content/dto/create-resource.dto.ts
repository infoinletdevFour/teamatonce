import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength, IsEnum, IsNumber, Min, IsBoolean, IsUrl } from 'class-validator';

export enum ResourceType {
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  IMAGE = 'image',
  CODE = 'code',
  LINK = 'link',
  ARCHIVE = 'archive',
  PRESENTATION = 'presentation',
}

export enum ResourceVisibility {
  PUBLIC = 'public',
  COURSE_MEMBERS = 'course_members',
  LESSON_SPECIFIC = 'lesson_specific',
  PRIVATE = 'private',
}

export class CreateResourceDto {
  @ApiProperty({
    description: 'Title of the resource',
    example: 'React Hooks Cheat Sheet',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the resource',
    example: 'Comprehensive cheat sheet covering all React Hooks with examples',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Type of resource',
    enum: ResourceType,
    example: ResourceType.DOCUMENT,
  })
  @IsEnum(ResourceType)
  type: ResourceType;

  @ApiProperty({
    description: 'URL or path to the resource',
    example: 'https://example.com/resources/react-hooks-cheatsheet.pdf',
  })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({
    description: 'Course ID this resource belongs to',
    example: 'course_react_advanced',
  })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({
    description: 'Lesson ID this resource belongs to',
    example: 'lesson_hooks_intro',
  })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiPropertyOptional({
    description: 'Chapter ID this resource belongs to',
    example: 'chapter_hooks',
  })
  @IsOptional()
  @IsString()
  chapterId?: string;

  @ApiProperty({
    description: 'Visibility level of the resource',
    enum: ResourceVisibility,
    example: ResourceVisibility.COURSE_MEMBERS,
  })
  @IsEnum(ResourceVisibility)
  visibility: ResourceVisibility;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 2048576,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  size?: number;

  @ApiPropertyOptional({
    description: 'Duration in seconds (for video/audio)',
    example: 1800,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({
    description: 'MIME type of the resource',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({
    description: 'File extension',
    example: 'pdf',
  })
  @IsOptional()
  @IsString()
  extension?: string;

  @ApiPropertyOptional({
    description: 'Thumbnail URL (for videos/images)',
    example: 'https://example.com/thumbnails/video-thumb.jpg',
  })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether resource is downloadable',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isDownloadable?: boolean;

  @ApiPropertyOptional({
    description: 'Whether resource requires authentication to access',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresAuth?: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: {
      author: 'React Team',
      version: '1.2',
      language: 'en',
      format: 'PDF',
    },
  })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Alternative text for accessibility',
    example: 'Visual diagram showing React Hooks lifecycle',
  })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({
    description: 'Transcription or text content (for media files)',
    maxLength: 50000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  transcription?: string;
}