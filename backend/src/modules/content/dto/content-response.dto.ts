import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonType, DifficultyLevel } from './create-lesson.dto';
import { ResourceType, ResourceVisibility } from './create-resource.dto';

export class ContentLessonResponseDto {
  @ApiProperty({ description: 'Lesson ID', example: 'lesson_123' })
  id: string;

  @ApiProperty({ description: 'Lesson title', example: 'Introduction to React Hooks' })
  title: string;

  @ApiPropertyOptional({ description: 'Lesson description' })
  description?: string;

  @ApiProperty({ description: 'Lesson type', enum: LessonType })
  type: LessonType;

  @ApiProperty({ description: 'Course ID', example: 'course_react_advanced' })
  courseId: string;

  @ApiPropertyOptional({ description: 'Chapter ID', example: 'chapter_hooks' })
  chapterId?: string;

  @ApiProperty({ description: 'Main lesson content' })
  content: string;

  @ApiProperty({ description: 'Difficulty level', enum: DifficultyLevel })
  difficulty: DifficultyLevel;

  @ApiPropertyOptional({ description: 'Duration in minutes', example: 45 })
  duration?: number;

  @ApiPropertyOptional({ description: 'Order within course', example: 5 })
  order?: number;

  @ApiPropertyOptional({ description: 'Lesson tags', isArray: true, type: String })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Prerequisites', isArray: true, type: String })
  prerequisites?: string[];

  @ApiPropertyOptional({ description: 'Learning objectives', isArray: true, type: String })
  objectives?: string[];

  @ApiPropertyOptional({ description: 'Additional resources' })
  resources?: Array<{
    type: string;
    url: string;
    title: string;
    description?: string;
    duration?: number;
    size?: number;
  }>;

  @ApiProperty({ description: 'Whether lesson is published', example: true })
  isPublished: boolean;

  @ApiProperty({ description: 'Whether lesson is free', example: false })
  isFree: boolean;

  @ApiPropertyOptional({ description: 'Interactive elements configuration' })
  interactiveElements?: {
    hasQuiz?: boolean;
    hasCodeEditor?: boolean;
    hasDiscussions?: boolean;
    hasAssignment?: boolean;
    hasDownloads?: boolean;
  };

  @ApiPropertyOptional({ description: 'Completion criteria' })
  completionCriteria?: {
    requiresQuizPass?: boolean;
    minimumScore?: number;
    requiresTimeSpent?: number;
    requiresAssignmentSubmission?: boolean;
  };

  @ApiProperty({ description: 'View count', example: 1234 })
  viewCount: number;

  @ApiProperty({ description: 'Average rating', example: 4.5 })
  averageRating: number;

  @ApiProperty({ description: 'Number of ratings', example: 89 })
  ratingCount: number;

  @ApiProperty({ description: 'Creation date', example: '2024-01-15T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date', example: '2024-01-15T10:00:00Z' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'User progress info (if authenticated)' })
  userProgress?: {
    isCompleted: boolean;
    progress: number; // 0-100
    timeSpent: number; // minutes
    lastAccessedAt?: string;
    score?: number;
  };

  @ApiPropertyOptional({ description: 'Author information' })
  author?: {
    id: string;
    username: string;
    fullName?: string;
    avatar?: string;
  };
}

export class ResourceResponseDto {
  @ApiProperty({ description: 'Resource ID', example: 'resource_456' })
  id: string;

  @ApiProperty({ description: 'Resource title', example: 'React Hooks Cheat Sheet' })
  title: string;

  @ApiPropertyOptional({ description: 'Resource description' })
  description?: string;

  @ApiProperty({ description: 'Resource type', enum: ResourceType })
  type: ResourceType;

  @ApiProperty({ description: 'Resource URL', example: 'https://example.com/resource.pdf' })
  url: string;

  @ApiPropertyOptional({ description: 'Course ID' })
  courseId?: string;

  @ApiPropertyOptional({ description: 'Lesson ID' })
  lessonId?: string;

  @ApiPropertyOptional({ description: 'Chapter ID' })
  chapterId?: string;

  @ApiProperty({ description: 'Visibility level', enum: ResourceVisibility })
  visibility: ResourceVisibility;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 2048576 })
  size?: number;

  @ApiPropertyOptional({ description: 'Duration in seconds', example: 1800 })
  duration?: number;

  @ApiPropertyOptional({ description: 'MIME type', example: 'application/pdf' })
  mimeType?: string;

  @ApiPropertyOptional({ description: 'File extension', example: 'pdf' })
  extension?: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Whether resource is downloadable', example: true })
  isDownloadable: boolean;

  @ApiProperty({ description: 'Whether resource requires authentication', example: false })
  requiresAuth: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Alternative text for accessibility' })
  altText?: string;

  @ApiPropertyOptional({ description: 'Transcription or text content' })
  transcription?: string;

  @ApiProperty({ description: 'Download count', example: 456 })
  downloadCount: number;

  @ApiProperty({ description: 'Creation date', example: '2024-01-15T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date', example: '2024-01-15T10:00:00Z' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Uploader information' })
  uploader?: {
    id: string;
    username: string;
    fullName?: string;
    avatar?: string;
  };
}

export class PaginatedContentLessonsDto {
  @ApiProperty({ description: 'List of lessons', isArray: true, type: ContentLessonResponseDto })
  data: ContentLessonResponseDto[];

  @ApiProperty({ description: 'Total number of lessons', example: 50 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 3 })
  totalPages: number;

  @ApiProperty({ description: 'Has next page', example: true })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Has previous page', example: false })
  hasPrevPage: boolean;
}

export class PaginatedResourcesDto {
  @ApiProperty({ description: 'List of resources', isArray: true, type: ResourceResponseDto })
  data: ResourceResponseDto[];

  @ApiProperty({ description: 'Total number of resources', example: 30 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 2 })
  totalPages: number;

  @ApiProperty({ description: 'Has next page', example: true })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Has previous page', example: false })
  hasPrevPage: boolean;
}

export class ContentQueryDto {
  @ApiPropertyOptional({ description: 'Search term', example: 'react hooks' })
  search?: string;

  @ApiPropertyOptional({ description: 'Course ID filter', example: 'course_123' })
  courseId?: string;

  @ApiPropertyOptional({ description: 'Chapter ID filter', example: 'chapter_456' })
  chapterId?: string;

  @ApiPropertyOptional({ description: 'Lesson type filter', enum: LessonType })
  type?: LessonType;

  @ApiPropertyOptional({ description: 'Difficulty filter', enum: DifficultyLevel })
  difficulty?: DifficultyLevel;

  @ApiPropertyOptional({ description: 'Show only free lessons', example: false })
  freeOnly?: boolean;

  @ApiPropertyOptional({ description: 'Show only published content', example: true })
  publishedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, minimum: 1, maximum: 100 })
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort field', example: 'createdAt' })
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', example: 'desc', enum: ['asc', 'desc'] })
  sortOrder?: 'asc' | 'desc';
}