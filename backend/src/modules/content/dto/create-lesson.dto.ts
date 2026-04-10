import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength, IsEnum, IsArray, IsNumber, Min, Max, IsBoolean, IsUUID } from 'class-validator';

export enum LessonType {
  VIDEO = 'video',
  TEXT = 'text',
  AUDIO = 'audio',
  INTERACTIVE = 'interactive',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
  DOCUMENT = 'document',
  CODE = 'code',
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export class CreateContentLessonDto {
  @ApiProperty({
    description: 'Title of the lesson',
    example: 'Introduction to React Hooks',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the lesson',
    example: 'Learn the fundamentals of React Hooks including useState, useEffect, and custom hooks',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Type of lesson content',
    enum: LessonType,
    example: LessonType.VIDEO,
  })
  @IsEnum(LessonType)
  type: LessonType;

  @ApiProperty({
    description: 'Course ID this lesson belongs to',
    example: 'course_react_advanced',
  })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiPropertyOptional({
    description: 'Chapter ID this lesson belongs to',
    example: 'chapter_hooks',
  })
  @IsOptional()
  @IsString()
  chapterId?: string;

  @ApiProperty({
    description: 'Main content of the lesson (text, HTML, or markdown)',
    example: '# Introduction to React Hooks\n\nReact Hooks are functions that let you use state and other React features...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Difficulty level',
    enum: DifficultyLevel,
    example: DifficultyLevel.INTERMEDIATE,
  })
  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  @ApiPropertyOptional({
    description: 'Estimated duration in minutes',
    example: 45,
    minimum: 1,
    maximum: 600,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(600)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Order/sequence number within the course',
    example: 5,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({
    description: 'Tags for better categorization',
    example: ['react', 'hooks', 'javascript', 'frontend'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Prerequisites for this lesson',
    example: ['Basic JavaScript', 'React Components'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @ApiPropertyOptional({
    description: 'Learning objectives',
    example: [
      'Understand what React Hooks are',
      'Use useState for component state',
      'Apply useEffect for side effects',
    ],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @ApiPropertyOptional({
    description: 'Additional resources and attachments',
    example: [
      {
        type: 'video',
        url: 'https://example.com/lesson-video.mp4',
        title: 'React Hooks Tutorial',
        duration: 1800,
      },
      {
        type: 'document',
        url: 'https://example.com/hooks-cheatsheet.pdf',
        title: 'React Hooks Cheat Sheet',
      },
    ],
  })
  @IsOptional()
  resources?: Array<{
    type: 'video' | 'audio' | 'document' | 'image' | 'link' | 'code';
    url: string;
    title: string;
    description?: string;
    duration?: number; // in seconds for media
    size?: number; // in bytes for files
  }>;

  @ApiPropertyOptional({
    description: 'Whether lesson is published',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({
    description: 'Whether lesson is free or requires enrollment',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({
    description: 'Interactive elements configuration',
    example: {
      hasQuiz: true,
      hasCodeEditor: true,
      hasDiscussions: true,
    },
  })
  @IsOptional()
  interactiveElements?: {
    hasQuiz?: boolean;
    hasCodeEditor?: boolean;
    hasDiscussions?: boolean;
    hasAssignment?: boolean;
    hasDownloads?: boolean;
  };

  @ApiPropertyOptional({
    description: 'Completion criteria',
    example: {
      requiresQuizPass: true,
      minimumScore: 70,
      requiresTimeSpent: 30,
    },
  })
  @IsOptional()
  completionCriteria?: {
    requiresQuizPass?: boolean;
    minimumScore?: number;
    requiresTimeSpent?: number; // in minutes
    requiresAssignmentSubmission?: boolean;
  };
}